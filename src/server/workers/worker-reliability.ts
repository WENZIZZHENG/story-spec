import type { AgentJob, AgentJobRepository } from '../jobs/agent-job.js';
import type { QueueReadyState } from '../queue/agent-job-queue.js';

export type WorkerFailureKind =
  | 'job-missing'
  | 'runtime-missing'
  | 'runtime-failed'
  | 'queue-failed';

export type WorkerFailureDecision = 'retryable' | 'dead-letter' | 'ignored';

export interface WorkerFailurePolicyInput {
  reason: string;
  failureKind: WorkerFailureKind;
  attempt: number;
  maxAttempts: number;
}

export interface WorkerFailurePolicyDecision {
  decision: WorkerFailureDecision;
  retryable: boolean;
  deadLetter: boolean;
}

export interface WorkerFailureRecord {
  id: string;
  jobId: string;
  projectId: string;
  userId: string;
  runtime: string;
  kind: string;
  attempt: number;
  maxAttempts: number;
  failureKind: WorkerFailureKind;
  decision: WorkerFailureDecision;
  reason: string;
  traceId?: string;
  createdAt: string;
}

export interface WorkerFailureRepository {
  save(record: WorkerFailureRecord): Promise<void>;
  listByJob(jobId: string): Promise<WorkerFailureRecord[]>;
  snapshot(): WorkerFailureRecord[];
}

export type WorkerLeaseStatus = 'active' | 'stopped';

export interface WorkerLease {
  workerId: string;
  status: WorkerLeaseStatus;
  concurrency: number;
  activeJobIds: string[];
  lastHeartbeatAt: string;
  leaseExpiresAt: string;
  traceId?: string;
  stoppedAt?: string;
}

export interface WorkerLeaseRepository {
  save(lease: WorkerLease): Promise<void>;
  findByWorkerId(workerId: string): Promise<WorkerLease | undefined>;
  listActive(): Promise<WorkerLease[]>;
  listStale(input: { now: string }): Promise<WorkerLease[]>;
  markStopped(input: { workerId: string; stoppedAt: string }): Promise<WorkerLease | undefined>;
  snapshot(): WorkerLease[];
}

export type WorkerAlertSeverity = 'info' | 'warning' | 'critical';

export type WorkerAlertCategory = 'queue' | 'retryable' | 'dead-letter' | 'job-status';

export interface WorkerAlertItem {
  id: string;
  severity: WorkerAlertSeverity;
  category: WorkerAlertCategory;
  jobId?: string;
  failureId?: string;
  reason: string;
  recommendedAction: string;
  traceId?: string;
  createdAt: string;
}

export interface WorkerAlertSummary {
  projectId: string;
  totalAlerts: number;
  retryableFailures: number;
  deadLetterFailures: number;
  failedJobsWithoutFailureRecord: number;
  queue: {
    readiness: QueueReadyState;
    snapshot?: {
      pending: number;
      acknowledged: number;
      failed: number;
    };
  };
  alerts: WorkerAlertItem[];
}

export interface WorkerLeaseRecoveryAffectedJob {
  workerId: string;
  jobId: string;
  projectId: string;
  userId: string;
  runtime: string;
  kind: string;
  attempt: number;
  status: 'running';
  leaseExpiresAt: string;
  traceId?: string;
  recommendedAction: string;
}

export interface WorkerLeaseRecoveryJobRef {
  workerId: string;
  jobId: string;
  leaseExpiresAt: string;
  status?: AgentJob['status'];
  reason: string;
}

export interface WorkerLeaseRecoveryPlan {
  generatedAt: string;
  projectId?: string;
  staleLeases: WorkerLease[];
  affectedJobs: WorkerLeaseRecoveryAffectedJob[];
  missingJobRefs: WorkerLeaseRecoveryJobRef[];
  ignoredJobRefs: WorkerLeaseRecoveryJobRef[];
}

export interface BuildWorkerAlertSummaryInput {
  projectId: string;
  jobs: AgentJob[];
  failureRecords: WorkerFailureRecord[];
  queueReadyState: QueueReadyState;
  queueSnapshot?: {
    pending: unknown[];
    acknowledged: unknown[];
    failed: unknown[];
  };
  now?: () => string;
}

export interface BuildWorkerLeaseRecoveryPlanInput {
  leaseRepository: WorkerLeaseRepository;
  jobRepository: AgentJobRepository;
  projectId?: string;
  now?: () => string;
}

export interface RecordWorkerFailureInput {
  repository: WorkerFailureRepository;
  jobId: string;
  projectId: string;
  userId: string;
  runtime: string;
  kind: string;
  attempt: number;
  maxAttempts: number;
  failureKind: WorkerFailureKind;
  reason: string;
  traceId?: string;
  now?: () => string;
  idGenerator?: () => string;
}

export interface RefreshWorkerLeaseInput {
  repository: WorkerLeaseRepository;
  workerId: string;
  concurrency: number;
  activeJobIds: string[];
  leaseTtlMs: number;
  traceId?: string;
  now?: () => string;
}

const currentTimestamp = (): string => new Date().toISOString();
const defaultId = (): string => `worker-failure-${Math.random().toString(36).slice(2, 12)}`;

const failedJobStatuses = new Set<AgentJob['status']>(['failed', 'timeout']);

const queueAlertReason = (readiness: QueueReadyState): string => {
  const reasons = [
    !readiness.configured ? '队列未配置' : '',
    !readiness.connected ? '队列未连接' : '',
    !readiness.worker ? 'worker 未运行' : ''
  ].filter(Boolean);
  return `${reasons.join('；')}。`;
};

const queueAlertRecommendedAction = (readiness: QueueReadyState): string => {
  if (!readiness.configured) {
    return '配置 Redis/BullMQ 或确认当前环境只使用内存队列。';
  }
  return '检查 Redis/BullMQ 连接和 storyspec worker 进程。';
};

export const classifyWorkerFailure = (
  input: WorkerFailurePolicyInput
): WorkerFailurePolicyDecision => {
  const deadLetter = input.failureKind === 'job-missing'
    || input.failureKind === 'runtime-missing'
    || input.attempt >= input.maxAttempts;

  if (deadLetter) {
    return {
      decision: 'dead-letter',
      retryable: false,
      deadLetter: true
    };
  }

  return {
    decision: 'retryable',
    retryable: true,
    deadLetter: false
  };
};

export const createMemoryWorkerFailureRepository = (): WorkerFailureRepository => {
  const records: WorkerFailureRecord[] = [];

  return {
    async save(record) {
      records.push(record);
    },
    async listByJob(jobId) {
      return records.filter(record => record.jobId === jobId);
    },
    snapshot() {
      return [...records];
    }
  };
};

export const createMemoryWorkerLeaseRepository = (): WorkerLeaseRepository => {
  const leases = new Map<string, WorkerLease>();

  const activeLeases = (): WorkerLease[] => [...leases.values()]
    .filter(lease => lease.status === 'active')
    .sort((left, right) => left.workerId.localeCompare(right.workerId));

  return {
    async save(lease) {
      leases.set(lease.workerId, { ...lease, activeJobIds: [...lease.activeJobIds] });
    },
    async findByWorkerId(workerId) {
      const lease = leases.get(workerId);
      return lease ? { ...lease, activeJobIds: [...lease.activeJobIds] } : undefined;
    },
    async listActive() {
      return activeLeases().map(lease => ({ ...lease, activeJobIds: [...lease.activeJobIds] }));
    },
    async listStale(input) {
      return activeLeases()
        .filter(lease => lease.leaseExpiresAt < input.now)
        .map(lease => ({ ...lease, activeJobIds: [...lease.activeJobIds] }));
    },
    async markStopped(input) {
      const existing = leases.get(input.workerId);
      if (!existing) {
        return undefined;
      }
      const stopped: WorkerLease = {
        ...existing,
        status: 'stopped',
        stoppedAt: input.stoppedAt
      };
      leases.set(input.workerId, stopped);
      return { ...stopped, activeJobIds: [...stopped.activeJobIds] };
    },
    snapshot() {
      return [...leases.values()]
        .sort((left, right) => left.workerId.localeCompare(right.workerId))
        .map(lease => ({ ...lease, activeJobIds: [...lease.activeJobIds] }));
    }
  };
};

export const refreshWorkerLease = async (
  input: RefreshWorkerLeaseInput
): Promise<WorkerLease> => {
  const now = input.now?.() ?? currentTimestamp();
  const lease: WorkerLease = {
    workerId: input.workerId,
    status: 'active',
    concurrency: input.concurrency,
    activeJobIds: [...input.activeJobIds],
    lastHeartbeatAt: now,
    leaseExpiresAt: new Date(Date.parse(now) + input.leaseTtlMs).toISOString(),
    ...(input.traceId ? { traceId: input.traceId } : {})
  };

  await input.repository.save(lease);
  return lease;
};

export const buildWorkerLeaseRecoveryPlan = async (
  input: BuildWorkerLeaseRecoveryPlanInput
): Promise<WorkerLeaseRecoveryPlan> => {
  const generatedAt = input.now?.() ?? currentTimestamp();
  const staleLeases = await input.leaseRepository.listStale({ now: generatedAt });
  const affectedJobs: WorkerLeaseRecoveryAffectedJob[] = [];
  const missingJobRefs: WorkerLeaseRecoveryJobRef[] = [];
  const ignoredJobRefs: WorkerLeaseRecoveryJobRef[] = [];

  for (const lease of staleLeases) {
    for (const jobId of lease.activeJobIds) {
      const job = await input.jobRepository.findById(jobId);
      if (!job) {
        missingJobRefs.push({
          workerId: lease.workerId,
          jobId,
          leaseExpiresAt: lease.leaseExpiresAt,
          reason: 'lease 引用了不存在的 job。'
        });
        continue;
      }

      if (input.projectId && job.projectId !== input.projectId) {
        continue;
      }

      if (job.status !== 'running') {
        ignoredJobRefs.push({
          workerId: lease.workerId,
          jobId,
          leaseExpiresAt: lease.leaseExpiresAt,
          status: job.status,
          reason: 'job 状态不是 running。'
        });
        continue;
      }

      affectedJobs.push({
        workerId: lease.workerId,
        jobId: job.id,
        projectId: job.projectId,
        userId: job.userId,
        runtime: job.runtime,
        kind: job.kind,
        attempt: job.attempt,
        status: 'running',
        leaseExpiresAt: lease.leaseExpiresAt,
        ...(job.traceId ? { traceId: job.traceId } : lease.traceId ? { traceId: lease.traceId } : {}),
        recommendedAction: '确认 worker 已停止后，人工检查 job 日志并决定是否标记 timeout 或手动 retry。'
      });
    }
  }

  return {
    generatedAt,
    ...(input.projectId ? { projectId: input.projectId } : {}),
    staleLeases,
    affectedJobs,
    missingJobRefs,
    ignoredJobRefs
  };
};

export const recordWorkerFailure = async (
  input: RecordWorkerFailureInput
): Promise<WorkerFailureRecord> => {
  const classification = classifyWorkerFailure(input);
  const record: WorkerFailureRecord = {
    id: input.idGenerator?.() ?? defaultId(),
    jobId: input.jobId,
    projectId: input.projectId,
    userId: input.userId,
    runtime: input.runtime,
    kind: input.kind,
    attempt: input.attempt,
    maxAttempts: input.maxAttempts,
    failureKind: input.failureKind,
    decision: classification.decision,
    reason: input.reason,
    traceId: input.traceId,
    createdAt: input.now?.() ?? currentTimestamp()
  };

  await input.repository.save(record);
  return record;
};

export const buildWorkerAlertSummary = (
  input: BuildWorkerAlertSummaryInput
): WorkerAlertSummary => {
  const now = input.now?.() ?? currentTimestamp();
  const projectFailures = input.failureRecords
    .filter(record => record.projectId === input.projectId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const retryableFailures = projectFailures.filter(record => record.decision === 'retryable');
  const deadLetterFailures = projectFailures.filter(record => record.decision === 'dead-letter');
  const failureJobIds = new Set(projectFailures.map(record => record.jobId));
  const failedJobsWithoutRecords = input.jobs
    .filter(job => job.projectId === input.projectId)
    .filter(job => failedJobStatuses.has(job.status))
    .filter(job => !failureJobIds.has(job.id))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const alerts: WorkerAlertItem[] = [];

  if (
    !input.queueReadyState.configured
    || !input.queueReadyState.connected
    || !input.queueReadyState.worker
  ) {
    alerts.push({
      id: 'queue-unavailable',
      severity: 'critical',
      category: 'queue',
      reason: queueAlertReason(input.queueReadyState),
      recommendedAction: queueAlertRecommendedAction(input.queueReadyState),
      createdAt: now
    });
  }

  for (const record of deadLetterFailures) {
    alerts.push({
      id: record.id,
      severity: 'critical',
      category: 'dead-letter',
      jobId: record.jobId,
      failureId: record.id,
      reason: record.reason,
      recommendedAction: '人工检查 job 日志和 failure record；修正后再决定是否手动重试。',
      ...(record.traceId ? { traceId: record.traceId } : {}),
      createdAt: record.createdAt
    });
  }

  for (const record of retryableFailures) {
    alerts.push({
      id: record.id,
      severity: 'warning',
      category: 'retryable',
      jobId: record.jobId,
      failureId: record.id,
      reason: record.reason,
      recommendedAction: '查看 job 日志后，可使用现有 retry API 手动重试。',
      ...(record.traceId ? { traceId: record.traceId } : {}),
      createdAt: record.createdAt
    });
  }

  for (const job of failedJobsWithoutRecords) {
    alerts.push({
      id: `job-status-${job.id}`,
      severity: 'warning',
      category: 'job-status',
      jobId: job.id,
      reason: `job 状态为 ${job.status}，但没有对应 worker failure record。`,
      recommendedAction: '查看 job 日志；若需要恢复，请使用现有 retry API 手动重试。',
      ...(job.traceId ? { traceId: job.traceId } : {}),
      createdAt: job.updatedAt
    });
  }

  return {
    projectId: input.projectId,
    totalAlerts: alerts.length,
    retryableFailures: retryableFailures.length,
    deadLetterFailures: deadLetterFailures.length,
    failedJobsWithoutFailureRecord: failedJobsWithoutRecords.length,
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
    },
    alerts
  };
};
