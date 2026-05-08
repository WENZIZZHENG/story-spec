export type AgentJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled' | 'timeout';

export interface AgentJob {
  id: string;
  userId: string;
  projectId: string;
  kind: string;
  runtime: string;
  status: AgentJobStatus;
  attempt: number;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

export interface AgentJobRepository {
  findById(jobId: string): Promise<AgentJob | undefined>;
  findActiveByIdempotencyKey(input: {
    userId: string;
    projectId: string;
    idempotencyKey: string;
  }): Promise<AgentJob | undefined>;
  save(job: AgentJob): Promise<void>;
}

export interface AgentJobResult {
  blocked: boolean;
  blockedReasons: string[];
  job?: AgentJob;
}

export interface CreateAgentJobInput {
  repository: AgentJobRepository;
  userId: string;
  projectId: string;
  kind: string;
  runtime: string;
  idempotencyKey?: string;
  now?: () => string;
  idGenerator?: () => string;
}

export interface TransitionAgentJobInput {
  repository: AgentJobRepository;
  jobId: string;
  status: AgentJobStatus;
  errorMessage?: string;
  now?: () => string;
}

export interface CancelAgentJobInput {
  repository: AgentJobRepository;
  jobId: string;
  now?: () => string;
}

export interface RetryAgentJobInput {
  repository: AgentJobRepository;
  jobId: string;
  now?: () => string;
  idGenerator?: () => string;
}

const terminalStatuses = new Set<AgentJobStatus>(['succeeded', 'failed', 'canceled', 'timeout']);
const activeStatuses = new Set<AgentJobStatus>(['queued', 'running']);
const retryableStatuses = new Set<AgentJobStatus>(['failed', 'timeout']);
const transitions: Record<AgentJobStatus, AgentJobStatus[]> = {
  queued: ['running', 'canceled'],
  running: ['succeeded', 'failed', 'timeout', 'canceled'],
  succeeded: [],
  failed: [],
  canceled: [],
  timeout: []
};

const currentTimestamp = (): string => new Date().toISOString();

const defaultId = (): string => `job-${Math.random().toString(36).slice(2, 12)}`;

const blocked = (reason: string): AgentJobResult => ({
  blocked: true,
  blockedReasons: [reason]
});

export const createMemoryAgentJobRepository = (): AgentJobRepository => {
  const jobs = new Map<string, AgentJob>();

  return {
    async findById(jobId) {
      return jobs.get(jobId);
    },
    async findActiveByIdempotencyKey(input) {
      return [...jobs.values()].find(job =>
        job.userId === input.userId
        && job.projectId === input.projectId
        && job.idempotencyKey === input.idempotencyKey
        && activeStatuses.has(job.status)
      );
    },
    async save(job) {
      jobs.set(job.id, job);
    }
  };
};

export const createAgentJob = async (
  input: CreateAgentJobInput
): Promise<AgentJobResult> => {
  if (input.idempotencyKey) {
    const existing = await input.repository.findActiveByIdempotencyKey({
      userId: input.userId,
      projectId: input.projectId,
      idempotencyKey: input.idempotencyKey
    });
    if (existing) {
      return {
        blocked: false,
        blockedReasons: [],
        job: existing
      };
    }
  }

  const now = input.now?.() ?? currentTimestamp();
  const job = {
    id: input.idGenerator?.() ?? defaultId(),
    userId: input.userId,
    projectId: input.projectId,
    kind: input.kind,
    runtime: input.runtime,
    status: 'queued' as const,
    attempt: 1,
    idempotencyKey: input.idempotencyKey,
    createdAt: now,
    updatedAt: now
  };

  await input.repository.save(job);
  return {
    blocked: false,
    blockedReasons: [],
    job
  };
};

export const transitionAgentJob = async (
  input: TransitionAgentJobInput
): Promise<AgentJobResult> => {
  const job = await input.repository.findById(input.jobId);
  if (!job) {
    return blocked('job 不存在');
  }

  if (!transitions[job.status].includes(input.status)) {
    return blocked(`非法状态转移：${job.status} -> ${input.status}`);
  }

  const next = {
    ...job,
    status: input.status,
    errorMessage: input.errorMessage,
    updatedAt: input.now?.() ?? currentTimestamp()
  };
  await input.repository.save(next);

  return {
    blocked: false,
    blockedReasons: [],
    job: next
  };
};

export const cancelAgentJob = async (
  input: CancelAgentJobInput
): Promise<AgentJobResult> => transitionAgentJob({
  repository: input.repository,
  jobId: input.jobId,
  status: 'canceled',
  now: input.now
});

export const retryAgentJob = async (
  input: RetryAgentJobInput
): Promise<AgentJobResult> => {
  const job = await input.repository.findById(input.jobId);
  if (!job) {
    return blocked('job 不存在');
  }

  if (!retryableStatuses.has(job.status)) {
    const reason = terminalStatuses.has(job.status)
      ? `当前状态不能重试：${job.status}`
      : `job 尚未结束，不能重试：${job.status}`;
    return blocked(reason);
  }

  const now = input.now?.() ?? currentTimestamp();
  const attempt = job.attempt + 1;
  const retry = {
    ...job,
    id: input.idGenerator?.() ?? defaultId(),
    status: 'queued' as const,
    attempt,
    idempotencyKey: `${job.idempotencyKey ?? job.id}:retry:${attempt}`,
    createdAt: now,
    updatedAt: now,
    errorMessage: undefined
  };

  await input.repository.save(retry);

  return {
    blocked: false,
    blockedReasons: [],
    job: retry
  };
};
