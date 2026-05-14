import type { AgentRuntimeAdapter, AgentRuntimeOutput } from '../agent-runtime/agent-runtime.js';
import { runAgentJobWithRuntime } from '../agent-runtime/agent-runtime.js';
import type { AgentJob, AgentJobRepository } from '../jobs/agent-job.js';
import type { AgentJobQueue, AgentJobQueuePayload } from '../queue/agent-job-queue.js';

export type AgentJobWorkerAction = 'idle' | 'succeeded' | 'failed' | 'skipped';

export interface RunNextAgentJobInput {
  repository: AgentJobRepository;
  queue: AgentJobQueue;
  runtimes: AgentRuntimeAdapter[];
  now?: () => string;
}

export interface RunNextAgentJobResult {
  processed: boolean;
  action: AgentJobWorkerAction;
  payload?: AgentJobQueuePayload;
  job?: AgentJob;
  output?: AgentRuntimeOutput;
  blockedReasons: string[];
  skippedReason?: string;
}

const idleResult = (): RunNextAgentJobResult => ({
  processed: false,
  action: 'idle',
  blockedReasons: []
});

export const runNextAgentJob = async (
  input: RunNextAgentJobInput
): Promise<RunNextAgentJobResult> => {
  const item = await input.queue.dequeue();
  if (!item) {
    return idleResult();
  }

  const job = await input.repository.findById(item.payload.jobId);
  if (!job) {
    const reason = 'job 不存在';
    await input.queue.fail(item, reason);
    return {
      processed: true,
      action: 'failed',
      payload: item.payload,
      blockedReasons: [reason]
    };
  }

  if (job.status !== 'queued') {
    const skippedReason = `job 状态不是 queued：${job.status}`;
    await input.queue.ack(item);
    return {
      processed: true,
      action: 'skipped',
      payload: item.payload,
      job,
      blockedReasons: [],
      skippedReason
    };
  }

  const runtime = input.runtimes.find(candidate => candidate.id === job.runtime);
  if (!runtime) {
    const reason = `未注册 runtime：${job.runtime}`;
    await input.queue.fail(item, reason);
    return {
      processed: true,
      action: 'failed',
      payload: item.payload,
      job,
      blockedReasons: [reason]
    };
  }

  const result = await runAgentJobWithRuntime({
    repository: input.repository,
    jobId: job.id,
    runtime,
    now: input.now
  });

  if (result.blocked) {
    const reason = result.blockedReasons[0] ?? 'runtime 执行失败';
    await input.queue.fail(item, reason);
    return {
      processed: true,
      action: 'failed',
      payload: item.payload,
      job: result.job,
      blockedReasons: result.blockedReasons
    };
  }

  await input.queue.ack(item);
  return {
    processed: true,
    action: 'succeeded',
    payload: item.payload,
    job: result.job,
    output: result.output,
    blockedReasons: []
  };
};
