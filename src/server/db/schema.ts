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

export const MULTIUSER_MIGRATION_VERSION = 1;

export const multiuserDatabaseSchema: MultiuserDatabaseSchema = {
  users,
  sessions,
  projects,
  memberships,
  agentJobs,
  auditLogs,
  quotaBuckets
};

export const createMultiuserMigrationPlan = (): MultiuserMigrationPlan => ({
  version: MULTIUSER_MIGRATION_VERSION,
  statements: [
    ...users.createStatements,
    ...sessions.createStatements,
    ...projects.createStatements,
    ...memberships.createStatements,
    ...agentJobs.createStatements,
    ...auditLogs.createStatements,
    ...quotaBuckets.createStatements
  ]
});
