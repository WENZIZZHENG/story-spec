import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createMemoryRecentProjectStore } from '../../src/application/local-app-projects.js';
import type { ProjectFileSystem } from '../../src/application/project-ports.js';
import {
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
      tokenRequired: true
    })).toContain('http://127.0.0.1:43127');
    expect(renderLocalAppStarted({
      url: 'http://127.0.0.1:43127',
      tokenRequired: true
    })).toContain('Ctrl+C');
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
      openedProject: result.openedProject
    })).toContain('已打开项目：法术编译纪元');
    expect(renderLocalAppStarted({
      url: result.server.url,
      tokenRequired: true,
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
});
