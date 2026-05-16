import { describe, expect, it } from 'vitest';
import {
  buildWorkerAlertSummary,
  classifyWorkerFailure,
  createMemoryWorkerFailureRepository,
  recordWorkerFailure
} from '../../src/server/workers/worker-reliability.js';

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
});
