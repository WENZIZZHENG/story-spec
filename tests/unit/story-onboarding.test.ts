import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import programmingCastingFixture from '../fixtures/co-creation/programming-casting.json' with { type: 'json' };
import {
  createStoryIdea,
  getStoryNext,
  renderStoryNext,
  STORY_NEXT_ACTION_IDS
} from '../../src/application/story-onboarding.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-story-onboarding');
  const fileSystem = new MemoryFileSystem(projectRoot);

  await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
    name: 'story-onboarding',
    type: 'novel'
  });

  return { projectRoot, fileSystem };
};

describe('story onboarding', () => {
  it('publishes stable action identifiers for next JSON clients', () => {
    expect(STORY_NEXT_ACTION_IDS).toEqual([
      'continue_interview',
      'review_creative_report',
      'preview_specification',
      'preview_plan',
      'compare_branch',
      'sample_author_profile',
      'review_story',
      'build_context_pack',
      'validate_project',
      'check_status',
      'open_tasks_board',
      'generate_tasks',
      'generate_plan',
      'run_command'
    ]);
  });

  it('creates only an idea draft and keeps the user premise as original text', async () => {
    const { projectRoot, fileSystem } = await createProject();

    const result = await createStoryIdea({
      projectRoot,
      fileSystem,
      name: '法术编译纪元',
      idea: '异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁',
      now: () => new Date('2026-05-03T12:00:00.000Z')
    });

    expect(result.story).toBe('法术编译纪元');
    await expect(fileSystem.readFile(path.join(projectRoot, 'stories', '法术编译纪元', 'idea.md')))
      .resolves.toContain('## 用户原文');
    await expect(fileSystem.readFile(result.ideaPath)).resolves.toContain('AI 候选必须经过用户确认');
    await expect(fileSystem.pathExists(path.join(projectRoot, 'stories', '法术编译纪元', 'specification.md')))
      .resolves.toBe(false);
  });

  it('surfaces author profile sampling as optional context without writing it into the idea draft', async () => {
    const { projectRoot, fileSystem } = await createProject();
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'memory', 'author-profile.json'), {
      schemaVersion: '1.0',
      updatedAt: '2026-05-04T08:00:00.000Z',
      notes: [],
      entries: [
        {
          id: 'pref.genre',
          category: 'genre',
          label: '题材偏好',
          value: '轻松冒险优先，文明级威胁慢慢浮现',
          status: 'confirmed',
          source: 'user-explicit',
          evidence: ['用户确认'],
          createdAt: '2026-05-04T08:00:00.000Z',
          updatedAt: '2026-05-04T08:00:00.000Z',
          confirmedAt: '2026-05-04T08:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const result = await createStoryIdea({
      projectRoot,
      fileSystem,
      name: '法术编译纪元',
      idea: '异界穿越、编程施法'
    });

    expect(result.authorProfile.activeHints).toEqual([
      '[confirmed] 题材偏好：轻松冒险优先，文明级威胁慢慢浮现'
    ]);
    expect(result.nextCommands).not.toContain('storyspec author-profile --init');
    await expect(fileSystem.readFile(result.ideaPath)).resolves.not.toContain('轻松冒险优先');
  });

  it('guides idea-stage stories back to interview before specification writing', async () => {
    const { projectRoot, fileSystem } = await createProject();
    await createStoryIdea({
      projectRoot,
      fileSystem,
      name: '法术编译纪元',
      idea: '异界穿越、编程施法'
    });

    const result = await getStoryNext({
      projectRoot,
      fileSystem,
      story: '法术编译纪元'
    });

    expect(result.stage).toBe('idea');
    expect(result.actions[0]).toMatchObject({
      action: 'continue_interview',
      command: 'storyspec interview 法术编译纪元 --focus power --premise "异界穿越、编程施法"'
    });
    expect(result.actions.map(action => action.command)).toContain('storyspec preview specify 法术编译纪元');
  });

  it('marks next interview recommendations as copyable with premise context from idea drafts', async () => {
    const { projectRoot, fileSystem } = await createProject();
    await createStoryIdea({
      projectRoot,
      fileSystem,
      name: '星尘驿站',
      idea: '退休星舰导航员在宇宙边境开一间给迷路灵魂和破损飞船歇脚的驿站。'
    });

    const result = await getStoryNext({
      projectRoot,
      fileSystem,
      story: '星尘驿站'
    });
    const interviewAction = result.actions.find(action => action.command.startsWith('storyspec interview'));
    const entryAction = result.coCreationEntrypoints.find(entry => entry.command.startsWith('storyspec interview'));
    const rendered = renderStoryNext(result);

    expect(interviewAction).toMatchObject({
      copyableCommand: 'storyspec interview 星尘驿站 --focus stage --premise "退休星舰导航员在宇宙边境开一间给迷路灵魂和破损飞船歇脚的驿站。"',
      requiresPremise: false
    });
    expect(interviewAction?.command).toBe(interviewAction?.copyableCommand);
    expect(entryAction).toMatchObject({
      copyableCommand: expect.stringContaining('--premise "退休星舰导航员在宇宙边境开一间给迷路灵魂和破损飞船歇脚的驿站。"'),
      requiresPremise: false
    });
    expect(rendered).toContain('storyspec interview 星尘驿站 --focus stage --premise "退休星舰导航员在宇宙边境开一间给迷路灵魂和破损飞船歇脚的驿站。"');
  });

  it('returns stable natural-language material entrypoints in next JSON results', async () => {
    const { projectRoot, fileSystem } = await createProject();
    await createStoryIdea({
      projectRoot,
      fileSystem,
      name: '素材入口',
      idea: '一个退休调查员收到旧案卷宗，里面夹着一张不会褪色的车票。'
    });

    const result = await getStoryNext({
      projectRoot,
      fileSystem,
      story: '素材入口'
    });

    expect(result.sourceMaterialEntrypoints.map(entry => entry.id)).toEqual([
      'longform-material',
      'short-idea',
      'table-material',
      'casual-chat'
    ]);
    expect(result.sourceMaterialEntrypoints).toEqual([
      expect.objectContaining({
        id: 'longform-material',
        action: 'ingest_longform_material',
        label: '我有长文资料',
        recommendedCommand: expect.stringContaining('storyspec interview 素材入口'),
        copyableCommand: expect.stringContaining('storyspec interview 素材入口'),
        inputGuidance: expect.stringContaining('500-3000 字')
      }),
      expect.objectContaining({
        id: 'short-idea',
        action: 'start_from_short_idea',
        label: '我只有一句灵感',
        inputGuidance: expect.stringContaining('20-200 字')
      }),
      expect.objectContaining({
        id: 'table-material',
        action: 'ingest_table_material',
        label: '我有表格资料',
        inputGuidance: expect.stringContaining('表格会保守作为候选')
      }),
      expect.objectContaining({
        id: 'casual-chat',
        action: 'start_casual_chat',
        label: '我想先随便聊聊',
        inputGuidance: expect.stringContaining('待澄清不是导入失败')
      })
    ]);
    expect(result.sourceMaterialEntrypoints.every(entry =>
      entry.description.length > 0
      && entry.recommendedCommand === entry.copyableCommand
    )).toBe(true);
    expect(result.sourceMaterialEntrypoints.map(entry => entry.inputGuidance).join('\n')).toContain('示例：');
  });

  it('renders next navigation as a concise default view with one primary command', async () => {
    const { projectRoot, fileSystem } = await createProject();
    await createStoryIdea({
      projectRoot,
      fileSystem,
      name: '编程施法',
      idea: '工科马列青年穿越剑与魔法世界，用编程施法展开轻松冒险。'
    });

    const result = await getStoryNext({
      projectRoot,
      fileSystem,
      story: '编程施法'
    });
    const rendered = renderStoryNext(result);

    expect(rendered).toContain('先选你手里的素材：');
    expect(rendered).toContain('我有长文资料');
    expect(rendered).toContain('首轮建议 500-3000 字');
    expect(rendered).toContain('我只有一句灵感');
    expect(rendered).toContain('20-200 字');
    expect(rendered).toContain('我有表格资料');
    expect(rendered).toContain('表格会保守作为候选');
    expect(rendered).toContain('我想先随便聊聊');
    expect(rendered).toContain('待澄清不是导入失败');
    expect(rendered).toContain('长文资料');
    expect(rendered).toContain('一句灵感');
    expect(rendered).toContain('表格资料');
    expect(rendered).toContain('随便聊聊');
    expect(rendered).toContain('可复制命令：');
    expect(rendered).toContain(result.actions[0].copyableCommand);
    expect(rendered).toContain('为什么：');
    expect(rendered).toContain('也可以从这里继续：');
    expect(rendered).toContain('storyspec next 编程施法 --verbose');
    expect(rendered).toContain('storyspec next 编程施法 --modes');
    expect(rendered.indexOf('先选你手里的素材：')).toBeLessThan(rendered.indexOf('可复制命令：'));
    expect(rendered.slice(
      rendered.indexOf('先选你手里的素材：'),
      rendered.indexOf('可复制命令：')
    )).not.toContain('storyspec ');
    expect(rendered.split('\n').length).toBeLessThanOrEqual(34);
    expect(rendered).not.toContain('今日创作模式');
    expect(rendered).not.toContain('最小快乐闭环');
    expect(rendered).not.toContain('有趣选择');
    expect(rendered).not.toContain('核心要素：');
    expect(rendered).not.toContain('结构问题：');
  });

  it('renders the full workbench only in verbose next navigation', async () => {
    const { projectRoot, fileSystem } = await createProject();
    await createStoryIdea({
      projectRoot,
      fileSystem,
      name: '编程施法',
      idea: '工科马列青年穿越剑与魔法世界，用编程施法展开轻松冒险。'
    });

    const result = await getStoryNext({
      projectRoot,
      fileSystem,
      story: '编程施法'
    });
    const rendered = renderStoryNext(result, { verbose: true });

    expect(rendered).toContain('今日创作模式');
    expect(rendered).toContain('最小快乐闭环');
    expect(rendered).toContain('你想从哪里继续？');
    expect(rendered).toContain('有趣选择');
    expect(rendered).toContain('核心要素：');
    expect(rendered).toContain('结构问题：');
    expect(rendered).toContain('storyspec interview 编程施法 --focus scene');
  });

  it('renders today modes as a separate low-burden next view', async () => {
    const { projectRoot, fileSystem } = await createProject();
    await createStoryIdea({
      projectRoot,
      fileSystem,
      name: programmingCastingFixture.story,
      idea: [
        programmingCastingFixture.idea,
        ...programmingCastingFixture.preferences,
        programmingCastingFixture.confirmed.threat,
        `编程施法偏${programmingCastingFixture.confirmed.magicStyle}`
      ].join('；')
    });

    const result = await getStoryNext({
      projectRoot,
      fileSystem,
      story: programmingCastingFixture.story
    });
    const rendered = renderStoryNext(result, { modes: true });

    expect(rendered).toContain('今日创作模式');
    expect(rendered).toContain('我只想随便聊聊');
    expect(rendered).toContain('最小快乐闭环');
    expect(rendered).toContain('不写入文件');
    expect(rendered).not.toContain('你想从哪里继续？');
    expect(rendered).not.toContain('核心要素：');
    expect(rendered).not.toContain('结构问题：');
  });

  it('keeps the programming-casting sample in co-creation before downstream planning', async () => {
    const { projectRoot, fileSystem } = await createProject();
    await createStoryIdea({
      projectRoot,
      fileSystem,
      name: programmingCastingFixture.story,
      idea: [
        programmingCastingFixture.idea,
        ...programmingCastingFixture.preferences,
        programmingCastingFixture.confirmed.threat,
        `编程施法偏${programmingCastingFixture.confirmed.magicStyle}`
      ].join('；')
    });

    const result = await getStoryNext({
      projectRoot,
      fileSystem,
      story: programmingCastingFixture.story
    });

    expect(result.stage).toBe('idea');
    expect(result.creativeGaps.join('\n')).toContain('核心伙伴');
    expect(result.creativeGaps.join('\n')).toContain('第一舞台');
    expect(result.coCreationEntrypoints.map(entry => entry.id)).toEqual(expect.arrayContaining([
      'protagonist',
      'stage',
      'power',
      'faction',
      'conflict'
    ]));
    expect(result.coCreationEntrypoints[0]).toEqual(expect.objectContaining({
      command: expect.stringContaining('storyspec interview 编程施法'),
      reason: expect.stringContaining('候选'),
      recommended: true
    }));
    expect(result.coCreationEntrypoints.slice(0, 3).map(entry => entry.id)).toEqual(expect.arrayContaining([
      'stage',
      'power'
    ]));
    expect(result.actions[0].command).toMatch(/^storyspec interview 编程施法 --focus (stage|power|faction) --premise /);
    expect(result.actions.map(action => action.command)).not.toContain('继续运行平台对应 plan 命令');
  });

  it('surfaces unconfirmed AI suggestions before moving downstream', async () => {
    const { projectRoot, fileSystem } = await createProject();
    const storyPath = path.join(projectRoot, 'stories', 'demo');
    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# demo');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'demo',
      premise: '异界穿越',
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      questions: [{
        id: 'threat.shape',
        stage: 'specify',
        topic: 'threat',
        question: '文明级威胁是什么？',
        whyItMatters: '影响长线结构。',
        type: 'textarea',
        required: true,
        options: [],
        exampleAnswers: ['旧文明运行时重启。', '群星协议崩塌。'],
        dependsOn: []
      }],
      answers: [{
        questionId: 'threat.shape',
        answer: '旧文明运行时重启',
        source: 'ai-suggested',
        confidence: 0.6,
        confirmed: false,
        createdAt: '2026-05-03T00:00:00.000Z',
        updatedAt: '2026-05-03T00:00:00.000Z'
      }]
    }, { spaces: 2 });

    const result = await getStoryNext({
      projectRoot,
      fileSystem,
      story: 'demo'
    });

    expect(result.pendingQuestions.join('\n')).toContain('AI 建议待确认');
    expect(result.actions[0].command).toBe('storyspec interview demo --premise "异界穿越"');
  });

  it('prioritizes partner, stage, and conflict co-creation when core elements are immature', async () => {
    const { projectRoot, fileSystem } = await createProject();
    const storyPath = path.join(projectRoot, 'stories', 'demo');
    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# demo');
    await fileSystem.writeFile(path.join(storyPath, 'clarifications.md'), '# demo clarifications');
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'demo',
      premise: '主角晏无是一名工科马列青年，穿越到剑与魔法世界；编程施法、文明级威胁。',
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      questions: [
        {
          id: 'protagonist.identity',
          stage: 'specify',
          topic: 'protagonist',
          question: '主角是谁？',
          whyItMatters: '影响主角视角。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
        {
          id: 'partner.core',
          stage: 'specify',
          topic: 'partner',
          question: '核心伙伴是谁？',
          whyItMatters: '影响关系张力。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
        {
          id: 'stage.first',
          stage: 'specify',
          topic: 'stage',
          question: '第一舞台在哪里？',
          whyItMatters: '影响世界规则的第一眼呈现。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
        {
          id: 'faction.conflict',
          stage: 'specify',
          topic: 'faction',
          question: '第一卷的势力冲突是什么？',
          whyItMatters: '影响行动压力。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        }
      ],
      answers: [
        {
          questionId: 'protagonist.identity',
          answer: '晏无是工科马列青年，穿越到剑与魔法世界。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const result = await getStoryNext({
      projectRoot,
      fileSystem,
      story: 'demo'
    });

    expect(result.stage).toBe('specified');
    expect(result.coreElements).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'partner', status: 'missing' }),
      expect.objectContaining({ id: 'stage', status: 'missing' }),
      expect.objectContaining({ id: 'factionConflict', status: 'missing' })
    ]));
    expect(result.coCreationEntrypoints.slice(0, 3).map(entry => entry.id)).toEqual([
      'partner',
      'stage',
      'faction'
    ]);
    expect(result.coCreationEntrypoints[0]).toEqual(expect.objectContaining({
      id: 'partner',
      recommended: true,
      recommendationReason: expect.stringContaining('核心伙伴')
    }));
    expect(result.actions[0]).toMatchObject({
      command: 'storyspec interview demo --focus partner --premise "主角晏无是一名工科马列青年，穿越到剑与魔法世界；编程施法、文明级威胁。"'
    });
    expect(result.actions[0].reason).toContain('核心伙伴');
    expect(result.actions.map(action => action.command)).not.toContain('继续运行平台对应 plan 命令');
  });

  it('guides planned stories to agent tasks and local writing preflight commands', async () => {
    const { projectRoot, fileSystem } = await createProject();
    const storyPath = path.join(projectRoot, 'stories', 'demo');
    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# demo');
    await fileSystem.writeFile(path.join(storyPath, 'clarifications.md'), '# clarifications');
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
    await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');

    const result = await getStoryNext({
      projectRoot,
      fileSystem,
      story: 'demo'
    });

    expect(result.stage).toBe('planned');
    expect(result.actions[0]).toMatchObject({
      command: '/storyspec-tasks',
      copyableCommand: '/storyspec-tasks',
      reason: expect.stringContaining('stories/demo/tasks.md')
    });
    expect(result.actions.map(action => action.command)).toContain('storyspec status');
    expect(result.actions.map(action => action.command)).toContain('storyspec tasks:board demo');
  });

  it('presents a multi-entry co-creation workbench instead of a linear-only next step', async () => {
    const { projectRoot, fileSystem } = await createProject();
    await createStoryIdea({
      projectRoot,
      fileSystem,
      name: '编程施法',
      idea: '工科马列青年穿越剑与魔法世界，用编程施法展开轻松冒险。'
    });

    const result = await getStoryNext({
      projectRoot,
      fileSystem,
      story: '编程施法'
    });

    expect(result.creationModes.map(mode => mode.id)).toEqual([
      'discover',
      'co-create',
      'plan',
      'write',
      'reflect'
    ]);
    expect(result.creationModes).toContainEqual(expect.objectContaining({
      id: 'discover',
      status: 'active'
    }));
    expect(result.coCreationEntrypoints.map(entry => entry.id)).toEqual(expect.arrayContaining([
      'protagonist',
      'partner',
      'world',
      'scene',
      'power',
      'ending',
      'branch'
    ]));
    expect(result.coCreationEntrypoints.every(entry =>
      entry.command.includes('--focus')
      && entry.whenToUse.length > 0
      && entry.openingQuestions.length > 0
      && entry.interestingChoices.length > 0
      && entry.candidateArtifacts.length > 0
      && entry.canonBoundary.includes('候选')
      && entry.nextRecommendations.length > 0
      && entry.maturityImpact.length > 0
    )).toBe(true);

    const rendered = renderStoryNext(result, { verbose: true });

    expect(rendered).toContain('你想从哪里继续？');
    expect(rendered).toContain('推荐入口');
    expect(rendered).toContain('开场问题');
    expect(rendered).toContain('有趣选择');
    expect(rendered).toContain('候选产物');
    expect(rendered).toContain('正典边界');
    expect(rendered).toContain('storyspec interview 编程施法 --focus scene');
  });

  it('offers low-burden today modes and a minimum fun loop before heavy planning', async () => {
    const { projectRoot, fileSystem } = await createProject();
    await createStoryIdea({
      projectRoot,
      fileSystem,
      name: programmingCastingFixture.story,
      idea: [
        programmingCastingFixture.idea,
        ...programmingCastingFixture.preferences,
        programmingCastingFixture.confirmed.threat,
        `编程施法偏${programmingCastingFixture.confirmed.magicStyle}`
      ].join('；')
    });

    const result = await getStoryNext({
      projectRoot,
      fileSystem,
      story: programmingCastingFixture.story
    });

    expect(result.todayCreationModes.map(mode => mode.id)).toEqual([
      'play-character',
      'write-scene',
      'organize-setting',
      'compare-branches',
      'free-chat'
    ]);
    expect(result.todayCreationModes.map(mode => mode.label)).toContain('我只想随便聊聊');

    for (const mode of result.todayCreationModes) {
      expect(mode.maxQuestions).toBeLessThanOrEqual(2);
      expect(mode.candidateLimit).toBe(2);
      expect(mode.writesFiles).toBe(false);
      expect(mode.command).toContain('--max-questions 2');
      expect(mode.command).toContain('--no-write');
      expect(mode.responseOptions).toEqual(['确认', '改写', '拒绝', '稍后']);
      expect(mode.canonBoundary).toContain('候选');
      expect(mode.outputContract).toContain('不写入文件');
      expect(mode.toneGuide).toContain('短');
    }

    expect(result.todayCreationModes.find(mode => mode.id === 'play-character')?.entrypointIds)
      .toEqual(expect.arrayContaining(['protagonist', 'partner']));
    expect(result.minimumFunLoop.steps).toEqual([
      '选择一个今日创作模式',
      '看 2 个有后果的候选',
      '确认、改写、拒绝或稍后',
      '得到一句创作回声',
      '核心要素不足时阻止完整 plan'
    ]);
    expect(result.minimumFunLoop.planGate).toContain('不生成完整 creative-plan');

    const rendered = renderStoryNext(result, { modes: true });

    expect(rendered).toContain('今日创作模式');
    expect(rendered).toContain('我只想随便聊聊');
    expect(rendered).toContain('最小快乐闭环');
    expect(rendered).toContain('不写入文件');
  });

  it('keeps co-creation entrypoints available after specification when core elements are still immature', async () => {
    const { projectRoot, fileSystem } = await createProject();
    const storyPath = path.join(projectRoot, 'stories', 'demo');
    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# demo');
    await fileSystem.writeFile(path.join(storyPath, 'clarifications.md'), '# demo clarifications');
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'demo',
      premise: '主角晏无是一名工科马列青年，穿越到剑与魔法世界；编程施法、文明级威胁。',
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      questions: [{
        id: 'protagonist.identity',
        stage: 'specify',
        topic: 'protagonist',
        question: '主角是谁？',
        whyItMatters: '影响主角视角。',
        type: 'textarea',
        required: true,
        options: [],
        exampleAnswers: [],
        dependsOn: []
      }],
      answers: [{
        questionId: 'protagonist.identity',
        answer: '晏无是工科马列青年，穿越到剑与魔法世界。',
        source: 'user-explicit',
        confidence: 1,
        confirmed: true,
        createdAt: '2026-05-03T00:00:00.000Z',
        updatedAt: '2026-05-03T00:00:00.000Z'
      }]
    }, { spaces: 2 });

    const result = await getStoryNext({
      projectRoot,
      fileSystem,
      story: 'demo'
    });

    expect(result.stage).toBe('specified');
    expect(result.creationModes).toContainEqual(expect.objectContaining({
      id: 'co-create',
      status: 'active'
    }));
    expect(result.coCreationEntrypoints.map(entry => entry.id)).toEqual(expect.arrayContaining([
      'partner',
      'world',
      'conflict',
      'scene'
    ]));
    expect(result.coCreationEntrypoints.find(entry => entry.id === 'partner')?.command)
      .toBe('storyspec interview demo --focus partner --premise "主角晏无是一名工科马列青年，穿越到剑与魔法世界；编程施法、文明级威胁。"');
  });

  it('surfaces active what-if branches in next navigation', async () => {
    const { projectRoot, fileSystem } = await createProject();
    const storyPath = path.join(projectRoot, 'stories', 'demo');
    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# demo');
    await fileSystem.writeJson(path.join(storyPath, 'branches', '提前揭示身份', 'branch.json'), {
      id: '提前揭示身份',
      base: 'main',
      title: '提前揭示身份',
      premise: '主角提前暴露身份，换取学院临时信任。',
      changedScenes: ['scene-001'],
      changedCanonFacts: ['canon.identity'],
      impactSummary: '分支将影响 1 个 scene、1 个 canon fact，promote 前必须人工确认影响清单。',
      status: 'exploring',
      createdAt: '2026-05-04T00:00:00.000Z'
    }, { spaces: 2 });

    const result = await getStoryNext({
      projectRoot,
      fileSystem,
      story: 'demo'
    });
    const rendered = renderStoryNext(result, { verbose: true });

    expect(result.activeBranches).toEqual([
      expect.objectContaining({
        id: '提前揭示身份',
        status: 'exploring',
        compareCommand: 'storyspec branch:compare 提前揭示身份'
      })
    ]);
    expect(result.actions.map(action => action.command)).toContain('storyspec branch:compare 提前揭示身份');
    expect(rendered).toContain('活跃 what-if 分支');
    expect(rendered).toContain('提前揭示身份：exploring');
    expect(rendered).toContain('storyspec branch:compare 提前揭示身份');
  });

  it('returns deferred questions to the front of next navigation with decision-log context', async () => {
    const { projectRoot, fileSystem } = await createProject();
    const storyPath = path.join(projectRoot, 'stories', 'demo');
    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# demo');
    await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'demo',
      premise: '异界穿越、编程施法、慢热感情',
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      questions: [
        {
          id: 'partner.core',
          stage: 'specify',
          topic: 'partner',
          question: '核心伙伴是谁？',
          whyItMatters: '影响关系张力和第一卷行动压力。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        }
      ],
      answers: [
        {
          questionId: 'partner.core',
          answer: '稍后决定',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const result = await getStoryNext({
      projectRoot,
      fileSystem,
      story: 'demo'
    });
    const rendered = renderStoryNext(result, { verbose: true });

    expect(result.decisionLog.deferredItems).toEqual([
      expect.objectContaining({
        questionId: 'partner.core',
        topic: 'partner',
        trigger: expect.stringContaining('进入 plan')
      })
    ]);
    expect(result.actions[0]).toMatchObject({
      command: 'storyspec interview demo --focus partner --premise "异界穿越、编程施法、慢热感情"'
    });
    expect(rendered).toContain('未决项回流：');
    expect(rendered).toContain('partner.core：核心伙伴是谁？');
    expect(rendered).toContain('当初选择：稍后决定');
    expect(rendered).toContain('回流条件：进入 plan');
  });
});
