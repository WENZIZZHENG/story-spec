import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createDraft,
  listDrafts,
  promoteDraft,
  renderDraftCreateSummary
} from '../../src/application/manage-drafts.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-drafts');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', '001-demo');

  await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), `# tasks

- [ ] [P0] [WRITE-READY] **T001** - 起草第一章
  - **输出**：\`content/chapter-001.md\`
`);
  await fileSystem.writeFile(path.join(storyPath, 'content', 'chapter-001.md'), '# old chapter');

  return { projectRoot, fileSystem, storyPath };
};

describe('manage drafts', () => {
  it('creates draft records without overwriting content', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();

    const result = await createDraft({
      projectRoot,
      fileSystem,
      chapter: '001',
      contextPack: '.specify/context-packs/pack.json',
      now: () => new Date('2026-05-02T10:00:00.000Z')
    });

    expect(result.record).toMatchObject({
      id: 'chapter-001.v1',
      chapter: 'chapter-001',
      version: 1,
      path: 'stories/001-demo/drafts/chapter-001.v1.md',
      basedOn: 'stories/001-demo/content/chapter-001.md',
      contextPack: '.specify/context-packs/pack.json',
      status: 'draft',
      createdAt: '2026-05-02T10:00:00.000Z'
    });
    await expect(fileSystem.readFile(path.join(storyPath, 'content', 'chapter-001.md'))).resolves.toBe('# old chapter');
    await expect(fileSystem.readFile(result.draftPath)).resolves.toContain('# old chapter');

    const drafts = await listDrafts({ projectRoot, fileSystem, chapter: '001' });
    expect(drafts.records).toHaveLength(1);
  });

  it('shows writing preflight commands after creating a draft', async () => {
    const { projectRoot, fileSystem } = await createProject();

    const result = await createDraft({
      projectRoot,
      fileSystem,
      story: '001-demo',
      chapter: '001'
    });
    const summary = renderDraftCreateSummary(result);

    expect(summary).toContain('写作前检查：');
    expect(summary).toContain('storyspec context:pack 001-demo --chapter chapter-001');
    expect(summary).toContain('storyspec scene:init 001-demo');
    expect(summary).toContain('storyspec tasks:board 001-demo');
  });

  it('promotes drafts only after explicit confirmation', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();
    await createDraft({ projectRoot, fileSystem, chapter: '001' });
    await fileSystem.writeFile(path.join(storyPath, 'drafts', 'chapter-001.v1.md'), '# new chapter');

    const preview = await promoteDraft({
      projectRoot,
      fileSystem,
      draftId: 'chapter-001.v1'
    });

    expect(preview.dryRun).toBe(true);
    await expect(fileSystem.readFile(path.join(storyPath, 'content', 'chapter-001.md'))).resolves.toBe('# old chapter');

    const promoted = await promoteDraft({
      projectRoot,
      fileSystem,
      draftId: 'chapter-001.v1',
      yes: true
    });

    expect(promoted.dryRun).toBe(false);
    expect(promoted.record.status).toBe('published');
    await expect(fileSystem.readFile(path.join(storyPath, 'content', 'chapter-001.md'))).resolves.toBe('# new chapter');
  });
});
