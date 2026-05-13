import { describe, expect, it } from 'vitest';
import { createMemoryAuditLogRepository } from '../../src/server/audit/audit-log.js';
import { createMemorySessionRepository } from '../../src/server/auth/session.js';
import { startMultiuserServer } from '../../src/server/http/multiuser-server.js';
import { createAgentJob, createMemoryAgentJobRepository, transitionAgentJob } from '../../src/server/jobs/agent-job.js';
import { createMemoryProjectAccessRepository } from '../../src/server/projects/project-security.js';
import { createMemoryQuotaRepository } from '../../src/server/quota/quota.js';

describe('multiuser server entry', () => {
  it('starts a loopback listener with health and standard errors', async () => {
    const server = await startMultiuserServer({
      host: '127.0.0.1',
      port: 0,
      version: '0.20.0'
    });

    try {
      expect(server.host).toBe('127.0.0.1');
      expect(server.port).toBeGreaterThan(0);

      const health = await fetch(`${server.url}/health`);
      expect(health.status).toBe(200);
      await expect(health.json()).resolves.toMatchObject({
        service: 'storyspec-multiuser',
        status: 'ok',
        version: '0.20.0'
      });

      const traced = await fetch(`${server.url}/health`, {
        headers: {
          'x-request-id': 'req-fixed'
        }
      });
      expect(traced.headers.get('x-request-id')).toBe('req-fixed');

      const unknown = await fetch(`${server.url}/missing`);
      expect(unknown.status).toBe(404);
      await expect(unknown.json()).resolves.toMatchObject({
        statusCode: 404,
        requestId: expect.stringMatching(/^req-/),
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: '未知的多用户 server 路径'
        }
      });
    } finally {
      await server.close();
    }
  });

  it('requires a session and project membership for protected context', async () => {
    const server = await startMultiuserServer({
      host: '127.0.0.1',
      port: 0,
      version: '0.20.0',
      sessionRepository: createMemorySessionRepository({
        users: [{ id: 'user-1', displayName: '作者甲' }],
        sessions: [{
          token: 'session-token',
          userId: 'user-1',
          expiresAt: '2026-05-08T13:00:00.000Z'
        }]
      }),
      projectRepository: createMemoryProjectAccessRepository({
        projects: [{
          id: 'project-1',
          ownerUserId: 'user-1',
          dataRoot: 'D:\\storyspec-data\\project-1'
        }],
        memberships: [{
          projectId: 'project-1',
          userId: 'user-1',
          role: 'owner'
        }]
      }),
      now: () => '2026-05-08T12:00:00.000Z'
    });

    try {
      const missingToken = await fetch(`${server.url}/api/context?projectId=project-1`);
      expect(missingToken.status).toBe(401);
      await expect(missingToken.json()).resolves.toMatchObject({
        statusCode: 401,
        error: {
          code: 'AUTH_REQUIRED',
          message: '缺少 session token'
        }
      });

      const deniedProject = await fetch(`${server.url}/api/context?projectId=project-2`, {
        headers: {
          authorization: 'Bearer session-token'
        }
      });
      expect(deniedProject.status).toBe(403);
      await expect(deniedProject.json()).resolves.toMatchObject({
        statusCode: 403,
        error: {
          code: 'PROJECT_ACCESS_DENIED'
        }
      });

      const context = await fetch(`${server.url}/api/context?projectId=project-1`, {
        headers: {
          authorization: 'Bearer session-token',
          'x-request-id': 'req-context'
        }
      });
      expect(context.status).toBe(200);
      await expect(context.json()).resolves.toEqual({
        requestId: 'req-context',
        userId: 'user-1',
        projectId: 'project-1',
        role: 'owner'
      });
    } finally {
      await server.close();
    }
  });

  it('lists accessible projects for the authenticated user', async () => {
    const server = await startMultiuserServer({
      host: '127.0.0.1',
      port: 0,
      version: '0.20.0',
      sessionRepository: createMemorySessionRepository({
        users: [{ id: 'user-1', displayName: '作者甲' }],
        sessions: [{
          token: 'session-token',
          userId: 'user-1',
          expiresAt: '2026-05-08T13:00:00.000Z'
        }]
      }),
      projectRepository: createMemoryProjectAccessRepository({
        projects: [{
          id: 'project-1',
          ownerUserId: 'user-1',
          dataRoot: 'D:\\storyspec-data\\project-1'
        }, {
          id: 'project-2',
          ownerUserId: 'user-2',
          dataRoot: 'D:\\storyspec-data\\project-2'
        }],
        memberships: [{
          projectId: 'project-1',
          userId: 'user-1',
          role: 'owner'
        }]
      }),
      now: () => '2026-05-08T12:00:00.000Z'
    });

    try {
      const projects = await fetch(`${server.url}/api/projects`, {
        headers: {
          authorization: 'Bearer session-token'
        }
      });

      expect(projects.status).toBe(200);
      await expect(projects.json()).resolves.toEqual({
        projects: [{
          id: 'project-1',
          ownerUserId: 'user-1',
          dataRoot: expect.stringContaining('project-1'),
          role: 'owner'
        }]
      });
    } finally {
      await server.close();
    }
  });

  it('serves authorized project metadata and rejects unsafe path resolution', async () => {
    const server = await startMultiuserServer({
      host: '127.0.0.1',
      port: 0,
      version: '0.20.0',
      sessionRepository: createMemorySessionRepository({
        users: [{ id: 'user-1', displayName: '作者甲' }],
        sessions: [{
          token: 'session-token',
          userId: 'user-1',
          expiresAt: '2026-05-08T13:00:00.000Z'
        }]
      }),
      projectRepository: createMemoryProjectAccessRepository({
        projects: [{
          id: 'project-1',
          ownerUserId: 'user-1',
          dataRoot: 'D:\\storyspec-data\\project-1'
        }],
        memberships: [{
          projectId: 'project-1',
          userId: 'user-1',
          role: 'owner'
        }]
      }),
      now: () => '2026-05-08T12:00:00.000Z'
    });

    try {
      const project = await fetch(`${server.url}/api/projects/project-1`, {
        headers: {
          authorization: 'Bearer session-token'
        }
      });
      expect(project.status).toBe(200);
      await expect(project.json()).resolves.toEqual({
        id: 'project-1',
        ownerUserId: 'user-1',
        dataRoot: expect.stringContaining('project-1')
      });

      const resolved = await fetch(`${server.url}/api/projects/project-1/resolve?path=stories/main/specification.md`, {
        headers: {
          authorization: 'Bearer session-token'
        }
      });
      expect(resolved.status).toBe(200);
      await expect(resolved.json()).resolves.toMatchObject({
        projectId: 'project-1',
        relativePath: 'stories/main/specification.md',
        resolvedPath: expect.stringContaining('specification.md')
      });

      const escaped = await fetch(`${server.url}/api/projects/project-1/resolve?path=../secret.md`, {
        headers: {
          authorization: 'Bearer session-token'
        }
      });
      expect(escaped.status).toBe(400);
      await expect(escaped.json()).resolves.toMatchObject({
        statusCode: 400,
        error: {
          code: 'PROJECT_PATH_INVALID',
          message: '项目路径不能包含 ..'
        }
      });
    } finally {
      await server.close();
    }
  });

  it('serves project member and job lists behind project membership', async () => {
    const jobRepository = createMemoryAgentJobRepository();
    await createAgentJob({
      repository: jobRepository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      now: () => '2026-05-08T12:00:00.000Z',
      idGenerator: () => 'job-1',
      traceId: 'trace-job-1'
    });
    await createAgentJob({
      repository: jobRepository,
      userId: 'user-2',
      projectId: 'project-2',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      now: () => '2026-05-08T12:00:00.000Z',
      idGenerator: () => 'job-2'
    });

    const server = await startMultiuserServer({
      host: '127.0.0.1',
      port: 0,
      version: '0.20.0',
      sessionRepository: createMemorySessionRepository({
        users: [{ id: 'user-1', displayName: '作者甲' }, { id: 'user-2', displayName: '作者乙' }],
        sessions: [{
          token: 'session-token',
          userId: 'user-1',
          expiresAt: '2026-05-08T13:00:00.000Z'
        }]
      }),
      projectRepository: createMemoryProjectAccessRepository({
        projects: [{
          id: 'project-1',
          ownerUserId: 'user-1',
          dataRoot: 'D:\\storyspec-data\\project-1'
        }, {
          id: 'project-2',
          ownerUserId: 'user-2',
          dataRoot: 'D:\\storyspec-data\\project-2'
        }],
        memberships: [{
          projectId: 'project-1',
          userId: 'user-1',
          role: 'owner'
        }, {
          projectId: 'project-1',
          userId: 'user-2',
          role: 'editor'
        }]
      }),
      jobRepository,
      now: () => '2026-05-08T12:00:00.000Z'
    });

    try {
      const members = await fetch(`${server.url}/api/projects/project-1/members`, {
        headers: {
          authorization: 'Bearer session-token'
        }
      });
      expect(members.status).toBe(200);
      await expect(members.json()).resolves.toEqual({
        projectId: 'project-1',
        members: [{
          projectId: 'project-1',
          userId: 'user-1',
          role: 'owner'
        }, {
          projectId: 'project-1',
          userId: 'user-2',
          role: 'editor'
        }]
      });

      const jobs = await fetch(`${server.url}/api/projects/project-1/jobs`, {
        headers: {
          authorization: 'Bearer session-token'
        }
      });
      expect(jobs.status).toBe(200);
      await expect(jobs.json()).resolves.toEqual({
        projectId: 'project-1',
        jobs: [expect.objectContaining({
          id: 'job-1',
          projectId: 'project-1',
          traceId: 'trace-job-1'
        })]
      });

      const denied = await fetch(`${server.url}/api/projects/project-2/jobs`, {
        headers: {
          authorization: 'Bearer session-token'
        }
      });
      expect(denied.status).toBe(403);
    } finally {
      await server.close();
    }
  });

  it('reports readiness with repository and runtime status', async () => {
    const server = await startMultiuserServer({
      host: '127.0.0.1',
      port: 0,
      version: '0.20.0',
      sessionRepository: createMemorySessionRepository({
        users: [],
        sessions: []
      }),
      projectRepository: createMemoryProjectAccessRepository({
        projects: [],
        memberships: []
      }),
      jobRepository: createMemoryAgentJobRepository(),
      auditRepository: createMemoryAuditLogRepository(),
      quotaRepository: createMemoryQuotaRepository({ buckets: [] }),
      runtimeIds: ['local-storyspec', 'openhands']
    });

    try {
      const readiness = await fetch(`${server.url}/ready`);
      expect(readiness.status).toBe(200);
      await expect(readiness.json()).resolves.toEqual({
        service: 'storyspec-multiuser',
        status: 'ready',
        version: '0.20.0',
        database: {
          configured: false,
          connected: false,
          migrated: false
        },
        repositories: {
          sessions: true,
          projects: true,
          jobs: true,
          audit: true,
          quota: true
        },
        runtimes: ['local-storyspec', 'openhands']
      });
    } finally {
      await server.close();
    }
  });

  it('reports configured PostgreSQL readiness separately from repository wiring', async () => {
    const server = await startMultiuserServer({
      host: '127.0.0.1',
      port: 0,
      version: '0.20.0',
      database: {
        configured: true,
        connected: true,
        migrated: true
      }
    });

    try {
      const readiness = await fetch(`${server.url}/ready`);
      expect(readiness.status).toBe(200);
      await expect(readiness.json()).resolves.toMatchObject({
        database: {
          configured: true,
          connected: true,
          migrated: true
        }
      });
    } finally {
      await server.close();
    }
  });

  it('creates, reads, cancels, and retries project-scoped agent jobs', async () => {
    const jobRepository = createMemoryAgentJobRepository();
    const server = await startMultiuserServer({
      host: '127.0.0.1',
      port: 0,
      version: '0.20.0',
      sessionRepository: createMemorySessionRepository({
        users: [{ id: 'user-1', displayName: '作者甲' }],
        sessions: [{
          token: 'session-token',
          userId: 'user-1',
          expiresAt: '2026-05-08T13:00:00.000Z'
        }]
      }),
      projectRepository: createMemoryProjectAccessRepository({
        projects: [{
          id: 'project-1',
          ownerUserId: 'user-1',
          dataRoot: 'D:\\storyspec-data\\project-1'
        }],
        memberships: [{
          projectId: 'project-1',
          userId: 'user-1',
          role: 'owner'
        }]
      }),
      jobRepository,
      now: () => '2026-05-08T12:00:00.000Z',
      jobIdGenerator: () => 'job-1'
    });

    try {
      const created = await fetch(`${server.url}/api/projects/project-1/jobs`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer session-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          kind: 'chapter-draft',
          runtime: 'local-storyspec',
          idempotencyKey: 'chapter-1'
        })
      });
      expect(created.status).toBe(200);
      await expect(created.json()).resolves.toMatchObject({
        id: 'job-1',
        userId: 'user-1',
        projectId: 'project-1',
        status: 'queued'
      });

      const loaded = await fetch(`${server.url}/api/projects/project-1/jobs/job-1`, {
        headers: {
          authorization: 'Bearer session-token'
        }
      });
      expect(loaded.status).toBe(200);
      await expect(loaded.json()).resolves.toMatchObject({
        id: 'job-1',
        kind: 'chapter-draft',
        runtime: 'local-storyspec'
      });

      const canceled = await fetch(`${server.url}/api/projects/project-1/jobs/job-1/cancel`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer session-token'
        }
      });
      expect(canceled.status).toBe(200);
      await expect(canceled.json()).resolves.toMatchObject({
        id: 'job-1',
        status: 'canceled'
      });

      await createAgentJob({
        repository: jobRepository,
        userId: 'user-1',
        projectId: 'project-1',
        kind: 'chapter-draft',
        runtime: 'local-storyspec',
        idempotencyKey: 'chapter-retry',
        now: () => '2026-05-08T12:00:00.000Z',
        idGenerator: () => 'job-failed'
      });
      await transitionAgentJob({
        repository: jobRepository,
        jobId: 'job-failed',
        status: 'running',
        now: () => '2026-05-08T12:00:10.000Z'
      });
      await transitionAgentJob({
        repository: jobRepository,
        jobId: 'job-failed',
        status: 'failed',
        errorMessage: 'runtime failed',
        now: () => '2026-05-08T12:00:20.000Z'
      });
      const retryServer = await startMultiuserServer({
        host: '127.0.0.1',
        port: 0,
        version: '0.20.0',
        sessionRepository: createMemorySessionRepository({
          users: [{ id: 'user-1', displayName: '作者甲' }],
          sessions: [{
            token: 'session-token',
            userId: 'user-1',
            expiresAt: '2026-05-08T13:00:00.000Z'
          }]
        }),
        projectRepository: createMemoryProjectAccessRepository({
          projects: [{
            id: 'project-1',
            ownerUserId: 'user-1',
            dataRoot: 'D:\\storyspec-data\\project-1'
          }],
          memberships: [{
            projectId: 'project-1',
            userId: 'user-1',
            role: 'owner'
          }]
        }),
        jobRepository,
        now: () => '2026-05-08T12:01:00.000Z',
        jobIdGenerator: () => 'job-2'
      });

      try {
        const retried = await fetch(`${retryServer.url}/api/projects/project-1/jobs/job-failed/retry`, {
          method: 'POST',
          headers: {
            authorization: 'Bearer session-token'
          }
        });
        expect(retried.status).toBe(200);
        await expect(retried.json()).resolves.toMatchObject({
          id: 'job-2',
          status: 'queued',
          attempt: 2
        });
      } finally {
        await retryServer.close();
      }
    } finally {
      await server.close();
    }
  });

  it('enforces configured job quota before creating jobs', async () => {
    const jobRepository = createMemoryAgentJobRepository();
    const quotaRepository = createMemoryQuotaRepository({
      buckets: [{
        id: 'quota-project-job',
        scopeType: 'project',
        scopeId: 'project-1',
        metric: 'job',
        limit: 1,
        used: 1
      }]
    });
    const server = await startMultiuserServer({
      host: '127.0.0.1',
      port: 0,
      version: '0.20.0',
      sessionRepository: createMemorySessionRepository({
        users: [{ id: 'user-1', displayName: '作者甲' }],
        sessions: [{
          token: 'session-token',
          userId: 'user-1',
          expiresAt: '2026-05-08T13:00:00.000Z'
        }]
      }),
      projectRepository: createMemoryProjectAccessRepository({
        projects: [{
          id: 'project-1',
          ownerUserId: 'user-1',
          dataRoot: 'D:\\storyspec-data\\project-1'
        }],
        memberships: [{
          projectId: 'project-1',
          userId: 'user-1',
          role: 'owner'
        }]
      }),
      jobRepository,
      quotaRepository,
      now: () => '2026-05-08T12:00:00.000Z',
      jobIdGenerator: () => 'job-quota-blocked'
    });

    try {
      const blocked = await fetch(`${server.url}/api/projects/project-1/jobs`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer session-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          kind: 'chapter-draft',
          runtime: 'local-storyspec'
        })
      });

      expect(blocked.status).toBe(429);
      await expect(blocked.json()).resolves.toMatchObject({
        statusCode: 429,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: expect.stringContaining('配额不足')
        }
      });
      await expect(jobRepository.findById('job-quota-blocked')).resolves.toBeUndefined();
    } finally {
      await server.close();
    }
  });

  it('consumes job quota and records audit events for job mutations', async () => {
    const jobRepository = createMemoryAgentJobRepository();
    const auditRepository = createMemoryAuditLogRepository();
    const quotaRepository = createMemoryQuotaRepository({
      buckets: [{
        id: 'quota-project-job',
        scopeType: 'project',
        scopeId: 'project-1',
        metric: 'job',
        limit: 3,
        used: 0
      }, {
        id: 'quota-user-job',
        scopeType: 'user',
        scopeId: 'user-1',
        metric: 'job',
        limit: 3,
        used: 0
      }]
    });
    const server = await startMultiuserServer({
      host: '127.0.0.1',
      port: 0,
      version: '0.20.0',
      sessionRepository: createMemorySessionRepository({
        users: [{ id: 'user-1', displayName: '作者甲' }],
        sessions: [{
          token: 'session-token',
          userId: 'user-1',
          expiresAt: '2026-05-08T13:00:00.000Z'
        }]
      }),
      projectRepository: createMemoryProjectAccessRepository({
        projects: [{
          id: 'project-1',
          ownerUserId: 'user-1',
          dataRoot: 'D:\\storyspec-data\\project-1'
        }],
        memberships: [{
          projectId: 'project-1',
          userId: 'user-1',
          role: 'owner'
        }]
      }),
      jobRepository,
      auditRepository,
      quotaRepository,
      now: () => '2026-05-08T12:00:00.000Z',
      jobIdGenerator: () => 'job-audited'
    });

    try {
      const created = await fetch(`${server.url}/api/projects/project-1/jobs`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer session-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          kind: 'chapter-draft',
          runtime: 'local-storyspec'
        })
      });
      expect(created.status).toBe(200);

      await expect(quotaRepository.findBucket({
        scopeType: 'project',
        scopeId: 'project-1',
        metric: 'job'
      })).resolves.toMatchObject({ used: 1 });
      await expect(quotaRepository.findBucket({
        scopeType: 'user',
        scopeId: 'user-1',
        metric: 'job'
      })).resolves.toMatchObject({ used: 1 });

      const canceled = await fetch(`${server.url}/api/projects/project-1/jobs/job-audited/cancel`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer session-token'
        }
      });
      expect(canceled.status).toBe(200);

      await createAgentJob({
        repository: jobRepository,
        userId: 'user-1',
        projectId: 'project-1',
        kind: 'chapter-draft',
        runtime: 'local-storyspec',
        now: () => '2026-05-08T12:00:00.000Z',
        idGenerator: () => 'job-retry-audit'
      });
      await transitionAgentJob({
        repository: jobRepository,
        jobId: 'job-retry-audit',
        status: 'running',
        now: () => '2026-05-08T12:00:10.000Z'
      });
      await transitionAgentJob({
        repository: jobRepository,
        jobId: 'job-retry-audit',
        status: 'failed',
        errorMessage: 'runtime failed',
        now: () => '2026-05-08T12:00:20.000Z'
      });

      const retryServer = await startMultiuserServer({
        host: '127.0.0.1',
        port: 0,
        version: '0.20.0',
        sessionRepository: createMemorySessionRepository({
          users: [{ id: 'user-1', displayName: '作者甲' }],
          sessions: [{
            token: 'session-token',
            userId: 'user-1',
            expiresAt: '2026-05-08T13:00:00.000Z'
          }]
        }),
        projectRepository: createMemoryProjectAccessRepository({
          projects: [{
            id: 'project-1',
            ownerUserId: 'user-1',
            dataRoot: 'D:\\storyspec-data\\project-1'
          }],
          memberships: [{
            projectId: 'project-1',
            userId: 'user-1',
            role: 'owner'
          }]
        }),
        jobRepository,
        auditRepository,
        quotaRepository,
        now: () => '2026-05-08T12:01:00.000Z',
        jobIdGenerator: () => 'job-retried-audit'
      });

      try {
        const retried = await fetch(`${retryServer.url}/api/projects/project-1/jobs/job-retry-audit/retry`, {
          method: 'POST',
          headers: {
            authorization: 'Bearer session-token'
          }
        });
        expect(retried.status).toBe(200);
      } finally {
        await retryServer.close();
      }

      await expect(auditRepository.listByProject('project-1')).resolves.toEqual(expect.arrayContaining([
        expect.objectContaining({
          actorUserId: 'user-1',
          projectId: 'project-1',
          action: 'agent_job.create',
          source: 'multiuser-server',
          jobId: 'job-audited'
        }),
        expect.objectContaining({
          actorUserId: 'user-1',
          projectId: 'project-1',
          action: 'agent_job.cancel',
          source: 'multiuser-server',
          jobId: 'job-audited'
        }),
        expect.objectContaining({
          actorUserId: 'user-1',
          projectId: 'project-1',
          action: 'agent_job.retry',
          source: 'multiuser-server',
          jobId: 'job-retried-audit'
        })
      ]));
    } finally {
      await server.close();
    }
  });
});
