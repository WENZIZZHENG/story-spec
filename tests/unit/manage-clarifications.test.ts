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
});
