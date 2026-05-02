import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkWritingState,
  countNarrativeChars,
  renderWritingStateChecklist
} from '../../src/application/check-writing-state.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createWritingStateFixture = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-writing-state');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyRoot = path.join(projectRoot, 'stories', 'demo');

  await fileSystem.writeFile(path.join(projectRoot, '.specify', 'memory', 'writing-constitution.md'), '# constitution');
  await fileSystem.writeFile(path.join(storyRoot, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyRoot, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyRoot, 'tasks.md'), `- [ ] [P0] **T001** - 第一章
  - **输出**：\`content/chapter-001.md\`
- [~] [P1] **T002** - 第二章
  - **输出**：\`content/chapter-002.md\`
- [x] [P2] **T003** - 第三章
  - **输出**：\`content/chapter-003.md\`
`);
  await fileSystem.writeFile(path.join(storyRoot, 'content', 'chapter-001.md'), '# 第一章\n\n正文正文正文');
  await fileSystem.writeFile(path.join(storyRoot, 'content', 'chapter-002.md'), '短');

  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'tracking', 'good.json'), '{"ok":true}');
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'tracking', 'bad.json'), '{bad');

  return { projectRoot, fileSystem };
};

describe('checkWritingState', () => {
  it('counts narrative characters without markdown noise', () => {
    expect(countNarrativeChars('# 标题\n\n正文 `code`\n- 项')).toBe(5);
  });

  it('scans documents, task progress, content word counts, and tracking JSON', async () => {
    const { projectRoot, fileSystem } = await createWritingStateFixture();

    const state = await checkWritingState({
      projectRoot,
      fileSystem,
      wordRange: { min: 4, max: 10 }
    });

    expect(state.story).toMatchObject({
      name: 'demo',
      path: path.join(projectRoot, 'stories', 'demo')
    });
    expect(state.documents).toEqual({
      constitution: true,
      specification: true,
      creativePlan: true,
      tasks: true
    });
    expect(state.tasks).toMatchObject({
      total: 3,
      pending: 1,
      inProgress: 1,
      completed: 1,
      completionRate: 33,
      nextTask: 'T001 - 第一章'
    });
    expect(state.content).toMatchObject({
      chapterCount: 2,
      badChapterCount: 1,
      totalChars: 10
    });
    expect(state.tracking).toMatchObject({
      total: 2,
      valid: 1,
      invalid: 1
    });
    expect(state.canWrite).toBe(true);
  });

  it('renders a checklist-compatible report', async () => {
    const { projectRoot, fileSystem } = await createWritingStateFixture();
    const state = await checkWritingState({
      projectRoot,
      fileSystem,
      wordRange: { min: 4, max: 10 }
    });

    const checklist = renderWritingStateChecklist(state);

    expect(checklist).toContain('# 写作状态检查 Checklist');
    expect(checklist).toContain('- [x] CHK001 writing-constitution.md 存在');
    expect(checklist).toContain('- [x] CHK005 有进行中的任务（1 个）');
    expect(checklist).toContain('- [!] CHK009 字数符合标准（1 章不符合）');
    expect(checklist).toContain('- [!] CHK010 tracking JSON 有效（1 个错误）');
  });
});
