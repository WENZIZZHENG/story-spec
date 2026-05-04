import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getMaintenanceContext,
  renderMaintenanceContext
} from '../../src/application/maintenance-context.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-maintenance-context');
  const fileSystem = new MemoryFileSystem(projectRoot);

  await fileSystem.writeFile(path.join(projectRoot, 'docs', 'tech', 'todo-index.md'), `# 待办统一入口

## 当前待办

| 路线 | 状态 | 当前优先级 | 下一步 |
| --- | --- | --- | --- |
| [章节生产流程优化](chapter-production-workflow-roadmap.md) | Planned | P0 | 先实现 Scene Card 路径语义校验与自动修复。 |
`);

  return { projectRoot, fileSystem };
};

describe('getMaintenanceContext', () => {
  it('summarizes todo maintenance context without reading long documents', async () => {
    const { projectRoot, fileSystem } = await createProject();

    const result = await getMaintenanceContext({
      projectRoot,
      fileSystem,
      topic: 'todo',
      brief: true
    });

    expect(result).toMatchObject({
      topic: 'todo',
      brief: true,
      files: ['docs/tech/todo-index.md']
    });
    expect(result.activeRoutes).toEqual([
      {
        title: '章节生产流程优化',
        path: 'docs/tech/chapter-production-workflow-roadmap.md',
        status: 'Planned',
        priority: 'P0',
        nextStep: '先实现 Scene Card 路径语义校验与自动修复。'
      }
    ]);
    expect(result.rules.length).toBeLessThanOrEqual(5);
    expect(result.commands).toContain('git diff --check');
    expect(renderMaintenanceContext(result)).toContain('章节生产流程优化');
  });

  it('rejects unknown maintenance topics', async () => {
    const { projectRoot, fileSystem } = await createProject();

    await expect(getMaintenanceContext({
      projectRoot,
      fileSystem,
      topic: 'unknown'
    })).rejects.toThrow('未知维护主题');
  });
});
