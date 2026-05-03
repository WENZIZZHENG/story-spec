import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyPreview,
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
    await expect(fileSystem.readFile(preview.contentPath)).resolves.toContain('## 用户已确认');
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
    await expect(fileSystem.readFile(path.join(storyPath, 'specification.md'))).resolves.toContain('# demo 规格预览');
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
});
