import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createStoryCoreSummary,
  renderStoryCoreSummary
} from '../../src/application/story-core-summary.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

describe('story core summary', () => {
  it('renders a focused story core panel without changing clarifications', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-story-core-summary');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', '法术程序师');

    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# 法术程序师');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: '法术程序师',
      premise: '工科马列青年晏无穿越到剑与魔法的世界。',
      createdAt: '2026-05-04T00:00:00.000Z',
      updatedAt: '2026-05-04T00:00:00.000Z',
      questions: [
        {
          id: 'core.premise',
          stage: 'specify',
          topic: 'premise',
          question: '核心创意是什么？',
          whyItMatters: '核心创意是作者控制权边界。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
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
          id: 'core.partner',
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
          id: 'core.stage',
          stage: 'specify',
          topic: 'stage',
          question: '第一舞台在哪里？',
          whyItMatters: '影响世界规则。',
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
          question: '能力体系是什么？',
          whyItMatters: '影响能力边界。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
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
          exampleAnswers: [],
          dependsOn: []
        }
      ],
      answers: [
        {
          questionId: 'core.premise',
          answer: '工科马列青年晏无在魔导边境学院觉醒法术程序理解能力。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z'
        },
        {
          questionId: 'core.protagonist',
          answer: '晏无开朗务实，但容易把亲密关系也当成需要调试的问题。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z'
        },
        {
          questionId: 'core.partner',
          answer: '莉莉丝想重新拥有名字和选择，瑟琳娜会质疑合法是否等于正义。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z'
        },
        {
          questionId: 'core.stage',
          answer: '魔导边境学院垄断知识解释权，实习评级会改变学生行动代价。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z'
        },
        {
          questionId: 'magic.rule-hardness',
          answer: '中度偏硬规则，关键事故讲清魔力流向、断点和失败代价。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z'
        },
        {
          questionId: 'core.scope',
          answer: '第一阶段不能定稿最终反派、长线威胁真相和感情线归属。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const originalRecord = await fileSystem.readFile(path.join(storyPath, 'clarifications.json'));
    const result = await createStoryCoreSummary({
      projectRoot,
      fileSystem,
      story: '法术程序师'
    });
    const rendered = renderStoryCoreSummary(result);

    expect(await fileSystem.readFile(path.join(storyPath, 'clarifications.json'))).toBe(originalRecord);
    expect(result.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'premise', label: '核心创意', status: 'confirmed' }),
      expect.objectContaining({ id: 'protagonist', label: '主角', status: 'partial' }),
      expect.objectContaining({ id: 'partner', label: '核心伙伴', status: 'confirmed' }),
      expect.objectContaining({ id: 'stage', label: '第一舞台', status: 'confirmed' }),
      expect.objectContaining({ id: 'power', label: '能力体系', status: 'confirmed' }),
      expect.objectContaining({ id: 'scope', label: '创作边界', status: 'confirmed' })
    ]));
    expect(rendered).toContain('StorySpec 核心信息面板');
    expect(rendered).toContain('核心创意：已确认');
    expect(rendered).toContain('能力体系：已确认');
    expect(rendered).toContain('创作边界：已确认');
    expect(rendered).toContain('不能定稿最终反派');
    expect(rendered).not.toContain('AI 建议待确认');
  });

  it('can render only missing or incomplete core items', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-story-core-summary-missing');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', 'demo');

    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# demo');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'demo',
      premise: '学院冒险。',
      createdAt: '2026-05-04T00:00:00.000Z',
      updatedAt: '2026-05-04T00:00:00.000Z',
      questions: [
        {
          id: 'core.protagonist',
          stage: 'specify',
          topic: 'protagonist',
          question: '主角是谁？',
          whyItMatters: '影响视角。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: [],
          dependsOn: []
        },
        {
          id: 'core.partner',
          stage: 'specify',
          topic: 'partner',
          question: '核心伙伴是谁？',
          whyItMatters: '影响关系。',
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
          answer: '晏无想先获得学生身份，目标是理解学院制度。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-04T00:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const result = await createStoryCoreSummary({
      projectRoot,
      fileSystem,
      story: 'demo',
      missingOnly: true
    });
    const rendered = renderStoryCoreSummary(result);

    expect(result.items.some(item => item.status === 'confirmed')).toBe(false);
    expect(rendered).toContain('只显示缺失或未完成项');
    expect(rendered).toContain('核心伙伴：缺失');
    expect(rendered).not.toContain('主角：已确认');
  });
});
