import { Command } from '@commander-js/extra-typings';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryAuditLogRepository } from '../../src/server/audit/audit-log.js';
import { createMemorySessionRepository } from '../../src/server/auth/session.js';
import { createMemoryAgentJobRepository } from '../../src/server/jobs/agent-job.js';
import { createMemoryProjectAccessRepository } from '../../src/server/projects/project-security.js';
import { createMemoryQuotaRepository } from '../../src/server/quota/quota.js';
import { createMemoryAgentJobQueue } from '../../src/server/queue/agent-job-queue.js';
import { registerMultiuserWorkerCommand } from '../../src/cli/commands/multiuser-worker.command.js';

describe('multiuser worker command', () => {
  it('wires PostgreSQL repositories, Redis queue, runtimes, and worker loop', async () => {
    const closeDatabase = vi.fn(async () => {});
    const closeQueue = vi.fn(async () => {});
    const waitForShutdown = vi.fn(async () => {});
    const runWorker = vi.fn(async () => ({
      processed: false,
      action: 'idle' as const,
      blockedReasons: []
    }));
    const jobRepository = createMemoryAgentJobRepository();
    const queue = {
      ...createMemoryAgentJobQueue(),
      close: closeQueue
    };
    const createDatabaseConnection = vi.fn(async () => ({
      pool: { query: vi.fn() },
      executor: {
        queryOne: vi.fn(),
        queryMany: vi.fn(),
        execute: vi.fn()
      },
      repositories: {
        sessions: createMemorySessionRepository({ users: [] }),
        projects: createMemoryProjectAccessRepository({ projects: [], memberships: [] }),
        jobs: jobRepository,
        audit: createMemoryAuditLogRepository(),
        quota: createMemoryQuotaRepository({ buckets: [] })
      },
      ready: {
        configured: true,
        connected: true,
        migrated: true
      },
      close: closeDatabase
    }));
    const createQueue = vi.fn(() => queue);
    const program = new Command();
    program.exitOverride();
    registerMultiuserWorkerCommand(program, {
      env: {
        STORYSPEC_DATABASE_URL: 'postgres://storyspec:storyspec@localhost:5432/storyspec',
        STORYSPEC_DATABASE_MIGRATE: 'true',
        STORYSPEC_REDIS_URL: 'redis://localhost:6379',
        STORYSPEC_WORKER_ONCE: 'true',
        STORYSPEC_WORKER_CONCURRENCY: '2'
      },
      createDatabaseConnection,
      createQueue,
      runWorker,
      waitForShutdown
    });

    await program.parseAsync([
      'node',
      'storyspec',
      'worker',
      '--once'
    ]);

    expect(createDatabaseConnection).toHaveBeenCalledWith({
      connectionString: 'postgres://storyspec:storyspec@localhost:5432/storyspec',
      migrate: true
    });
    expect(createQueue).toHaveBeenCalledWith({
      redisUrl: 'redis://localhost:6379',
      concurrency: 2
    });
    expect(runWorker).toHaveBeenCalledWith(expect.objectContaining({
      repository: jobRepository,
      queue,
      runtimes: expect.arrayContaining([
        expect.objectContaining({ id: 'local-storyspec' }),
        expect.objectContaining({ id: 'openhands' })
      ])
    }));
    expect(waitForShutdown).not.toHaveBeenCalled();
    expect(closeQueue).toHaveBeenCalled();
    expect(closeDatabase).toHaveBeenCalled();
  });

  it('rejects real worker startup without database and Redis configuration', async () => {
    const program = new Command();
    program.exitOverride();
    registerMultiuserWorkerCommand(program, {
      env: {},
      waitForShutdown: vi.fn(async () => {})
    });

    await expect(program.parseAsync([
      'node',
      'storyspec',
      'worker',
      '--once'
    ])).rejects.toThrow('storyspec worker 需要 STORYSPEC_DATABASE_URL');
  });

  it('keeps OpenHands headless disabled by default and enables it explicitly from env', async () => {
    const createDatabaseConnection = () => vi.fn(async () => ({
      pool: { query: vi.fn() },
      executor: {
        queryOne: vi.fn(),
        queryMany: vi.fn(),
        execute: vi.fn()
      },
      repositories: {
        sessions: createMemorySessionRepository({ users: [] }),
        projects: createMemoryProjectAccessRepository({ projects: [], memberships: [] }),
        jobs: createMemoryAgentJobRepository(),
        audit: createMemoryAuditLogRepository(),
        quota: createMemoryQuotaRepository({ buckets: [] })
      },
      ready: {
        configured: true,
        connected: true,
        migrated: true
      },
      close: vi.fn(async () => {})
    }));
    const createRunWorker = () => vi.fn(async () => ({
      processed: false,
      action: 'idle' as const,
      blockedReasons: []
    }));
    const createRuntimes = vi.fn(() => [
      { id: 'local-storyspec' },
      { id: 'openhands', headless: true }
    ]);
    const registerProgram = (env: NodeJS.ProcessEnv) => {
      const program = new Command();
      const runWorker = createRunWorker();
      program.exitOverride();
      registerMultiuserWorkerCommand(program, {
        env: {
          STORYSPEC_DATABASE_URL: 'postgres://storyspec:storyspec@localhost:5432/storyspec',
          STORYSPEC_REDIS_URL: 'redis://localhost:6379',
          STORYSPEC_WORKER_ONCE: 'true',
          ...env
        },
        createDatabaseConnection: createDatabaseConnection(),
        createQueue: vi.fn(() => ({
          ...createMemoryAgentJobQueue(),
          close: vi.fn(async () => {})
        })),
        runWorker,
        createRuntimes
      });
      return { program, runWorker };
    };

    const defaultProgram = registerProgram({});
    await defaultProgram.program.parseAsync([
      'node',
      'storyspec',
      'worker',
      '--once'
    ]);

    expect(createRuntimes).toHaveBeenLastCalledWith({
      workspaceRoot: expect.any(String),
      openHandsHeadless: false,
      openHandsCommand: undefined,
      openHandsPromptPrefix: undefined
    });

    const enabledProgram = registerProgram({
      STORYSPEC_OPENHANDS_HEADLESS: 'true',
      STORYSPEC_OPENHANDS_COMMAND: 'openhands-dev',
      STORYSPEC_OPENHANDS_PROMPT_PREFIX: 'StorySpec worker headless'
    });
    await enabledProgram.program.parseAsync([
      'node',
      'storyspec',
      'worker',
      '--once'
    ]);

    expect(createRuntimes).toHaveBeenLastCalledWith({
      workspaceRoot: expect.any(String),
      openHandsHeadless: true,
      openHandsCommand: 'openhands-dev',
      openHandsPromptPrefix: 'StorySpec worker headless'
    });
    expect(enabledProgram.runWorker).toHaveBeenCalledWith(expect.objectContaining({
      runtimes: [
        { id: 'local-storyspec' },
        { id: 'openhands', headless: true }
      ]
    }));
  });
});
