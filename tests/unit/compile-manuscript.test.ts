import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  compileManuscript,
  countWords
} from '../../src/application/compile-manuscript.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-compile');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', '001-demo');

  await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), '# tasks');
  await fileSystem.writeFile(path.join(storyPath, 'content', 'chapter-001.md'), '# 第一章\n\n他推开门。');
  await fileSystem.writeFile(path.join(storyPath, 'content', 'chapter-002.md'), '# 第二章\n\nThe door opened.');
  await fileSystem.writeFile(path.join(storyPath, 'scenes', 'scene-001.yaml'), [
    'id: scene-001',
    'chapter: chapter-001',
    'order: 1',
    'pov: 主角',
    'location: 门外',
    'time: 夜',
    'sceneGoal: 进入',
    'conflict: 有人阻拦',
    'outcome: 推开门',
    'draftPath: content/chapter-001.md'
  ].join('\n'));
  await fileSystem.writeFile(path.join(storyPath, 'scenes', 'scene-002.yaml'), [
    'id: scene-002',
    'chapter: chapter-003',
    'order: 2',
    'pov: 主角',
    'location: 堂前',
    'time: 夜',
    'sceneGoal: 对峙',
    'conflict: 谎言',
    'outcome: 暂退',
    'draftPath: content/chapter-003.md'
  ].join('\n'));

  return { projectRoot, fileSystem };
};

describe('compile manuscript', () => {
  it('counts Chinese characters and English words', () => {
    expect(countWords('# 标题\n\n他推开 door.')).toBe(4);
  });

  it('compiles markdown into build outputs without touching content', async () => {
    const fixture = await createProject();

    const result = await compileManuscript({
      ...fixture,
      story: '001-demo',
      withFrontmatter: true,
      includeAppendix: true
    });

    expect(result.outputPath).toContain(path.join('build', 'manuscript.md'));
    expect(result.reportPath).toContain(path.join('build', 'reports', 'manuscript-report.json'));
    expect(result.frontmatterPath).toContain(path.join('build', 'manuscript.frontmatter.json'));
    expect(result.chapters.map(chapter => chapter.path)).toEqual([
      'stories/001-demo/content/chapter-001.md'
    ]);
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_CHAPTER_FILE' })
    ]));

    await expect(fixture.fileSystem.readFile(result.outputPath)).resolves.toContain('<!-- source: stories/001-demo/content/chapter-001.md; words: 4 -->');
    await expect(fixture.fileSystem.readFile(path.join(fixture.projectRoot, 'stories', '001-demo', 'content', 'chapter-001.md'))).resolves.toContain('他推开门。');
  });
});
