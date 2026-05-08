import { describe, expect, it } from 'vitest';
import {
  createLocalStorySpecRunner,
  runAgentJobWithRuntime
} from '../../src/server/agent-runtime/local-storyspec-runner.js';
import {
  createOpenHandsRunner
} from '../../src/server/agent-runtime/openhands-runner.js';
import {
  createAgentJob,
  createMemoryAgentJobRepository
} from '../../src/server/jobs/agent-job.js';

describe('multiuser agent runtime adapters', () => {
  it('runs a queued job through the local runner as preview-only candidate output', async () => {
    const repository = createMemoryAgentJobRepository();
    await createAgentJob({
      repository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      now: () => '2026-05-08T12:00:00.000Z',
      idGenerator: () => 'job-1',
      traceId: 'trace-job-1'
    });

    const result = await runAgentJobWithRuntime({
      repository,
      jobId: 'job-1',
      runtime: createLocalStorySpecRunner({
        execute: async job => ({
          jobId: job.id,
          candidateRef: `candidate:${job.id}`,
          previewOnly: true,
          summary: '生成章节候选'
        })
      }),
      now: () => '2026-05-08T12:01:00.000Z'
    });

    expect(result).toMatchObject({
      blocked: false,
      output: {
        jobId: 'job-1',
        candidateRef: 'candidate:job-1',
        previewOnly: true,
        summary: '生成章节候选'
      },
      job: {
        id: 'job-1',
        status: 'succeeded',
        traceId: 'trace-job-1'
      }
    });
  });

  it('marks runtime failures on the job without applying output', async () => {
    const repository = createMemoryAgentJobRepository();
    await createAgentJob({
      repository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      now: () => '2026-05-08T12:00:00.000Z',
      idGenerator: () => 'job-1'
    });

    const result = await runAgentJobWithRuntime({
      repository,
      jobId: 'job-1',
      runtime: createLocalStorySpecRunner({
        execute: async () => {
          throw new Error('runner failed');
        }
      }),
      now: () => '2026-05-08T12:01:00.000Z'
    });

    expect(result).toMatchObject({
      blocked: true,
      blockedReasons: ['runner failed'],
      job: {
        id: 'job-1',
        status: 'failed',
        errorMessage: 'runner failed',
        runtimeErrorCode: 'RUNTIME_EXECUTION_FAILED'
      }
    });
  });

  it('creates an OpenHands headless plan that cannot auto-apply results', async () => {
    const runner = createOpenHandsRunner({
      workspaceRoot: 'D:\\storyspec-data\\project-1',
      command: 'openhands',
      promptPrefix: 'StorySpec job'
    });
    const repository = createMemoryAgentJobRepository();
    const created = await createAgentJob({
      repository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'openhands',
      now: () => '2026-05-08T12:00:00.000Z',
      idGenerator: () => 'job-1'
    });

    expect(runner.plan(created.job!)).toEqual({
      command: 'openhands',
      args: [
        '--workspace',
        'D:\\storyspec-data\\project-1',
        '--prompt',
        'StorySpec job: chapter-draft (job-1)'
      ],
      workspaceRoot: 'D:\\storyspec-data\\project-1',
      autoApply: false
    });

    await expect(runner.start(created.job!)).resolves.toMatchObject({
      jobId: 'job-1',
      candidateRef: 'openhands:job-1',
      previewOnly: true
    });
  });
});
