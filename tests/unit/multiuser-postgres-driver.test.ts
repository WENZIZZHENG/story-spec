import { describe, expect, it } from 'vitest';
import {
  checkPostgresReady,
  createPostgresExecutor,
  runMultiuserMigrations,
  type PostgresQueryPool
} from '../../src/server/db/postgres.js';

describe('multiuser postgres driver', () => {
  it('adapts pool queries to the database executor boundary', async () => {
    const calls: Array<{ sql: string; params: readonly unknown[] }> = [];
    const pool: PostgresQueryPool = {
      async query(sql, params = []) {
        calls.push({ sql, params });
        return {
          rows: [{ id: 'row-1' }],
          rowCount: 1
        };
      }
    };
    const executor = createPostgresExecutor(pool);

    await expect(executor.queryOne('select * from users where id = $1', ['user-1'])).resolves.toEqual({
      id: 'row-1'
    });
    await expect(executor.queryMany('select * from users', [])).resolves.toEqual([{
      id: 'row-1'
    }]);
    await executor.execute('delete from sessions where token = $1', ['session-1']);

    expect(calls).toEqual([
      { sql: 'select * from users where id = $1', params: ['user-1'] },
      { sql: 'select * from users', params: [] },
      { sql: 'delete from sessions where token = $1', params: ['session-1'] }
    ]);
  });

  it('runs migrations once and records the current version', async () => {
    const executed: Array<{ sql: string; params: readonly unknown[] }> = [];
    const executor = {
      async queryOne<T>(sql: string, params: readonly unknown[] = []): Promise<T | undefined> {
        executed.push({ sql, params });
        return undefined;
      },
      async queryMany<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
        executed.push({ sql, params });
        return [];
      },
      async execute(sql: string, params: readonly unknown[] = []): Promise<void> {
        executed.push({ sql, params });
      }
    };

    await expect(runMultiuserMigrations(executor)).resolves.toEqual({
      applied: true,
      version: 1,
      statementsExecuted: expect.any(Number)
    });
    expect(executed.some(call => call.sql.includes('create table if not exists schema_migrations'))).toBe(true);
    expect(executed.some(call => call.sql.includes('create table if not exists users'))).toBe(true);
    expect(executed.at(-1)).toEqual({
      sql: 'insert into schema_migrations (version, applied_at) values ($1, now())',
      params: [1]
    });
  });

  it('skips migrations when the current version is already applied', async () => {
    const executed: string[] = [];
    const executor = {
      async queryOne<T>(sql: string): Promise<T | undefined> {
        executed.push(sql);
        return { version: 1 } as T;
      },
      async queryMany<T>(): Promise<T[]> {
        return [];
      },
      async execute(sql: string): Promise<void> {
        executed.push(sql);
      }
    };

    await expect(runMultiuserMigrations(executor)).resolves.toEqual({
      applied: false,
      version: 1,
      statementsExecuted: 0
    });
    expect(executed).not.toContain(expect.stringContaining('create table if not exists users'));
  });

  it('reports configured database readiness from a lightweight query', async () => {
    const executor = {
      async queryOne<T>(): Promise<T | undefined> {
        return { ok: 1, version: 1 } as T;
      },
      async queryMany<T>(): Promise<T[]> {
        return [];
      },
      async execute(): Promise<void> {}
    };

    await expect(checkPostgresReady({
      configured: true,
      executor,
      expectedVersion: 1
    })).resolves.toEqual({
      configured: true,
      connected: true,
      migrated: true
    });
  });
});
