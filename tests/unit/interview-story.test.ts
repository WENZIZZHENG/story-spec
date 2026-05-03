import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  interviewStory,
  prepareInterviewQuestions
} from '../../src/application/interview-story.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-interview');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', 'idea-demo');

  await fileSystem.writeFile(path.join(storyPath, 'idea.md'), '# 异界穿越灵感');

  return { projectRoot, fileSystem, storyPath };
};

describe('interviewStory', () => {
  it('selects a gentle first round of questions from the built-in packs', async () => {
    const prepared = await prepareInterviewQuestions({
      premise: '异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁',
      maxQuestions: 6
    });

    expect(prepared.questions.length).toBeGreaterThan(0);
    expect(prepared.questions.length).toBeLessThanOrEqual(6);
    expect(prepared.selection.matchedPacks).toEqual(expect.arrayContaining([
      'core',
      'portal-fantasy',
      'magic-system',
      'slow-burn-romance',
      'civilization-threat'
    ]));
    expect(prepared.questions[0].exampleAnswers.length).toBeGreaterThanOrEqual(2);
  });

  it('writes clarification records and a copyable handoff prompt without touching specification', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();
    await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# 旧规格');

    const result = await interviewStory({
      projectRoot,
      fileSystem,
      story: 'idea-demo',
      premise: '异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁',
      answers: {
        'core.premise': '编程施法只是工具，开局仍然是轻松冒险。'
      },
      maxQuestions: 4,
      now: () => new Date('2026-05-03T12:00:00.000Z')
    });

    expect(result.record).toMatchObject({
      story: 'idea-demo',
      premise: '异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁'
    });
    expect(result.record.answers).toContainEqual(expect.objectContaining({
      questionId: 'core.premise',
      source: 'user-explicit',
      confirmed: true
    }));
    expect(result.handoffPrompt).toContain('/storyspec-specify');
    expect(result.handoffPrompt).toContain('clarifications.json');
    await expect(fileSystem.readFile(result.markdownPath)).resolves.toContain('## 需要澄清');
    await expect(fileSystem.readJson(result.jsonPath)).resolves.toMatchObject({
      story: 'idea-demo',
      answers: expect.any(Array)
    });
    await expect(fileSystem.readFile(path.join(storyPath, 'specification.md'))).resolves.toBe('# 旧规格');
  });

  it('replays existing answers and only updates explicit new answers', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'idea-demo',
      premise: '旧创意',
      createdAt: '2026-05-03T08:00:00.000Z',
      updatedAt: '2026-05-03T08:00:00.000Z',
      questions: [
        {
          id: 'core.protagonist',
          stage: 'specify',
          topic: 'protagonist',
          question: '主角开局最重要的性格缺口或能力盲区是什么？',
          whyItMatters: '缺口决定成长线。',
          type: 'text',
          required: true,
          options: [],
          exampleAnswers: ['他擅长修 bug，但不擅长理解人。', '她理论强、行动慢。'],
          dependsOn: []
        }
      ],
      answers: [
        {
          questionId: 'core.protagonist',
          answer: '他擅长修 bug，但不擅长理解人。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T08:00:00.000Z',
          updatedAt: '2026-05-03T08:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const result = await interviewStory({
      projectRoot,
      fileSystem,
      story: 'idea-demo',
      premise: '异界穿越、编程施法',
      answers: {
        'core.premise': '一个程序员把法术当运行时调试。'
      },
      maxQuestions: 3,
      now: () => new Date('2026-05-03T12:00:00.000Z')
    });

    expect(result.record.createdAt).toBe('2026-05-03T08:00:00.000Z');
    expect(result.reusedAnswerIds).toContain('core.protagonist');
    expect(result.updatedAnswerIds).toContain('core.premise');
    expect(result.record.answers).toEqual(expect.arrayContaining([
      expect.objectContaining({
        questionId: 'core.protagonist',
        answer: '他擅长修 bug，但不擅长理解人。',
        updatedAt: '2026-05-03T08:00:00.000Z'
      }),
      expect.objectContaining({
        questionId: 'core.premise',
        answer: '一个程序员把法术当运行时调试。',
        updatedAt: '2026-05-03T12:00:00.000Z'
      })
    ]));
    expect(result.record.questions.map(question => question.id)).toContain('core.protagonist');
  });

  it('skips already confirmed answers and keeps deferred answers open', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();
    await fileSystem.writeJson(path.join(storyPath, 'clarifications.json'), {
      schemaVersion: '1.0',
      story: 'idea-demo',
      premise: '异界穿越、编程施法',
      createdAt: '2026-05-03T08:00:00.000Z',
      updatedAt: '2026-05-03T08:00:00.000Z',
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
        }
      ],
      answers: [
        {
          questionId: 'core.premise',
          answer: '稍后决定',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T08:00:00.000Z',
          updatedAt: '2026-05-03T08:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const result = await interviewStory({
      projectRoot,
      fileSystem,
      story: 'idea-demo',
      premise: '异界穿越、编程施法',
      maxQuestions: 4,
      now: () => new Date('2026-05-03T12:00:00.000Z')
    });

    expect(result.record.questions.map(question => question.id)).toContain('core.premise');
    expect(result.markdown).toContain('core.premise：故事最想保留什么？');
  });

  it('can intentionally use examples as user-selected starter answers', async () => {
    const { projectRoot, fileSystem } = await createProject();

    const result = await interviewStory({
      projectRoot,
      fileSystem,
      story: 'idea-demo',
      premise: '异界穿越、轻松冒险、编程施法',
      useExamples: true,
      maxQuestions: 3,
      now: () => new Date('2026-05-03T12:00:00.000Z')
    });

    expect(result.record.answers.length).toBe(3);
    expect(result.record.answers.every(answer =>
      answer.source === 'user-explicit' && answer.confirmed
    )).toBe(true);
  });
});
