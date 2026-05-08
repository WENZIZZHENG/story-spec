import { describe, expect, it } from 'vitest';
import { createLocalStorySpecRunner } from '../../src/server/agent-runtime/local-storyspec-runner.js';
import { createMemorySessionRepository } from '../../src/server/auth/session.js';
import { startMultiuserServer } from '../../src/server/http/multiuser-server.js';
import { createAgentJob, createMemoryAgentJobRepository } from '../../src/server/jobs/agent-job.js';
import { createMemoryProjectAccessRepository } from '../../src/server/projects/project-security.js';

const createSecurityServer = async () => {
  const jobRepository = createMemoryAgentJobRepository();
  await createAgentJob({
    repository: jobRepository,
    userId: 'user-2',
    projectId: 'project-2',
    kind: 'chapter-draft',
    runtime: 'local-storyspec',
    now: () => '2026-05-08T12:00:00.000Z',
    idGenerator: () => 'job-project-2'
  });

  const server = await startMultiuserServer({
    host: '127.0.0.1',
    port: 0,
    version: '0.20.0',
    sessionRepository: createMemorySessionRepository({
      users: [{ id: 'user-1', displayName: '作者甲' }, { id: 'user-2', displayName: '作者乙' }],
      sessions: [{
        token: 'session-user-1',
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
    jobRepository,
    now: () => '2026-05-08T12:00:00.000Z'
  });

  return { server, jobRepository };
};

describe('multiuser security regressions', () => {
  it('rejects unauthenticated project API access', async () => {
    const { server } = await createSecurityServer();

    try {
      const response = await fetch(`${server.url}/api/projects/project-1`);
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        error: {
          code: 'AUTH_REQUIRED'
        }
      });
    } finally {
      await server.close();
    }
  });

  it('rejects cross-project job access before leaking job metadata', async () => {
    const { server } = await createSecurityServer();

    try {
      const response = await fetch(`${server.url}/api/projects/project-2/jobs/job-project-2`, {
        headers: {
          authorization: 'Bearer session-user-1'
        }
      });
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({
        error: {
          code: 'PROJECT_ACCESS_DENIED'
        }
      });
    } finally {
      await server.close();
    }
  });

  it('rejects path traversal through project storage probe', async () => {
    const { server } = await createSecurityServer();

    try {
      const response = await fetch(`${server.url}/api/projects/project-1/resolve?path=..%2Fsecret.md`, {
        headers: {
          authorization: 'Bearer session-user-1'
        }
      });
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        error: {
          code: 'PROJECT_PATH_INVALID'
        }
      });
    } finally {
      await server.close();
    }
  });

  it('keeps runtime outputs preview-only', async () => {
    const runner = createLocalStorySpecRunner();
    await expect(runner.start({
      id: 'job-1',
      userId: 'user-1',
      projectId: 'project-1',
      kind: 'chapter-draft',
      runtime: 'local-storyspec',
      status: 'running',
      attempt: 1,
      createdAt: '2026-05-08T12:00:00.000Z',
      updatedAt: '2026-05-08T12:00:00.000Z'
    })).resolves.toMatchObject({
      previewOnly: true,
      candidateRef: 'local-storyspec:job-1'
    });
  });
});
