import { describe, expect, it } from 'vitest';
import { parseWritingTasksFromMarkdown } from '../../src/domain/story-artifact.js';

const tasksMarkdown = `# 写作任务

## 写作任务

- [ ] [P0] [WRITE-READY] **T001** - 第一章：星落 (3000字)
  - **任务类型**：正文写作
  - **核心任务**：完成开篇冲突
  - **必须读取**：
    - \`.specify/memory/constitution.md\`
    - \`stories/demo/specification.md\`
  - **允许修改**：
    - \`stories/demo/content/volume1/chapter-001.md\`
    - \`stories/demo/tasks.md\`（仅更新任务状态）
  - **涉及线索**：
    - PL-01(星落之匣) ★★★ 主推进
  - **依赖**：无
  - **输出**：\`content/volume1/chapter-001.md\`
  - **验收标准**：
    - [ ] 覆盖本章全部关键情节
    - [ ] 完成后更新任务状态

- [x] [P1] **T002** - 角色档案：主角详细设定
  - **核心任务**：完善主角设定
  - **依赖**：T001
  - **输出**：
    - \`spec/knowledge/character-profiles.md\`
`;

describe('story artifact domain', () => {
  it('parses writing task status, dependencies, outputs, and context boundaries', () => {
    const tasks = parseWritingTasksFromMarkdown(tasksMarkdown, {
      storyPath: 'stories/demo',
      tasksPath: 'stories/demo/tasks.md'
    });

    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toMatchObject({
      id: 'T001',
      title: '第一章：星落 (3000字)',
      status: 'todo',
      priority: 'P0',
      writeReady: true,
      planOnly: false,
      dependencies: [],
      outputs: ['content/volume1/chapter-001.md'],
      requiredReads: [
        '.specify/memory/constitution.md',
        'stories/demo/specification.md'
      ],
      allowedWrites: [
        'stories/demo/content/volume1/chapter-001.md',
        'stories/demo/tasks.md'
      ],
      clues: ['PL-01']
    });
    expect(tasks[0].acceptanceCriteria).toEqual([
      '覆盖本章全部关键情节',
      '完成后更新任务状态'
    ]);

    expect(tasks[1]).toMatchObject({
      id: 'T002',
      status: 'done',
      priority: 'P1',
      dependencies: ['T001'],
      outputs: ['spec/knowledge/character-profiles.md']
    });
  });
});
