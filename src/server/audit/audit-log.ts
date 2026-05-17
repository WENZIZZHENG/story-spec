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

export type ProjectActivityKind =
  | 'agent-job'
  | 'collaboration'
  | 'project'
  | 'member'
  | 'story'
  | 'other';

export interface ProjectActivityItem {
  id: string;
  actorUserId: string;
  action: string;
  kind: ProjectActivityKind;
  source: string;
  summary?: string;
  jobId?: string;
  createdAt: string;
}

export interface ProjectActivityFeed {
  projectId: string;
  items: ProjectActivityItem[];
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

const classifyActivityKind = (action: string): ProjectActivityKind => {
  if (action.startsWith('agent_job.')) {
    return 'agent-job';
  }
  if (action.startsWith('collaboration.')) {
    return 'collaboration';
  }
  if (action.startsWith('project.')) {
    return 'project';
  }
  if (action.startsWith('member.') || action.startsWith('membership.')) {
    return 'member';
  }
  if (action.startsWith('story.') || action.startsWith('chapter.')) {
    return 'story';
  }
  return 'other';
};

export const buildProjectActivityFeed = async (
  input: {
    repository: AuditLogRepository;
    projectId: string;
    limit?: number;
  }
): Promise<ProjectActivityFeed> => {
  const events = await input.repository.listByProject(input.projectId);
  const items = [...events]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, input.limit)
    .map(event => ({
      id: event.id,
      actorUserId: event.actorUserId,
      action: event.action,
      kind: classifyActivityKind(event.action),
      source: event.source,
      summary: event.diffSummary,
      jobId: event.jobId,
      createdAt: event.createdAt
    }));

  return {
    projectId: input.projectId,
    items
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
