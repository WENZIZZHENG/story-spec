import { describe, expect, it } from 'vitest';
import {
  buildWorkerLeaseRecoveryPlan,
  buildWorkerAlertSummary,
  classifyWorkerFailure,
  createMemoryWorkerJobLockRepository,
  createMemoryWorkerLeaseRepository,
  createMemoryWorkerFailureRepository,
  refreshWorkerLease,
  recoverStaleWorkerJobs,
  recordWorkerFailure
} from '../../src/server/workers/worker-reliability.js';
import {
  createAgentJob,
  createMemoryAgentJobRepository,
  transitionAgentJob
} from '../../src/server/jobs/agent-job.js';

describe('multiuser worker reliability policy', () => {
  it('classifies runtime failures as retryable before max attempts', () => {
    expect(classifyWorkerFailure({
      reason: 'runner failed',
      failureKind: 'runtime-failed',
      attempt: 1,
      maxAttempts: 3
    })).toEqual({
      decision: 'retryable',
      retryable: true,
      deadLetter: false
    });
  });

  it('classifies runtime failures as dead-letter at max attempts', () => {
    expect(classifyWorkerFailure({
      reason: 'runner failed',
      failureKind: 'runtime-failed',
      attempt: 3,
      maxAttempts: 3
    })).toEqual({
      decision: 'dead-letter',
      retryable: false,
      deadLetter: true
    });
  });

  it('records missing jobs and runtimes as dead-letter failures', async () => {
    const repository = createMemoryWorkerFailureRepository();

    const record = await recordWorkerFailure({
      repository,
      jobId: 'job-1',
      projectId: 'project-1',
      userId: 'user-1',
      runtime: 'missing-runtime',
      kind: 'chapter-draft',
      attempt: 1,
      maxAttempts: 3,
      failureKind: 'runtime-missing',
      reason: '未注册 runtime：missing-runtime',
      traceId: 'trace-1',
      now: () => '2026-05-14T10:00:00.000Z',
      idGenerator: () => 'failure-1'
    });

    expect(record).toMatchObject({
      id: 'failure-1',
      jobId: 'job-1',
      decision: 'dead-letter',
      failureKind: 'runtime-missing',
      reason: '未注册 runtime：missing-runtime',
      traceId: 'trace-1'
    });
    expect(repository.snapshot()).toEqual([record]);
  });

  it('builds a read-only worker alert summary from failures jobs and queue readiness', async () => {
    const repository = createMemoryWorkerFailureRepository();
    const retryable = await recordWorkerFailure({
      repository,
      jobId: 'job-retryable',
      projectId: 'project-1',
      userId: 'user-1',
      runtime: 'local-storyspec',
      kind: 'chapter-draft',
      attempt: 1,
      maxAttempts: 3,
      failureKind: 'runtime-failed',
      reason: 'runner failed',
      traceId: 'trace-retry',
      now: () => '2026-05-16T10:00:00.000Z',
      idGenerator: () => 'failure-retryable'
    });
    const deadLetter = await recordWorkerFailure({
      repository,
      jobId: 'job-dead',
      projectId: 'project-1',
      userId: 'user-1',
      runtime: 'openhands',
      kind: 'canon-review',
      attempt: 3,
      maxAttempts: 3,
      failureKind: 'runtime-failed',
      reason: 'max attempts reached',
      traceId: 'trace-dead',
      now: () => '2026-05-16T10:05:00.000Z',
      idGenerator: () => 'failure-dead'
    });

    const summary = buildWorkerAlertSummary({
      projectId: 'project-1',
      jobs: [{
        id: 'job-retryable',
        userId: 'user-1',
        projectId: 'project-1',
        kind: 'chapter-draft',
        runtime: 'local-storyspec',
        status: 'failed',
        attempt: 1,
        createdAt: '2026-05-16T09:59:00.000Z',
        updatedAt: '2026-05-16T10:00:00.000Z',
        errorMessage: 'runner failed',
        traceId: 'trace-retry'
      }, {
        id: 'job-timeout-no-record',
        userId: 'user-1',
        projectId: 'project-1',
        kind: 'chapter-draft',
        runtime: 'local-storyspec',
        status: 'timeout',
        attempt: 2,
        createdAt: '2026-05-16T10:01:00.000Z',
        updatedAt: '2026-05-16T10:03:00.000Z',
        errorMessage: 'timeout'
      }],
      failureRecords: [retryable, deadLetter],
      queueReadyState: {
        configured: true,
        connected: false,
        worker: false,
        driver: 'bullmq'
      },
      queueSnapshot: {
        pending: [{ jobId: 'job-retryable' }],
        acknowledged: [],
        failed: [{ jobId: 'job-dead' }]
      }
    });

    expect(summary).toMatchObject({
      projectId: 'project-1',
      totalAlerts: 4,
      retryableFailures: 1,
      deadLetterFailures: 1,
      failedJobsWithoutFailureRecord: 1,
      queue: {
        readiness: {
          configured: true,
          connected: false,
          worker: false,
          driver: 'bullmq'
        },
        snapshot: {
          pending: 1,
          acknowledged: 0,
          failed: 1
        }
      }
    });
    expect(summary.alerts).toEqual([
      expect.objectContaining({
        id: 'queue-unavailable',
        severity: 'critical',
        category: 'queue',
        reason: '队列未连接；worker 未运行。',
        recommendedAction: '检查 Redis/BullMQ 连接和 storyspec worker 进程。'
      }),
      expect.objectContaining({
        id: 'failure-dead',
        severity: 'critical',
        category: 'dead-letter',
        jobId: 'job-dead',
        failureId: 'failure-dead',
        recommendedAction: '人工检查 job 日志和 failure record；修正后再决定是否手动重试。'
      }),
      expect.objectContaining({
        id: 'failure-retryable',
        severity: 'warning',
        category: 'retryable',
        jobId: 'job-retryable',
        traceId: 'trace-retry',
        recommendedAction: '查看 job 日志后，可使用现有 retry API 手动重试。'
      }),
      expect.objectContaining({
        id: 'job-status-job-timeout-no-record',
        severity: 'warning',
        category: 'job-status',
        jobId: 'job-timeout-no-record',
        reason: 'job 状态为 timeout，但没有对应 worker failure record。'
      })
    ]);
    expect(repository.snapshot()).toEqual([retryable, deadLetter]);
  });

  it('tracks worker lease heartbeats and stale workers without requeueing jobs', async () => {
    const repository = createMemoryWorkerLeaseRepository();

    const registered = await refreshWorkerLease({
      repository,
      workerId: 'worker-a',
      concurrency: 2,
      activeJobIds: ['job-1'],
      traceId: 'trace-worker-a',
      now: () => '2026-05-16T12:00:00.000Z',
      leaseTtlMs: 30_000
    });
    const refreshed = await refreshWorkerLease({
      repository,
      workerId: 'worker-a',
      concurrency: 2,
      activeJobIds: ['job-2', 'job-3'],
      now: () => '2026-05-16T12:00:20.000Z',
      leaseTtlMs: 30_000
    });

    expect(registered).toMatchObject({
      workerId: 'worker-a',
      status: 'active',
      concurrency: 2,
      activeJobIds: ['job-1'],
      traceId: 'trace-worker-a',
      lastHeartbeatAt: '2026-05-16T12:00:00.000Z',
      leaseExpiresAt: '2026-05-16T12:00:30.000Z'
    });
    expect(refreshed).toMatchObject({
      workerId: 'worker-a',
      status: 'active',
      activeJobIds: ['job-2', 'job-3'],
      lastHeartbeatAt: '2026-05-16T12:00:20.000Z',
      leaseExpiresAt: '2026-05-16T12:00:50.000Z'
    });
    await expect(repository.listActive()).resolves.toEqual([refreshed]);
    await expect(repository.listStale({
      now: '2026-05-16T12:01:00.000Z'
    })).resolves.toEqual([refreshed]);
    expect(repository.snapshot()).toEqual([refreshed]);
  });

  it('marks stopped worker leases outside the active listing', async () => {
    const repository = createMemoryWorkerLeaseRepository();
    await refreshWorkerLease({
      repository,
      workerId: 'worker-a',
      concurrency: 1,
      activeJobIds: [],
      now: () => '2026-05-16T12:00:00.000Z',
      leaseTtlMs: 30_000
    });

    const stopped = await repository.markStopped({
      workerId: 'worker-a',
      stoppedAt: '2026-05-16T12:00:10.000Z'
    });

    expect(stopped).toMatchObject({
      workerId: 'worker-a',
      status: 'stopped',
      stoppedAt: '2026-05-16T12:00:10.000Z'
    });
    await expect(repository.listActive()).resolves.toEqual([]);
    await expect(repository.listStale({
      now: '2026-05-16T12:01:00.000Z'
    })).resolves.toEqual([]);
  });

  it('builds a non-mutating recovery plan for stale worker leases', async () => {
    const leaseRepository = createMemoryWorkerLeaseRepository();
    const jobRepository = createMemoryAgentJobRepository();
    await createAgentJob({
      repository: jobRepository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      traceId: 'trace-running',
      now: () => '2026-05-16T12:00:00.000Z',
      idGenerator: () => 'job-running'
    });
    await transitionAgentJob({
      repository: jobRepository,
      jobId: 'job-running',
      status: 'running',
      now: () => '2026-05-16T12:00:10.000Z'
    });
    await createAgentJob({
      repository: jobRepository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      now: () => '2026-05-16T12:00:00.000Z',
      idGenerator: () => 'job-succeeded'
    });
    await transitionAgentJob({
      repository: jobRepository,
      jobId: 'job-succeeded',
      status: 'running',
      now: () => '2026-05-16T12:00:10.000Z'
    });
    await transitionAgentJob({
      repository: jobRepository,
      jobId: 'job-succeeded',
      status: 'succeeded',
      now: () => '2026-05-16T12:00:20.000Z'
    });
    await refreshWorkerLease({
      repository: leaseRepository,
      workerId: 'worker-stale',
      concurrency: 2,
      activeJobIds: ['job-running', 'job-succeeded', 'job-missing'],
      traceId: 'trace-worker',
      now: () => '2026-05-16T12:00:00.000Z',
      leaseTtlMs: 30_000
    });
    await refreshWorkerLease({
      repository: leaseRepository,
      workerId: 'worker-active',
      concurrency: 1,
      activeJobIds: ['job-active'],
      now: () => '2026-05-16T12:02:00.000Z',
      leaseTtlMs: 30_000
    });

    const plan = await buildWorkerLeaseRecoveryPlan({
      leaseRepository,
      jobRepository,
      projectId: 'project-1',
      now: () => '2026-05-16T12:01:00.000Z'
    });

    expect(plan).toMatchObject({
      generatedAt: '2026-05-16T12:01:00.000Z',
      projectId: 'project-1',
      staleLeases: [expect.objectContaining({
        workerId: 'worker-stale',
        leaseExpiresAt: '2026-05-16T12:00:30.000Z'
      })],
      affectedJobs: [expect.objectContaining({
        jobId: 'job-running',
        workerId: 'worker-stale',
        projectId: 'project-1',
        status: 'running',
        traceId: 'trace-running',
        recommendedAction: '确认 worker 已停止后，人工检查 job 日志并决定是否标记 timeout 或手动 retry。'
      })],
      missingJobRefs: [expect.objectContaining({
        workerId: 'worker-stale',
        jobId: 'job-missing'
      })],
      ignoredJobRefs: [expect.objectContaining({
        workerId: 'worker-stale',
        jobId: 'job-succeeded',
        status: 'succeeded',
        reason: 'job 状态不是 running。'
      })]
    });
    await expect(jobRepository.findById('job-running')).resolves.toMatchObject({
      status: 'running'
    });
  });

  it('runs timeout recovery for stale worker jobs without retrying or requeueing', async () => {
    const leaseRepository = createMemoryWorkerLeaseRepository();
    const failureRepository = createMemoryWorkerFailureRepository();
    const jobRepository = createMemoryAgentJobRepository();
    await createAgentJob({
      repository: jobRepository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'canon-review',
      runtime: 'openhands',
      traceId: 'trace-stale',
      now: () => '2026-05-16T12:00:00.000Z',
      idGenerator: () => 'job-stale'
    });
    await transitionAgentJob({
      repository: jobRepository,
      jobId: 'job-stale',
      status: 'running',
      now: () => '2026-05-16T12:00:10.000Z'
    });
    await refreshWorkerLease({
      repository: leaseRepository,
      workerId: 'worker-stale',
      concurrency: 1,
      activeJobIds: ['job-stale'],
      now: () => '2026-05-16T12:00:00.000Z',
      leaseTtlMs: 30_000
    });

    const result = await recoverStaleWorkerJobs({
      leaseRepository,
      jobRepository,
      failureRepository,
      maxAttempts: 3,
      now: () => '2026-05-16T12:01:00.000Z',
      failureIdGenerator: () => 'failure-stale'
    });

    expect(result).toMatchObject({
      recoveredJobs: [expect.objectContaining({
        jobId: 'job-stale',
        workerId: 'worker-stale',
        status: 'timeout',
        failureRecord: expect.objectContaining({
          id: 'failure-stale',
          jobId: 'job-stale',
          failureKind: 'queue-failed',
          decision: 'retryable',
          reason: 'worker lease 已过期，job 从 running 恢复为 timeout。'
        })
      })],
      skippedJobs: [],
      blockedReasons: []
    });
    await expect(jobRepository.findById('job-stale')).resolves.toMatchObject({
      status: 'timeout',
      errorMessage: 'worker lease 已过期，job 从 running 恢复为 timeout。',
      runtimeErrorCode: 'WORKER_LEASE_EXPIRED'
    });
    expect(failureRepository.snapshot()).toEqual([
      expect.objectContaining({
        id: 'failure-stale',
        jobId: 'job-stale',
        decision: 'retryable'
      })
    ]);
  });

  it('job lock blocks competing workers and allows takeover after expiration', async () => {
    const repository = createMemoryWorkerJobLockRepository();

    const acquired = await repository.acquire({
      jobId: 'job-locked',
      workerId: 'worker-a',
      traceId: 'trace-a',
      now: '2026-05-16T12:00:00.000Z',
      lockTtlMs: 30_000
    });
    const blocked = await repository.acquire({
      jobId: 'job-locked',
      workerId: 'worker-b',
      now: '2026-05-16T12:00:10.000Z',
      lockTtlMs: 30_000
    });
    const heartbeat = await repository.heartbeat({
      jobId: 'job-locked',
      workerId: 'worker-a',
      now: '2026-05-16T12:00:20.000Z',
      lockTtlMs: 30_000
    });
    const takenOver = await repository.acquire({
      jobId: 'job-locked',
      workerId: 'worker-b',
      traceId: 'trace-b',
      now: '2026-05-16T12:01:00.000Z',
      lockTtlMs: 30_000
    });
    const staleHeartbeat = await repository.heartbeat({
      jobId: 'job-locked',
      workerId: 'worker-a',
      now: '2026-05-16T12:01:05.000Z',
      lockTtlMs: 30_000
    });
    const staleRelease = await repository.release({
      jobId: 'job-locked',
      workerId: 'worker-a',
      releasedAt: '2026-05-16T12:01:06.000Z'
    });
    const released = await repository.release({
      jobId: 'job-locked',
      workerId: 'worker-b',
      releasedAt: '2026-05-16T12:01:10.000Z'
    });

    expect(acquired).toMatchObject({
      acquired: true,
      lock: {
        jobId: 'job-locked',
        workerId: 'worker-a',
        status: 'active',
        acquiredAt: '2026-05-16T12:00:00.000Z',
        lastHeartbeatAt: '2026-05-16T12:00:00.000Z',
        lockExpiresAt: '2026-05-16T12:00:30.000Z',
        traceId: 'trace-a'
      }
    });
    expect(blocked).toMatchObject({
      acquired: false,
      blockedReason: 'job lock 已由 worker-a 持有，过期时间 2026-05-16T12:00:30.000Z。'
    });
    expect(heartbeat).toMatchObject({
      success: true,
      lock: {
        workerId: 'worker-a',
        lastHeartbeatAt: '2026-05-16T12:00:20.000Z',
        lockExpiresAt: '2026-05-16T12:00:50.000Z'
      }
    });
    expect(takenOver).toMatchObject({
      acquired: true,
      lock: {
        workerId: 'worker-b',
        acquiredAt: '2026-05-16T12:01:00.000Z',
        previousWorkerId: 'worker-a',
        traceId: 'trace-b'
      }
    });
    expect(staleHeartbeat).toEqual({
      success: false,
      blockedReason: 'job lock 当前归 worker-b 持有，worker-a 不能 heartbeat。'
    });
    expect(staleRelease).toEqual({
      success: false,
      blockedReason: 'job lock 当前归 worker-b 持有，worker-a 不能 release。'
    });
    expect(released).toMatchObject({
      success: true,
      lock: {
        jobId: 'job-locked',
        workerId: 'worker-b',
        status: 'released',
        releasedAt: '2026-05-16T12:01:10.000Z'
      }
    });
    await expect(repository.findByJobId('job-locked')).resolves.toMatchObject({
      workerId: 'worker-b',
      status: 'released'
    });
    expect(repository.snapshot()).toEqual([
      expect.objectContaining({
        jobId: 'job-locked',
        workerId: 'worker-b',
        status: 'released'
      })
    ]);
  });
});
