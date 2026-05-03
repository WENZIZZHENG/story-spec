import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createCreativeReport,
  renderCreativeReport
} from '../../src/application/creative-report.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

describe('creative report', () => {
  it('separates confirmed user choices, pending questions, AI suggestions, and drift issues', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-creative-report');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', 'demo');

    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# demo');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'demo',
      premise: '异界穿越、慢热感情、文明级威胁',
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
          exampleAnswers: ['轻松冒险。', '文明谜团。'],
          dependsOn: []
        },
        {
          id: 'romance.boundary',
          stage: 'specify',
          topic: 'relationship',
          question: '慢热感情边界是什么？',
          whyItMatters: '避免过早定关系。',
          type: 'textarea',
          required: true,
          options: [],
          exampleAnswers: ['第一卷互相信任。', '第二卷才表白。'],
          dependsOn: []
        },
        {
          id: 'threat.shape',
          stage: 'specify',
          topic: 'threat',
          question: '威胁形态是什么？',
          whyItMatters: '影响长线结构。',
          type: 'textarea',
          required: false,
          options: [],
          exampleAnswers: ['旧文明运行时重启。', '群星协议崩塌。'],
          dependsOn: []
        }
      ],
      answers: [
        {
          questionId: 'core.premise',
          answer: '编程施法只是工具，开局仍然是轻松冒险。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        },
        {
          questionId: 'threat.shape',
          answer: '旧文明运行时重启',
          source: 'ai-suggested',
          confidence: 0.6,
          confirmed: false,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '文明级威胁是旧文明运行时重启。');

    const result = await createCreativeReport({
      projectRoot,
      fileSystem,
      story: 'demo'
    });

    expect(result.confirmed).toEqual([
      expect.objectContaining({ questionId: 'core.premise' })
    ]);
    expect(result.pendingQuestions).toEqual([
      expect.objectContaining({ questionId: 'romance.boundary' })
    ]);
    expect(result.aiSuggestions).toEqual([
      expect.objectContaining({ questionId: 'threat.shape' })
    ]);
    expect(result.driftIssues).toEqual([
      expect.objectContaining({
        code: 'CREATIVE_INTENT_DRIFT_UNCONFIRMED_AI_SUGGESTION'
      })
    ]);
    expect(result.nextActions).toContain('storyspec review --panel continuity');
  });

  it('renders a core element panel for co-creating programming-casting', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-creative-report-core');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyPath = path.join(projectRoot, 'stories', '编程施法');

    await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# 编程施法');
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: '编程施法',
      premise: '主角晏无是一名工科马列青年，穿越到剑与魔法世界；轻松冒险、慢热感情、文明级威胁。',
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
          id: 'magic-system.style',
          stage: 'specify',
          topic: 'magic-system',
          question: '编程施法更偏硬规则，还是轻量隐喻？',
          whyItMatters: '影响能力边界。',
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
        },
        {
          id: 'threat.silence',
          stage: 'specify',
          topic: 'threat',
          question: '文明级威胁最早以什么小异常出现？',
          whyItMatters: '影响长线揭示。',
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
        },
        {
          questionId: 'magic-system.style',
          answer: '编程施法偏轻量隐喻。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        },
        {
          questionId: 'threat.silence',
          answer: '第三次寂静正在逼近人类文明，前两次分别吞没远古神族和高等精灵文明。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T00:00:00.000Z',
          updatedAt: '2026-05-03T00:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const result = await createCreativeReport({
      projectRoot,
      fileSystem,
      story: '编程施法'
    });
    const rendered = renderCreativeReport(result);

    expect(result.coreElements).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'protagonist', label: '主角', status: 'partial' }),
      expect.objectContaining({ id: 'power', label: '能力体系', status: 'confirmed' }),
      expect.objectContaining({ id: 'longThreat', label: '长线威胁', status: 'confirmed' }),
      expect.objectContaining({ id: 'partner', label: '核心伙伴', status: 'missing' }),
      expect.objectContaining({ id: 'stage', label: '第一舞台', status: 'missing' }),
      expect.objectContaining({ id: 'factionConflict', label: '势力与冲突', status: 'missing' })
    ]));
    expect(rendered).toContain('核心要素面板');
    expect(rendered).toContain('主角：部分确认');
    expect(rendered).toContain('核心伙伴：缺失');
    expect(rendered).toContain('第一舞台：缺失');
    expect(rendered).toContain('势力与冲突：缺失');
  });
});
