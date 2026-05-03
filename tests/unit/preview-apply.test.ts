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
  });
});
