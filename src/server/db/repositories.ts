import type { AuditEvent, AuditLogRepository } from '../audit/audit-log.js';
import type { MultiuserSession, MultiuserUser, SessionRepository } from '../auth/session.js';
import type {
  ApplyRequest,
  CanonPatch,
  CollaborationCanonRepository,
  CommentThread,
  CollaborationProposal,
  CollaborationRisk,
  CollaborationSourceRef,
  CollaborationTarget,
  ReviewDecision,
  VersionSnapshot
} from '../collaboration/canon-merge.js';
import type { AgentJob, AgentJobRepository } from '../jobs/agent-job.js';
import type {
  MultiuserProject,
  ProjectAccessRepository,
  ProjectMembership
} from '../projects/project-security.js';
import type { ProjectRole } from '../projects/permission-model.js';
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
  collaboration: CollaborationCanonRepository;
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
  role: ProjectRole;
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

interface CollaborationProposalRow {
  id: string;
  actor_user_id: string;
  project_id: string;
  story_id: string;
  status: CollaborationProposal['status'];
  target: CollaborationTarget | string;
  source_refs: CollaborationSourceRef[] | string;
  summary: string;
  risks: CollaborationRisk[] | string;
  created_at: string;
  updated_at: string;
}

interface CollaborationReviewDecisionRow {
  id: string;
  proposal_id: string;
  reviewer_user_id: string;
  decision: ReviewDecision['decision'];
  note?: string;
  created_at: string;
}

interface CollaborationCanonPatchRow {
  id: string;
  proposal_id: string;
  target_path: string;
  kind: CanonPatch['kind'];
  diff_summary: string;
  rollback_hint: string;
  content?: string;
  source_refs: string[] | string;
}

interface CollaborationApplyRequestRow {
  id: string;
  proposal_id: string;
  actor_user_id: string;
  status: ApplyRequest['status'];
  current_version: VersionSnapshot | string;
  patch_ids: string[] | string;
  reviewer_ids: string[] | string;
  blocked_reasons: string[] | string;
  created_at: string;
}

interface CollaborationCommentThreadRow {
  id: string;
  project_id: string;
  story_id: string;
  anchor_kind: CommentThread['anchorKind'];
  anchor_id: string;
  comments: CommentThread['comments'] | string;
  created_at: string;
  updated_at: string;
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
  errorMessage: row.error_message,
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

const parseJsonValue = <T>(value: T | string): T => {
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }
  return value;
};

const mapCollaborationProposal = (row: CollaborationProposalRow): CollaborationProposal => ({
  id: row.id,
  actorUserId: row.actor_user_id,
  projectId: row.project_id,
  storyId: row.story_id,
  status: row.status,
  target: parseJsonValue<CollaborationTarget>(row.target),
  sourceRefs: parseJsonValue<CollaborationSourceRef[]>(row.source_refs),
  summary: row.summary,
  risks: parseJsonValue<CollaborationRisk[]>(row.risks),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapCollaborationReviewDecision = (row: CollaborationReviewDecisionRow): ReviewDecision => ({
  id: row.id,
  proposalId: row.proposal_id,
  reviewerUserId: row.reviewer_user_id,
  decision: row.decision,
  note: row.note,
  createdAt: row.created_at
});

const mapCollaborationCanonPatch = (row: CollaborationCanonPatchRow): CanonPatch => ({
  id: row.id,
  proposalId: row.proposal_id,
  targetPath: row.target_path,
  kind: row.kind,
  diffSummary: row.diff_summary,
  rollbackHint: row.rollback_hint,
  content: row.content,
  sourceRefs: parseJsonValue<string[]>(row.source_refs)
});

const mapCollaborationApplyRequest = (row: CollaborationApplyRequestRow): ApplyRequest => ({
  id: row.id,
  proposalId: row.proposal_id,
  actorUserId: row.actor_user_id,
  status: row.status,
  currentVersion: parseJsonValue<VersionSnapshot>(row.current_version),
  patchIds: parseJsonValue<string[]>(row.patch_ids),
  reviewerIds: parseJsonValue<string[]>(row.reviewer_ids),
  blockedReasons: parseJsonValue<string[]>(row.blocked_reasons),
  createdAt: row.created_at
});

const mapCollaborationCommentThread = (row: CollaborationCommentThreadRow): CommentThread => ({
  id: row.id,
  projectId: row.project_id,
  storyId: row.story_id,
  anchorKind: row.anchor_kind,
  anchorId: row.anchor_id,
  comments: parseJsonValue<CommentThread['comments']>(row.comments)
});

export const createMultiuserDatabaseRepositories = (
  executor: MultiuserDatabaseExecutor
): MultiuserDatabaseRepositories => {
  const collaborationCache = {
    proposals: new Map<string, CollaborationProposal>(),
    reviewDecisions: [] as ReviewDecision[],
    patches: [] as CanonPatch[],
    applyRequests: [] as ApplyRequest[],
    commentThreads: [] as CommentThread[]
  };

  return {
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
      const rows = await executor.queryMany<ProjectRow & { role: ProjectRole }>(
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
    },
    collaboration: {
    async findProposalById(proposalId) {
      const row = await executor.queryOne<CollaborationProposalRow>(
        [
          'select id, actor_user_id, project_id, story_id, status, target, source_refs, summary, risks, created_at, updated_at',
          'from collaboration_proposals where id = $1'
        ].join(' '),
        [proposalId]
      );
      return row ? mapCollaborationProposal(row) : undefined;
    },
    async listProposalsByProject(input) {
      const clauses = [
        'select id, actor_user_id, project_id, story_id, status, target, source_refs, summary, risks, created_at, updated_at',
        'from collaboration_proposals where project_id = $1'
      ];
      const params: unknown[] = [input.projectId];
      if (input.storyId) {
        clauses.push('and story_id = $2');
        params.push(input.storyId);
      }
      clauses.push('order by updated_at desc');
      const rows = await executor.queryMany<CollaborationProposalRow>(clauses.join(' '), params);
      return rows.map(mapCollaborationProposal);
    },
    async saveProposal(proposal) {
      collaborationCache.proposals.set(proposal.id, proposal);
      await executor.execute(
        [
          'insert into collaboration_proposals (id, actor_user_id, project_id, story_id, status, target, source_refs, summary, risks, created_at, updated_at)',
          'values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9::jsonb, $10, $11)',
          'on conflict (id) do update set status = excluded.status, target = excluded.target, source_refs = excluded.source_refs, summary = excluded.summary, risks = excluded.risks, updated_at = excluded.updated_at'
        ].join(' '),
        [
          proposal.id,
          proposal.actorUserId,
          proposal.projectId,
          proposal.storyId,
          proposal.status,
          JSON.stringify(proposal.target),
          JSON.stringify(proposal.sourceRefs),
          proposal.summary,
          JSON.stringify(proposal.risks),
          proposal.createdAt,
          proposal.updatedAt
        ]
      );
    },
    async listReviewDecisions(proposalId) {
      const rows = await executor.queryMany<CollaborationReviewDecisionRow>(
        [
          'select id, proposal_id, reviewer_user_id, decision, note, created_at',
          'from collaboration_review_decisions where proposal_id = $1 order by created_at asc'
        ].join(' '),
        [proposalId]
      );
      return rows.map(mapCollaborationReviewDecision);
    },
    async saveReviewDecision(decision) {
      collaborationCache.reviewDecisions.push(decision);
      await executor.execute(
        [
          'insert into collaboration_review_decisions (id, proposal_id, reviewer_user_id, decision, note, created_at)',
          'values ($1, $2, $3, $4, $5, $6)',
          'on conflict (id) do update set decision = excluded.decision, note = excluded.note'
        ].join(' '),
        [
          decision.id,
          decision.proposalId,
          decision.reviewerUserId,
          decision.decision,
          decision.note,
          decision.createdAt
        ]
      );
    },
    async listPatches(proposalId) {
      const rows = await executor.queryMany<CollaborationCanonPatchRow>(
        [
          'select id, proposal_id, target_path, kind, diff_summary, rollback_hint, content, source_refs',
          'from collaboration_canon_patches where proposal_id = $1 order by id asc'
        ].join(' '),
        [proposalId]
      );
      return rows.map(mapCollaborationCanonPatch);
    },
    async savePatch(patch) {
      collaborationCache.patches.push(patch);
      await executor.execute(
        [
          'insert into collaboration_canon_patches (id, proposal_id, target_path, kind, diff_summary, rollback_hint, content, source_refs)',
          'values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)',
          'on conflict (id) do update set target_path = excluded.target_path, kind = excluded.kind, diff_summary = excluded.diff_summary, rollback_hint = excluded.rollback_hint, content = excluded.content, source_refs = excluded.source_refs'
        ].join(' '),
        [
          patch.id,
          patch.proposalId,
          patch.targetPath,
          patch.kind,
          patch.diffSummary,
          patch.rollbackHint,
          patch.content,
          JSON.stringify(patch.sourceRefs)
        ]
      );
    },
    async listApplyRequests(proposalId) {
      const rows = await executor.queryMany<CollaborationApplyRequestRow>(
        [
          'select id, proposal_id, actor_user_id, status, current_version, patch_ids, reviewer_ids, blocked_reasons, created_at',
          'from collaboration_apply_requests where proposal_id = $1 order by created_at asc'
        ].join(' '),
        [proposalId]
      );
      return rows.map(mapCollaborationApplyRequest);
    },
    async saveApplyRequest(request) {
      const existingIndex = collaborationCache.applyRequests.findIndex(item => item.id === request.id);
      if (existingIndex >= 0) {
        collaborationCache.applyRequests[existingIndex] = request;
      } else {
        collaborationCache.applyRequests.push(request);
      }
      await executor.execute(
        [
          'insert into collaboration_apply_requests (id, proposal_id, actor_user_id, status, current_version, patch_ids, reviewer_ids, blocked_reasons, created_at)',
          'values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9)',
          'on conflict (id) do update set status = excluded.status, current_version = excluded.current_version, patch_ids = excluded.patch_ids, reviewer_ids = excluded.reviewer_ids, blocked_reasons = excluded.blocked_reasons'
        ].join(' '),
        [
          request.id,
          request.proposalId,
          request.actorUserId,
          request.status,
          JSON.stringify(request.currentVersion),
          JSON.stringify(request.patchIds),
          JSON.stringify(request.reviewerIds),
          JSON.stringify(request.blockedReasons),
          request.createdAt
        ]
      );
    },
    async listCommentThreads(input) {
      const clauses = [
        'select id, project_id, story_id, anchor_kind, anchor_id, comments, created_at, updated_at',
        'from collaboration_comment_threads where project_id = $1'
      ];
      const params: unknown[] = [input.projectId];
      if (input.anchorKind) {
        params.push(input.anchorKind);
        clauses.push(`and anchor_kind = $${params.length}`);
      }
      if (input.anchorId) {
        params.push(input.anchorId);
        clauses.push(`and anchor_id = $${params.length}`);
      }
      clauses.push('order by updated_at desc');
      const rows = await executor.queryMany<CollaborationCommentThreadRow>(clauses.join(' '), params);
      return rows.map(mapCollaborationCommentThread);
    },
    async saveCommentThread(thread) {
      const existingIndex = collaborationCache.commentThreads.findIndex(item => item.id === thread.id);
      if (existingIndex >= 0) {
        collaborationCache.commentThreads[existingIndex] = thread;
      } else {
        collaborationCache.commentThreads.push(thread);
      }
      const createdAt = thread.comments[0]?.createdAt ?? new Date(0).toISOString();
      const updatedAt = thread.comments.at(-1)?.createdAt ?? createdAt;
      await executor.execute(
        [
          'insert into collaboration_comment_threads (id, project_id, story_id, anchor_kind, anchor_id, comments, created_at, updated_at)',
          'values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)',
          'on conflict (id) do update set comments = excluded.comments, updated_at = excluded.updated_at'
        ].join(' '),
        [
          thread.id,
          thread.projectId,
          thread.storyId,
          thread.anchorKind,
          thread.anchorId,
          JSON.stringify(thread.comments),
          createdAt,
          updatedAt
        ]
      );
    },
    snapshot() {
      return {
        proposals: [...collaborationCache.proposals.values()],
        reviewDecisions: [...collaborationCache.reviewDecisions],
        patches: [...collaborationCache.patches],
        applyRequests: [...collaborationCache.applyRequests],
        commentThreads: [...collaborationCache.commentThreads]
      };
    }
    }
  };
};
