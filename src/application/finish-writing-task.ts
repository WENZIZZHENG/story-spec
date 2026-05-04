import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import { exportTaskBoard } from './export-task-board.js';
import { parseWritingTasksFromMarkdown, type WritingTask } from '../domain/story-artifact.js';
import { selectStoryProject } from './workbench-utils.js';

export interface FinishWritingTaskInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  taskId: string;
  apply?: boolean;
  now?: () => Date;
}

export interface FinishWritingTaskTaskResult {
  id: string;
  title: string;
  statusBefore: WritingTask['status'];
  statusAfter: WritingTask['status'];
  tasksPath: string;
  draftPaths: string[];
}

export interface FinishWritingTaskResult {
  projectRoot: string;
  story: string;
  storyPath: string;
  applied: boolean;
  task: FinishWritingTaskTaskResult;
  draftPaths: string[];
  verificationCommands: string[];
  updatedFiles: string[];
}

export interface SetWritingTaskStatusInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  taskId: string;
  status: WritingTask['status'];
  now?: () => Date;
}

export interface SetWritingTaskStatusResult {
  projectRoot: string;
  story: string;
  storyPath: string;
  taskId: string;
  statusBefore: WritingTask['status'];
  statusAfter: WritingTask['status'];
  changed: boolean;
  updatedFiles: string[];
}

const normalizeToPosix = (value: string): string => value.split(path.sep).join('/');

const taskBoardOutputPath = (storyPath: string): string => path.join(storyPath, 'task-board.json');

const writeTasksMarkdown = (
  content: string,
  taskId: string,
  status: WritingTask['status']
): string => {
  const escapedTaskId = taskId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const taskLinePattern = new RegExp(`^(\\s*-\\s*)\\[\\s*[ xX]\\s*\\](.*(?:\\*\\*)?${escapedTaskId}(?:\\*\\*)?\\s*-\\s*.+)$`, 'm');
  const marker = status === 'done' ? 'x' : ' ';

  return content.replace(taskLinePattern, `$1[${marker}]$2`);
};

const readStoryTasks = async (
  projectRoot: string,
  fileSystem: ProjectFileSystem,
  story?: string
): Promise<{ storyPath: string; tasksPath: string; tasks: WritingTask[]; tasksMarkdown: string }> => {
  const selectedStory = await selectStoryProject(projectRoot, fileSystem, story);
  const tasksPath = selectedStory.artifacts.find(artifact => artifact.kind === 'tasks' && artifact.exists)?.path;
  if (!tasksPath) {
    throw new Error(`缺少 tasks.md：${selectedStory.name}`);
  }

  const tasksMarkdown = await fileSystem.readFile(tasksPath);
  const tasks = parseWritingTasksFromMarkdown(tasksMarkdown, {
    storyPath: selectedStory.path,
    tasksPath
  });

  return {
    storyPath: selectedStory.path,
    tasksPath,
    tasks,
    tasksMarkdown
  };
};

const relatedDraftPaths = (task: WritingTask): string[] => [
  ...task.outputs,
  ...task.allowedWrites,
  ...task.requiredReads
]
  .map(item => normalizeToPosix(item))
  .filter(item => /content\/chapter-\d+\.md$/.test(item))
  .filter((item, index, items) => items.indexOf(item) === index);

export const finishWritingTask = async (
  input: FinishWritingTaskInput
): Promise<FinishWritingTaskResult> => {
  const { storyPath, tasksPath, tasks, tasksMarkdown } = await readStoryTasks(
    input.projectRoot,
    input.fileSystem,
    input.story
  );

  const task = tasks.find(item => item.id === input.taskId);
  if (!task) {
    throw new Error(`未找到任务：${input.taskId}`);
  }

  const draftPaths = relatedDraftPaths(task);
  const verificationCommands = [
    'storyspec validate',
    `storyspec style:lint ${path.basename(storyPath)}`,
    `storyspec narrative:test ${path.basename(storyPath)}`,
    'storyspec review --panel continuity'
  ];

  const updatedFiles: string[] = [];

  if (input.apply) {
    const statusResult = await setWritingTaskStatus({
      projectRoot: input.projectRoot,
      fileSystem: input.fileSystem,
      story: input.story,
      taskId: input.taskId,
      status: 'done',
      now: input.now
    });
    updatedFiles.push(...statusResult.updatedFiles);
  }

  return {
    projectRoot: input.projectRoot,
    story: path.basename(storyPath),
    storyPath,
    applied: Boolean(input.apply),
    task: {
      id: task.id,
      title: task.title,
      statusBefore: task.status,
      statusAfter: task.status === 'todo' ? 'done' : task.status,
      tasksPath,
      draftPaths
    },
    draftPaths,
    verificationCommands,
    updatedFiles
  };
};

export const setWritingTaskStatus = async (
  input: SetWritingTaskStatusInput
): Promise<SetWritingTaskStatusResult> => {
  const { storyPath, tasksPath, tasks, tasksMarkdown } = await readStoryTasks(
    input.projectRoot,
    input.fileSystem,
    input.story
  );
  const task = tasks.find(item => item.id === input.taskId);
  if (!task) {
    throw new Error(`未找到任务：${input.taskId}`);
  }

  const updatedTaskMarkdown = writeTasksMarkdown(tasksMarkdown, input.taskId, input.status);
  const updatedFiles: string[] = [];

  if (updatedTaskMarkdown !== tasksMarkdown) {
    await input.fileSystem.writeFile(tasksPath, updatedTaskMarkdown);
    updatedFiles.push(tasksPath);
  }

  const boardResult = await exportTaskBoard({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem,
    story: input.story,
    output: taskBoardOutputPath(storyPath),
    write: true,
    now: input.now
  });
  if (boardResult.outputPath && boardResult.written) {
    updatedFiles.push(boardResult.outputPath);
  }

  return {
    projectRoot: input.projectRoot,
    story: path.basename(storyPath),
    storyPath,
    taskId: input.taskId,
    statusBefore: task.status,
    statusAfter: input.status,
    changed: updatedFiles.length > 0,
    updatedFiles
  };
};

export const renderFinishWritingTaskSummary = (result: FinishWritingTaskResult): string => [
  '章节收尾',
  '',
  `故事：${result.story}`,
  `任务：${result.task.id} ${result.task.title}`,
  `状态：${result.task.statusBefore} -> ${result.task.statusAfter}`,
  `草稿：${result.task.draftPaths.length}`,
  `模式：${result.applied ? '应用模式' : '预览模式'}`
].join('\n');
