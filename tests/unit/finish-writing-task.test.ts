import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  finishWritingTask,
  renderFinishWritingTaskSummary
} from '../../src/application/finish-writing-task.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-finish-writing-task');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', 'demo');
  const tasksPath = path.join(storyPath, 'tasks.md');

  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'entities.json'), { entities: [] });
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'edges.json'), { edges: [] });
  await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyPath, 'content', 'chapter-001.md'), '# chapter-001');
  await fileSystem.writeFile(path.join(storyPath, 'scenes', 'scene-001.yaml'), `id: scene-001
chapter: chapter-001
order: 1
pov: Hero
location: Home
time: Morning
sceneGoal: Open story
conflict: Trouble arrives
outcome: Hero accepts the task
plotThread: 主线推进
readerPromise: 兑现出走承诺
relationshipChange: 主角和家人暂时决裂
worldReveal:
  factId: world.rule
  actionImpact: 主角必须绕过许可制度
  beneficiaries:
    - 管理者
  costs:
    - 主角
  violationConsequence: 被巡查者通缉
emotionalBeat: 从压抑转向决意
endingHook: 门外传来陌生敲门声
successCriteria:
  - 主角做出主动选择
allowedWrites:
  - content/chapter-001.md
draftPath: content/chapter-001.md
`);
  await fileSystem.writeFile(tasksPath, `# tasks

- [ ] [P0] [WRITE-READY] **T001** - 起草第一章
  - **任务类型**：正文写作
  - **核心任务**：完成开场冲突
  - **必须读取**：
    - \`specification.md\`
    - \`creative-plan.md\`
  - **允许修改**：
    - \`content/chapter-001.md\`
  - **依赖**：无
  - **输出**：\`content/chapter-001.md\`
  - **验收标准**：
    - [ ] 覆盖本章关键情节
`);

  return { projectRoot, fileSystem, storyPath, tasksPath };
};

describe('finishWritingTask', () => {
  it('previews a writing task finish without changing files', async () => {
    const { projectRoot, fileSystem, tasksPath } = await createProject();
    const before = await fileSystem.readFile(tasksPath);

    const result = await finishWritingTask({
      projectRoot,
      fileSystem,
      story: 'demo',
      taskId: 'T001',
      apply: false,
      now: () => new Date('2026-05-04T00:00:00.000Z')
    });

    expect(result.applied).toBe(false);
    expect(result.task).toMatchObject({
      id: 'T001',
      title: '起草第一章',
      statusBefore: 'todo',
      statusAfter: 'done'
    });
    expect(result.draftPaths).toEqual(['content/chapter-001.md']);
    expect(result.verificationCommands).toEqual([
      'storyspec validate',
      'storyspec style:lint demo',
      'storyspec narrative:test demo',
      'storyspec review --panel continuity'
    ]);
    expect(renderFinishWritingTaskSummary(result)).toContain('预览模式');
    expect(await fileSystem.readFile(tasksPath)).toBe(before);
  });

  it('marks the task done and refreshes the task board when applied', async () => {
    const { projectRoot, fileSystem, storyPath, tasksPath } = await createProject();

    const result = await finishWritingTask({
      projectRoot,
      fileSystem,
      story: 'demo',
      taskId: 'T001',
      apply: true,
      now: () => new Date('2026-05-04T00:00:00.000Z')
    });

    expect(result.applied).toBe(true);
    expect(result.updatedFiles).toEqual([
      tasksPath,
      path.join(storyPath, 'task-board.json')
    ]);
    expect(await fileSystem.readFile(tasksPath)).toContain('- [x] [P0] [WRITE-READY] **T001** - 起草第一章');
    const board = await fileSystem.readJson<any>(path.join(storyPath, 'task-board.json'));
    expect(board.summary).toMatchObject({ total: 1, todo: 0, done: 1 });
    expect(board.tasks[0]).toMatchObject({ id: 'T001', status: 'done' });
  });
});
