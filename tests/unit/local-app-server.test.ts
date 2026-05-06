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

  it('creates a story idea only inside the current opened project', async () => {
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
      projectStatus: async input => ({ projectRoot: input.projectRoot }),
      createStoryIdea: async input => ({
        projectRoot: input.projectRoot,
        story: input.name,
        idea: input.idea,
        ideaPath: path.join(input.projectRoot, 'stories', input.name, 'idea.md'),
        nextCommands: [`storyspec next ${input.name}`]
      })
    });

    await expect(core.createStoryIdea({
      token: 'secret',
      name: '法术编译纪元',
      idea: '工科青年穿越异界，用编程思维理解符文。'
    })).resolves.toEqual({
      status: 403,
      body: {
        blocked: true,
        blockedReasons: ['项目尚未在本次 App 会话中打开']
      }
    });

    await core.openProject({ token: 'secret', projectRoot });

    await expect(core.createStoryIdea({
      token: 'secret',
      name: '法术编译纪元',
      idea: '工科青年穿越异界，用编程思维理解符文。'
    })).resolves.toEqual({
      status: 200,
      body: {
        projectRoot,
        story: '法术编译纪元',
        idea: '工科青年穿越异界，用编程思维理解符文。',
        ideaPath: path.join(projectRoot, 'stories', '法术编译纪元', 'idea.md'),
        nextCommands: ['storyspec next 法术编译纪元']
      }
    });
  });

  it('previews source material through the current project and keeps applyConfirmed false by default', async () => {
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
      projectStatus: async input => ({ projectRoot: input.projectRoot }),
      ingestStoryInput: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        ingestedTextLength: input.text?.length ?? 0,
        inputProfile: { id: 'short-idea', label: '一句灵感' },
        confirmedItems: [],
        candidateItems: [{ questionId: 'core.premise', label: '核心创意', answer: input.text }],
        pendingQuestions: ['主角：未确认。'],
        written: input.applyConfirmed
      })
    });

    await core.openProject({ token: 'secret', projectRoot });

    await expect(core.ingestStoryInput({
      token: 'secret',
      story: '法术编译纪元',
      text: '一个工科青年把符文看成可调试的程序。'
    })).resolves.toEqual({
      status: 200,
      body: {
        projectRoot,
        story: '法术编译纪元',
        ingestedTextLength: 18,
        inputProfile: { id: 'short-idea', label: '一句灵感' },
        confirmedItems: [],
        candidateItems: [{ questionId: 'core.premise', label: '核心创意', answer: '一个工科青年把符文看成可调试的程序。' }],
        pendingQuestions: ['主角：未确认。'],
        written: false
      }
    });
  });

  it('returns missing core items for the current project story', async () => {
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
      projectStatus: async input => ({ projectRoot: input.projectRoot }),
      storyCoreSummary: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        missingOnly: input.missingOnly,
        items: [{
          id: 'core.partner',
          label: '核心伙伴',
          status: 'missing',
          sourceLabel: '待澄清',
          summary: '还没确认核心伙伴。',
          nextPrompt: '继续确认核心伙伴。'
        }]
      })
    });

    await core.openProject({ token: 'secret', projectRoot });

    await expect(core.getStoryCoreMissing({
      token: 'secret',
      story: '法术编译纪元'
    })).resolves.toEqual({
      status: 200,
      body: {
        projectRoot,
        story: '法术编译纪元',
        missingOnly: true,
        items: [{
          id: 'core.partner',
          label: '核心伙伴',
          status: 'missing',
          sourceLabel: '待澄清',
          summary: '还没确认核心伙伴。',
          nextPrompt: '继续确认核心伙伴。'
        }]
      }
    });
  });
});
