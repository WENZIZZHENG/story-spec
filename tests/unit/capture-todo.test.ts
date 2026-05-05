import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  captureTodo,
  renderTodoCaptureSummary
} from '../../src/application/capture-todo.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-capture-todo');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const indexPath = path.join(projectRoot, 'docs', 'tech', 'todo-index.md');

  await fileSystem.writeFile(indexPath, `# 待办统一入口

## 当前待办

| 优先级 | 路线 | 状态 | 覆盖范围 | 下一步 |
| --- | --- | --- | --- | --- |
| P0 | [章节与维护自动化增强路线图](chapter-maintenance-automation-roadmap.md) | Active | 维护命令 | 优先推进 |

## 使用方式

1. 开始新开发前，先读本文确认当前活跃路线。
`);

  return { projectRoot, fileSystem, indexPath };
};

describe('captureTodo', () => {
  it('previews a governed roadmap draft without writing files', async () => {
    const { projectRoot, fileSystem, indexPath } = await createProject();
    const before = await fileSystem.readFile(indexPath);

    const result = await captureTodo({
      projectRoot,
      fileSystem,
      topic: '协作体验',
      notes: '补齐首屏入口\n需要保留作者确认'
    });

    expect(result).toMatchObject({
      topic: '协作体验',
      slug: 'topic',
      mode: 'preview',
      blocked: false,
      roadmapPath: 'docs/tech/topic-roadmap.md',
      indexPath: 'docs/tech/todo-index.md',
      wouldWrite: [
        'docs/tech/topic-roadmap.md',
        'docs/tech/todo-index.md'
      ],
      updatedFiles: []
    });
    expect(result.draftRoadmap).toContain('# 协作体验路线图');
    expect(result.draftRoadmap).toContain('- 补齐首屏入口');
    expect(result.draftRoadmap).toContain('- 需要保留作者确认');
    expect(result.draftRoadmap).toContain('待人工确认');
    expect(result.indexPatchPreview).toBe('| P1 | [协作体验路线图](topic-roadmap.md) | Active | 待人工确认；来自 `todo:capture` 草案 | 先人工校准草案，再将首个任务转为 OpenSpec |');
    expect(renderTodoCaptureSummary(result)).toContain('预览模式');
    expect(await fileSystem.readFile(indexPath)).toBe(before);
    await expect(fileSystem.pathExists(path.join(projectRoot, 'docs', 'tech', 'topic-roadmap.md'))).resolves.toBe(false);
  });

  it('applies a roadmap draft and appends it to todo-index', async () => {
    const { projectRoot, fileSystem, indexPath } = await createProject();

    const result = await captureTodo({
      projectRoot,
      fileSystem,
      topic: 'todo capture',
      notes: '从讨论捕获长期路线',
      apply: true
    });

    const roadmapPath = path.join(projectRoot, 'docs', 'tech', 'todo-capture-roadmap.md');
    expect(result).toMatchObject({
      mode: 'apply',
      blocked: false,
      slug: 'todo-capture',
      roadmapPath: 'docs/tech/todo-capture-roadmap.md',
      updatedFiles: [
        roadmapPath,
        indexPath
      ]
    });
    await expect(fileSystem.readFile(roadmapPath)).resolves.toContain('# todo capture 路线图');
    const index = await fileSystem.readFile(indexPath);
    expect(index).toContain('| P1 | [todo capture 路线图](todo-capture-roadmap.md) | Active | 待人工确认；来自 `todo:capture` 草案 | 先人工校准草案，再将首个任务转为 OpenSpec |');
  });

  it('blocks apply when the target roadmap already exists', async () => {
    const { projectRoot, fileSystem, indexPath } = await createProject();
    await fileSystem.writeFile(path.join(projectRoot, 'docs', 'tech', 'todo-capture-roadmap.md'), '# existing');
    const indexBefore = await fileSystem.readFile(indexPath);

    const result = await captureTodo({
      projectRoot,
      fileSystem,
      topic: 'todo capture',
      notes: '从讨论捕获长期路线',
      apply: true
    });

    expect(result).toMatchObject({
      mode: 'apply',
      blocked: true,
      blockedReasons: ['目标路线已存在：docs/tech/todo-capture-roadmap.md'],
      updatedFiles: []
    });
    expect(await fileSystem.readFile(indexPath)).toBe(indexBefore);
  });

  it('blocks ambiguous or missing note sources without writing files', async () => {
    const { projectRoot, fileSystem, indexPath } = await createProject();
    const before = await fileSystem.readFile(indexPath);

    await expect(captureTodo({
      projectRoot,
      fileSystem,
      topic: '协作体验',
      notes: '',
      apply: true
    })).resolves.toMatchObject({
      blocked: true,
      blockedReasons: ['缺少 notes：请使用 --from <path> 或 --notes <text> 提供待办来源']
    });

    await fileSystem.writeFile(path.join(projectRoot, 'notes.md'), 'notes from file');
    await expect(captureTodo({
      projectRoot,
      fileSystem,
      topic: '协作体验',
      from: 'notes.md',
      notes: 'inline notes',
      apply: true
    })).resolves.toMatchObject({
      blocked: true,
      blockedReasons: ['只能提供一个 notes 来源：--from 或 --notes 二选一']
    });

    expect(await fileSystem.readFile(indexPath)).toBe(before);
  });

  it('reads notes from a file during preview', async () => {
    const { projectRoot, fileSystem } = await createProject();
    await fileSystem.writeFile(path.join(projectRoot, 'capture-notes.md'), '从文件捕获路线');

    const result = await captureTodo({
      projectRoot,
      fileSystem,
      topic: 'file notes',
      from: 'capture-notes.md'
    });

    expect(result.blocked).toBe(false);
    expect(result.draftRoadmap).toContain('- 从文件捕获路线');
  });
});
