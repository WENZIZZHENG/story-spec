import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createMemoryRecentProjectStore } from '../../src/application/local-app-projects.js';
import type { ProjectFileSystem } from '../../src/application/project-ports.js';
import {
  createLocalAppStartJson,
  type LocalAppWorkbenchServer,
  renderLocalAppStartPreview,
  renderLocalAppStarted,
  startLocalAppWorkbench
} from '../../src/cli/commands/app.command.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

describe('local app command', () => {
  it('renders a start preview with loopback host and token requirement', () => {
    expect(renderLocalAppStartPreview({
      host: '127.0.0.1',
      port: 43127,
      tokenRequired: true
    })).toContain('http://127.0.0.1:43127');
    expect(renderLocalAppStartPreview({
      host: '127.0.0.1',
      port: 43127,
      tokenRequired: true
    })).toContain('需要本机 session token');
  });

  it('renders a started message with the local app URL', () => {
    expect(renderLocalAppStarted({
      url: 'http://127.0.0.1:43127',
      tokenRequired: true,
      requestedPort: 43127,
      port: 43127,
      fallbackUsed: false
    })).toContain('http://127.0.0.1:43127');
    expect(renderLocalAppStarted({
      url: 'http://127.0.0.1:43127',
      tokenRequired: true,
      requestedPort: 43127,
      port: 43127,
      fallbackUsed: false
    })).toContain('Ctrl+C');
  });

  it('renders fallback port details and stable JSON without exposing the token', () => {
    const started = renderLocalAppStarted({
      url: 'http://127.0.0.1:43128',
      tokenRequired: true,
      requestedPort: 43127,
      port: 43128,
      fallbackUsed: true
    });

    expect(started).toContain('http://127.0.0.1:43128');
    expect(started).toContain('端口回退：43127 -> 43128');
    expect(createLocalAppStartJson({
      host: '127.0.0.1',
      requestedPort: 43127,
      port: 43128,
      url: 'http://127.0.0.1:43128',
      project: 'D:\\workspace\\spell-era',
      openBrowser: false,
      tokenRequired: true,
      fallbackUsed: true,
      status: 'started'
    })).toMatchObject({
      command: 'app',
      host: '127.0.0.1',
      requestedPort: 43127,
      port: 43128,
      fallbackUsed: true,
      url: 'http://127.0.0.1:43128',
      openBrowser: false,
      tokenRequired: true,
      status: 'started'
    });
    expect(JSON.stringify(createLocalAppStartJson({
      host: '127.0.0.1',
      requestedPort: 43127,
      port: 43128,
      url: 'http://127.0.0.1:43128',
      openBrowser: false,
      tokenRequired: true,
      fallbackUsed: true,
      status: 'started'
    }))).not.toContain('secret-token');
  });

  it('falls back to the next loopback port when the requested port is occupied', async () => {
    const attempts: number[] = [];

    const result = await startLocalAppWorkbench({
      host: '127.0.0.1',
      port: 43127,
      token: 'secret-token',
      fileSystem: new MemoryFileSystem('D:\\workspace'),
      recentProjects: createMemoryRecentProjectStore(),
      projectStatus: async input => ({ projectRoot: input.projectRoot }),
      startServer: async ({ port, core }) => {
        attempts.push(port);
        if (port === 43127) {
          const error = new Error('listen EADDRINUSE') as NodeJS.ErrnoException;
          error.code = 'EADDRINUSE';
          throw error;
        }

        return {
          url: `http://127.0.0.1:${port}`,
          host: '127.0.0.1',
          port,
          close: async () => undefined,
          core
        } satisfies LocalAppWorkbenchServer;
      }
    });

    expect(attempts).toEqual([43127, 43128]);
    expect(result.requestedPort).toBe(43127);
    expect(result.port).toBe(43128);
    expect(result.fallbackUsed).toBe(true);
    expect(result.server.url).toBe('http://127.0.0.1:43128');
  });

  it('starts the workbench and pre-opens a valid startup project without exposing the token in output', async () => {
    const fileSystem = new MemoryFileSystem('D:\\workspace');
    const projectRoot = path.resolve('D:\\workspace\\spell-era');
    await fileSystem.ensureDir(path.join(projectRoot, '.specify'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: '法术编译纪元'
    });
    const recentProjects = createMemoryRecentProjectStore();

    const result = await startLocalAppWorkbench({
      host: '127.0.0.1',
      port: 0,
      project: projectRoot,
      token: 'secret-token',
      fileSystem,
      recentProjects,
      projectStatus: async input => ({
        projectRoot: input.projectRoot,
        projectName: '法术编译纪元'
      }),
      startServer: async ({ core }) => ({
        url: 'http://127.0.0.1:43127',
        close: async () => undefined,
        core
      })
    });

    expect(result.openedProject).toMatchObject({
      name: '法术编译纪元',
      path: projectRoot
    });
    await expect(result.core.getCurrentProjectStatus({ token: 'secret-token' })).resolves.toEqual({
      status: 200,
      body: {
        projectRoot,
        projectName: '法术编译纪元'
      }
    });
    expect(renderLocalAppStarted({
      url: result.server.url,
      tokenRequired: true,
      requestedPort: 43127,
      port: 43127,
      fallbackUsed: false,
      openedProject: result.openedProject
    })).toContain('已打开项目：法术编译纪元');
    expect(renderLocalAppStarted({
      url: result.server.url,
      tokenRequired: true,
      requestedPort: 43127,
      port: 43127,
      fallbackUsed: false,
      openedProject: result.openedProject
    })).not.toContain('secret-token');
  });

  it('keeps the service available when the startup project cannot be opened', async () => {
    const fileSystem: ProjectFileSystem = new MemoryFileSystem('D:\\workspace');

    const result = await startLocalAppWorkbench({
      host: '127.0.0.1',
      port: 0,
      project: 'D:\\workspace\\missing',
      token: 'secret-token',
      fileSystem,
      recentProjects: createMemoryRecentProjectStore(),
      projectStatus: async input => ({ projectRoot: input.projectRoot }),
      startServer: async ({ core }) => ({
        url: 'http://127.0.0.1:43127',
        close: async () => undefined,
        core
      })
    });

    expect(result.openProjectBlockedReasons).toEqual([
      '缺少 .specify/config.json，所选目录不是 StorySpec 项目根目录'
    ]);
    expect(renderLocalAppStarted({
      url: result.server.url,
      tokenRequired: true,
      openProjectBlockedReasons: result.openProjectBlockedReasons
    })).toContain('启动项目未打开');
  });

  it('starts the workbench with story intake services wired into the app core', async () => {
    const fileSystem = new MemoryFileSystem('D:\\workspace');
    const projectRoot = path.resolve('D:\\workspace\\spell-era');
    await fileSystem.ensureDir(path.join(projectRoot, '.specify'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: '法术编译纪元'
    });
    const result = await startLocalAppWorkbench({
      host: '127.0.0.1',
      port: 0,
      project: projectRoot,
      token: 'secret-token',
      fileSystem,
      recentProjects: createMemoryRecentProjectStore(),
      projectStatus: async input => ({ projectRoot: input.projectRoot }),
      createStoryIdea: async input => ({
        projectRoot: input.projectRoot,
        story: input.name,
        idea: input.idea,
        nextCommands: [`storyspec next ${input.name}`]
      }),
      ingestStoryInput: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        written: input.applyConfirmed === true,
        candidateItems: [{ answer: input.text }]
      }),
      storyCoreSummary: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        missingOnly: input.missingOnly,
        items: [{ label: '核心伙伴', status: 'missing' }]
      }),
      startServer: async ({ core }) => ({
        url: 'http://127.0.0.1:43127',
        close: async () => undefined,
        core
      })
    });

    await expect(result.core.createStoryIdea({
      token: 'secret-token',
      name: '法术编译纪元',
      idea: '工科青年调试符文。'
    })).resolves.toMatchObject({
      status: 200,
      body: {
        projectRoot,
        story: '法术编译纪元',
        idea: '工科青年调试符文。'
      }
    });
    await expect(result.core.ingestStoryInput({
      token: 'secret-token',
      story: '法术编译纪元',
      text: '核心创意：工科青年调试符文。'
    })).resolves.toMatchObject({
      status: 200,
      body: {
        projectRoot,
        story: '法术编译纪元',
        written: false
      }
    });
    await expect(result.core.getStoryCoreMissing({
      token: 'secret-token',
      story: '法术编译纪元'
    })).resolves.toMatchObject({
      status: 200,
      body: {
        projectRoot,
        story: '法术编译纪元',
        missingOnly: true
      }
    });
  });

  it('starts the workbench with outline and task board services wired into the app core', async () => {
    const fileSystem = new MemoryFileSystem('D:\\workspace');
    const projectRoot = path.resolve('D:\\workspace\\spell-era');
    await fileSystem.ensureDir(path.join(projectRoot, '.specify'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: '法术编译纪元'
    });
    const result = await startLocalAppWorkbench({
      host: '127.0.0.1',
      port: 0,
      project: projectRoot,
      token: 'secret-token',
      fileSystem,
      recentProjects: createMemoryRecentProjectStore(),
      projectStatus: async input => ({ projectRoot: input.projectRoot }),
      listOutlineCandidates: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        outlines: [{ id: 'academy', title: '学院线加强版' }]
      }),
      createOutlineCandidate: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        outline: { id: 'border', title: input.title }
      }),
      compareOutlineCandidates: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        left: { id: input.leftId },
        right: { id: input.rightId },
        dimensions: [{ dimension: '主线目标', changed: true }]
      }),
      promoteOutlineCandidate: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        outline: { id: input.outlineId },
        dryRun: input.yes !== true
      }),
      taskBoard: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        write: input.write,
        board: { summary: { total: 1 }, tasks: [] }
      }),
      startServer: async ({ core }) => ({
        url: 'http://127.0.0.1:43127',
        close: async () => undefined,
        core
      })
    });

    await expect(result.core.listOutlineCandidates({
      token: 'secret-token',
      story: '法术编译纪元'
    })).resolves.toMatchObject({
      status: 200,
      body: { projectRoot, outlines: [{ id: 'academy' }] }
    });
    await expect(result.core.createOutlineCandidate({
      token: 'secret-token',
      story: '法术编译纪元',
      title: '边境冒险版',
      text: '主线目标：边境冒险'
    })).resolves.toMatchObject({
      status: 200,
      body: { projectRoot, outline: { id: 'border', title: '边境冒险版' } }
    });
    await expect(result.core.compareOutlineCandidates({
      token: 'secret-token',
      story: '法术编译纪元',
      leftId: 'academy',
      rightId: 'border'
    })).resolves.toMatchObject({
      status: 200,
      body: { projectRoot, dimensions: [{ dimension: '主线目标', changed: true }] }
    });
    await expect(result.core.promoteOutlineCandidate({
      token: 'secret-token',
      story: '法术编译纪元',
      outlineId: 'border'
    })).resolves.toMatchObject({
      status: 200,
      body: { projectRoot, dryRun: true }
    });
    await expect(result.core.getTaskBoard({
      token: 'secret-token',
      story: '法术编译纪元'
    })).resolves.toMatchObject({
      status: 200,
      body: { projectRoot, write: false }
    });
  });

  it('starts the workbench with chapter services wired into the app core', async () => {
    const fileSystem = new MemoryFileSystem('D:\\workspace');
    const projectRoot = path.resolve('D:\\workspace\\spell-era');
    await fileSystem.ensureDir(path.join(projectRoot, '.specify'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: '法术编译纪元'
    });
    const result = await startLocalAppWorkbench({
      host: '127.0.0.1',
      port: 0,
      project: projectRoot,
      token: 'secret-token',
      fileSystem,
      recentProjects: createMemoryRecentProjectStore(),
      projectStatus: async input => ({ projectRoot: input.projectRoot }),
      createChapterDraft: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        chapter: input.chapter,
        record: { id: 'chapter-001.v1', status: 'draft' }
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
        dryRun: input.yes !== true
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
        findings: [{ code: 'CHAPTER_TOO_SHORT' }],
        taskDrafts: [{ task_title: '[warning] 修复 CHAPTER_TOO_SHORT' }],
        reviewers: [{ id: 'editor', score: 92 }]
      }),
      startServer: async ({ core }) => ({
        url: 'http://127.0.0.1:43127',
        close: async () => undefined,
        core
      })
    });

    await expect(result.core.createChapterDraft({
      token: 'secret-token',
      story: '法术编译纪元',
      chapter: '001'
    })).resolves.toMatchObject({
      status: 200,
      body: { projectRoot, record: { id: 'chapter-001.v1', status: 'draft' } }
    });
    await expect(result.core.listChapterDrafts({
      token: 'secret-token',
      story: '法术编译纪元',
      chapter: '001'
    })).resolves.toMatchObject({
      status: 200,
      body: { projectRoot, records: [{ id: 'chapter-001.v1' }] }
    });
    await expect(result.core.promoteChapterDraft({
      token: 'secret-token',
      story: '法术编译纪元',
      draftId: 'chapter-001.v1'
    })).resolves.toMatchObject({
      status: 200,
      body: { projectRoot, dryRun: true }
    });
    await expect(result.core.createChapterSceneCard({
      token: 'secret-token',
      story: '法术编译纪元',
      sceneId: 'scene-001'
    })).resolves.toMatchObject({
      status: 200,
      body: { projectRoot, sceneId: 'scene-001' }
    });
    await expect(result.core.reviewChapter({
      token: 'secret-token',
      chapter: '001',
      panel: ['editor']
    })).resolves.toMatchObject({
      status: 200,
      body: {
        projectRoot,
        chapter: '001',
        panel: ['editor'],
        findings: [{ code: 'CHAPTER_TOO_SHORT' }]
      }
    });
  });
});
