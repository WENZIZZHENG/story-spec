import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createClarificationRecord,
  listClarificationRecords,
  renderClarificationMarkdown,
  renderClarificationSummary
} from '../../src/application/manage-clarifications.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-clarifications');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', '001-demo');

  await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), '# tasks');

  return { projectRoot, fileSystem, storyPath };
};

describe('manage clarifications', () => {
  it('creates clarification records without modifying specification', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();

    const result = await createClarificationRecord({
      projectRoot,
      fileSystem,
      story: '001-demo',
      premise: '异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁',
      confirmed: [
        {
          questionId: 'core.premise',
          answer: '编程施法是工具，开局先写轻松冒险。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true
        }
      ],
      suggestions: [
        {
          questionId: 'threat.shape',
          answer: '旧文明运行时重启',
          source: 'ai-suggested',
          confidence: 0.62,
          confirmed: false
        }
      ],
      selectedQuestions: [
        {
          id: 'threat.first-symptom',
          stage: 'specify',
          topic: 'threat',
          question: '文明级威胁最早以什么小异常出现？',
          whyItMatters: '保护轻松冒险的开局。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: ['旧日志偶尔出现。', '边境工具同步故障。'],
          dependsOn: []
        }
      ],
      now: () => new Date('2026-05-03T12:00:00.000Z')
    });

    expect(result.record).toMatchObject({
      schemaVersion: '1.0',
      story: '001-demo',
      premise: '异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁',
      createdAt: '2026-05-03T12:00:00.000Z'
    });
    expect(result.record.answers).toEqual(expect.arrayContaining([
      expect.objectContaining({ questionId: 'core.premise', source: 'user-explicit', confirmed: true }),
      expect.objectContaining({ questionId: 'threat.shape', source: 'ai-suggested', confirmed: false })
    ]));
    expect(result.jsonPath).toBe(path.join(storyPath, 'clarifications.json'));
    expect(result.markdownPath).toBe(path.join(storyPath, 'clarifications.md'));
    await expect(fileSystem.readFile(path.join(storyPath, 'specification.md'))).resolves.toBe('# spec');
    await expect(fileSystem.readJson(result.jsonPath)).resolves.toMatchObject({
      story: '001-demo',
      answers: expect.any(Array)
    });
    await expect(fileSystem.readFile(result.markdownPath)).resolves.toContain('## 需要澄清');
  });

  it('lists clarification records from a story', async () => {
    const { projectRoot, fileSystem } = await createProject();
    await createClarificationRecord({
      projectRoot,
      fileSystem,
      story: '001-demo',
      premise: '异界穿越',
      selectedQuestions: [],
      now: () => new Date('2026-05-03T12:00:00.000Z')
    });

    const result = await listClarificationRecords({ projectRoot, fileSystem, story: '001-demo' });

    expect(result.record?.premise).toBe('异界穿越');
    expect(result.jsonPath).toContain('clarifications.json');
  });

  it('renders summary sections for creative interviews', () => {
    const markdown = renderClarificationSummary({
      explicit: ['题材：异界穿越、编程施法'],
      pending: ['主角身份', '文明级威胁的小异常'],
      examples: ['主角是后端程序员。', '威胁先表现为旧日志。']
    });

    expect(markdown).toContain('## 用户已明确');
    expect(markdown).toContain('## 需要澄清');
    expect(markdown).toContain('## 可复制示例');
    expect(markdown).toContain('## 下一步建议');
    expect(markdown).toContain('生成 Level 1/2/3 规格');
  });

  it('renders example branches in summary output', () => {
    const markdown = renderClarificationSummary({
      explicit: ['题材：异界穿越、编程施法'],
      pending: ['主角身份'],
      examples: ['主角是后端程序员。'],
      exampleBranches: [
        {
          label: '作者主导：继续提问',
          tone: '保留创作空间',
          assumptions: ['先不决定主角身份。'],
          sampleAnswer: '我先不定主角，请继续问我 3 个关键问题。',
          tradeoffs: ['推进较慢，但不会让 AI 替作者定稿。']
        }
      ]
    });

    expect(markdown).toContain('### ExampleBranch：作者主导：继续提问');
    expect(markdown).toContain('confirmed: false');
  });

  it('renders markdown with unconfirmed AI suggestions separated from user answers', () => {
    const markdown = renderClarificationMarkdown({
      schemaVersion: '1.0',
      story: 'demo',
      premise: '异界穿越',
      createdAt: '2026-05-03T12:00:00.000Z',
      updatedAt: '2026-05-03T12:00:00.000Z',
      questions: [],
      answers: [
        {
          questionId: 'core.premise',
          answer: '编程施法是工具',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T12:00:00.000Z',
          updatedAt: '2026-05-03T12:00:00.000Z'
        },
        {
          questionId: 'threat.shape',
          answer: '旧文明运行时重启',
          source: 'ai-suggested',
          confidence: 0.62,
          confirmed: false,
          createdAt: '2026-05-03T12:00:00.000Z',
          updatedAt: '2026-05-03T12:00:00.000Z'
        }
      ]
    });

    expect(markdown).toContain('## 用户已明确');
    expect(markdown).toContain('## AI 建议，待确认');
    expect(markdown).toContain('threat.shape');
  });

  it('renders deferred answers as a decision log instead of losing them in pending questions', () => {
    const markdown = renderClarificationMarkdown({
      schemaVersion: '1.0',
      story: 'demo',
      premise: '异界穿越',
      createdAt: '2026-05-03T12:00:00.000Z',
      updatedAt: '2026-05-03T12:00:00.000Z',
      questions: [{
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
      }],
      answers: [{
        questionId: 'partner.core',
        answer: '稍后决定',
        source: 'user-explicit',
        confidence: 1,
        confirmed: true,
        createdAt: '2026-05-03T12:00:00.000Z',
        updatedAt: '2026-05-03T12:00:00.000Z'
      }]
    });

    expect(markdown).toContain('## 未决项回流与决策日志');
    expect(markdown).toContain('partner.core：核心伙伴是谁？');
    expect(markdown).toContain('当初选择：稍后决定');
    expect(markdown).toContain('回流条件');
  });

  it('renders high-impact interesting choice dimensions in clarification markdown', () => {
    const markdown = renderClarificationMarkdown({
      schemaVersion: '1.0',
      story: 'demo',
      premise: '编程施法',
      createdAt: '2026-05-03T12:00:00.000Z',
      updatedAt: '2026-05-03T12:00:00.000Z',
      questions: [{
        id: 'magic.rule-hardness',
        stage: 'specify',
        topic: 'magic-system',
        question: '编程施法更偏硬规则还是轻量隐喻？',
        whyItMatters: '影响能力爽点和世界规则。',
        type: 'single-choice',
        required: true,
        choiceImpact: 'high',
        options: [],
        exampleAnswers: ['轻量隐喻。', '硬规则。'],
        exampleBranches: [{
          label: '轻量隐喻',
          answer: '编程施法偏轻量隐喻。',
          flavor: '轻松。',
          tradeoffs: ['技术辨识度会弱一些。'],
          downstreamImpact: '能力边界要靠失败代价呈现。',
          recommendedFor: ['轻松冒险'],
          interestingChoice: {
            appeal: '轻松顺滑。',
            cost: '技术辨识度会弱一些。',
            relationshipImpact: '伙伴更容易参与判断。',
            worldImpact: '能力边界靠失败代价呈现。',
            futureHook: '下一轮确认失败代价。',
            confirmationBoundary: '候选，确认后才写入规格。'
          }
        }],
        dependsOn: []
      }],
      answers: []
    });

    expect(markdown).toContain('## 示例分叉');
    expect(markdown).toContain('吸引力：轻松顺滑。');
    expect(markdown).toContain('代价：技术辨识度会弱一些。');
    expect(markdown).toContain('关系影响：伙伴更容易参与判断。');
    expect(markdown).toContain('世界影响：能力边界靠失败代价呈现。');
    expect(markdown).toContain('后续钩子：下一轮确认失败代价。');
    expect(markdown).toContain('确认边界：候选，确认后才写入规格。');
  });

  it('renders faction power structures in clarification markdown', () => {
    const markdown = renderClarificationMarkdown({
      schemaVersion: '1.0',
      story: 'demo',
      premise: '编程施法',
      createdAt: '2026-05-03T12:00:00.000Z',
      updatedAt: '2026-05-03T12:00:00.000Z',
      questions: [{
        id: 'core.faction-conflict',
        stage: 'specify',
        topic: 'faction',
        question: '第一卷最先撞上的势力或冲突是什么？',
        whyItMatters: '势力需要有利益逻辑。',
        type: 'textarea',
        required: false,
        choiceImpact: 'high',
        options: [],
        exampleAnswers: ['学院垄断许可。'],
        exampleBranches: [{
          label: '学院许可',
          answer: '学院垄断咒文许可。',
          flavor: '知识垄断和规则学习同台出现。',
          tradeoffs: ['需要写出学院合理性。'],
          downstreamImpact: '成功路线会围绕突破许可推进。',
          recommendedFor: ['学院工坊'],
          interestingChoice: {
            appeal: '制度阻力清楚。',
            cost: '容易偏制度讨论。',
            relationshipImpact: '伙伴可能来自学院内部。',
            worldImpact: '许可制度影响普通施法者。',
            futureHook: '下一轮确认第一次越权救人。',
            confirmationBoundary: '候选，确认后才进入 World Bible。'
          },
          powerStructure: {
            name: '艾尔学院',
            resourceControl: '咒文许可、考试资格和导师署名。',
            legitimacySource: '维护施法安全和旧灾难禁令。',
            beneficiaries: ['学院导师', '持证贵族'],
            victims: ['工坊学徒', '无证民间术士'],
            publicNarrative: '只有认证者才能保护普通人。',
            internalCracks: ['年轻讲师同情工坊', '边境分院缺资源'],
            firstCollisionScene: '晏无越权修复民生法器，被要求提交许可。',
            relationshipHooks: ['伙伴来自学院内部，担心他害自己背违纪风险。']
          }
        }],
        dependsOn: []
      }],
      answers: []
    });

    expect(markdown).toContain('权力结构：艾尔学院');
    expect(markdown).toContain('资源控制：咒文许可、考试资格和导师署名。');
    expect(markdown).toContain('合法性来源：维护施法安全和旧灾难禁令。');
    expect(markdown).toContain('获利者：学院导师；持证贵族');
    expect(markdown).toContain('受损者：工坊学徒；无证民间术士');
    expect(markdown).toContain('第一碰撞场景：晏无越权修复民生法器，被要求提交许可。');
    expect(markdown).toContain('关系钩子：伙伴来自学院内部，担心他害自己背违纪风险。');
  });
});
