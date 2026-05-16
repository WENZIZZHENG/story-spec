import { describe, expect, it } from 'vitest';
import { createMemoryAuditLogRepository } from '../../src/server/audit/audit-log.js';
import { createMemorySessionRepository } from '../../src/server/auth/session.js';
import { createMemoryCollaborationCanonRepository } from '../../src/server/collaboration/canon-merge.js';
import { startMultiuserServer } from '../../src/server/http/multiuser-server.js';
import { createAgentJob, createMemoryAgentJobRepository, transitionAgentJob } from '../../src/server/jobs/agent-job.js';
import { createMemoryAgentJobQueue } from '../../src/server/queue/agent-job-queue.js';
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
      jobQueue: createMemoryAgentJobQueue(),
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
          collaboration: false,
          audit: true,
          quota: true
        },
        queue: {
          configured: true,
          connected: true,
          worker: true,
          driver: 'memory'
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

  it('enqueues newly created jobs but does not duplicate idempotent active jobs', async () => {
    const jobRepository = createMemoryAgentJobRepository();
    const jobQueue = createMemoryAgentJobQueue();
    const server = await startMultiuserServer({
      host: '127.0.0.1',
      port: 0,
      version: '0.20.0',
      sessionRepository: createMemorySessionRepository({
        users: [{ id: 'user-1', displayName: '作者甲' }],
        sessions: [{
          token: 'session-token',
          userId: 'user-1',
          expiresAt: '2026-05-13T13:00:00.000Z'
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
      jobQueue,
      now: () => '2026-05-13T12:00:00.000Z',
      jobIdGenerator: () => 'job-1'
    });

    try {
      const first = await fetch(`${server.url}/api/projects/project-1/jobs`, {
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
      expect(first.status).toBe(200);

      const second = await fetch(`${server.url}/api/projects/project-1/jobs`, {
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
      expect(second.status).toBe(200);
      await expect(second.json()).resolves.toMatchObject({
        id: 'job-1',
        status: 'queued'
      });

      expect(jobQueue.snapshot().pending).toEqual([
        {
          jobId: 'job-1',
          projectId: 'project-1',
          userId: 'user-1',
          runtime: 'local-storyspec',
          kind: 'chapter-draft',
          attempt: 1
        }
      ]);
    } finally {
      await server.close();
    }
  });

  it('serves a project job dashboard with status counts and queue snapshot', async () => {
    const jobRepository = createMemoryAgentJobRepository();
    const jobQueue = createMemoryAgentJobQueue();
    const queued = await createAgentJob({
      repository: jobRepository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      now: () => '2026-05-08T12:00:00.000Z',
      idGenerator: () => 'job-queued'
    });
    await jobQueue.enqueue({
      jobId: 'job-queued',
      projectId: 'project-1',
      userId: 'user-1',
      runtime: 'local-storyspec',
      kind: 'chapter-draft',
      attempt: 1
    });
    const running = await createAgentJob({
      repository: jobRepository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'review',
      runtime: 'local-storyspec',
      now: () => '2026-05-08T12:01:00.000Z',
      idGenerator: () => 'job-running'
    });
    await transitionAgentJob({
      repository: jobRepository,
      jobId: running.job!.id,
      status: 'running',
      now: () => '2026-05-08T12:02:00.000Z'
    });
    const failed = await createAgentJob({
      repository: jobRepository,
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'canon-review',
      runtime: 'openhands',
      now: () => '2026-05-08T12:03:00.000Z',
      idGenerator: () => 'job-failed'
    });
    await transitionAgentJob({
      repository: jobRepository,
      jobId: failed.job!.id,
      status: 'running',
      now: () => '2026-05-08T12:04:00.000Z'
    });
    await transitionAgentJob({
      repository: jobRepository,
      jobId: failed.job!.id,
      status: 'failed',
      errorMessage: 'runner failed',
      now: () => '2026-05-08T12:05:00.000Z'
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
      jobQueue,
      now: () => '2026-05-08T12:06:00.000Z'
    });

    try {
      const dashboard = await fetch(`${server.url}/api/projects/project-1/jobs/dashboard`, {
        headers: {
          authorization: 'Bearer session-token'
        }
      });
      expect(dashboard.status).toBe(200);
      await expect(dashboard.json()).resolves.toMatchObject({
        projectId: 'project-1',
        totalJobs: 3,
        activeJobs: 2,
        retryableJobs: 1,
        statusCounts: {
          queued: 1,
          running: 1,
          succeeded: 0,
          failed: 1,
          canceled: 0,
          timeout: 0
        },
        queue: {
          readiness: {
            configured: true,
            connected: true,
            worker: true,
            driver: 'memory'
          },
          snapshot: {
            pending: 1,
            acknowledged: 0,
            failed: 0
          }
        },
        latestJobs: [
          expect.objectContaining({ id: 'job-failed', status: 'failed' }),
          expect.objectContaining({ id: 'job-running', status: 'running' }),
          expect.objectContaining({ id: 'job-queued', status: 'queued' })
        ]
      });
      expect(queued.job?.status).toBe('queued');
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

  it('returns repository readiness and 503 when collaboration repository is missing', async () => {
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
      })
    });

    try {
      const readiness = await fetch(`${server.url}/ready`);
      await expect(readiness.json()).resolves.toMatchObject({
        repositories: {
          collaboration: false
        }
      });

      const created = await fetch(`${server.url}/api/projects/project-1/collaboration/proposals`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer session-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          storyId: 'story-main',
          target: {
            kind: 'canon',
            path: 'stories/main/canon.md',
            resourceVersion: 'canon-v1'
          },
          sourceRefs: [{
            kind: 'agent-job',
            id: 'job-1',
            label: '章节候选'
          }],
          summary: '把候选事实纳入正典预览。'
        })
      });

      expect(created.status).toBe(503);
      await expect(created.json()).resolves.toMatchObject({
        error: {
          code: 'MULTIUSER_REPOSITORY_NOT_CONFIGURED'
        }
      });

      const panel = await fetch(`${server.url}/api/projects/project-1/stories/story-main/canon-review`, {
        headers: {
          authorization: 'Bearer session-token'
        }
      });
      expect(panel.status).toBe(503);
      await expect(panel.json()).resolves.toMatchObject({
        error: {
          code: 'MULTIUSER_REPOSITORY_NOT_CONFIGURED'
        }
      });
    } finally {
      await server.close();
    }
  });

  it('handles collaboration canon proposal review patch and apply request mutations', async () => {
    const collaborationRepository = createMemoryCollaborationCanonRepository();
    const auditRepository = createMemoryAuditLogRepository();
    const server = await startMultiuserServer({
      host: '127.0.0.1',
      port: 0,
      version: '0.20.0',
      sessionRepository: createMemorySessionRepository({
        users: [
          { id: 'user-owner', displayName: '作者甲' },
          { id: 'user-reviewer', displayName: '审稿者乙' }
        ],
        sessions: [{
          token: 'owner-token',
          userId: 'user-owner',
          expiresAt: '2026-05-08T13:00:00.000Z'
        }, {
          token: 'reviewer-token',
          userId: 'user-reviewer',
          expiresAt: '2026-05-08T13:00:00.000Z'
        }]
      }),
      projectRepository: createMemoryProjectAccessRepository({
        projects: [{
          id: 'project-1',
          ownerUserId: 'user-owner',
          dataRoot: 'D:\\storyspec-data\\project-1'
        }],
        memberships: [{
          projectId: 'project-1',
          userId: 'user-owner',
          role: 'owner'
        }, {
          projectId: 'project-1',
          userId: 'user-reviewer',
          role: 'reviewer'
        }]
      }),
      collaborationRepository,
      auditRepository,
      now: () => '2026-05-08T12:00:00.000Z'
    });

    try {
      const readiness = await fetch(`${server.url}/ready`);
      await expect(readiness.json()).resolves.toMatchObject({
        repositories: {
          collaboration: true
        }
      });

      const created = await fetch(`${server.url}/api/projects/project-1/collaboration/proposals`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer owner-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          storyId: 'story-main',
          target: {
            kind: 'canon',
            path: 'stories/main/canon.md',
            resourceVersion: 'canon-v1'
          },
          sourceRefs: [{
            kind: 'agent-job',
            id: 'job-1',
            label: '章节候选'
          }],
          summary: '把候选事实纳入正典预览。',
          risks: []
        })
      });
      expect(created.status).toBe(200);
      const proposal = await created.json() as { id: string };

      const commented = await fetch(`${server.url}/api/projects/project-1/collaboration/proposals/${proposal.id}/comments`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer reviewer-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          body: '这里需要补充来源证据。'
        })
      });
      expect(commented.status).toBe(200);
      await expect(commented.json()).resolves.toMatchObject({
        projectId: 'project-1',
        storyId: 'story-main',
        anchorKind: 'proposal',
        anchorId: proposal.id,
        comments: [
          {
            actorUserId: 'user-reviewer',
            body: '这里需要补充来源证据。',
            createdAt: '2026-05-08T12:00:00.000Z'
          }
        ]
      });

      const comments = await fetch(`${server.url}/api/projects/project-1/collaboration/proposals/${proposal.id}/comments`, {
        headers: {
          authorization: 'Bearer owner-token'
        }
      });
      expect(comments.status).toBe(200);
      await expect(comments.json()).resolves.toMatchObject({
        proposalId: proposal.id,
        threads: [
          {
            anchorId: proposal.id,
            comments: [
              {
                body: '这里需要补充来源证据。'
              }
            ]
          }
        ]
      });

      const reviewed = await fetch(`${server.url}/api/projects/project-1/collaboration/proposals/${proposal.id}/reviews`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer reviewer-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          decision: 'approve',
          note: '正典来源清晰，可以进入应用确认。'
        })
      });
      expect(reviewed.status).toBe(200);
      await expect(reviewed.json()).resolves.toMatchObject({
        proposalId: proposal.id,
        reviewerUserId: 'user-reviewer',
        decision: 'approve'
      });

      const patched = await fetch(`${server.url}/api/projects/project-1/collaboration/proposals/${proposal.id}/patches`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer owner-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          targetPath: 'stories/main/canon.md',
          kind: 'canon-fact',
          diffSummary: '新增主角知道港口暗号的正典事实。',
          rollbackHint: '删除 canon fact fact-1。',
          sourceRefs: ['job-1']
        })
      });
      expect(patched.status).toBe(200);
      const patch = await patched.json() as { id: string };

      const applyRequested = await fetch(`${server.url}/api/projects/project-1/collaboration/proposals/${proposal.id}/apply-requests`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer owner-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          authorConfirmed: true,
          currentVersion: {
            resourceVersion: 'canon-v1',
            storyStage: 'drafting',
            canonFactIds: ['fact-old'],
            taskState: 'open'
          }
        })
      });
      expect(applyRequested.status).toBe(200);
      await expect(applyRequested.json()).resolves.toMatchObject({
        proposalId: proposal.id,
        actorUserId: 'user-owner',
        status: 'ready',
        patchIds: [patch.id],
        reviewerIds: ['user-reviewer'],
        blockedReasons: []
      });

      const reviewPanel = await fetch(`${server.url}/api/projects/project-1/stories/story-main/canon-review`, {
        headers: {
          authorization: 'Bearer reviewer-token'
        }
      });
      expect(reviewPanel.status).toBe(200);
      await expect(reviewPanel.json()).resolves.toMatchObject({
        projectId: 'project-1',
        storyId: 'story-main',
        totals: {
          proposals: 1,
          reviews: 1,
          patches: 1,
          applyRequests: 1
        },
        entries: [
          {
            proposal: {
              id: proposal.id,
              storyId: 'story-main',
              status: 'apply-requested'
            },
            reviews: [
              {
                reviewerUserId: 'user-reviewer',
                decision: 'approve'
              }
            ],
            patches: [
              {
                id: patch.id,
                kind: 'canon-fact'
              }
            ],
            applyRequests: [
              {
                status: 'ready',
                patchIds: [patch.id]
              }
            ],
            nextActions: [
              '等待作者确认 apply；正式故事仍未写入。'
            ]
          }
        ]
      });

      await expect(auditRepository.listByProject('project-1')).resolves.toEqual(expect.arrayContaining([
        expect.objectContaining({ action: 'collaboration.proposal.create' }),
        expect.objectContaining({ action: 'collaboration.comment.create' }),
        expect.objectContaining({ action: 'collaboration.review.submit' }),
        expect.objectContaining({ action: 'collaboration.patch.create' }),
        expect.objectContaining({ action: 'collaboration.apply_request.create' })
      ]));
    } finally {
      await server.close();
    }
  });

  it('rejects collaboration apply requests without apply-canon-change permission', async () => {
    const collaborationRepository = createMemoryCollaborationCanonRepository();
    const server = await startMultiuserServer({
      host: '127.0.0.1',
      port: 0,
      version: '0.20.0',
      sessionRepository: createMemorySessionRepository({
        users: [
          { id: 'user-owner', displayName: '作者甲' },
          { id: 'user-editor', displayName: '编辑乙' }
        ],
        sessions: [{
          token: 'owner-token',
          userId: 'user-owner',
          expiresAt: '2026-05-08T13:00:00.000Z'
        }, {
          token: 'editor-token',
          userId: 'user-editor',
          expiresAt: '2026-05-08T13:00:00.000Z'
        }]
      }),
      projectRepository: createMemoryProjectAccessRepository({
        projects: [{
          id: 'project-1',
          ownerUserId: 'user-owner',
          dataRoot: 'D:\\storyspec-data\\project-1'
        }],
        memberships: [{
          projectId: 'project-1',
          userId: 'user-owner',
          role: 'owner'
        }, {
          projectId: 'project-1',
          userId: 'user-editor',
          role: 'editor'
        }]
      }),
      collaborationRepository,
      now: () => '2026-05-08T12:00:00.000Z'
    });

    try {
      const proposal = await fetch(`${server.url}/api/projects/project-1/collaboration/proposals`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer owner-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          storyId: 'story-main',
          target: {
            kind: 'canon',
            path: 'stories/main/canon.md',
            resourceVersion: 'canon-v1'
          },
          sourceRefs: [{
            kind: 'manual',
            id: 'note-1',
            label: '人工记录'
          }],
          summary: '候选事实。'
        })
      });
      const proposalBody = await proposal.json() as { id: string };

      const denied = await fetch(`${server.url}/api/projects/project-1/collaboration/proposals/${proposalBody.id}/apply-requests`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer editor-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          authorConfirmed: true,
          currentVersion: {
            resourceVersion: 'canon-v1',
            storyStage: 'drafting',
            canonFactIds: [],
            taskState: 'open'
          }
        })
      });

      expect(denied.status).toBe(403);
      await expect(denied.json()).resolves.toMatchObject({
        error: {
          code: 'PROJECT_ACCESS_DENIED'
        }
      });
    } finally {
      await server.close();
    }
  });
});
