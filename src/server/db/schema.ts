export interface MultiuserTableSchema {
  name: string;
  columns: readonly string[];
  createStatements: readonly string[];
}

export interface MultiuserDatabaseSchema {
  users: MultiuserTableSchema;
  sessions: MultiuserTableSchema;
  projects: MultiuserTableSchema;
  memberships: MultiuserTableSchema;
  agentJobs: MultiuserTableSchema;
  auditLogs: MultiuserTableSchema;
  quotaBuckets: MultiuserTableSchema;
  collaborationProposals: MultiuserTableSchema;
  collaborationReviewDecisions: MultiuserTableSchema;
  collaborationCanonPatches: MultiuserTableSchema;
  collaborationApplyRequests: MultiuserTableSchema;
  collaborationCommentThreads: MultiuserTableSchema;
}

export interface MultiuserMigrationPlan {
  version: number;
  statements: string[];
}

const users: MultiuserTableSchema = {
  name: 'users',
  columns: ['id', 'display_name', 'created_at'],
  createStatements: [
    'create table if not exists users (',
    '  id text primary key,',
    '  display_name text not null,',
    '  created_at timestamptz not null default now()',
    ');'
  ]
};

const sessions: MultiuserTableSchema = {
  name: 'sessions',
  columns: ['token', 'user_id', 'expires_at', 'revoked_at', 'created_at'],
  createStatements: [
    'create table if not exists sessions (',
    '  token text primary key,',
    '  user_id text not null references users(id) on delete cascade,',
    '  expires_at timestamptz not null,',
    '  revoked_at timestamptz,',
    '  created_at timestamptz not null default now()',
    ');'
  ]
};

const projects: MultiuserTableSchema = {
  name: 'projects',
  columns: ['id', 'owner_user_id', 'data_root', 'created_at', 'updated_at'],
  createStatements: [
    'create table if not exists projects (',
    '  id text primary key,',
    '  owner_user_id text not null references users(id) on delete cascade,',
    '  data_root text not null,',
    '  created_at timestamptz not null default now(),',
    '  updated_at timestamptz not null default now()',
    ');'
  ]
};

const memberships: MultiuserTableSchema = {
  name: 'memberships',
  columns: ['project_id', 'user_id', 'role', 'created_at'],
  createStatements: [
    'create table if not exists memberships (',
    '  project_id text not null references projects(id) on delete cascade,',
    '  user_id text not null references users(id) on delete cascade,',
    '  role text not null check (role in (\'owner\', \'editor\', \'reviewer\', \'viewer\', \'agent\')),',
    '  created_at timestamptz not null default now(),',
    '  primary key (project_id, user_id)',
    ');'
  ]
};

const agentJobs: MultiuserTableSchema = {
  name: 'agent_jobs',
  columns: [
    'id',
    'user_id',
    'project_id',
    'kind',
    'runtime',
    'status',
    'attempt',
    'idempotency_key',
    'created_at',
    'updated_at',
    'error_message',
    'trace_id',
    'runtime_error_code'
  ],
  createStatements: [
    'create table if not exists agent_jobs (',
    '  id text primary key,',
    '  user_id text not null references users(id) on delete cascade,',
    '  project_id text not null references projects(id) on delete cascade,',
    '  kind text not null,',
    '  runtime text not null,',
    '  status text not null,',
    '  attempt integer not null default 1,',
    '  idempotency_key text,',
    '  created_at timestamptz not null default now(),',
    '  updated_at timestamptz not null default now(),',
    '  error_message text,',
    '  trace_id text,',
    '  runtime_error_code text',
    ');',
    'create index if not exists agent_jobs_idempotency_key_idx on agent_jobs (user_id, project_id, idempotency_key);'
  ]
};

const auditLogs: MultiuserTableSchema = {
  name: 'audit_logs',
  columns: [
    'id',
    'actor_user_id',
    'project_id',
    'action',
    'source',
    'diff_summary',
    'job_id',
    'created_at'
  ],
  createStatements: [
    'create table if not exists audit_logs (',
    '  id text primary key,',
    '  actor_user_id text not null references users(id) on delete cascade,',
    '  project_id text not null references projects(id) on delete cascade,',
    '  action text not null,',
    '  source text not null,',
    '  diff_summary text,',
    '  job_id text references agent_jobs(id) on delete set null,',
    '  created_at timestamptz not null default now()',
    ');',
    'create index if not exists audit_logs_project_created_at_idx on audit_logs (project_id, created_at desc);'
  ]
};

const quotaBuckets: MultiuserTableSchema = {
  name: 'quota_buckets',
  columns: ['id', 'owner_type', 'owner_id', 'metric', 'limit_value', 'used', 'updated_at'],
  createStatements: [
    'create table if not exists quota_buckets (',
    '  id text primary key,',
    '  owner_type text not null check (owner_type in (\'user\', \'project\')),',
    '  owner_id text not null,',
    '  metric text not null check (metric in (\'request\', \'job\', \'token\')),',
    '  limit_value integer not null,',
    '  used integer not null default 0,',
    '  updated_at timestamptz not null default now(),',
    '  unique (owner_type, owner_id, metric)',
    ');'
  ]
};

const collaborationProposals: MultiuserTableSchema = {
  name: 'collaboration_proposals',
  columns: [
    'id',
    'actor_user_id',
    'project_id',
    'story_id',
    'status',
    'target',
    'source_refs',
    'summary',
    'risks',
    'created_at',
    'updated_at'
  ],
  createStatements: [
    'create table if not exists collaboration_proposals (',
    '  id text primary key,',
    '  actor_user_id text not null references users(id) on delete cascade,',
    '  project_id text not null references projects(id) on delete cascade,',
    '  story_id text not null,',
    '  status text not null,',
    '  target jsonb not null,',
    '  source_refs jsonb not null,',
    '  summary text not null,',
    '  risks jsonb not null,',
    '  created_at timestamptz not null,',
    '  updated_at timestamptz not null',
    ');',
    'create index if not exists collaboration_proposals_project_story_idx on collaboration_proposals (project_id, story_id, updated_at desc);'
  ]
};

const collaborationReviewDecisions: MultiuserTableSchema = {
  name: 'collaboration_review_decisions',
  columns: ['id', 'proposal_id', 'reviewer_user_id', 'decision', 'note', 'created_at'],
  createStatements: [
    'create table if not exists collaboration_review_decisions (',
    '  id text primary key,',
    '  proposal_id text not null references collaboration_proposals(id) on delete cascade,',
    '  reviewer_user_id text not null references users(id) on delete cascade,',
    '  decision text not null,',
    '  note text,',
    '  created_at timestamptz not null',
    ');',
    'create index if not exists collaboration_review_decisions_proposal_idx on collaboration_review_decisions (proposal_id, created_at asc);'
  ]
};

const collaborationCanonPatches: MultiuserTableSchema = {
  name: 'collaboration_canon_patches',
  columns: ['id', 'proposal_id', 'target_path', 'kind', 'diff_summary', 'rollback_hint', 'content', 'rollback_content', 'source_refs'],
  createStatements: [
    'create table if not exists collaboration_canon_patches (',
    '  id text primary key,',
    '  proposal_id text not null references collaboration_proposals(id) on delete cascade,',
    '  target_path text not null,',
    '  kind text not null,',
    '  diff_summary text not null,',
    '  rollback_hint text not null,',
    '  content text,',
    '  rollback_content text,',
    '  source_refs jsonb not null',
    ');',
    'alter table if exists collaboration_canon_patches add column if not exists rollback_content text;',
    'create index if not exists collaboration_canon_patches_proposal_idx on collaboration_canon_patches (proposal_id);'
  ]
};

const collaborationApplyRequests: MultiuserTableSchema = {
  name: 'collaboration_apply_requests',
  columns: [
    'id',
    'proposal_id',
    'actor_user_id',
    'status',
    'current_version',
    'patch_ids',
    'reviewer_ids',
    'blocked_reasons',
    'created_at',
    'applied_at',
    'rolled_back_at'
  ],
  createStatements: [
    'create table if not exists collaboration_apply_requests (',
    '  id text primary key,',
    '  proposal_id text not null references collaboration_proposals(id) on delete cascade,',
    '  actor_user_id text not null references users(id) on delete cascade,',
    '  status text not null,',
    '  current_version jsonb not null,',
    '  patch_ids jsonb not null,',
    '  reviewer_ids jsonb not null,',
    '  blocked_reasons jsonb not null,',
    '  created_at timestamptz not null,',
    '  applied_at timestamptz,',
    '  rolled_back_at timestamptz',
    ');',
    'alter table if exists collaboration_apply_requests add column if not exists applied_at timestamptz;',
    'alter table if exists collaboration_apply_requests add column if not exists rolled_back_at timestamptz;',
    'create index if not exists collaboration_apply_requests_proposal_idx on collaboration_apply_requests (proposal_id, created_at desc);'
  ]
};

const collaborationCommentThreads: MultiuserTableSchema = {
  name: 'collaboration_comment_threads',
  columns: [
    'id',
    'project_id',
    'story_id',
    'anchor_kind',
    'anchor_id',
    'comments',
    'created_at',
    'updated_at'
  ],
  createStatements: [
    'create table if not exists collaboration_comment_threads (',
    '  id text primary key,',
    '  project_id text not null references projects(id) on delete cascade,',
    '  story_id text not null,',
    '  anchor_kind text not null check (anchor_kind in (\'proposal\', \'story\', \'chapter\', \'task\', \'canon-fact\')),',
    '  anchor_id text not null,',
    '  comments jsonb not null,',
    '  created_at timestamptz not null,',
    '  updated_at timestamptz not null',
    ');',
    'create index if not exists collaboration_comment_threads_anchor_idx on collaboration_comment_threads (project_id, anchor_kind, anchor_id, updated_at desc);'
  ]
};

export const MULTIUSER_MIGRATION_VERSION = 5;

export const multiuserDatabaseSchema: MultiuserDatabaseSchema = {
  users,
  sessions,
  projects,
  memberships,
  agentJobs,
  auditLogs,
  quotaBuckets,
  collaborationProposals,
  collaborationReviewDecisions,
  collaborationCanonPatches,
  collaborationApplyRequests,
  collaborationCommentThreads
};

const tableStatements = (schema: MultiuserTableSchema): string[] => [
  schema.createStatements.join('\n')
];

export const createMultiuserMigrationPlan = (): MultiuserMigrationPlan => ({
  version: MULTIUSER_MIGRATION_VERSION,
  statements: [
    ...tableStatements(users),
    ...tableStatements(sessions),
    ...tableStatements(projects),
    ...tableStatements(memberships),
    ...tableStatements(agentJobs),
    ...tableStatements(auditLogs),
    ...tableStatements(quotaBuckets),
    ...tableStatements(collaborationProposals),
    ...tableStatements(collaborationReviewDecisions),
    ...tableStatements(collaborationCanonPatches),
    ...tableStatements(collaborationApplyRequests),
    ...tableStatements(collaborationCommentThreads)
  ]
});
