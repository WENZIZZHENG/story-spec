import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectCreativeIntentDrift } from '../../src/application/detect-creative-intent-drift.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-drift');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', 'demo');

  await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# 灵感');
  await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
    schemaVersion: '1.0',
    story: 'demo',
    premise: '异界穿越、编程施法、慢热感情、文明级威胁',
    createdAt: '2026-05-03T08:00:00.000Z',
    updatedAt: '2026-05-03T08:00:00.000Z',
    questions: [
      {
        id: 'core.relationship-line',
        stage: 'specify',
        topic: 'relationship',
        question: '慢热感情线在早期承担什么功能？',
        whyItMatters: '避免过早定关系。',
        type: 'textarea',
        required: true,
        options: [],
        exampleAnswers: ['两人先是任务搭档。', '感情线承担文明差异冲突。'],
        dependsOn: []
      },
      {
        id: 'threat.shape',
        stage: 'specify',
        topic: 'threat',
        question: '文明级威胁的真实形态是什么？',
        whyItMatters: '威胁真相会影响长线结构。',
        type: 'textarea',
        required: false,
        options: [],
        exampleAnswers: ['旧文明运行时重启。', '群星边界的协议崩塌。'],
        dependsOn: []
      }
    ],
    answers: [
      {
        questionId: 'threat.shape',
        answer: '旧文明运行时重启',
        source: 'ai-suggested',
        confidence: 0.62,
        confirmed: false,
        createdAt: '2026-05-03T08:00:00.000Z',
        updatedAt: '2026-05-03T08:00:00.000Z'
      }
    ]
  }, { spaces: 2 });

  return { projectRoot, fileSystem, storyPath };
};

describe('detectCreativeIntentDrift', () => {
  it('flags unconfirmed AI suggestions and pending topics used in canon-bound artifacts', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), [
      '# spec',
      '',
      '文明级威胁的真相是旧文明运行时重启。'
    ].join('\n'));
    await fileSystem.writeFile(path.join(storyPath, 'content', 'chapter-001.md'), [
      '# 第一章',
      '',
      '他意识到自己已经爱上了任务搭档，甚至想立刻表白。'
    ].join('\n'));

    const result = await detectCreativeIntentDrift({
      projectRoot,
      fileSystem
    });

    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'CREATIVE_INTENT_DRIFT_UNCONFIRMED_AI_SUGGESTION',
        questionId: 'threat.shape',
        evidence: expect.stringContaining('旧文明运行时重启')
      }),
      expect.objectContaining({
        code: 'CREATIVE_INTENT_DRIFT_PENDING_TOPIC',
        questionId: 'core.relationship-line',
        evidence: expect.stringContaining('表白')
      })
    ]));
  });

  it('ignores confirmed answers and exploratory candidate notes', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();
    const record = await fileSystem.readJson<any>(path.join(storyPath, 'clarifications.json'));
    record.answers.push({
      questionId: 'core.relationship-line',
      answer: '第一卷只到互相信任，不表白。',
      source: 'user-explicit',
      confidence: 1,
      confirmed: true,
      createdAt: '2026-05-03T08:00:00.000Z',
      updatedAt: '2026-05-03T08:00:00.000Z'
    });
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), record, { spaces: 2 });
    await fileSystem.writeFile(path.join(storyPath, 'candidates.md'), '旧文明运行时重启只是候选方向。');

    const result = await detectCreativeIntentDrift({
      projectRoot,
      fileSystem
    });

    expect(result.issues).toEqual([]);
  });
});
