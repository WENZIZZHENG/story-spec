import type { AgentJob } from '../jobs/agent-job.js';
import type { AgentRuntimeAdapter, AgentRuntimeOutput } from './agent-runtime.js';

export interface OpenHandsRunnerInput {
  workspaceRoot: string;
  command?: string;
  promptPrefix?: string;
}

export interface OpenHandsExecutionPlan {
  command: string;
  args: string[];
  workspaceRoot: string;
  autoApply: false;
}

export interface OpenHandsRunner extends AgentRuntimeAdapter {
  plan(job: AgentJob): OpenHandsExecutionPlan;
}

const emptyLogs = async function* (): AsyncIterable<string> {
  return;
};

export const createOpenHandsRunner = (
  input: OpenHandsRunnerInput
): OpenHandsRunner => {
  const command = input.command ?? 'openhands';
  const promptPrefix = input.promptPrefix ?? 'StorySpec job';
  let latestResult: AgentRuntimeOutput | undefined;

  return {
    id: 'openhands',
    plan(job) {
      return {
        command,
        args: [
          '--workspace',
          input.workspaceRoot,
          '--prompt',
          `${promptPrefix}: ${job.kind} (${job.id})`
        ],
        workspaceRoot: input.workspaceRoot,
        autoApply: false
      };
    },
    async validate(job) {
      return job.runtime === 'openhands'
        ? []
        : [`runtime 不匹配：${job.runtime}`];
    },
    async start(job) {
      this.plan(job);
      latestResult = {
        jobId: job.id,
        candidateRef: `openhands:${job.id}`,
        previewOnly: true,
        summary: 'OpenHands PoC runtime 已生成候选'
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
