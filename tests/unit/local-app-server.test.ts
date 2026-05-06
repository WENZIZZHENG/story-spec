import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';
import { createMemoryRecentProjectStore } from '../../src/application/local-app-projects.js';
import {
  createLocalAppServerCore
} from '../../src/app-server/local-app-server.js';

describe('local app server core', () => {
  it('reports health and token requirement', () => {
    const core = createLocalAppServerCore({
      token: 'secret',
      fileSystem: new MemoryFileSystem('D:\\workspace'),
      recentProjects: createMemoryRecentProjectStore(),
      projectStatus: async () => {
        throw new Error('not used');
      }
    });

    expect(core.health()).toEqual({
      ok: true,
      requiresToken: true,
      host: '127.0.0.1'
    });
  });

  it('rejects API calls without the session token', async () => {
    const core = createLocalAppServerCore({
      token: 'secret',
      fileSystem: new MemoryFileSystem('D:\\workspace'),
      recentProjects: createMemoryRecentProjectStore(),
      projectStatus: async () => {
        throw new Error('not used');
      }
    });

    await expect(core.getCurrentProjectStatus({ token: 'wrong' })).resolves.toEqual({
      status: 401,
      body: {
        blocked: true,
        blockedReasons: ['缺少或无效的本机 App session token']
      }
    });
  });

  it('rejects status before a project is opened in this session', async () => {
    const fs = new MemoryFileSystem('D:\\workspace');
    const projectRoot = path.resolve('D:\\workspace\\spell-era');
    await fs.ensureDir(path.join(projectRoot, '.specify'));
    await fs.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: '法术编译纪元'
    });
    const core = createLocalAppServerCore({
      token: 'secret',
      fileSystem: fs,
      recentProjects: createMemoryRecentProjectStore(),
      projectStatus: async () => {
        throw new Error('status should not be read');
      }
    });

    await expect(core.getProjectStatus({
      token: 'secret',
      projectRoot
    })).resolves.toEqual({
      status: 403,
      body: {
        blocked: true,
        blockedReasons: ['项目尚未在本次 App 会话中打开']
      }
    });
  });

  it('returns status for the opened current project', async () => {
    const fs = new MemoryFileSystem('D:\\workspace');
    const projectRoot = path.resolve('D:\\workspace\\spell-era');
    await fs.ensureDir(path.join(projectRoot, '.specify'));
    await fs.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: '法术编译纪元'
    });
    const core = createLocalAppServerCore({
      token: 'secret',
      fileSystem: fs,
      recentProjects: createMemoryRecentProjectStore(),
      projectStatus: async input => ({
        projectRoot: input.projectRoot,
        projectName: '法术编译纪元',
        nextActions: ['继续创作']
      })
    });

    const openResult = await core.openProject({
      token: 'secret',
      projectRoot,
      now: () => '2026-05-06T13:30:00.000Z'
    });
    expect(openResult.status).toBe(200);

    await expect(core.getCurrentProjectStatus({ token: 'secret' })).resolves.toEqual({
      status: 200,
      body: {
        projectRoot,
        projectName: '法术编译纪元',
        nextActions: ['继续创作']
      }
    });
  });

  it('lists recent projects only with a valid token', async () => {
    const store = createMemoryRecentProjectStore();
    await store.record({
      name: '法术编译纪元',
      path: path.resolve('D:\\workspace\\spell-era'),
      lastOpenedAt: '2026-05-06T13:30:00.000Z'
    });
    const core = createLocalAppServerCore({
      token: 'secret',
      fileSystem: new MemoryFileSystem('D:\\workspace'),
      recentProjects: store,
      projectStatus: async () => {
        throw new Error('not used');
      }
    });

    await expect(core.listRecentProjects({ token: 'wrong' })).resolves.toEqual({
      status: 401,
      body: {
        blocked: true,
        blockedReasons: ['缺少或无效的本机 App session token']
      }
    });
    await expect(core.listRecentProjects({ token: 'secret' })).resolves.toEqual({
      status: 200,
      body: [{
        name: '法术编译纪元',
        path: path.resolve('D:\\workspace\\spell-era'),
        lastOpenedAt: '2026-05-06T13:30:00.000Z'
      }]
    });
  });

  it('creates a project and allowlists it for status reads', async () => {
    const fs = new MemoryFileSystem('D:\\workspace');
    const projectRoot = path.resolve('D:\\workspace\\spell-era');
    const core = createLocalAppServerCore({
      token: 'secret',
      fileSystem: fs,
      recentProjects: createMemoryRecentProjectStore(),
      projectStatus: async input => ({
        projectRoot: input.projectRoot,
        projectName: '法术编译纪元'
      }),
      createProject: async request => {
        await fs.ensureDir(path.join(projectRoot, '.specify'));
        await fs.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
          name: request.name
        });
        return {
          blocked: false,
          blockedReasons: [],
          project: {
            name: request.name,
            path: projectRoot,
            lastOpenedAt: '2026-05-06T13:30:00.000Z'
          }
        };
      }
    });

    const created = await core.createProject({
      token: 'secret',
      name: '法术编译纪元',
      workspacePath: projectRoot,
      method: 'three-act',
      git: false,
      withExperts: false
    });
    expect(created.status).toBe(200);

    await expect(core.getCurrentProjectStatus({ token: 'secret' })).resolves.toEqual({
      status: 200,
      body: {
        projectRoot,
        projectName: '法术编译纪元'
      }
    });
  });
});
