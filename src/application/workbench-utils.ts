import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import type { ScannedStoryProject } from '../validation/artifact-scanner.js';
import { scanStoryArtifacts } from '../validation/artifact-scanner.js';

export type StorySelectionErrorCode =
  | 'NO_STORIES'
  | 'STORY_NOT_FOUND'
  | 'MISSING_TASKS';

export class StorySelectionError extends Error {
  constructor(
    public readonly code: StorySelectionErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'StorySelectionError';
  }
}

export const toPosixPath = (value: string): string => value.split(path.sep).join('/');

export const unique = <T>(values: T[]): T[] => [...new Set(values.filter(Boolean))];

export const relativePath = (projectRoot: string, filePath: string): string =>
  path.isAbsolute(filePath)
    ? toPosixPath(path.relative(projectRoot, filePath))
    : toPosixPath(filePath);

const selectLatestStory = async (
  stories: ScannedStoryProject[],
  fs: ProjectFileSystem
): Promise<ScannedStoryProject> => {
  const withStats = await Promise.all(stories.map(async story => ({
    story,
    mtimeMs: (await fs.stat(story.path)).mtimeMs
  })));

  withStats.sort((left, right) => {
    if (right.mtimeMs !== left.mtimeMs) {
      return right.mtimeMs - left.mtimeMs;
    }

    return left.story.name.localeCompare(right.story.name);
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

export const selectStoryProject = async (
  projectRoot: string,
  fs: ProjectFileSystem,
  selector?: string
): Promise<ScannedStoryProject> => {
  const scan = await scanStoryArtifacts({ projectRoot, fileSystem: fs });

  if (scan.stories.length === 0) {
    throw new StorySelectionError('NO_STORIES', '项目中还没有 stories/* 故事目录');
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
    throw new StorySelectionError('STORY_NOT_FOUND', `未找到故事：${selector}`);
  }

  return story;
};

export const findStoryArtifactPath = (
  story: ScannedStoryProject,
  kind: 'specification' | 'creative-plan' | 'tasks'
): string | undefined => story.artifacts.find(artifact => artifact.kind === kind && artifact.exists)?.path;

export interface MissingTasksGuidance {
  targetPath: string;
  agentCommand: string;
  statusCommand: string;
  boardCommand: string;
  contextPackCommand: string;
  sceneInitCommand: string;
  summary: string;
}

export const buildMissingTasksGuidance = (storyName: string): MissingTasksGuidance => {
  const targetPath = `stories/${storyName}/tasks.md`;
  const boardCommand = `storyspec tasks:board ${storyName}`;
  const contextPackCommand = `storyspec context:pack ${storyName}`;

  return {
    targetPath,
    agentCommand: '/storyspec-tasks',
    statusCommand: 'storyspec status',
    boardCommand,
    contextPackCommand,
    sceneInitCommand: `storyspec scene:init ${storyName}`,
    summary: `先在 agent 中执行 \`/storyspec-tasks\`，根据 specification.md 和 creative-plan.md 生成 \`${targetPath}\`；生成后运行 \`${boardCommand}\` 检查任务看板，再运行 \`${contextPackCommand}\` 生成写作上下文。`
  };
};

export const renderMissingTasksMessage = (storyName: string): string => {
  const guidance = buildMissingTasksGuidance(storyName);
  return [
    `故事缺少 tasks.md：${storyName}`,
    guidance.summary
  ].join('\n');
};

export const requireTasksPath = (story: ScannedStoryProject): string => {
  const tasksPath = findStoryArtifactPath(story, 'tasks');
  if (!tasksPath) {
    throw new StorySelectionError('MISSING_TASKS', renderMissingTasksMessage(story.name));
  }

  return tasksPath;
};

export const normalizeProjectRelativePath = (
  projectRoot: string,
  storyPath: string,
  filePath: string
): string => {
  if (!filePath.trim()) {
    return '';
  }

  const normalized = filePath.trim();
  if (path.isAbsolute(normalized)) {
    return toPosixPath(path.relative(projectRoot, normalized));
  }

  if (
    normalized.startsWith('.specify/')
    || normalized.startsWith('spec/')
    || normalized.startsWith('stories/')
    || normalized === 'AGENTS.md'
  ) {
    return toPosixPath(normalized);
  }

  return toPosixPath(path.relative(projectRoot, path.join(storyPath, normalized)));
};

export const resolveProjectPath = (projectRoot: string, filePath: string): string =>
  path.isAbsolute(filePath) ? filePath : path.join(projectRoot, ...filePath.split('/'));

export const slugifyPathPart = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
