import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getProjectStatus,
  renderProjectStatus
} from '../../src/application/get-project-status.js';
import { commandGitAdapter } from '../../src/infrastructure/command-git-adapter.js';
import { nodeFileSystem } from '../../src/infrastructure/node-file-system.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const tempDirs: string[] = [];

const makeTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'novel-project-status-'));
  tempDirs.push(dir);
  return dir;
};

const createProjectFixture = async () => {
  const projectRoot = await makeTempDir();

  await mkdir(path.join(projectRoot, '.specify'), { recursive: true });
  await writeFile(path.join(projectRoot, '.specify', 'config.json'), JSON.stringify({
    name: 'status-demo',
    version: '0.8.0',
    method: 'three-act'
  }, null, 2));

  await mkdir(path.join(projectRoot, '.codex', 'prompts'), { recursive: true });
  await writeFile(path.join(projectRoot, 'AGENTS.md'), '# Agents');

  await mkdir(path.join(projectRoot, 'spec', 'tracking'), { recursive: true });
  await writeFile(path.join(projectRoot, 'spec', 'tracking', 'plot.json'), '{"valid":true}');
  await writeFile(path.join(projectRoot, 'spec', 'tracking', 'broken.json'), '{broken');

  const storyPath = path.join(projectRoot, 'stories', '001-demo');
  await mkdir(path.join(storyPath, 'content'), { recursive: true });
  await writeFile(path.join(storyPath, 'specification.md'), '- **版本**：v1');
  await writeFile(path.join(storyPath, 'creative-plan.md'), '版本: plan-v1');
  await writeFile(path.join(storyPath, 'clarifications.json'), JSON.stringify({
    schemaVersion: '1.0',
    story: '001-demo',
    premise: '异界穿越',
    createdAt: '2026-05-03T00:00:00.000Z',
    updatedAt: '2026-05-03T00:00:00.000Z',
    questions: [
      {
        id: 'core.protagonist',
        stage: 'specify',
        topic: 'protagonist',
        question: '主角是谁？',
        whyItMatters: '决定开局视角。',
        type: 'textarea',
        required: true,
        options: [],
        exampleAnswers: [],
        dependsOn: []
      },
      {
        id: 'romance.boundary',
        stage: 'specify',
        topic: 'romance',
        question: '感情线慢热边界是什么？',
        whyItMatters: '避免过早定关系。',
        type: 'textarea',
        required: true,
        options: [],
        exampleAnswers: [],
        dependsOn: []
      }
    ],
    answers: [
      {
        questionId: 'core.protagonist',
        answer: '后端程序员',
        source: 'user-explicit',
        confidence: 1,
        confirmed: true,
        createdAt: '2026-05-03T00:00:00.000Z',
        updatedAt: '2026-05-03T00:00:00.000Z'
      },
      {
        questionId: 'romance.boundary',
        answer: '第一卷只到互相信任',
        source: 'ai-suggested',
        confidence: 0.6,
        confirmed: false,
        createdAt: '2026-05-03T00:00:00.000Z',
        updatedAt: '2026-05-03T00:00:00.000Z'
      }
    ]
  }, null, 2));
  await writeFile(path.join(storyPath, 'tasks.md'), `- [ ] [P0] **T001** - 起草第一章
  - **依赖**：无
  - **输出**：\`content/chapter-02.md\`
`);
  await writeFile(path.join(storyPath, 'content', 'chapter-01.md'), '# 第一章\n\n一段正文。');

  return projectRoot;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('getProjectStatus', () => {
  it('summarizes project, codex handoff files, story progress, tracking, and next actions', async () => {
    const projectRoot = await createProjectFixture();

    const status = await getProjectStatus({
      projectRoot,
      fileSystem: nodeFileSystem,
      git: commandGitAdapter
    });

    expect(status).toMatchObject({
      projectRoot,
      projectName: 'status-demo',
      version: '0.8.0',
      method: 'three-act',
      configuredAI: ['codex'],
      handoff: {
        codexPrompts: true,
        agentsFile: true
      },
      codex: {
        prompts: true,
        agentsFile: true
      },
      story: {
        name: '001-demo',
        hasSpecification: true,
        hasCreativePlan: true,
        hasTasks: true,
        specificationVersion: 'v1',
        creativePlanVersion: 'plan-v1',
        nextTask: 'T001 - 起草第一章',
        chapterFiles: 1,
        contentFiles: 1,
        creativeControl: {
          confirmedDecisions: 1,
          pendingDecisions: 1,
          unconfirmedAiSuggestions: 1
        }
      }
    });
    expect(status.tracking).toContainEqual({ file: 'plot.json', valid: true });
    expect(status.tracking.find(item => item.file === 'broken.json')).toMatchObject({
      valid: false
    });
    expect(status.blockers).toContainEqual({
      severity: 'warning',
      code: 'MISSING_TASK_OUTPUT',
      message: '任务 T001 的输出文件不存在: content/chapter-02.md',
      path: path.join(projectRoot, 'stories', '001-demo', 'content', 'chapter-02.md')
    });
    expect(status.nextActions).toContain('先确认 1 个创作决策，再进入下一轮写入');
    expect(status.story?.creativeControl.cannotFinalize).toContain('未确认：感情线慢热边界是什么？');
    expect(status.story?.creativeControl.cannotFinalize).toContain('AI 建议待确认：romance.boundary');
  });

  it('renders the common status model for CLI output', async () => {
    const projectRoot = await createProjectFixture();
    const status = await getProjectStatus({
      projectRoot,
      fileSystem: nodeFileSystem,
      git: commandGitAdapter
    });

    const output = renderProjectStatus(status);

    expect(output).toContain('StorySpec 项目状态');
    expect(output).toContain('项目：status-demo');
    expect(output).toContain('当前故事：001-demo');
    expect(output).toContain('创作空间：');
    expect(output).toContain('AI 建议未确认：1');
    expect(output).toContain('追踪 JSON：存在错误');
    expect(output).toContain('阻塞原因：');
    expect(output).toContain('MISSING_TASK_OUTPUT');
    expect(output).toContain('建议下一步：');
  });

  it('can run against an in-memory project store', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-project');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.ensureDir(path.join(projectRoot, '.specify'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'memory-demo',
      version: '1.0.0'
    });
    await fileSystem.ensureDir(path.join(projectRoot, '.codex', 'prompts'));

    const status = await getProjectStatus({
      projectRoot,
      fileSystem,
      git: {
        init: async () => undefined,
        addAll: async () => undefined,
        commit: async () => undefined,
        statusShort: async () => ['M stories/demo/tasks.md']
      }
    });

    expect(status.projectName).toBe('memory-demo');
    expect(status.codex.prompts).toBe(true);
    expect(status.handoff.codexPrompts).toBe(true);
    expect(status.git).toMatchObject({
      available: true,
      dirty: true,
      changedFiles: 1
    });
    expect(status.nextActions).toContain('补充 `AGENTS.md`，让 Codex 明确只读/规划/写作边界');
  });

  it('treats idea-only stories as valid early creative states', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-idea-status');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', 'idea-demo');

    await fileSystem.ensureDir(path.join(projectRoot, '.specify'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'idea-status',
      version: '1.0.0'
    });
    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# 一句话灵感');

    const status = await getProjectStatus({
      projectRoot,
      fileSystem,
      git: {
        init: async () => undefined,
        addAll: async () => undefined,
        commit: async () => undefined,
        statusShort: async () => []
      }
    });

    expect(status.story).toMatchObject({
      name: 'idea-demo',
      stage: 'idea',
      hasIdea: true,
      hasSpecification: false,
      hasCreativePlan: false,
      hasTasks: false
    });
    expect(status.story?.creativeGaps).toContain('主角欲望、核心伙伴、第一舞台和第一卷冲突仍未确认');
    expect(status.nextActions).toContain('继续创作访谈：运行 `storyspec next idea-demo` 查看推荐入口');
    expect(status.nextActions).toContain('或直接运行 `storyspec interview idea-demo --premise "<一句话创意>"` 补齐第一版 StorySpec');
    expect(status.nextActions).not.toContain('先补齐 `stories/*/specification.md`');

    const output = renderProjectStatus(status);
    expect(output).toContain('创作阶段：idea');
    expect(output).toContain('还需要补齐：');
    expect(output).toContain('主角欲望、核心伙伴、第一舞台和第一卷冲突仍未确认');
  });

  it('guides empty projects to save an idea instead of starting from slash specify', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-empty-status');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await fileSystem.ensureDir(path.join(projectRoot, '.specify'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'empty-status',
      version: '1.0.0'
    });

    const status = await getProjectStatus({
      projectRoot,
      fileSystem,
      git: {
        init: async () => undefined,
        addAll: async () => undefined,
        commit: async () => undefined,
        statusShort: async () => []
      }
    });
    const output = renderProjectStatus(status);

    expect(status.story).toBeNull();
    expect(status.nextActions).toContain('先保存一句灵感：`storyspec story:new <故事名> --idea "<一句话创意>"`');
    expect(status.nextActions).toContain('然后运行 `storyspec next <故事名>` 选择角色、场景、设定或分支入口');
    expect(output).toContain('当前故事：尚未创建故事');
    expect(output).not.toContain('/specify');
  });

  it('shows what the current story has grown into instead of only file state', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-status-echo');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', '编程施法');

    await fileSystem.ensureDir(path.join(projectRoot, '.specify'));
    await fileSystem.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: 'status-echo',
      version: '1.0.0'
    });
    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# 编程施法');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: '编程施法',
      premise: '主角晏无穿越到剑与魔法世界，用编程施法处理第三次寂静前兆。',
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      questions: [
        {
          id: 'core.protagonist',
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
          id: 'magic.rule-hardness',
          stage: 'specify',
          topic: 'magic-system',
          question: '编程施法边界是什么？',
          whyItMatters: '影响能力边界。',
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
        }
      ],
      answers: [
        {
          questionId: 'core.protagonist',
          answer: '晏无是工科马列青年，穿越后会用工程思维处理法术事故。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        },
        {
          questionId: 'magic.rule-hardness',
          answer: '编程施法偏轻量隐喻，不能凭空创造资源。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const status = await getProjectStatus({
      projectRoot,
      fileSystem,
      git: {
        init: async () => undefined,
        addAll: async () => undefined,
        commit: async () => undefined,
        statusShort: async () => []
      }
    });
    const output = renderProjectStatus(status);

    expect(status.story?.creationEcho).toMatchObject({
      flavor: expect.stringContaining('编程施法'),
      strongestParts: expect.arrayContaining([
        expect.stringContaining('能力风味')
      ]),
      missingPieces: expect.arrayContaining([
        expect.stringContaining('核心伙伴')
      ])
    });
    expect(output).toContain('当前故事长成了什么：');
    expect(output).toContain('当前风味：');
    expect(output).toContain('成熟度：');
    expect(output).toContain('已长出的关键部件：');
    expect(output).toContain('还差的关键部件：');
  });
});
