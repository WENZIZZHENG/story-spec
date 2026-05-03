import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createCreativeReport } from '../../src/application/creative-report.js';
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
    expect(result.nextActions).toContain('novel review --panel continuity');
  });
});
