import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  exportTaskBoard,
  renderTaskBoardExportSummary,
  TaskBoardExportError
} from '../../src/application/export-task-board.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-task-board');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', '001-demo');

  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'entities.json'), {
    entities: [{
      id: 'entity.hero',
      type: 'character',
      name: 'Hero'
    }]
  });
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'edges.json'), {
    edges: []
  });
  await fileSystem.writeFile(path.join(storyPath, 'scenes', 'scene-001.yaml'), `id: scene-001
chapter: chapter-001
order: 1
pov: Hero
location: Home
time: Morning
sceneGoal: Open story
conflict: Trouble arrives
outcome: Hero accepts the task
entities:
  - entity.hero
draftPath: stories/*/content/chapter-001.md
`);
  await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), `# tasks

- [ ] [P0] [WRITE-READY] **T001** - 起草第一章
  - **任务类型**：正文写作
  - **核心任务**：完成开场冲突
  - **必须读取**：
    - \`specification.md\`
    - \`creative-plan.md\`
  - **允许修改**：
    - \`content/chapter-001.md\`
    - \`tasks.md\`
  - **涉及线索**：
    - PL-01 星落之匣
  - **依赖**：无
  - **输出**：\`content/chapter-001.md\`
  - **验收标准**：
    - [ ] 覆盖本章关键情节
    - [ ] 更新任务状态
- [x] [P1] [PLAN-ONLY] **T002** - 整理人物关系
  - **依赖**：T001
  - **输出**：
    - \`spec/knowledge/relationships.md\`
`);

  return { projectRoot, fileSystem, storyPath };
};

describe('exportTaskBoard', () => {
  it('exports tasks.md to a local JSON board with GitHub issue drafts', async () => {
    const { projectRoot, fileSystem, storyPath } = await createProject();

    const result = await exportTaskBoard({
      projectRoot,
      fileSystem,
      now: () => new Date('2026-05-02T00:00:00.000Z')
    });

    expect(result.outputPath).toBe(path.join(storyPath, 'task-board.json'));
    expect(await fileSystem.readJson(result.outputPath!)).toEqual(result.board);
    expect(result.board).toMatchObject({
      schemaVersion: '1.0',
      generatedAt: '2026-05-02T00:00:00.000Z',
      story: {
        name: '001-demo',
        tasksPath: path.join(storyPath, 'tasks.md')
      },
      summary: {
        total: 2,
        todo: 1,
        done: 1,
        writeReady: 1,
        planOnly: 1,
        graphEntities: 1,
        graphEdges: 0,
        sceneCards: 1
      },
      columns: [
        { id: 'todo', title: '待办', taskIds: ['T001'] },
        { id: 'done', title: '已完成', taskIds: ['T002'] }
      ]
    });
    expect(result.board.tasks[0]).toMatchObject({
      id: 'T001',
      title: '起草第一章',
      status: 'todo',
      priority: 'P0',
      writeReady: true,
      dependencies: [],
      outputs: ['content/chapter-001.md'],
      requiredReads: ['specification.md', 'creative-plan.md'],
      allowedWrites: ['content/chapter-001.md', 'tasks.md'],
      clues: ['PL-01'],
      acceptanceCriteria: ['覆盖本章关键情节', '更新任务状态'],
      relatedSceneIds: ['scene-001'],
      relatedEntityIds: ['entity.hero'],
      labels: ['priority:P0', 'status:todo', 'write-ready', 'clue:PL-01']
    });
    expect(result.board.tasks[0].githubIssue.title).toBe('[P0] T001 起草第一章');
    expect(result.board.tasks[0].githubIssue.body).toContain('必须读取：');
    expect(result.board.tasks[0].githubIssue.body).toContain('- [ ] 覆盖本章关键情节');
  });

  it('can render JSON without writing a file', async () => {
    const { projectRoot, fileSystem } = await createProject();

    const result = await exportTaskBoard({
      projectRoot,
      fileSystem,
      write: false
    });

    expect(result.outputPath).toBeUndefined();
    expect(renderTaskBoardExportSummary(result)).toContain('GitHub issue 草稿：2');
  });

  it('reports missing stories with a typed error', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-empty-task-board');
    const fileSystem = new MemoryFileSystem(projectRoot);

    await expect(exportTaskBoard({ projectRoot, fileSystem })).rejects.toMatchObject({
      code: 'NO_STORIES'
    } satisfies Partial<TaskBoardExportError>);
  });
});
