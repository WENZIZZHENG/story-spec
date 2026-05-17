import { Command } from '@commander-js/extra-typings';
import { describe, expect, it, vi } from 'vitest';
import { registerMultiuserServerCommand } from '../../src/cli/commands/multiuser-server.command.js';
import { createMemoryAuditLogRepository } from '../../src/server/audit/audit-log.js';
import { createMemorySessionRepository } from '../../src/server/auth/session.js';
import { createMemoryCollaborationCanonRepository } from '../../src/server/collaboration/canon-merge.js';
import { createMemoryAgentJobRepository } from '../../src/server/jobs/agent-job.js';
import { createMemoryProjectAccessRepository } from '../../src/server/projects/project-security.js';
import { createMemoryQuotaRepository } from '../../src/server/quota/quota.js';

describe('multiuser server command', () => {
  it('wires PostgreSQL repositories when STORYSPEC_DATABASE_URL is configured', async () => {
    const closeServer = vi.fn(async () => {});
    const closeDatabase = vi.fn(async () => {});
    const waitForShutdown = vi.fn(async () => {});
    const startServer = vi.fn(async () => ({
      url: 'http://127.0.0.1:43210',
      host: '127.0.0.1',
      port: 43210,
      close: closeServer
    }));
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
        jobs: createMemoryAgentJobRepository(),
        collaboration: createMemoryCollaborationCanonRepository(),
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
    const program = new Command();
    program.exitOverride();
    registerMultiuserServerCommand(program, {
      env: {
        STORYSPEC_DATABASE_URL: 'postgres://storyspec:storyspec@localhost:5432/storyspec',
        STORYSPEC_DATABASE_MIGRATE: 'true'
      },
      startServer,
      createDatabaseConnection,
      waitForShutdown
    });

    await program.parseAsync([
      'node',
      'storyspec',
      'server',
      '--host',
      '127.0.0.1',
      '--port',
      '43210',
      '--version',
      '0.20.0'
    ]);

    expect(createDatabaseConnection).toHaveBeenCalledWith({
      connectionString: 'postgres://storyspec:storyspec@localhost:5432/storyspec',
      migrate: true
    });
    expect(startServer).toHaveBeenCalledWith(expect.objectContaining({
      host: '127.0.0.1',
      port: 43210,
      version: '0.20.0',
      sessionRepository: expect.any(Object),
      projectRepository: expect.any(Object),
      jobRepository: expect.any(Object),
      collaborationRepository: expect.any(Object),
      auditRepository: expect.any(Object),
      quotaRepository: expect.any(Object),
      database: {
        configured: true,
        connected: true,
        migrated: true
      }
    }));
    expect(waitForShutdown).toHaveBeenCalled();
    expect(closeServer).toHaveBeenCalled();
    expect(closeDatabase).toHaveBeenCalled();
  });
});
