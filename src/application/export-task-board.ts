import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import type { ScannedStoryProject } from '../validation/artifact-scanner.js';
import { scanStoryArtifacts } from '../validation/artifact-scanner.js';
import type { WritingTask, WritingTaskStatus } from '../domain/story-artifact.js';

export type TaskBoardExportErrorCode =
  | 'NO_STORIES'
  | 'STORY_NOT_FOUND'
  | 'MISSING_TASKS';

export class TaskBoardExportError extends Error {
  constructor(
    public readonly code: TaskBoardExportErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'TaskBoardExportError';
  }
}

export interface TaskBoardColumn {
  id: WritingTaskStatus;
  title: string;
  taskIds: string[];
}

export interface TaskBoardIssueDraft {
  title: string;
  body: string;
  labels: string[];
}

export interface TaskBoardTask {
  id: string;
  title: string;
  status: WritingTaskStatus;
  priority: string;
  writeReady: boolean;
  planOnly: boolean;
  taskType?: string;
  coreTask?: string;
  dependencies: string[];
  outputs: string[];
  requiredReads: string[];
  allowedWrites: string[];
  clues: string[];
  acceptanceCriteria: string[];
  labels: string[];
  githubIssue: TaskBoardIssueDraft;
}

export interface TaskBoard {
  schemaVersion: '1.0';
  generatedAt: string;
  projectRoot: string;
  story: {
    name: string;
    path: string;
    tasksPath: string;
  };
  summary: {
    total: number;
    todo: number;
    done: number;
    writeReady: number;
    planOnly: number;
  };
  columns: TaskBoardColumn[];
  tasks: TaskBoardTask[];
}

export interface ExportTaskBoardInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  output?: string;
  write?: boolean;
  now?: () => Date;
}

export interface ExportTaskBoardResult {
  board: TaskBoard;
  outputPath?: string;
}

const STATUS_TITLES: Record<WritingTaskStatus, string> = {
  todo: '待办',
  done: '已完成'
};

const toPosixPath = (value: string): string => value.split(path.sep).join('/');

const toRelativePath = (projectRoot: string, filePath: string): string => {
  const relativePath = path.relative(projectRoot, filePath);
  return toPosixPath(relativePath || '.');
};

const listOrNone = (items: string[]): string => {
  if (items.length === 0) {
    return '- 无';
  }

  return items.map(item => `- \`${item}\``).join('\n');
};

const createLabels = (task: WritingTask): string[] => [
  `priority:${task.priority}`,
  `status:${task.status}`,
  ...(task.writeReady ? ['write-ready'] : []),
  ...(task.planOnly ? ['plan-only'] : []),
  ...task.clues.map(clue => `clue:${clue}`)
];

const createIssueDraft = (
  task: WritingTask,
  projectRoot: string,
  labels: string[]
): TaskBoardIssueDraft => {
  const body = [
    `来源任务：\`${toRelativePath(projectRoot, task.tasksPath)}#${task.id}\``,
    '',
    `状态：${task.status}`,
    `优先级：${task.priority}`,
    `写作就绪：${task.writeReady ? '是' : '否'}`,
    `仅规划：${task.planOnly ? '是' : '否'}`,
    '',
    '依赖：',
    listOrNone(task.dependencies),
    '',
    '必须读取：',
    listOrNone(task.requiredReads),
    '',
    '允许修改：',
    listOrNone(task.allowedWrites),
    '',
    '输出：',
    listOrNone(task.outputs),
    '',
    '验收标准：',
    task.acceptanceCriteria.length > 0
      ? task.acceptanceCriteria.map(item => `- [ ] ${item}`).join('\n')
      : '- [ ] 按任务说明完成并更新状态'
  ].join('\n');

  return {
    title: `[${task.priority}] ${task.id} ${task.title}`,
    body,
    labels
  };
};

const toBoardTask = (task: WritingTask, projectRoot: string): TaskBoardTask => {
  const labels = createLabels(task);

  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    writeReady: task.writeReady,
    planOnly: task.planOnly,
    taskType: task.taskType,
    coreTask: task.coreTask,
    dependencies: task.dependencies,
    outputs: task.outputs,
    requiredReads: task.requiredReads,
    allowedWrites: task.allowedWrites,
    clues: task.clues,
    acceptanceCriteria: task.acceptanceCriteria,
    labels,
    githubIssue: createIssueDraft(task, projectRoot, labels)
  };
};

const selectLatestStory = async (
  stories: ScannedStoryProject[],
  fs: ProjectFileSystem
): Promise<ScannedStoryProject> => {
  const withStats = await Promise.all(stories.map(async story => ({
    story,
    mtimeMs: (await fs.stat(story.path)).mtimeMs
  })));

  withStats.sort((a, b) => {
    if (b.mtimeMs !== a.mtimeMs) {
      return b.mtimeMs - a.mtimeMs;
    }

    return a.story.name.localeCompare(b.story.name);
  });

  return withStats[0].story;
};

const normalizeStorySelector = (projectRoot: string, selector: string): string[] => {
  const trimmed = selector.trim();
  const resolved = path.isAbsolute(trimmed)
    ? path.resolve(trimmed)
    : path.resolve(projectRoot, trimmed);

  return [
    trimmed,
    toPosixPath(trimmed),
    resolved,
    toPosixPath(path.relative(projectRoot, resolved))
  ];
};

const selectStory = async (
  projectRoot: string,
  fs: ProjectFileSystem,
  selector?: string
): Promise<ScannedStoryProject> => {
  const scan = await scanStoryArtifacts({ projectRoot, fileSystem: fs });

  if (scan.stories.length === 0) {
    throw new TaskBoardExportError('NO_STORIES', '项目中还没有 stories/* 故事目录');
  }

  if (!selector) {
    return selectLatestStory(scan.stories, fs);
  }

  const candidates = normalizeStorySelector(projectRoot, selector);
  const story = scan.stories.find(item =>
    candidates.includes(item.name)
    || candidates.includes(item.path)
    || candidates.includes(toPosixPath(path.relative(projectRoot, item.path)))
  );

  if (!story) {
    throw new TaskBoardExportError('STORY_NOT_FOUND', `未找到故事：${selector}`);
  }

  return story;
};

const assertTasksFile = (story: ScannedStoryProject): string => {
  const tasksArtifact = story.artifacts.find(artifact => artifact.kind === 'tasks');
  if (!tasksArtifact?.exists) {
    throw new TaskBoardExportError('MISSING_TASKS', `故事缺少 tasks.md：${story.name}`);
  }

  return tasksArtifact.path;
};

const createColumns = (tasks: TaskBoardTask[]): TaskBoardColumn[] => (
  (Object.keys(STATUS_TITLES) as WritingTaskStatus[]).map(status => ({
    id: status,
    title: STATUS_TITLES[status],
    taskIds: tasks.filter(task => task.status === status).map(task => task.id)
  }))
);

const createTaskBoard = (
  projectRoot: string,
  story: ScannedStoryProject,
  tasksPath: string,
  now: () => Date
): TaskBoard => {
  const tasks = story.tasks.map(task => toBoardTask(task, projectRoot));

  return {
    schemaVersion: '1.0',
    generatedAt: now().toISOString(),
    projectRoot,
    story: {
      name: story.name,
      path: story.path,
      tasksPath
    },
    summary: {
      total: tasks.length,
      todo: tasks.filter(task => task.status === 'todo').length,
      done: tasks.filter(task => task.status === 'done').length,
      writeReady: tasks.filter(task => task.writeReady).length,
      planOnly: tasks.filter(task => task.planOnly).length
    },
    columns: createColumns(tasks),
    tasks
  };
};

export const exportTaskBoard = async (
  input: ExportTaskBoardInput
): Promise<ExportTaskBoardResult> => {
  const { projectRoot, fileSystem: fs } = input;
  const story = await selectStory(projectRoot, fs, input.story);
  const tasksPath = assertTasksFile(story);
  const board = createTaskBoard(projectRoot, story, tasksPath, input.now ?? (() => new Date()));

  if (input.write === false) {
    return { board };
  }

  const outputPath = input.output
    ? path.resolve(projectRoot, input.output)
    : path.join(story.path, 'task-board.json');

  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeJson(outputPath, board, { spaces: 2 });

  return { board, outputPath };
};

export const renderTaskBoardExportSummary = (result: ExportTaskBoardResult): string => {
  const { board } = result;
  const lines = [
    'Novel Writer 任务看板',
    '',
    `故事：${board.story.name}`,
    `任务：${board.summary.total}（待办 ${board.summary.todo} / 已完成 ${board.summary.done}）`,
    `写作就绪：${board.summary.writeReady}`,
    `GitHub issue 草稿：${board.tasks.length}`
  ];

  if (result.outputPath) {
    lines.push(`输出：${result.outputPath}`);
  }

  return lines.join('\n');
};
