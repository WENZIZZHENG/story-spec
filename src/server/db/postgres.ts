import { createMultiuserMigrationPlan, MULTIUSER_MIGRATION_VERSION } from './schema.js';
import type { MultiuserDatabaseExecutor } from './repositories.js';
import type { MultiuserDatabaseRepositories } from './repositories.js';
import { createMultiuserDatabaseRepositories } from './repositories.js';

export interface PostgresQueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number | null;
}

export interface PostgresQueryPool {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[]
  ): Promise<PostgresQueryResult<T>>;
  end?(): Promise<void>;
}

export interface MultiuserMigrationResult {
  applied: boolean;
  version: number;
  statementsExecuted: number;
}

export interface PostgresReadyState {
  configured: boolean;
  connected: boolean;
  migrated: boolean;
  error?: string;
}

export interface PostgresConnectionConfig {
  connectionString: string;
}

export interface PostgresDatabaseConnection {
  pool: PostgresQueryPool;
  executor: MultiuserDatabaseExecutor;
  repositories: MultiuserDatabaseRepositories;
  ready: PostgresReadyState;
  close(): Promise<void>;
}

export const createPostgresExecutor = (
  pool: PostgresQueryPool
): MultiuserDatabaseExecutor => ({
  async queryOne<T = Record<string, unknown>>(sql: string, params: readonly unknown[] = []) {
    const result = await pool.query<T>(sql, params);
    return result.rows[0];
  },
  async queryMany<T = Record<string, unknown>>(sql: string, params: readonly unknown[] = []) {
    const result = await pool.query<T>(sql, params);
    return result.rows;
  },
  async execute(sql: string, params: readonly unknown[] = []) {
    await pool.query(sql, params);
  }
});

const ensureMigrationTable = async (executor: MultiuserDatabaseExecutor): Promise<void> => {
  await executor.execute([
    'create table if not exists schema_migrations (',
    '  version integer primary key,',
    '  applied_at timestamptz not null default now()',
    ');'
  ].join('\n'));
};

export const runMultiuserMigrations = async (
  executor: MultiuserDatabaseExecutor
): Promise<MultiuserMigrationResult> => {
  await ensureMigrationTable(executor);
  const current = await executor.queryOne<{ version: number }>(
    'select version from schema_migrations where version = $1',
    [MULTIUSER_MIGRATION_VERSION]
  );
  if (current?.version === MULTIUSER_MIGRATION_VERSION) {
    return {
      applied: false,
      version: MULTIUSER_MIGRATION_VERSION,
      statementsExecuted: 0
    };
  }

  const migration = createMultiuserMigrationPlan();
  for (const statement of migration.statements) {
    await executor.execute(statement);
  }
  await executor.execute(
    'insert into schema_migrations (version, applied_at) values ($1, now())',
    [migration.version]
  );

  return {
    applied: true,
    version: migration.version,
    statementsExecuted: migration.statements.length
  };
};

export const checkPostgresReady = async (
  input: {
    configured: boolean;
    executor?: MultiuserDatabaseExecutor;
    expectedVersion?: number;
  }
): Promise<PostgresReadyState> => {
  if (!input.configured || !input.executor) {
    return {
      configured: false,
      connected: false,
      migrated: false
    };
  }

  try {
    await input.executor.queryOne('select 1 as ok');
    const expectedVersion = input.expectedVersion ?? MULTIUSER_MIGRATION_VERSION;
    const migration = await input.executor.queryOne<{ version: number }>(
      'select version from schema_migrations where version = $1',
      [expectedVersion]
    );
    return {
      configured: true,
      connected: true,
      migrated: migration?.version === expectedVersion
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      migrated: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

export const createPostgresPool = async (
  config: PostgresConnectionConfig
): Promise<PostgresQueryPool> => {
  const pg = await import('pg');
  return new pg.Pool({
    connectionString: config.connectionString
  }) as PostgresQueryPool;
};

export const createPostgresDatabaseConnection = async (
  input: {
    connectionString: string;
    migrate?: boolean;
    poolFactory?: (config: PostgresConnectionConfig) => Promise<PostgresQueryPool>;
  }
): Promise<PostgresDatabaseConnection> => {
  const pool = await (input.poolFactory ?? createPostgresPool)({
    connectionString: input.connectionString
  });
  const executor = createPostgresExecutor(pool);
  if (input.migrate ?? true) {
    await runMultiuserMigrations(executor);
  }
  const ready = await checkPostgresReady({
    configured: true,
    executor
  });

  return {
    pool,
    executor,
    repositories: createMultiuserDatabaseRepositories(executor),
    ready,
    close: async () => {
      await pool.end?.();
    }
  };
};
