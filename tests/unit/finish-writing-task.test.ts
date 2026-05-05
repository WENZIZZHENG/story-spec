import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  finishWritingTask,
  renderFinishWritingTaskSummary,
  setWritingTaskStatus
} from '../../src/application/finish-writing-task.js';
import type { GitAdapter } from '../../src/application/project-ports.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createFakeGitAdapter = (status: string[] = []) => {
  const calls: { addAll: string[]; commit: Array<{ projectPath: string; message: string }> } = {
    addAll: [],
    commit: []
  };
  const adapter: GitAdapter = {
    init: async () => undefined,
    addAll: async projectPath => {
      calls.addAll.push(projectPath);
    },
    commit: async (projectPath, message) => {
      calls.commit.push({ projectPath, message });
    },
    statusShort: async () => status
  };

  return { adapter, calls };
};

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

const createProjectWithTasksMarkdown = async (tasksMarkdown: string) => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-finish-writing-task');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyPath = path.join(projectRoot, 'stories', 'demo');
  const tasksPath = path.join(storyPath, 'tasks.md');

  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'entities.json'), { entities: [] });
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'graph', 'edges.json'), { edges: [] });
  await fileSystem.writeFile(path.join(storyPath, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyPath, 'content', 'chapter-001.md'), '# chapter-001');
  await fileSystem.writeFile(tasksPath, tasksMarkdown);

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

  it('recognizes nested volume, short path and windows-style related draft paths in stable order', async () => {
    const { projectRoot, fileSystem } = await createProjectWithTasksMarkdown(`\n# tasks\n\n- [ ] [P0] [WRITE-READY] **T002** - 起草第二章\n  - **任务类型**：正文写作\n  - **核心任务**：完成中段推进\n  - **必须读取**：\n    - \`content/volume1/chapter-001.md\`\n    - \`chapter-001.md\`\n  - **允许修改**：\n    - \`content/volume-1/chapter-001.md\`\n    - \`stories/demo/content/volume1/chapter-002.md\`\n    - \`content/chapter-001.md\`\n  - **依赖**：无\n  - **输出**：\n    - \`content/volume1/chapter-001.md\`\n    - \`chapter-001.md\`\n    - \`content/volume-1/chapter-001.md\`\n    - \`stories\\\\demo\\\\content\\\\chapter-003.md\`\n`);

    const result = await finishWritingTask({
      projectRoot,
      fileSystem,
      story: 'demo',
      taskId: 'T002',
      apply: false,
      now: () => new Date('2026-05-04T00:00:00.000Z')
    });

    expect(result.draftPaths).toEqual([
      'content/volume1/chapter-001.md',
      'chapter-001.md',
      'content/volume-1/chapter-001.md',
      'stories/demo/content/chapter-003.md',
      'stories/demo/content/volume1/chapter-002.md',
      'content/chapter-001.md'
    ]);
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

  it('commits the applied task finish with a default commit message when only updated files changed', async () => {
    const { projectRoot, fileSystem, storyPath, tasksPath } = await createProject();
    const boardPath = path.join(storyPath, 'task-board.json');
    const { adapter, calls } = createFakeGitAdapter([
      'M stories/demo/tasks.md',
      '?? stories/demo/task-board.json'
    ]);

    const result = await finishWritingTask({
      projectRoot,
      fileSystem,
      gitAdapter: adapter,
      story: 'demo',
      taskId: 'T001',
      apply: true,
      commit: true,
      now: () => new Date('2026-05-04T00:00:00.000Z')
    });

    expect(result.updatedFiles).toEqual([tasksPath, boardPath]);
    expect(result.commit).toEqual({
      requested: true,
      created: true,
      message: '完成写作任务：T001 起草第一章'
    });
    expect(calls.addAll).toEqual([projectRoot]);
    expect(calls.commit).toEqual([
      {
        projectPath: projectRoot,
        message: '完成写作任务：T001 起草第一章'
      }
    ]);
  });

  it('skips commit when git status contains unrelated changes', async () => {
    const { projectRoot, fileSystem, storyPath, tasksPath } = await createProject();
    const boardPath = path.join(storyPath, 'task-board.json');
    const { adapter, calls } = createFakeGitAdapter([
      'M stories/demo/tasks.md',
      '?? stories/demo/task-board.json',
      'M README.md'
    ]);

    const result = await finishWritingTask({
      projectRoot,
      fileSystem,
      gitAdapter: adapter,
      story: 'demo',
      taskId: 'T001',
      apply: true,
      commit: true,
      commitMessage: '自定义收尾提交',
      now: () => new Date('2026-05-04T00:00:00.000Z')
    });

    expect(result.updatedFiles).toEqual([tasksPath, boardPath]);
    expect(result.commit).toEqual({
      requested: true,
      created: false,
      message: '自定义收尾提交',
      skippedReason: '存在 unrelated change：README.md'
    });
    expect(calls.addAll).toEqual([]);
    expect(calls.commit).toEqual([]);
  });

  it('blocks apply without changing task files when the related draft is missing', async () => {
    const { projectRoot, fileSystem, storyPath, tasksPath } = await createProjectWithTasksMarkdown(`# tasks

- [ ] [P0] [WRITE-READY] **T003** - 起草缺失章节
  - **任务类型**：正文写作
  - **核心任务**：完成缺失章节
  - **允许修改**：
    - \`content/chapter-404.md\`
  - **输出**：\`content/chapter-404.md\`
`);
    const before = await fileSystem.readFile(tasksPath);

    const result = await finishWritingTask({
      projectRoot,
      fileSystem,
      story: 'demo',
      taskId: 'T003',
      apply: true,
      now: () => new Date('2026-05-05T00:00:00.000Z')
    });

    expect(result).toMatchObject({
      applied: false,
      blocked: true,
      task: {
        statusBefore: 'todo',
        statusAfter: 'todo'
      },
      blockedReasons: ['关联正文缺失：content/chapter-404.md'],
      updatedFiles: []
    });
    expect(result.checks).toEqual([
      expect.objectContaining({
        id: 'related-drafts-exist',
        status: 'failed',
        paths: ['content/chapter-404.md']
      })
    ]);
    expect(result.nextActions).toContain('先补写缺失正文，再重新运行 task:finish --apply');
    expect(await fileSystem.readFile(tasksPath)).toBe(before);
    expect(await fileSystem.pathExists(path.join(storyPath, 'task-board.json'))).toBe(false);
  });

  it('does not rewrite tasks markdown or task board when the task is already done', async () => {
    const { projectRoot, fileSystem, storyPath, tasksPath } = await createProject();

    await finishWritingTask({
      projectRoot,
      fileSystem,
      story: 'demo',
      taskId: 'T001',
      apply: true,
      now: () => new Date('2026-05-04T00:00:00.000Z')
    });
    const tasksAfterFirstRun = await fileSystem.readFile(tasksPath);
    const boardAfterFirstRun = await fileSystem.readFile(path.join(storyPath, 'task-board.json'));

    const result = await finishWritingTask({
      projectRoot,
      fileSystem,
      story: 'demo',
      taskId: 'T001',
      apply: true,
      now: () => new Date('2026-05-05T00:00:00.000Z')
    });

    expect(result.updatedFiles).toEqual([]);
    expect(result.task).toMatchObject({
      statusBefore: 'done',
      statusAfter: 'done'
    });
    expect(await fileSystem.readFile(tasksPath)).toBe(tasksAfterFirstRun);
    expect(await fileSystem.readFile(path.join(storyPath, 'task-board.json'))).toBe(boardAfterFirstRun);
  });

  it('sets a writing task status in both directions through one idempotent helper', async () => {
    const { projectRoot, fileSystem, storyPath, tasksPath } = await createProject();

    const done = await setWritingTaskStatus({
      projectRoot,
      fileSystem,
      story: 'demo',
      taskId: 'T001',
      status: 'done',
      now: () => new Date('2026-05-04T00:00:00.000Z')
    });

    expect(done.changed).toBe(true);
    expect(done.updatedFiles).toEqual([
      tasksPath,
      path.join(storyPath, 'task-board.json')
    ]);
    expect(await fileSystem.readFile(tasksPath)).toContain('- [x] [P0] [WRITE-READY] **T001** - 起草第一章');

    const todo = await setWritingTaskStatus({
      projectRoot,
      fileSystem,
      story: 'demo',
      taskId: 'T001',
      status: 'todo',
      now: () => new Date('2026-05-04T00:10:00.000Z')
    });

    expect(todo.changed).toBe(true);
    expect(await fileSystem.readFile(tasksPath)).toContain('- [ ] [P0] [WRITE-READY] **T001** - 起草第一章');

    const todoAgain = await setWritingTaskStatus({
      projectRoot,
      fileSystem,
      story: 'demo',
      taskId: 'T001',
      status: 'todo',
      now: () => new Date('2026-05-05T00:00:00.000Z')
    });

    expect(todoAgain.changed).toBe(false);
    expect(todoAgain.updatedFiles).toEqual([]);
  });

  it('renders a single-screen finish summary with missing values shown as 无', () => {
    const summary = renderFinishWritingTaskSummary({
      projectRoot: '/project',
      story: 'demo',
      storyPath: '/project/stories/demo',
      applied: false,
      blocked: false,
      task: {
        id: 'T001',
        title: '起草第一章',
        statusBefore: 'todo',
        statusAfter: 'done',
        tasksPath: '/project/stories/demo/tasks.md',
        draftPaths: []
      },
      draftPaths: [],
      checks: [],
      blockedReasons: [],
      nextActions: [],
      verificationCommands: [],
      updatedFiles: []
    });

    expect(summary).toContain('故事：demo');
    expect(summary).toContain('任务：T001 起草第一章');
    expect(summary).toContain('状态：todo -> done');
    expect(summary).toContain('正文/草稿路径：无');
    expect(summary).toContain('门禁状态：通过');
    expect(summary).toContain('验证命令：无');
    expect(summary).toContain('更新文件：无');
    expect(summary).toContain('预览模式');
  });
});
