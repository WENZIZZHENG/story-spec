import type { AgentJob } from '../jobs/agent-job.js';
import type { AgentRuntimeAdapter, AgentRuntimeOutput, RunAgentJobWithRuntimeInput, RunAgentJobWithRuntimeResult } from './agent-runtime.js';
import { runAgentJobWithRuntime } from './agent-runtime.js';

export interface LocalStorySpecRunnerInput {
  execute?: (job: AgentJob) => Promise<AgentRuntimeOutput>;
}

const emptyLogs = async function* (): AsyncIterable<string> {
  return;
};

export const createLocalStorySpecRunner = (
  input: LocalStorySpecRunnerInput = {}
): AgentRuntimeAdapter => {
  let latestResult: AgentRuntimeOutput | undefined;

  return {
    id: 'local-storyspec',
    async validate(job) {
      return job.runtime === 'local-storyspec'
        ? []
        : [`runtime 不匹配：${job.runtime}`];
    },
    async start(job) {
      latestResult = input.execute
        ? await input.execute(job)
        : {
            jobId: job.id,
            candidateRef: `local-storyspec:${job.id}`,
            previewOnly: true,
            summary: '本地 StorySpec runtime 已生成候选'
          };
      return latestResult;
    },
    async cancel() {
      return;
    },
    logs: emptyLogs,
    async result() {
      return latestResult;
    }
  };
};

export const runAgentJobWithRuntimeLocal = async (
  input: RunAgentJobWithRuntimeInput
): Promise<RunAgentJobWithRuntimeResult> => runAgentJobWithRuntime(input);

export { runAgentJobWithRuntime };
