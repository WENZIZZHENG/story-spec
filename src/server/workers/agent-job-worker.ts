import type { AgentRuntimeAdapter, AgentRuntimeOutput } from '../agent-runtime/agent-runtime.js';
import { runAgentJobWithRuntime } from '../agent-runtime/agent-runtime.js';
import type { AgentJob, AgentJobRepository } from '../jobs/agent-job.js';
import type { AgentJobQueue, AgentJobQueuePayload } from '../queue/agent-job-queue.js';
import type { WorkerFailureKind, WorkerFailureRecord, WorkerFailureRepository } from './worker-reliability.js';
import { recordWorkerFailure } from './worker-reliability.js';

export type AgentJobWorkerAction = 'idle' | 'succeeded' | 'failed' | 'skipped';

export interface RunNextAgentJobInput {
  repository: AgentJobRepository;
  queue: AgentJobQueue;
  runtimes: AgentRuntimeAdapter[];
  failureRepository?: WorkerFailureRepository;
  maxAttempts?: number;
  now?: () => string;
}

export interface RunNextAgentJobResult {
  processed: boolean;
  action: AgentJobWorkerAction;
  payload?: AgentJobQueuePayload;
  job?: AgentJob;
  output?: AgentRuntimeOutput;
  failureRecord?: WorkerFailureRecord;
  blockedReasons: string[];
  skippedReason?: string;
}

const idleResult = (): RunNextAgentJobResult => ({
  processed: false,
  action: 'idle',
  blockedReasons: []
});

const recordFailure = async (
  input: RunNextAgentJobInput,
  payload: AgentJobQueuePayload,
  failureKind: WorkerFailureKind,
  reason: string
): Promise<WorkerFailureRecord | undefined> => {
  if (!input.failureRepository) {
    return undefined;
  }

  return recordWorkerFailure({
    repository: input.failureRepository,
    jobId: payload.jobId,
    projectId: payload.projectId,
    userId: payload.userId,
    runtime: payload.runtime,
    kind: payload.kind,
    attempt: payload.attempt,
    maxAttempts: input.maxAttempts ?? 3,
    failureKind,
    reason,
    traceId: payload.traceId,
    now: input.now
  });
};

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
    const failureRecord = await recordFailure(input, item.payload, 'job-missing', reason);
    await input.queue.fail(item, reason);
    return {
      processed: true,
      action: 'failed',
      payload: item.payload,
      failureRecord,
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
    const failureRecord = await recordFailure(input, item.payload, 'runtime-missing', reason);
    await input.queue.fail(item, reason);
    return {
      processed: true,
      action: 'failed',
      payload: item.payload,
      job,
      failureRecord,
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
    const failureRecord = await recordFailure(input, item.payload, 'runtime-failed', reason);
    await input.queue.fail(item, reason);
    return {
      processed: true,
      action: 'failed',
      payload: item.payload,
      job: result.job,
      failureRecord,
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
