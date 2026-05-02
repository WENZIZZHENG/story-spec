import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  feedbackToTasks,
  importFeedback,
  listFeedback,
  triageFeedback
} from '../../src/application/manage-feedback.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-feedback');
  const fileSystem = new MemoryFileSystem(projectRoot);

  await fileSystem.writeFile(path.join(projectRoot, 'feedback', 'beta-reader-001.md'), [
    '第一章开头有点困惑，不知道主角目标。',
    '',
    '第二段节奏很好，可以保留。'
  ].join('\n'));

  return { projectRoot, fileSystem };
};

describe('manage feedback', () => {
  it('imports reader feedback without changing story content', async () => {
    const fixture = await createProject();

    const result = await importFeedback({
      ...fixture,
      filePath: 'feedback/beta-reader-001.md',
      source: 'beta-reader-001',
      targetPath: 'stories/001-demo/content/chapter-001.md',
      type: 'confusion'
    });

    expect(result.imported).toHaveLength(2);
    expect(result.imported[0]).toMatchObject({
      id: 'feedback.beta-reader-001.001',
      status: 'new',
      targetPath: 'stories/001-demo/content/chapter-001.md'
    });

    const listed = await listFeedback(fixture);
    expect(listed.items).toHaveLength(2);
  });

  it('triages feedback and creates task drafts without writing tasks.md', async () => {
    const fixture = await createProject();
    const imported = await importFeedback({
      ...fixture,
      filePath: 'feedback/beta-reader-001.md',
      source: 'beta-reader-001',
      targetPath: 'stories/001-demo/content/chapter-001.md',
      suggestedAction: '补主角目标'
    });

    const triaged = await triageFeedback({
      ...fixture,
      id: imported.imported[0].id,
      status: 'accepted'
    });
    expect(triaged.item.status).toBe('accepted');

    const tasks = await feedbackToTasks(fixture);
    expect(tasks.taskDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        sourceFinding: `feedback:${imported.imported[0].id}`,
        suggestedAction: '补主角目标'
      })
    ]));
    await expect(fixture.fileSystem.pathExists(path.join(fixture.projectRoot, 'stories', '001-demo', 'tasks.md'))).resolves.toBe(false);
  });
});
