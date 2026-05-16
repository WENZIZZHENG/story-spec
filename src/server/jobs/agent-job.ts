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
  traceId?: string;
  runtimeErrorCode?: string;
}

export interface AgentJobRepository {
  findById(jobId: string): Promise<AgentJob | undefined>;
  findActiveByIdempotencyKey(input: {
    userId: string;
    projectId: string;
    idempotencyKey: string;
  }): Promise<AgentJob | undefined>;
  listByProject?(projectId: string): Promise<AgentJob[]>;
  save(job: AgentJob): Promise<void>;
}

export interface AgentJobResult {
  blocked: boolean;
  blockedReasons: string[];
  job?: AgentJob;
}

export interface AgentJobDashboard {
  projectId: string;
  totalJobs: number;
  activeJobs: number;
  retryableJobs: number;
  statusCounts: Record<AgentJobStatus, number>;
  latestJobs: AgentJob[];
  queue: {
    readiness: {
      configured: boolean;
      connected: boolean;
      worker: boolean;
      driver: 'memory' | 'bullmq' | 'none';
    };
    snapshot?: {
      pending: number;
      acknowledged: number;
      failed: number;
    };
  };
}

export type AgentJobLogLevel = 'info' | 'warning' | 'error';

export interface AgentJobLogEntry {
  level: AgentJobLogLevel;
  message: string;
  createdAt: string;
  traceId?: string;
  runtimeErrorCode?: string;
}

export interface AgentJobLog {
  projectId: string;
  jobId: string;
  entries: AgentJobLogEntry[];
}

export interface CreateAgentJobInput {
  repository: AgentJobRepository;
  userId: string;
  projectId: string;
  kind: string;
  runtime: string;
  idempotencyKey?: string;
  traceId?: string;
  now?: () => string;
  idGenerator?: () => string;
}

export interface TransitionAgentJobInput {
  repository: AgentJobRepository;
  jobId: string;
  status: AgentJobStatus;
  errorMessage?: string;
  runtimeErrorCode?: string;
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
const allStatuses: AgentJobStatus[] = ['queued', 'running', 'succeeded', 'failed', 'canceled', 'timeout'];
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

const buildJobStatusLogMessage = (
  job: AgentJob
): { level: AgentJobLogLevel; message: string } => {
  switch (job.status) {
    case 'queued':
      return { level: 'info', message: 'job 等待 worker 执行。' };
    case 'running':
      return { level: 'info', message: 'job 正在运行。' };
    case 'succeeded':
      return { level: 'info', message: 'job 已完成。' };
    case 'failed':
      return { level: 'error', message: `job 失败：${job.errorMessage ?? 'runtime 执行失败'}` };
    case 'timeout':
      return { level: 'error', message: `job 超时：${job.errorMessage ?? 'runtime 执行超时'}` };
    case 'canceled':
      return { level: 'warning', message: 'job 已取消。' };
  }
};

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
    async listByProject(projectId) {
      return [...jobs.values()].filter(job => job.projectId === projectId);
    },
    async save(job) {
      jobs.set(job.id, job);
    }
  };
};

export const buildAgentJobLog = (job: AgentJob): AgentJobLog => {
  const withTrace = job.traceId ? { traceId: job.traceId } : {};
  const entries: AgentJobLogEntry[] = [{
    level: 'info',
    message: `job 已创建并进入队列：${job.kind} / ${job.runtime}`,
    createdAt: job.createdAt,
    ...withTrace
  }];

  if (job.status !== 'queued' || job.updatedAt !== job.createdAt) {
    const statusLog = buildJobStatusLogMessage(job);
    entries.push({
      level: statusLog.level,
      message: statusLog.message,
      createdAt: job.updatedAt,
      ...withTrace,
      ...(job.runtimeErrorCode ? { runtimeErrorCode: job.runtimeErrorCode } : {})
    });
  }

  return {
    projectId: job.projectId,
    jobId: job.id,
    entries
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
    updatedAt: now,
    traceId: input.traceId
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
    runtimeErrorCode: input.runtimeErrorCode,
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

export const buildAgentJobDashboard = (
  input: {
    projectId: string;
    jobs: AgentJob[];
    queueReadyState: AgentJobDashboard['queue']['readiness'];
    queueSnapshot?: {
      pending: unknown[];
      acknowledged: unknown[];
      failed: unknown[];
    };
    latestLimit?: number;
  }
): AgentJobDashboard => {
  const statusCounts = Object.fromEntries(
    allStatuses.map(status => [status, 0])
  ) as Record<AgentJobStatus, number>;
  for (const job of input.jobs) {
    statusCounts[job.status] += 1;
  }

  return {
    projectId: input.projectId,
    totalJobs: input.jobs.length,
    activeJobs: input.jobs.filter(job => activeStatuses.has(job.status)).length,
    retryableJobs: input.jobs.filter(job => retryableStatuses.has(job.status)).length,
    statusCounts,
    latestJobs: [...input.jobs]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, input.latestLimit ?? 10),
    queue: {
      readiness: input.queueReadyState,
      ...(input.queueSnapshot
        ? {
          snapshot: {
            pending: input.queueSnapshot.pending.length,
            acknowledged: input.queueSnapshot.acknowledged.length,
            failed: input.queueSnapshot.failed.length
          }
        }
        : {})
    }
  };
};
