export interface AuditEvent {
  id: string;
  actorUserId: string;
  projectId: string;
  action: string;
  source: string;
  diffSummary?: string;
  jobId?: string;
  createdAt: string;
}

export interface AuditLogRepository {
  save(event: AuditEvent): Promise<void>;
  listByProject(projectId: string): Promise<AuditEvent[]>;
}

export interface RecordAuditEventInput {
  repository: AuditLogRepository;
  actorUserId: string;
  projectId: string;
  action: string;
  source: string;
  diffSummary?: string;
  jobId?: string;
  now?: () => string;
  idGenerator?: () => string;
}

const currentTimestamp = (): string => new Date().toISOString();

const defaultId = (): string => `audit-${Math.random().toString(36).slice(2, 12)}`;

export const createMemoryAuditLogRepository = (): AuditLogRepository => {
  const events: AuditEvent[] = [];

  return {
    async save(event) {
      events.push(event);
    },
    async listByProject(projectId) {
      return events.filter(event => event.projectId === projectId);
    }
  };
};

export const recordAuditEvent = async (
  input: RecordAuditEventInput
): Promise<AuditEvent> => {
  const event = {
    id: input.idGenerator?.() ?? defaultId(),
    actorUserId: input.actorUserId,
    projectId: input.projectId,
    action: input.action,
    source: input.source,
    diffSummary: input.diffSummary,
    jobId: input.jobId,
    createdAt: input.now?.() ?? currentTimestamp()
  };

  await input.repository.save(event);
  return event;
};
