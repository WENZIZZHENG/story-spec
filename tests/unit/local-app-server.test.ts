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

  it('returns the current project resume lane with token and opened-project checks', async () => {
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
        resume: {
          projectRoot: input.projectRoot,
          projectName: '法术编译纪元',
          storyName: '编程施法',
          stage: 'idea',
          stateLabel: '共创澄清中',
          primaryAction: {
            label: '继续创作访谈',
            reason: '先确认主角和舞台。',
            copyableCommand: 'storyspec next 编程施法',
            writesFiles: false,
            writeMode: 'read-only',
            boundary: '只导航，不写入。'
          },
          statusGlossary: [{ term: 'preview', meaning: '写入前预览。' }],
          recentProjectHint: '会记住最近项目。',
          boundaries: ['不会绕过 preview / confirm / apply。']
        }
      })
    });

    await expect(core.getCurrentProjectResume({ token: 'wrong' })).resolves.toEqual({
      status: 401,
      body: {
        blocked: true,
        blockedReasons: ['缺少或无效的本机 App session token']
      }
    });
    await expect(core.getCurrentProjectResume({ token: 'secret' })).resolves.toEqual({
      status: 403,
      body: {
        blocked: true,
        blockedReasons: ['项目尚未在本次 App 会话中打开']
      }
    });

    await core.openProject({ token: 'secret', projectRoot });

    await expect(core.getCurrentProjectResume({ token: 'secret' })).resolves.toMatchObject({
      status: 200,
      body: {
        projectRoot,
        projectName: '法术编译纪元',
        storyName: '编程施法',
        stateLabel: '共创澄清中',
        primaryAction: {
          copyableCommand: 'storyspec next 编程施法',
          writeMode: 'read-only'
        },
        boundaries: ['不会绕过 preview / confirm / apply。']
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

  it('routes outline candidate operations through the current project and keeps promote dry-run by default', async () => {
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
      })
    });

    await expect(core.listOutlineCandidates({
      token: 'secret',
      story: '法术编译纪元'
    })).resolves.toEqual({
      status: 403,
      body: {
        blocked: true,
        blockedReasons: ['项目尚未在本次 App 会话中打开']
      }
    });

    await core.openProject({ token: 'secret', projectRoot });

    await expect(core.listOutlineCandidates({
      token: 'secret',
      story: '法术编译纪元'
    })).resolves.toMatchObject({
      status: 200,
      body: {
        projectRoot,
        outlines: [{ id: 'academy', title: '学院线加强版', status: 'candidate' }]
      }
    });
    await expect(core.createOutlineCandidate({
      token: 'secret',
      story: '法术编译纪元',
      title: '边境冒险版',
      text: '主线目标：边境冒险'
    })).resolves.toMatchObject({
      status: 200,
      body: {
        projectRoot,
        outline: { id: 'border', title: '边境冒险版', status: 'candidate' }
      }
    });
    await expect(core.compareOutlineCandidates({
      token: 'secret',
      story: '法术编译纪元',
      leftId: 'academy',
      rightId: 'border'
    })).resolves.toMatchObject({
      status: 200,
      body: {
        projectRoot,
        dimensions: [{ dimension: '主线目标', changed: true }]
      }
    });
    await expect(core.promoteOutlineCandidate({
      token: 'secret',
      story: '法术编译纪元',
      outlineId: 'border'
    })).resolves.toMatchObject({
      status: 200,
      body: {
        projectRoot,
        dryRun: true,
        reminders: ['重新检查 tasks、Scene Card 和 Context Pack。']
      }
    });
  });

  it('returns a read-only task board for the current project', async () => {
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

    await core.openProject({ token: 'secret', projectRoot });

    await expect(core.getTaskBoard({
      token: 'secret',
      story: '法术编译纪元'
    })).resolves.toEqual({
      status: 200,
      body: {
        projectRoot,
        story: '法术编译纪元',
        write: false,
        board: {
          summary: { total: 2, todo: 1, done: 1, writeReady: 1, planOnly: 1 },
          tasks: [{ id: 'T1', title: '写第一章', status: 'todo' }]
        }
      }
    });
  });

  it('routes chapter draft, scene card, and review operations through the current project with dry-run publishing', async () => {
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
      createChapterDraft: async input => ({
        projectRoot: input.projectRoot,
        story: input.story,
        chapter: input.chapter,
        basedOn: input.basedOn,
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
        yes: input.yes,
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

    await expect(core.createChapterDraft({
      token: 'secret',
      story: '法术编译纪元',
      chapter: '001'
    })).resolves.toEqual({
      status: 403,
      body: {
        blocked: true,
        blockedReasons: ['项目尚未在本次 App 会话中打开']
      }
    });

    await core.openProject({ token: 'secret', projectRoot });

    await expect(core.createChapterDraft({
      token: 'secret',
      story: '法术编译纪元',
      chapter: '001',
      basedOn: 'stories/法术编译纪元/content/chapter-001.md',
      contextPack: '.specify/context-packs/write-001.json'
    })).resolves.toMatchObject({
      status: 200,
      body: {
        projectRoot,
        story: '法术编译纪元',
        chapter: '001',
        contextPack: '.specify/context-packs/write-001.json',
        record: { id: 'chapter-001.v1', status: 'draft' }
      }
    });
    await expect(core.listChapterDrafts({
      token: 'secret',
      story: '法术编译纪元',
      chapter: '001'
    })).resolves.toMatchObject({
      status: 200,
      body: {
        projectRoot,
        records: [{ id: 'chapter-001.v1', status: 'draft' }]
      }
    });
    await expect(core.promoteChapterDraft({
      token: 'secret',
      story: '法术编译纪元',
      draftId: 'chapter-001.v1'
    })).resolves.toMatchObject({
      status: 200,
      body: {
        projectRoot,
        draftId: 'chapter-001.v1',
        dryRun: true
      }
    });
    await expect(core.createChapterSceneCard({
      token: 'secret',
      story: '法术编译纪元',
      sceneId: 'scene-001'
    })).resolves.toMatchObject({
      status: 200,
      body: {
        projectRoot,
        sceneId: 'scene-001'
      }
    });
    await expect(core.reviewChapter({
      token: 'secret',
      chapter: '001',
      panel: ['editor']
    })).resolves.toMatchObject({
      status: 200,
      body: {
        projectRoot,
        chapter: '001',
        panel: ['editor'],
        findings: [{ code: 'CHAPTER_TOO_SHORT', severity: 'warning' }],
        taskDrafts: [{ task_title: '[warning] 修复 CHAPTER_TOO_SHORT' }]
      }
    });
  });

  it('returns a read-only chapter writing lane for the current project', async () => {
    const fs = new MemoryFileSystem('D:\\workspace');
    const projectRoot = path.resolve('D:\\workspace\\spell-era');
    const storyPath = path.join(projectRoot, 'stories', '法术编译纪元');
    await fs.ensureDir(path.join(projectRoot, '.specify'));
    await fs.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: '法术编译纪元'
    });
    await fs.ensureDir(storyPath);
    await fs.writeFile(path.join(storyPath, 'creative-plan.md'), '# 创作计划');
    await fs.writeFile(path.join(storyPath, 'tasks.md'), [
      '# Tasks',
      '',
      '- [ ] [WRITE-READY] T001 - 写第一章',
      '  - **必须读取**：`stories/法术编译纪元/scenes/chapter-001.yaml`',
      '  - **允许修改**：`stories/法术编译纪元/drafts/chapter-001.v1.md`',
      '  - **输出**：`stories/法术编译纪元/drafts/chapter-001.v1.md`'
    ].join('\n'));
    await fs.ensureDir(path.join(storyPath, 'scenes'));
    await fs.writeFile(path.join(storyPath, 'scenes', 'chapter-001.yaml'), 'id: chapter-001');
    const core = createLocalAppServerCore({
      token: 'secret',
      fileSystem: fs,
      recentProjects: createMemoryRecentProjectStore(),
      projectStatus: async input => ({ projectRoot: input.projectRoot })
    });

    await expect(core.getChapterWritingLane({
      token: 'secret',
      story: '法术编译纪元',
      chapter: '001'
    })).resolves.toEqual({
      status: 403,
      body: {
        blocked: true,
        blockedReasons: ['项目尚未在本次 App 会话中打开']
      }
    });

    await core.openProject({ token: 'secret', projectRoot });

    await expect(core.getChapterWritingLane({
      token: 'secret',
      story: '法术编译纪元',
      chapter: '001'
    })).resolves.toMatchObject({
      status: 200,
      body: {
        story: '法术编译纪元',
        chapter: 'chapter-001',
        currentStep: 'sample',
        boundaries: [
          '写作通道只读展示，不自动修改正文。',
          '章节小样默认不写入 content、tracking、canon 或 tasks。',
          '完整正文仍需作者确认小样后再分块生成。'
        ],
        lane: [
          { id: 'outline', status: 'ready' },
          { id: 'tasks', status: 'ready' },
          { id: 'scene', status: 'ready' },
          { id: 'sample', status: 'ready' },
          { id: 'draft', status: 'blocked' },
          { id: 'review', status: 'blocked' }
        ]
      }
    });
  });
});
