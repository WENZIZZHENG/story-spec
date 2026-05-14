import { describe, expect, it } from 'vitest';
import {
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
});
