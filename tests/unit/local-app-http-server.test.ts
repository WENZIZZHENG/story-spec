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

  it('routes outline and task board APIs through the current app session', async () => {
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
      listOutlineCandidates: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        outlines: [{ id: 'academy', title: '学院线加强版', status: 'candidate' }]
      }),
      createOutlineCandidate: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        outline: { id: 'border', title: input.title, status: 'candidate' },
        text: input.text
      }),
      compareOutlineCandidates: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        left: { id: input.leftId },
        right: { id: input.rightId },
        dimensions: [{ dimension: '主线目标', left: '学院', right: '边境', changed: true }]
      }),
      promoteOutlineCandidate: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        outline: { id: input.outlineId },
        dryRun: input.yes !== true,
        reminders: ['重新检查 tasks、Scene Card 和 Context Pack。']
      }),
      taskBoard: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        write: input.write,
        board: {
          summary: { total: 2, todo: 1, done: 1, writeReady: 1, planOnly: 1 },
          tasks: [{ id: 'T1', title: '写第一章', status: 'todo' }]
        }
      })
    });
    const server = await startLocalAppHttpServer({
      host: '127.0.0.1',
      port: 0,
      core,
      token: 'secret'
    });

    try {
      const unauthorized = await fetch(`${server.url}/api/outlines/list`);
      expect(unauthorized.status).toBe(401);

      await fetch(`${server.url}/api/projects/open`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-storyspec-app-token': 'secret'
        },
        body: JSON.stringify({ projectRoot })
      });

      const list = await fetch(`${server.url}/api/outlines/list?story=${encodeURIComponent('法术编译纪元')}`, {
        headers: { 'x-storyspec-app-token': 'secret' }
      });
      await expect(list.json()).resolves.toMatchObject({
        outlines: [{ id: 'academy', title: '学院线加强版' }]
      });

      const created = await fetch(`${server.url}/api/outlines/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-storyspec-app-token': 'secret'
        },
        body: JSON.stringify({
          story: '法术编译纪元',
          title: '边境冒险版',
          text: '主线目标：边境冒险'
        })
      });
      await expect(created.json()).resolves.toMatchObject({
        outline: { id: 'border', title: '边境冒险版', status: 'candidate' }
      });

      const compare = await fetch(`${server.url}/api/outlines/compare`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-storyspec-app-token': 'secret'
        },
        body: JSON.stringify({
          story: '法术编译纪元',
          leftId: 'academy',
          rightId: 'border'
        })
      });
      await expect(compare.json()).resolves.toMatchObject({
        dimensions: [{ dimension: '主线目标', changed: true }]
      });

      const promote = await fetch(`${server.url}/api/outlines/promote`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-storyspec-app-token': 'secret'
        },
        body: JSON.stringify({
          story: '法术编译纪元',
          outlineId: 'border'
        })
      });
      await expect(promote.json()).resolves.toMatchObject({
        dryRun: true,
        reminders: ['重新检查 tasks、Scene Card 和 Context Pack。']
      });

      const board = await fetch(`${server.url}/api/tasks/board?story=${encodeURIComponent('法术编译纪元')}`, {
        headers: { 'x-storyspec-app-token': 'secret' }
      });
      await expect(board.json()).resolves.toMatchObject({
        write: false,
        board: {
          summary: { total: 2, writeReady: 1, planOnly: 1 },
          tasks: [{ id: 'T1', title: '写第一章' }]
        }
      });
    } finally {
      await server.close();
    }
  });

  it('routes chapter draft, scene card, and review APIs through the current app session', async () => {
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
      createChapterDraft: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        chapter: input.chapter,
        contextPack: input.contextPack,
        record: { id: 'chapter-001.v1', status: 'draft', path: 'stories/法术编译纪元/drafts/chapter-001.v1.md' }
      }),
      listChapterDrafts: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        chapter: input.chapter,
        records: [{ id: 'chapter-001.v1', status: 'draft' }]
      }),
      promoteChapterDraft: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        draftId: input.draftId,
        dryRun: input.yes !== true,
        targetPath: path.join(input.projectRoot, 'stories', '法术编译纪元', 'content', 'chapter-001.md')
      }),
      createChapterSceneCard: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        sceneId: input.sceneId,
        outputPath: path.join(input.projectRoot, 'stories', '法术编译纪元', 'scenes', `${input.sceneId}.yaml`)
      }),
      reviewChapter: async input => ({
        projectRoot: input.projectRoot,
        chapter: input.chapter,
        panel: input.panel,
        findings: [{ code: 'CHAPTER_TOO_SHORT', severity: 'warning' }],
        taskDrafts: [{ task_title: '[warning] 修复 CHAPTER_TOO_SHORT' }],
        reviewers: [{ id: 'editor', score: 92 }]
      })
    });
    const server = await startLocalAppHttpServer({
      host: '127.0.0.1',
      port: 0,
      core,
      token: 'secret'
    });

    try {
      const unauthorized = await fetch(`${server.url}/api/chapters/drafts/list`);
      expect(unauthorized.status).toBe(401);

      await fetch(`${server.url}/api/projects/open`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-storyspec-app-token': 'secret'
        },
        body: JSON.stringify({ projectRoot })
      });

      const created = await fetch(`${server.url}/api/chapters/drafts/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-storyspec-app-token': 'secret'
        },
        body: JSON.stringify({
          story: '法术编译纪元',
          chapter: '001',
          contextPack: '.specify/context-packs/write-001.json'
        })
      });
      await expect(created.json()).resolves.toMatchObject({
        projectRoot,
        story: '法术编译纪元',
        chapter: '001',
        record: { id: 'chapter-001.v1', status: 'draft' }
      });

      const list = await fetch(`${server.url}/api/chapters/drafts/list?story=${encodeURIComponent('法术编译纪元')}&chapter=001`, {
        headers: { 'x-storyspec-app-token': 'secret' }
      });
      await expect(list.json()).resolves.toMatchObject({
        records: [{ id: 'chapter-001.v1', status: 'draft' }]
      });

      const promote = await fetch(`${server.url}/api/chapters/drafts/promote`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-storyspec-app-token': 'secret'
        },
        body: JSON.stringify({
          story: '法术编译纪元',
          draftId: 'chapter-001.v1'
        })
      });
      await expect(promote.json()).resolves.toMatchObject({
        draftId: 'chapter-001.v1',
        dryRun: true
      });

      const scene = await fetch(`${server.url}/api/chapters/scene/init`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-storyspec-app-token': 'secret'
        },
        body: JSON.stringify({
          story: '法术编译纪元',
          sceneId: 'scene-001'
        })
      });
      await expect(scene.json()).resolves.toMatchObject({
        story: '法术编译纪元',
        sceneId: 'scene-001'
      });

      const review = await fetch(`${server.url}/api/chapters/review`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-storyspec-app-token': 'secret'
        },
        body: JSON.stringify({
          chapter: '001',
          panel: ['editor']
        })
      });
      await expect(review.json()).resolves.toMatchObject({
        chapter: '001',
        panel: ['editor'],
        findings: [{ code: 'CHAPTER_TOO_SHORT', severity: 'warning' }],
        taskDrafts: [{ task_title: '[warning] 修复 CHAPTER_TOO_SHORT' }]
      });
    } finally {
      await server.close();
    }
  });

  it('serves the chapter writing lane through a token-protected endpoint', async () => {
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
      chapterWritingLane: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        chapter: input.chapter,
        currentStep: 'sample',
        lane: [{ id: 'sample', status: 'ready' }],
        boundaries: ['章节小样默认不写入 content、tracking、canon 或 tasks。']
      })
    });
    const server = await startLocalAppHttpServer({
      host: '127.0.0.1',
      port: 0,
      core,
      token: 'secret'
    });

    try {
      const unauthorized = await fetch(`${server.url}/api/chapters/lane`);
      expect(unauthorized.status).toBe(401);

      await fetch(`${server.url}/api/projects/open`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-storyspec-app-token': 'secret'
        },
        body: JSON.stringify({ projectRoot })
      });

      const lane = await fetch(`${server.url}/api/chapters/lane?story=${encodeURIComponent('法术编译纪元')}&chapter=001`, {
        headers: { 'x-storyspec-app-token': 'secret' }
      });
      await expect(lane.json()).resolves.toMatchObject({
        story: '法术编译纪元',
        chapter: '001',
        currentStep: 'sample',
        lane: [{ id: 'sample', status: 'ready' }],
        boundaries: ['章节小样默认不写入 content、tracking、canon 或 tasks。']
      });
    } finally {
      await server.close();
    }
  });
});
