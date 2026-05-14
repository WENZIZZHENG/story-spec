import { describe, expect, it, vi } from 'vitest';
import {
  createLocalStorySpecRunner
} from '../../src/server/agent-runtime/local-storyspec-runner.js';
import {
  createAgentJob,
  createMemoryAgentJobRepository,
  cancelAgentJob
} from '../../src/server/jobs/agent-job.js';
import {
  createBullMqAgentJobQueue,
  normalizeRedisConnection
} from '../../src/server/queue/bullmq-agent-job-queue.js';
import {
  createAgentJobQueuePayload,
  createMemoryAgentJobQueue
} from '../../src/server/queue/agent-job-queue.js';
import {
  runNextAgentJob
} from '../../src/server/workers/agent-job-worker.js';

describe('multiuser worker queue', () => {
  it('enqueues payloads and runs queued jobs through a preview-only runtime', async () => {
    const repository = createMemoryAgentJobRepository();
    const queue = createMemoryAgentJobQueue();
    const created = await createAgentJob({
      repository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      now: () => '2026-05-13T10:00:00.000Z',
      idGenerator: () => 'job-1'
    });
    await queue.enqueue(createAgentJobQueuePayload(created.job!));

    const result = await runNextAgentJob({
      repository,
      queue,
      runtimes: [
        createLocalStorySpecRunner({
          execute: async job => ({
            jobId: job.id,
            candidateRef: `candidate:${job.id}`,
            previewOnly: true,
            summary: '生成章节候选'
          })
        })
      ],
      now: () => '2026-05-13T10:01:00.000Z'
    });

    expect(result).toMatchObject({
      processed: true,
      action: 'succeeded',
      payload: {
        jobId: 'job-1',
        projectId: 'project-1',
        userId: 'user-1',
        runtime: 'local-storyspec',
        kind: 'chapter-draft',
        attempt: 1
      },
      job: {
        id: 'job-1',
        status: 'succeeded'
      },
      output: {
        jobId: 'job-1',
        candidateRef: 'candidate:job-1',
        previewOnly: true
      }
    });
    expect(queue.snapshot()).toMatchObject({
      pending: [],
      acknowledged: ['job-1'],
      failed: []
    });
    await expect(repository.findById('job-1')).resolves.toMatchObject({
      status: 'succeeded'
    });
  });

  it('acknowledges canceled jobs without starting the runtime', async () => {
    const repository = createMemoryAgentJobRepository();
    const queue = createMemoryAgentJobQueue();
    const start = vi.fn();
    const created = await createAgentJob({
      repository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      now: () => '2026-05-13T10:00:00.000Z',
      idGenerator: () => 'job-1'
    });
    await queue.enqueue(createAgentJobQueuePayload(created.job!));
    await cancelAgentJob({
      repository,
      jobId: 'job-1',
      now: () => '2026-05-13T10:00:10.000Z'
    });

    const result = await runNextAgentJob({
      repository,
      queue,
      runtimes: [
        createLocalStorySpecRunner({
          execute: start
        })
      ]
    });

    expect(result).toMatchObject({
      processed: true,
      action: 'skipped',
      skippedReason: 'job 状态不是 queued：canceled'
    });
    expect(start).not.toHaveBeenCalled();
    expect(queue.snapshot()).toMatchObject({
      acknowledged: ['job-1'],
      failed: []
    });
  });

  it('marks jobs and queue items as failed when runtime execution fails', async () => {
    const repository = createMemoryAgentJobRepository();
    const queue = createMemoryAgentJobQueue();
    const created = await createAgentJob({
      repository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      now: () => '2026-05-13T10:00:00.000Z',
      idGenerator: () => 'job-1'
    });
    await queue.enqueue(createAgentJobQueuePayload(created.job!));

    const result = await runNextAgentJob({
      repository,
      queue,
      runtimes: [
        createLocalStorySpecRunner({
          execute: async () => {
            throw new Error('runner exploded');
          }
        })
      ],
      now: () => '2026-05-13T10:01:00.000Z'
    });

    expect(result).toMatchObject({
      processed: true,
      action: 'failed',
      blockedReasons: ['runner exploded'],
      job: {
        id: 'job-1',
        status: 'failed',
        runtimeErrorCode: 'RUNTIME_EXECUTION_FAILED'
      }
    });
    expect(queue.snapshot()).toMatchObject({
      acknowledged: [],
      failed: [
        {
          jobId: 'job-1',
          reason: 'runner exploded'
        }
      ]
    });
  });

  it('normalizes Redis URLs for BullMQ and exposes queue readiness', async () => {
    expect(normalizeRedisConnection('redis://localhost:6379/2')).toEqual({
      host: 'localhost',
      port: 6379,
      db: 2
    });

    const queueClient = {
      add: vi.fn(async () => ({ id: 'job-1' })),
      close: vi.fn(async () => {})
    };
    const workerClient = {
      close: vi.fn(async () => {})
    };
    const queue = createBullMqAgentJobQueue({
      redisUrl: 'redis://localhost:6379',
      queueName: 'storyspec-agent-jobs',
      clients: {
        queue: queueClient,
        worker: workerClient
      }
    });

    await queue.enqueue({
      jobId: 'job-1',
      projectId: 'project-1',
      userId: 'user-1',
      runtime: 'local-storyspec',
      kind: 'chapter-draft',
      attempt: 1
    });

    expect(queueClient.add).toHaveBeenCalledWith('agent-job', {
      jobId: 'job-1',
      projectId: 'project-1',
      userId: 'user-1',
      runtime: 'local-storyspec',
      kind: 'chapter-draft',
      attempt: 1
    }, {
      jobId: 'job-1',
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: false
    });
    expect(queue.getReadyState()).toEqual({
      configured: true,
      connected: true,
      worker: true,
      driver: 'bullmq'
    });
    await queue.close();
    expect(queueClient.close).toHaveBeenCalled();
    expect(workerClient.close).toHaveBeenCalled();
  });
});
