import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyPreview,
  createPlanPreview,
  createSpecifyPreview,
  PreviewApplyError
} from '../../src/application/preview-apply.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async (answer = '编程施法只是工具，开局仍然是轻松冒险。') => {
  const projectRoot = path.join(os.tmpdir(), `memory-novel-preview-${answer.length}`);
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', 'demo');

  await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# demo');
  await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
    schemaVersion: '1.0',
    story: 'demo',
    premise: '异界穿越、编程施法',
    createdAt: '2026-05-03T00:00:00.000Z',
    updatedAt: '2026-05-03T00:00:00.000Z',
    questions: [{
      id: 'core.premise',
      stage: 'specify',
      topic: 'premise',
      question: '故事最想保留什么？',
      whyItMatters: '决定创作核心。',
      type: 'textarea',
      required: true,
      options: [],
      exampleAnswers: ['轻松冒险。', '文明谜团。'],
      dependsOn: []
    }],
    answers: [{
      questionId: 'core.premise',
      answer,
      source: 'user-explicit',
      confidence: 1,
      confirmed: true,
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z'
    }]
  }, { spaces: 2 });

  return { projectRoot, fileSystem, storyPath };
};

describe('preview apply', () => {
  it('creates a specification preview without touching specification.md', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# old spec');

    const preview = await createSpecifyPreview({
      projectRoot,
      fileSystem,
      story: 'demo',
      now: () => new Date('2026-05-03T12:00:00.000Z')
    });

    expect(preview.record.risks).toEqual([]);
    await expect(fileSystem.readFile(path.join(storyPath, 'specification.md'))).resolves.toBe('# old spec');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('# demo StorySpec v0');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('## 用户已确认');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('## 类型与阅读承诺');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('## 主角与成长线');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('## 核心伙伴');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('## 第一卷冲突');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('## 世界观');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('## 文风与不写边界');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('## 下一步入口');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('[作者已确认]');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('[agent 建议]');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('[待确认]');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.not.toContain('本文件由 preview 生成');
  });

  it('renders a write summary in preview records and reports', async () => {
    const { projectRoot, fileSystem } = await createProject();

    const preview = await createSpecifyPreview({
      projectRoot,
      fileSystem,
      story: 'demo',
      now: () => new Date('2026-05-03T12:00:00.000Z')
    });

    expect(preview.record.writeSummary).toMatchObject({
      confirmedItems: expect.arrayContaining([
        expect.objectContaining({
          questionId: 'core.premise',
          source: 'user-explicit',
          sourceLabel: '作者确认'
        })
      ]),
      agentSuggestions: expect.arrayContaining([
        expect.objectContaining({
          label: expect.any(String),
          sourceLabel: 'AI 候选'
        })
      ]),
      pendingItems: expect.any(Array)
    });
    await expect(fileSystem.readFile(preview.markdownPath)).resolves.toContain('## 写入摘要');
    await expect(fileSystem.readFile(preview.markdownPath)).resolves.toContain('### 作者确认项');
    await expect(fileSystem.readFile(preview.markdownPath)).resolves.toContain('core.premise [作者确认]');
    await expect(fileSystem.readFile(preview.markdownPath)).resolves.toContain('### Agent 建议');
    await expect(fileSystem.readFile(preview.markdownPath)).resolves.toContain('[AI 候选]');
    await expect(fileSystem.readFile(preview.markdownPath)).resolves.toContain('### 待确认项');
  });

  it('keeps full confirmed answers in the specification bible structure', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-preview-full-spec');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', '法术程序师');
    const longProtagonist = '晏无开朗务实，遇事先拆问题，再找主要矛盾。他尊重人，行动力强，擅长把复杂问题拆成可执行步骤；缺点是感情迟钝，容易把亲密关系也当成需要调试的问题，所以亲密关系调试盲区必须完整保留在规格里。';

    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# 法术程序师');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: '法术程序师',
      premise: '工科马列青年晏无穿越到剑与魔法的世界。',
      createdAt: '2026-05-04T00:00:00.000Z',
      updatedAt: '2026-05-04T00:00:00.000Z',
      questions: [
        {
          id: 'core.protagonist',
          stage: 'specify',
          topic: 'protagonist',
          question: '主角是谁？',
          whyItMatters: '影响主角成长线。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: ['晏无。', '工科青年。'],
          dependsOn: []
        },
        {
          id: 'core.partner',
          stage: 'specify',
          topic: 'partner',
          question: '核心伙伴是谁？',
          whyItMatters: '影响团队张力。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: ['莉莉丝。', '瑟琳娜。'],
          dependsOn: []
        },
        {
          id: 'core.stage',
          stage: 'specify',
          topic: 'stage',
          question: '第一舞台在哪里？',
          whyItMatters: '影响世界规则。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: ['学院。', '边境。'],
          dependsOn: []
        },
        {
          id: 'magic.rule-hardness',
          stage: 'specify',
          topic: 'magic-system',
          question: '能力体系是什么？',
          whyItMatters: '影响能力边界。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: ['中度偏硬。', '轻量隐喻。'],
          dependsOn: []
        },
        {
          id: 'core.faction-conflict',
          stage: 'specify',
          topic: 'faction',
          question: '势力冲突是什么？',
          whyItMatters: '影响第一卷压力。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: ['学院垄断。', '贵族系统。'],
          dependsOn: []
        },
        {
          id: 'core.scope',
          stage: 'specify',
          topic: 'scope',
          question: '哪些不能定稿？',
          whyItMatters: '保护作者控制权。',
          type: 'textarea',
          required: false,
          options: [],
          exampleAnswers: ['最终反派。', '感情归属。'],
          dependsOn: []
        }
      ],
      answers: [
        {
          questionId: 'core.protagonist',
          answer: longProtagonist,
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z'
        },
        {
          questionId: 'core.partner',
          answer: '莉莉丝重新拥有名字和选择，瑟琳娜追寻真正正义，塞拉斯蒂娅从书斋学者变成实践者。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z'
        },
        {
          questionId: 'core.stage',
          answer: '魔导边境学院垄断知识解释权，普通学生、底层工作人员、老学者和制度执行者都在其中承受不同代价。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z'
        },
        {
          questionId: 'magic.rule-hardness',
          answer: '中度偏硬规则，关键事故讲清魔力流向、符文连接、术式断点、材料限制、精神力消耗和错误后果。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z'
        },
        {
          questionId: 'core.faction-conflict',
          answer: '学院高层和贵族系统垄断知识解释权，资源、许可、考试和审查共同构成第一卷的制度阻力。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z'
        },
        {
          questionId: 'core.scope',
          answer: '第一阶段不能定稿最终反派、长线文明威胁真相、感情线归属和莉莉丝身份背后的完整阴谋。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const preview = await createSpecifyPreview({
      projectRoot,
      fileSystem,
      story: '法术程序师',
      now: () => new Date('2026-05-04T12:00:00.000Z')
    });
    const content = await fileSystem.readFile(preview.contentPath);

    expect(content).toContain('## 类型与阅读承诺');
    expect(content).toContain('## 世界观');
    expect(content).toContain('## 社会结构矛盾');
    expect(content).toContain('## 能力体系');
    expect(content).toContain('## 主角与成长线');
    expect(content).toContain('## 核心伙伴');
    expect(content).toContain('## 第一舞台');
    expect(content).toContain('## 第一卷冲突');
    expect(content).toContain('## 长线伏笔');
    expect(content).toContain('## 创作边界');
    expect(content).toContain('## 待确认');
    expect(content).toContain(longProtagonist);
    expect(content).toContain('亲密关系调试盲区必须完整保留在规格里');
    expect(content).toContain('不能定稿最终反派');
  });

  it('applies a preview only after explicit confirmation', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();
    const preview = await createSpecifyPreview({
      projectRoot,
      fileSystem,
      story: 'demo',
      now: () => new Date('2026-05-03T12:00:00.000Z')
    });

    const dryRun = await applyPreview({
      projectRoot,
      fileSystem,
      previewId: preview.record.id,
      now: () => new Date('2026-05-03T12:01:00.000Z')
    });

    expect(dryRun.dryRun).toBe(true);
    await expect(fileSystem.pathExists(path.join(storyPath, 'specification.md'))).resolves.toBe(false);

    const applied = await applyPreview({
      projectRoot,
      fileSystem,
      previewId: preview.record.id,
      yes: true,
      now: () => new Date('2026-05-03T12:02:00.000Z')
    });

    expect(applied.applied).toBe(true);
    await expect(fileSystem.readFile(path.join(storyPath, 'specification.md'))).resolves.toContain('# demo StorySpec v0');
    await expect(fileSystem.readFile(path.join(storyPath, 'specification.md'))).resolves.not.toContain('本文件由 preview 生成');
  });

  it('keeps unconfirmed longform, table, and AI suggestions out of confirmed specification writes', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-preview-unconfirmed-candidates');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', 'demo');
    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# demo');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'demo',
      premise: '异界穿越、编程施法',
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      questions: [
        {
          id: 'core.premise',
          stage: 'specify',
          topic: 'premise',
          question: '故事最想保留什么？',
          whyItMatters: '决定创作核心。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: ['轻松冒险。'],
          dependsOn: []
        },
        {
          id: 'core.protagonist',
          stage: 'specify',
          topic: 'protagonist',
          question: '主角是谁？',
          whyItMatters: '决定人物弧线。',
          type: 'textarea',
          required: false,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        }
      ],
      answers: [
        {
          questionId: 'core.premise',
          answer: '开局是轻松冒险，编程施法只是解决问题的工具。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        },
        {
          questionId: 'core.protagonist',
          answer: '长文候选：晏无已经能直接重构王国制度。',
          source: 'user-longform',
          confidence: 0.55,
          confirmed: false,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        },
        {
          questionId: 'core.protagonist',
          answer: '表格候选：莉莉丝第一章就成为最终伴侣。',
          source: 'user-table',
          confidence: 0.55,
          confirmed: false,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        },
        {
          questionId: 'core.protagonist',
          answer: 'AI 候选：瑟琳娜应当立刻继承王位。',
          source: 'ai-suggested',
          confidence: 0.4,
          confirmed: false,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const preview = await createSpecifyPreview({
      projectRoot,
      fileSystem,
      story: 'demo',
      now: () => new Date('2026-05-03T12:00:00.000Z')
    });
    const content = await fileSystem.readFile(preview.contentPath);

    expect(preview.record.writeSummary.confirmedItems.map(item => item.text).join('\n')).not.toContain('长文候选');
    expect(preview.record.writeSummary.confirmedItems.map(item => item.text).join('\n')).not.toContain('表格候选');
    expect(preview.record.writeSummary.confirmedItems.map(item => item.text).join('\n')).not.toContain('AI 候选');
    await expect(fileSystem.readFile(path.join(storyPath, 'clarifications.json'))).resolves.toContain('"confirmed": false');
    await expect(fileSystem.readFile(path.join(storyPath, 'clarifications.json'))).resolves.toContain('长文候选');
    await expect(fileSystem.readFile(path.join(storyPath, 'clarifications.json'))).resolves.toContain('表格候选');
    await expect(fileSystem.readFile(path.join(storyPath, 'clarifications.json'))).resolves.toContain('AI 候选');
    expect(content).toContain('开局是轻松冒险');
    expect(content).not.toContain('长文候选：晏无已经能直接重构王国制度');
    expect(content).not.toContain('表格候选：莉莉丝第一章就成为最终伴侣');
    expect(content).not.toContain('AI 候选：瑟琳娜应当立刻继承王位');
    await expect(fileSystem.pathExists(path.join(storyPath, 'specification.md'))).resolves.toBe(false);
  });

  it('blocks apply when required clarification is deferred', async () => {
    const { projectRoot, fileSystem } = await createProject('稍后决定');

    const preview = await createSpecifyPreview({
      projectRoot,
      fileSystem,
      story: 'demo',
      now: () => new Date('2026-05-03T12:00:00.000Z')
    });

    expect(preview.record.risks).toEqual([
      expect.objectContaining({ severity: 'blocking' })
    ]);
    await expect(applyPreview({
      projectRoot,
      fileSystem,
      previewId: preview.record.id,
      yes: true,
      now: () => new Date('2026-05-03T12:01:00.000Z')
    })).rejects.toBeInstanceOf(PreviewApplyError);
  });

  it('creates a plan preview with core gaps without touching creative-plan.md', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'demo',
      premise: '主角晏无是一名工科马列青年，穿越到剑与魔法世界。',
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
          exampleAnswers: ['晏无。', '工程师。'],
          dependsOn: []
        },
        {
          id: 'partner.core',
          stage: 'specify',
          topic: 'partner',
          question: '核心伙伴是谁？',
          whyItMatters: '影响关系张力。',
          type: 'textarea',
          required: false,
          options: [],
          exampleAnswers: ['符文学徒。', '边境治安官。'],
          exampleBranches: [{
            label: '符文学徒',
            answer: '核心伙伴是被学院驱逐的符文学徒。',
            flavor: '学习线和关系线更近。',
            tradeoffs: ['需要避免只解释设定。'],
            downstreamImpact: '能力体系和关系升温会绑定。',
            recommendedFor: ['学院工坊']
          }],
          dependsOn: []
        },
        {
          id: 'stage.first',
          stage: 'specify',
          topic: 'stage',
          question: '第一舞台在哪里？',
          whyItMatters: '影响世界规则的第一眼呈现。',
          type: 'textarea',
          required: false,
          options: [],
          exampleAnswers: ['边境小城。', '学院工坊。'],
          dependsOn: []
        },
        {
          id: 'faction.conflict',
          stage: 'specify',
          topic: 'faction',
          question: '第一卷的势力冲突是什么？',
          whyItMatters: '影响行动压力。',
          type: 'textarea',
          required: false,
          options: [],
          exampleAnswers: ['学院许可。', '地方贵族。'],
          dependsOn: []
        }
      ],
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

    const preview = await createPlanPreview({
      projectRoot,
      fileSystem,
      story: 'demo',
      now: () => new Date('2026-05-03T12:00:00.000Z')
    });

    expect(preview.record.kind).toBe('plan');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('# demo 创作计划 v0');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('## 作品定位');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('## 主角核心');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('## 下一步入口');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.not.toContain('本文件由 preview plan 生成');
    expect(preview.record.targetPath).toBe(path.join(storyPath, 'creative-plan.md'));
    expect(preview.record.risks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: 'blocking',
        message: expect.stringContaining('核心伙伴')
      })
    ]));
    await expect(fileSystem.pathExists(path.join(storyPath, 'creative-plan.md'))).resolves.toBe(false);
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('[需要澄清] 核心伙伴');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('来源：clarifications.json');
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('符文学徒');
  });

  it('keeps unrelated programming-casting branches out of stardust inn plan previews', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-preview-stardust-inn');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', '星尘驿站');

    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# 星尘驿站');
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: '星尘驿站',
      premise: '退休星舰导航员在宇宙边境开一间给迷路灵魂和破损飞船歇脚的驿站；轻松治愈，慢热群像，背后有一场被遗忘的星际战争。',
      createdAt: '2026-05-04T00:00:00.000Z',
      updatedAt: '2026-05-04T00:00:00.000Z',
      questions: [
        {
          id: 'core.stage',
          stage: 'specify',
          topic: 'setting',
          question: '第一卷主要发生在哪类舞台？',
          whyItMatters: '影响第一卷的故事压力。',
          type: 'textarea',
          required: false,
          options: [],
          exampleAnswers: ['驿站大厅。', '边境航道。'],
          exampleBranches: [
            {
              label: '漂泊者驿站',
              answer: '第一卷围绕边境驿站展开，每位来客都带来一个轻小但有余韵的问题。',
              flavor: '治愈、群像、低压冒险。',
              tradeoffs: ['需要让每个来客都带来新的故事压力。'],
              downstreamImpact: '计划会围绕来客单元和被遗忘战争线索展开。',
              recommendedFor: ['治愈群像']
            }
          ],
          dependsOn: []
        }
      ],
      answers: []
    }, { spaces: 2 });

    const preview = await createPlanPreview({
      projectRoot,
      fileSystem,
      story: '星尘驿站',
      now: () => new Date('2026-05-04T12:00:00.000Z')
    });
    const content = await fileSystem.readFile(preview.contentPath);

    expect(content).toContain('漂泊者驿站');
    for (const term of ['晏无', '编程施法', '学院工坊', '贵族许可', '边境小城', '工科马列', '第三次寂静']) {
      expect(content).not.toContain(term);
    }
  });

  it('blocks full plan apply but allows explicit draft mode with gaps preserved', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'demo',
      premise: '异界穿越、编程施法',
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      questions: [{
        id: 'partner.core',
        stage: 'specify',
        topic: 'partner',
        question: '核心伙伴是谁？',
        whyItMatters: '影响关系张力。',
        type: 'textarea',
        required: false,
        options: [],
        exampleAnswers: ['符文学徒。', '边境治安官。'],
        dependsOn: []
      }],
      answers: []
    }, { spaces: 2 });

    const preview = await createPlanPreview({
      projectRoot,
      fileSystem,
      story: 'demo',
      now: () => new Date('2026-05-03T12:00:00.000Z')
    });

    await expect(applyPreview({
      projectRoot,
      fileSystem,
      previewId: preview.record.id,
      yes: true,
      now: () => new Date('2026-05-03T12:01:00.000Z')
    })).rejects.toBeInstanceOf(PreviewApplyError);

    const applied = await applyPreview({
      projectRoot,
      fileSystem,
      previewId: preview.record.id,
      yes: true,
      draft: true,
      now: () => new Date('2026-05-03T12:02:00.000Z')
    });

    expect(applied.applied).toBe(true);
    await expect(fileSystem.readFile(path.join(storyPath, 'creative-plan.md'))).resolves.toContain('[需要澄清]');
    await expect(fileSystem.readFile(path.join(storyPath, 'creative-plan.md'))).resolves.toContain('来源：clarifications.json');
    await expect(fileSystem.readFile(path.join(storyPath, 'creative-plan.md'))).resolves.toContain('# demo 创作计划 v0');
    await expect(fileSystem.readFile(path.join(storyPath, 'creative-plan.md'))).resolves.not.toContain('本文件由 preview plan 生成');
  });
});
