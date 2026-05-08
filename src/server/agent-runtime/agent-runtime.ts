import type { AgentJob, AgentJobRepository } from '../jobs/agent-job.js';
import { transitionAgentJob } from '../jobs/agent-job.js';

export interface AgentRuntimeOutput {
  jobId: string;
  candidateRef: string;
  previewOnly: true;
  summary: string;
}

export interface AgentRuntimeAdapter {
  readonly id: string;
  validate(job: AgentJob): Promise<string[]>;
  start(job: AgentJob): Promise<AgentRuntimeOutput>;
  cancel(job: AgentJob): Promise<void>;
  logs(job: AgentJob): AsyncIterable<string>;
  result(job: AgentJob): Promise<AgentRuntimeOutput | undefined>;
}

export interface RunAgentJobWithRuntimeInput {
  repository: AgentJobRepository;
  jobId: string;
  runtime: AgentRuntimeAdapter;
  now?: () => string;
}

export interface RunAgentJobWithRuntimeResult {
  blocked: boolean;
  blockedReasons: string[];
  job?: AgentJob;
  output?: AgentRuntimeOutput;
}

const blocked = (
  reason: string,
  job?: AgentJob
): RunAgentJobWithRuntimeResult => ({
  blocked: true,
  blockedReasons: [reason],
  job
});

export const runAgentJobWithRuntime = async (
  input: RunAgentJobWithRuntimeInput
): Promise<RunAgentJobWithRuntimeResult> => {
  const job = await input.repository.findById(input.jobId);
  if (!job) {
    return blocked('job 不存在');
  }

  const validationErrors = await input.runtime.validate(job);
  if (validationErrors.length > 0) {
    return blocked(validationErrors[0], job);
  }

  const running = await transitionAgentJob({
    repository: input.repository,
    jobId: job.id,
    status: 'running',
    now: input.now
  });
  if (running.blocked || !running.job) {
    return blocked(running.blockedReasons[0] ?? 'job 无法进入运行状态', running.job);
  }

  try {
    const output = await input.runtime.start(running.job);
    const succeeded = await transitionAgentJob({
      repository: input.repository,
      jobId: running.job.id,
      status: 'succeeded',
      now: input.now
    });

    return {
      blocked: false,
      blockedReasons: [],
      job: succeeded.job,
      output
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed = await transitionAgentJob({
      repository: input.repository,
      jobId: running.job.id,
      status: 'failed',
      errorMessage: message,
      runtimeErrorCode: 'RUNTIME_EXECUTION_FAILED',
      now: input.now
    });

    return blocked(message, failed.job);
  }
};
