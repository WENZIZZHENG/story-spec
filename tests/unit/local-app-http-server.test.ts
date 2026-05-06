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
  it('serves the local workbench shell at the root path without weakening API token checks', async () => {
    const core = createLocalAppServerCore({
      token: 'secret',
      fileSystem: nodeFileSystem,
      recentProjects: createMemoryRecentProjectStore(),
      projectStatus: async input => ({
        projectRoot: input.projectRoot,
        projectName: '法术编译纪元'
      })
    });
    const server = await startLocalAppHttpServer({
      host: '127.0.0.1',
      port: 0,
      core,
      token: 'secret'
    });

    try {
      const shell = await fetch(`${server.url}/`);
      const html = await shell.text();
      expect(shell.status).toBe(200);
      expect(shell.headers.get('content-type')).toContain('text/html');
      expect(html).toContain('StorySpec 本机工作台');
      expect(html).toContain('secret');

      const unauthorized = await fetch(`${server.url}/api/projects/recent`);
      expect(unauthorized.status).toBe(401);
    } finally {
      await server.close();
    }
  });

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
      core,
      token: 'secret'
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

  it('routes story intake APIs through the current app session with token checks', async () => {
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
        projectName: '法术编译纪元'
      }),
      createStoryIdea: async input => ({
        projectRoot: input.projectRoot,
        story: input.name,
        idea: input.idea,
        nextCommands: [`storyspec next ${input.name}`]
      }),
      ingestStoryInput: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        text: input.text,
        written: input.applyConfirmed === true,
        candidateItems: [{ label: '核心创意', answer: input.text }]
      }),
      storyCoreSummary: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        missingOnly: input.missingOnly,
        items: [{ label: '核心伙伴', status: 'missing' }]
      })
    });
    const server = await startLocalAppHttpServer({
      host: '127.0.0.1',
      port: 0,
      core,
      token: 'secret'
    });

    try {
      const unauthorized = await fetch(`${server.url}/api/stories/create`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: '法术编译纪元',
          idea: '工科青年调试符文。'
        })
      });
      expect(unauthorized.status).toBe(401);

      await fetch(`${server.url}/api/projects/open`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-storyspec-app-token': 'secret'
        },
        body: JSON.stringify({ projectRoot })
      });

      const createStory = await fetch(`${server.url}/api/stories/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-storyspec-app-token': 'secret'
        },
        body: JSON.stringify({
          name: '法术编译纪元',
          idea: '工科青年调试符文。'
        })
      });
      await expect(createStory.json()).resolves.toMatchObject({
        story: '法术编译纪元',
        idea: '工科青年调试符文。'
      });

      const ingest = await fetch(`${server.url}/api/stories/ingest`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-storyspec-app-token': 'secret'
        },
        body: JSON.stringify({
          story: '法术编译纪元',
          text: '核心创意：工科青年把符文看成程序。',
          applyConfirmed: false
        })
      });
      await expect(ingest.json()).resolves.toMatchObject({
        story: '法术编译纪元',
        written: false
      });

      const coreMissing = await fetch(`${server.url}/api/stories/core/missing?story=${encodeURIComponent('法术编译纪元')}`, {
        headers: {
          'x-storyspec-app-token': 'secret'
        }
      });
      await expect(coreMissing.json()).resolves.toMatchObject({
        story: '法术编译纪元',
        missingOnly: true,
        items: [{ label: '核心伙伴', status: 'missing' }]
      });
    } finally {
      await server.close();
    }
  });
});
