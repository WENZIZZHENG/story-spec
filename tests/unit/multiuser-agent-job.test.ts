import { describe, expect, it } from 'vitest';
import {
  cancelAgentJob,
  createAgentJob,
  createMemoryAgentJobRepository,
  retryAgentJob,
  transitionAgentJob
} from '../../src/server/jobs/agent-job.js';

describe('multiuser agent job foundation', () => {
  it('creates queued jobs and reuses active jobs by idempotency key', async () => {
    const repository = createMemoryAgentJobRepository();

    const first = await createAgentJob({
      repository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      idempotencyKey: 'draft-chapter-1',
      now: () => '2026-05-08T12:00:00.000Z',
      idGenerator: () => 'job-1'
    });
    const second = await createAgentJob({
      repository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      idempotencyKey: 'draft-chapter-1',
      now: () => '2026-05-08T12:01:00.000Z',
      idGenerator: () => 'job-2'
    });

    expect(first.blocked).toBe(false);
    expect(first.job).toMatchObject({
      id: 'job-1',
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      status: 'queued',
      attempt: 1,
      idempotencyKey: 'draft-chapter-1',
      createdAt: '2026-05-08T12:00:00.000Z',
      updatedAt: '2026-05-08T12:00:00.000Z'
    });
    expect(second.job?.id).toBe('job-1');
  });

  it('enforces lifecycle transitions and cancellation', async () => {
    const repository = createMemoryAgentJobRepository();
    const created = await createAgentJob({
      repository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      now: () => '2026-05-08T12:00:00.000Z',
      idGenerator: () => 'job-1'
    });

    await expect(transitionAgentJob({
      repository,
      jobId: 'job-1',
      status: 'succeeded',
      now: () => '2026-05-08T12:00:10.000Z'
    })).resolves.toMatchObject({
      blocked: true,
      blockedReasons: ['非法状态转移：queued -> succeeded']
    });

    await expect(transitionAgentJob({
      repository,
      jobId: 'job-1',
      status: 'running',
      now: () => '2026-05-08T12:00:10.000Z'
    })).resolves.toMatchObject({
      blocked: false,
      job: {
        id: created.job?.id,
        status: 'running',
        updatedAt: '2026-05-08T12:00:10.000Z'
      }
    });

    await expect(cancelAgentJob({
      repository,
      jobId: 'job-1',
      now: () => '2026-05-08T12:00:20.000Z'
    })).resolves.toMatchObject({
      blocked: false,
      job: {
        status: 'canceled',
        updatedAt: '2026-05-08T12:00:20.000Z'
      }
    });
  });

  it('retries failed jobs with the next attempt', async () => {
    const repository = createMemoryAgentJobRepository();
    await createAgentJob({
      repository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      idempotencyKey: 'draft-chapter-1',
      now: () => '2026-05-08T12:00:00.000Z',
      idGenerator: () => 'job-1'
    });
    await transitionAgentJob({
      repository,
      jobId: 'job-1',
      status: 'running',
      now: () => '2026-05-08T12:00:10.000Z'
    });
    await transitionAgentJob({
      repository,
      jobId: 'job-1',
      status: 'failed',
      errorMessage: 'runtime failed',
      now: () => '2026-05-08T12:00:20.000Z'
    });

    await expect(retryAgentJob({
      repository,
      jobId: 'job-1',
      now: () => '2026-05-08T12:01:00.000Z',
      idGenerator: () => 'job-2'
    })).resolves.toMatchObject({
      blocked: false,
      job: {
        id: 'job-2',
        status: 'queued',
        attempt: 2,
        idempotencyKey: 'draft-chapter-1:retry:2'
      }
    });
  });
});
