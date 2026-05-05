import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { captureTodo } from '../../src/application/capture-todo.js';
import { finishDocsChange } from '../../src/application/finish-docs-change.js';
import { finishWritingTask } from '../../src/application/finish-writing-task.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const expectedSharedKeys = [
  'mode',
  'wouldWrite',
  'updatedFiles',
  'checks',
  'blocked',
  'blockedReasons',
  'nextActions',
  'commit'
];

const expectSharedFlowShape = (result: Record<string, unknown>) => {
  for (const key of expectedSharedKeys) {
    expect(result).toHaveProperty(key);
  }
  expect(Array.isArray(result.wouldWrite)).toBe(true);
  expect(Array.isArray(result.updatedFiles)).toBe(true);
  expect(Array.isArray(result.checks)).toBe(true);
  expect(Array.isArray(result.blockedReasons)).toBe(true);
  expect(Array.isArray(result.nextActions)).toBe(true);
  expect(result.commit).toMatchObject({
    requested: expect.any(Boolean),
    created: expect.any(Boolean)
  });
};

const createWritingProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-flow-command-writing');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', 'demo');
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'entities.json'), { entities: [] });
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'edges.json'), { edges: [] });
  await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyPath, 'content', 'chapter-001.md'), '# chapter-001');
  await fileSystem.writeFile(path.join(storyPath, 'tasks.md'), `# tasks

- [ ] [P0] [WRITE-READY] **T001** - 起草第一章
  - **允许修改**：
    - \`content/chapter-001.md\`
  - **输出**：\`content/chapter-001.md\`
`);

  return { projectRoot, fileSystem };
};

const createTodoProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-flow-command-todo');
  const fileSystem = new MemoryFileSystem(projectRoot);
  await fileSystem.writeFile(path.join(projectRoot, 'docs', 'tech', 'todo-index.md'), `# 待办统一入口

## 当前待办

| 优先级 | 路线 | 状态 | 覆盖范围 | 下一步 |
| --- | --- | --- | --- | --- |
`);

  return { projectRoot, fileSystem };
};

describe('flow command result shape', () => {
  it('task:finish, docs:finish and todo:capture expose shared JSON fields', async () => {
    const writingProject = await createWritingProject();
    const taskFinish = await finishWritingTask({
      projectRoot: writingProject.projectRoot,
      fileSystem: writingProject.fileSystem,
      story: 'demo',
      taskId: 'T001'
    });

    const docsFinish = await finishDocsChange({
      projectRoot: path.resolve('demo-docs'),
      message: '记录文档变更'
    });

    const todoProject = await createTodoProject();
    const todoCapture = await captureTodo({
      projectRoot: todoProject.projectRoot,
      fileSystem: todoProject.fileSystem,
      topic: 'flow shape',
      notes: '统一流程字段'
    });

    for (const result of [taskFinish, docsFinish, todoCapture]) {
      expectSharedFlowShape(result as unknown as Record<string, unknown>);
    }

    expect(taskFinish).toMatchObject({
      mode: 'preview',
      applied: false
    });
    expect(docsFinish).toMatchObject({
      mode: 'preview',
      writesFiles: false
    });
    expect(todoCapture).toMatchObject({
      mode: 'preview',
      draftRoadmap: expect.stringContaining('统一流程字段')
    });
  });
});
