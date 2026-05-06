import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createMemoryRecentProjectStore } from '../../src/application/local-app-projects.js';
import { nodeFileSystem } from '../../src/infrastructure/node-file-system.js';
import { createLocalAppServerCore } from '../../src/app-server/local-app-server.js';
import { startLocalAppHttpServer } from '../../src/app-server/local-app-http-server.js';

const tempDirs: string[] = [];

const makeTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'storyspec-local-app-http-'));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('local app http server', () => {
  it('serves health, enforces token, opens a project, and returns current status', async () => {
    const projectRoot = await makeTempDir();
    await mkdir(path.join(projectRoot, '.specify'), { recursive: true });
    await writeFile(path.join(projectRoot, '.specify', 'config.json'), JSON.stringify({
      name: '法术编译纪元'
    }));
    const core = createLocalAppServerCore({
      token: 'secret',
      fileSystem: nodeFileSystem,
      recentProjects: createMemoryRecentProjectStore(),
      projectStatus: async input => ({
        projectRoot: input.projectRoot,
        projectName: '法术编译纪元',
        nextActions: ['继续创作']
      })
    });
    const server = await startLocalAppHttpServer({
      host: '127.0.0.1',
      port: 0,
      core
    });

    try {
      await expect(fetch(`${server.url}/api/app/health`).then(res => res.json())).resolves.toEqual({
        ok: true,
        requiresToken: true,
        host: '127.0.0.1'
      });

      const unauthorized = await fetch(`${server.url}/api/projects/current/status`);
      expect(unauthorized.status).toBe(401);

      const opened = await fetch(`${server.url}/api/projects/open`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-storyspec-app-token': 'secret'
        },
        body: JSON.stringify({ projectRoot })
      });
      expect(opened.status).toBe(200);

      const status = await fetch(`${server.url}/api/projects/current/status`, {
        headers: {
          'x-storyspec-app-token': 'secret'
        }
      });
      await expect(status.json()).resolves.toEqual({
        projectRoot,
        projectName: '法术编译纪元',
        nextActions: ['继续创作']
      });
    } finally {
      await server.close();
    }
  });
});
