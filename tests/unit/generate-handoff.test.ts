import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  generateHandoff,
  HandoffGenerationError,
  renderHandoffSummary
} from '../../src/application/generate-handoff.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-handoff');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', '001-demo');

  await fileSystem.writeFile(path.join(projectRoot, 'AGENTS.md'), '# Agents');
  await fileSystem.writeFile(path.join(projectRoot, '.specify', 'memory', 'constitution.md'), '# constitution');
  await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyPath, 'content', 'chapter-000.md'), '# 前情\n\n已经写过的内容');
  await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), `# tasks

- [ ] [P0] [WRITE-READY] **T001** - 起草第一章
  - **必须读取**：
    - \`specification.md\`
    - \`creative-plan.md\`
  - **允许修改**：
    - \`content/chapter-001.md\`
    - \`tasks.md\`
  - **依赖**：无
  - **输出**：\`content/chapter-001.md\`
  - **验收标准**：
    - [ ] 覆盖本章关键情节
    - [ ] 更新任务状态
- [ ] [P1] [PLAN-ONLY] **T002** - 整理人物关系
  - **依赖**：T001
  - **必须读取**：
    - \`specification.md\`
  - **允许修改**：
    - \`spec/knowledge/relationships.md\`
  - **输出**：
    - \`spec/knowledge/relationships.md\`
`);

  return { projectRoot, fileSystem, storyPath };
};

describe('generateHandoff', () => {
  it('generates a markdown handoff package from story tasks', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();

    const result = await generateHandoff({
      projectRoot,
      fileSystem,
      now: () => new Date('2026-05-02T08:00:00.000Z')
    });

    expect(result.outputPath).toBe(path.join(storyPath, 'handoff.md'));
    expect(await fileSystem.readFile(result.outputPath!)).toBe(result.markdown);
    expect(result.context).toMatchObject({
      schemaVersion: '1.0',
      generatedAt: '2026-05-02T08:00:00.000Z',
      story: {
        name: '001-demo',
        tasksPath: path.join(storyPath, 'tasks.md')
      },
      currentChapter: {
        path: 'stories/001-demo/content/chapter-001.md',
        source: 'next-task-output',
        exists: false,
        chars: 0,
        taskId: 'T001'
      },
      nextTask: {
        id: 'T001',
        title: '起草第一章',
        priority: 'P0',
        writeReady: true,
        outputs: ['stories/001-demo/content/chapter-001.md'],
        allowedWrites: [
          'stories/001-demo/content/chapter-001.md',
          'stories/001-demo/tasks.md'
        ],
        acceptanceCriteria: ['覆盖本章关键情节', '更新任务状态']
      }
    });
    expect(result.context.mustReadFiles).toEqual([
      'AGENTS.md',
      '.specify/memory/constitution.md',
      'stories/001-demo/specification.md',
      'stories/001-demo/creative-plan.md',
      'stories/001-demo/tasks.md'
    ]);
    expect(result.context.allowedWriteFiles).toContain('spec/knowledge/relationships.md');
    expect(result.markdown).toContain('# Handoff');
    expect(result.markdown).toContain('`T001` 起草第一章');
    expect(result.markdown).toContain('## 风险边界');
    expect(renderHandoffSummary(result)).toContain('下一任务：T001 起草第一章');
  });

  it('can render a structured context without writing a file', async () => {
    const { projectRoot, fileSystem } = await createProject();

    const result = await generateHandoff({
      projectRoot,
      fileSystem,
      write: false
    });

    expect(result.outputPath).toBeUndefined();
    expect(result.context.unfinishedTasks).toHaveLength(2);
  });

  it('reports missing stories with a typed error', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-empty-handoff');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await expect(generateHandoff({ projectRoot, fileSystem })).rejects.toMatchObject({
      code: 'NO_STORIES'
    } satisfies Partial<HandoffGenerationError>);
  });
});
