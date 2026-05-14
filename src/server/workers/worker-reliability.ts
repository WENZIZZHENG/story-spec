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

const currentTimestamp = (): string => new Date().toISOString();
const defaultId = (): string => `worker-failure-${Math.random().toString(36).slice(2, 12)}`;

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
