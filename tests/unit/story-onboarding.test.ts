import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createStoryIdea,
  getStoryNext
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
      command: 'novel interview 法术编译纪元'
    });
    expect(result.actions.map(action => action.command)).toContain('novel preview specify 法术编译纪元');
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
    expect(result.actions[0].command).toBe('novel interview demo');
  });
});
