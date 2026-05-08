import type { AuditEvent, AuditLogRepository } from '../audit/audit-log.js';
import type { MultiuserSession, MultiuserUser, SessionRepository } from '../auth/session.js';
import type { AgentJob, AgentJobRepository } from '../jobs/agent-job.js';
import type {
  MultiuserProject,
  ProjectAccessRepository,
  ProjectMembership
} from '../projects/project-security.js';
import type { QuotaBucket, QuotaRepository } from '../quota/quota.js';

export interface MultiuserDatabaseExecutor {
  queryOne<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<T | undefined>;
  queryMany<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  execute(sql: string, params?: readonly unknown[]): Promise<void>;
}

export interface MultiuserDatabaseRepositories {
  sessions: SessionRepository;
  projects: ProjectAccessRepository;
  jobs: AgentJobRepository;
  audit: AuditLogRepository;
  quota: QuotaRepository;
}

interface UserRow {
  id: string;
  display_name: string;
}

interface SessionRow {
  token: string;
  user_id: string;
  expires_at: string;
  revoked_at?: string;
}

interface ProjectRow {
  id: string;
  owner_user_id: string;
  data_root: string;
}

interface MembershipRow {
  project_id: string;
  user_id: string;
  role: 'owner' | 'member';
}

interface AgentJobRow {
  id: string;
  user_id: string;
  project_id: string;
  kind: string;
  runtime: string;
  status: AgentJob['status'];
  attempt: number;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
  trace_id?: string;
  runtime_error_code?: string;
}

interface AuditRow {
  id: string;
  actor_user_id: string;
  project_id: string;
  action: string;
  source: string;
  diff_summary?: string;
  job_id?: string;
  created_at: string;
}

interface QuotaRow {
  id: string;
  owner_type: QuotaBucket['scopeType'];
  owner_id: string;
  metric: QuotaBucket['metric'];
  limit_value: number;
  used: number;
}

const mapUser = (row: UserRow): MultiuserUser => ({
  id: row.id,
  displayName: row.display_name
});

const mapSession = (row: SessionRow): MultiuserSession => ({
  token: row.token,
  userId: row.user_id,
  expiresAt: row.expires_at,
  revokedAt: row.revoked_at
});

const mapProject = (row: ProjectRow): MultiuserProject => ({
  id: row.id,
  ownerUserId: row.owner_user_id,
  dataRoot: row.data_root
});

const mapMembership = (row: MembershipRow): ProjectMembership => ({
  projectId: row.project_id,
  userId: row.user_id,
  role: row.role
});

const mapJob = (row: AgentJobRow): AgentJob => ({
  id: row.id,
  userId: row.user_id,
  projectId: row.project_id,
  kind: row.kind,
  runtime: row.runtime,
  status: row.status,
  attempt: row.attempt,
  idempotencyKey: row.idempotency_key,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  errorMessage: row.error_message
  ,
  traceId: row.trace_id,
  runtimeErrorCode: row.runtime_error_code
});

const mapAudit = (row: AuditRow): AuditEvent => ({
  id: row.id,
  actorUserId: row.actor_user_id,
  projectId: row.project_id,
  action: row.action,
  source: row.source,
  diffSummary: row.diff_summary,
  jobId: row.job_id,
  createdAt: row.created_at
});

const mapQuota = (row: QuotaRow): QuotaBucket => ({
  id: row.id,
  scopeType: row.owner_type,
  scopeId: row.owner_id,
  metric: row.metric,
  limit: row.limit_value,
  used: row.used
});

export const createMultiuserDatabaseRepositories = (
  executor: MultiuserDatabaseExecutor
): MultiuserDatabaseRepositories => ({
  sessions: {
    async findUser(userId) {
      const row = await executor.queryOne<UserRow>(
        'select id, display_name from users where id = $1',
        [userId]
      );
      return row ? mapUser(row) : undefined;
    },
    async findSession(token) {
      const row = await executor.queryOne<SessionRow>(
        'select token, user_id, expires_at, revoked_at from sessions where token = $1',
        [token]
      );
      return row ? mapSession(row) : undefined;
    },
    async saveSession(session) {
      await executor.execute(
        [
          'insert into sessions (token, user_id, expires_at, revoked_at)',
          'values ($1, $2, $3, $4)',
          'on conflict (token) do update set user_id = excluded.user_id, expires_at = excluded.expires_at, revoked_at = excluded.revoked_at'
        ].join(' '),
        [session.token, session.userId, session.expiresAt, session.revokedAt]
      );
    },
    async revokeSession(token, revokedAt) {
      const row = await executor.queryOne<SessionRow>(
        [
          'update sessions set revoked_at = $2',
          'where token = $1',
          'returning token, user_id, expires_at, revoked_at'
        ].join(' '),
        [token, revokedAt]
      );
      return row ? mapSession(row) : undefined;
    }
  },
  projects: {
    async findProject(projectId) {
      const row = await executor.queryOne<ProjectRow>(
        'select id, owner_user_id, data_root from projects where id = $1',
        [projectId]
      );
      return row ? mapProject(row) : undefined;
    },
    async findMembership(input) {
      const row = await executor.queryOne<MembershipRow>(
        [
          'select project_id, user_id, role from memberships',
          'where project_id = $1 and user_id = $2'
        ].join(' '),
        [input.projectId, input.userId]
      );
      return row ? mapMembership(row) : undefined;
    },
    async listProjectsForUser(userId) {
      const rows = await executor.queryMany<ProjectRow & { role: 'owner' | 'member' }>(
        [
          'select p.id, p.owner_user_id, p.data_root, m.role',
          'from projects p join memberships m on p.id = m.project_id',
          'where m.user_id = $1'
        ].join(' '),
        [userId]
      );
      return rows.map(row => ({
        ...mapProject(row),
        role: row.role
      }));
    },
    async listMembers(projectId) {
      const rows = await executor.queryMany<MembershipRow>(
        [
          'select project_id, user_id, role from memberships',
          'where project_id = $1'
        ].join(' '),
        [projectId]
      );
      return rows.map(mapMembership);
    }
  },
  jobs: {
    async findById(jobId) {
      const row = await executor.queryOne<AgentJobRow>(
        [
          'select id, user_id, project_id, kind, runtime, status, attempt, idempotency_key, created_at, updated_at, error_message',
          'from agent_jobs where id = $1'
        ].join(' '),
        [jobId]
      );
      return row ? mapJob(row) : undefined;
    },
    async findActiveByIdempotencyKey(input) {
      const row = await executor.queryOne<AgentJobRow>(
        [
          'select id, user_id, project_id, kind, runtime, status, attempt, idempotency_key, created_at, updated_at, error_message',
          'from agent_jobs',
          'where user_id = $1 and project_id = $2 and idempotency_key = $3 and status in (\'queued\', \'running\')'
        ].join(' '),
        [input.userId, input.projectId, input.idempotencyKey]
      );
      return row ? mapJob(row) : undefined;
    },
    async listByProject(projectId) {
      const rows = await executor.queryMany<AgentJobRow>(
        [
          'select id, user_id, project_id, kind, runtime, status, attempt, idempotency_key, created_at, updated_at, error_message, trace_id, runtime_error_code',
          'from agent_jobs where project_id = $1 order by created_at desc'
        ].join(' '),
        [projectId]
      );
      return rows.map(mapJob);
    },
    async save(job) {
      await executor.execute(
        [
          'insert into agent_jobs (id, user_id, project_id, kind, runtime, status, attempt, idempotency_key, created_at, updated_at, error_message, trace_id, runtime_error_code)',
          'values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
          'on conflict (id) do update set status = excluded.status, attempt = excluded.attempt, updated_at = excluded.updated_at, error_message = excluded.error_message, trace_id = excluded.trace_id, runtime_error_code = excluded.runtime_error_code'
        ].join(' '),
        [
          job.id,
          job.userId,
          job.projectId,
          job.kind,
          job.runtime,
          job.status,
          job.attempt,
          job.idempotencyKey,
          job.createdAt,
          job.updatedAt,
          job.errorMessage,
          job.traceId,
          job.runtimeErrorCode
        ]
      );
    }
  },
  audit: {
    async save(event) {
      await executor.execute(
        [
          'insert into audit_logs (id, actor_user_id, project_id, action, source, diff_summary, job_id, created_at)',
          'values ($1, $2, $3, $4, $5, $6, $7, $8)'
        ].join(' '),
        [
          event.id,
          event.actorUserId,
          event.projectId,
          event.action,
          event.source,
          event.diffSummary,
          event.jobId,
          event.createdAt
        ]
      );
    },
    async listByProject(projectId) {
      const rows = await executor.queryMany<AuditRow>(
        [
          'select id, actor_user_id, project_id, action, source, diff_summary, job_id, created_at',
          'from audit_logs where project_id = $1 order by created_at desc'
        ].join(' '),
        [projectId]
      );
      return rows.map(mapAudit);
    }
  },
  quota: {
    async findBucket(input) {
      const row = await executor.queryOne<QuotaRow>(
        [
          'select id, owner_type, owner_id, metric, limit_value, used',
          'from quota_buckets where owner_type = $1 and owner_id = $2 and metric = $3'
        ].join(' '),
        [input.scopeType, input.scopeId, input.metric]
      );
      return row ? mapQuota(row) : undefined;
    },
    async saveBucket(bucket) {
      await executor.execute(
        [
          'insert into quota_buckets (id, owner_type, owner_id, metric, limit_value, used)',
          'values ($1, $2, $3, $4, $5, $6)',
          'on conflict (owner_type, owner_id, metric) do update set limit_value = excluded.limit_value, used = excluded.used, updated_at = now()'
        ].join(' '),
        [bucket.id, bucket.scopeType, bucket.scopeId, bucket.metric, bucket.limit, bucket.used]
      );
    }
  }
});
