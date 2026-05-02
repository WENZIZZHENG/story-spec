import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import type { ScannedStoryProject } from '../validation/artifact-scanner.js';
import { scanStoryArtifacts, type ArtifactIssue } from '../validation/artifact-scanner.js';
import type { StoryArtifact, WritingTask } from '../domain/story-artifact.js';

export type HandoffGenerationErrorCode =
  | 'NO_STORIES'
  | 'STORY_NOT_FOUND'
  | 'MISSING_TASKS';

export class HandoffGenerationError extends Error {
  constructor(
    public readonly code: HandoffGenerationErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'HandoffGenerationError';
  }
}

export interface HandoffTask {
  id: string;
  title: string;
  priority: string;
  writeReady: boolean;
  planOnly: boolean;
  dependencies: string[];
  outputs: string[];
  requiredReads: string[];
  allowedWrites: string[];
  acceptanceCriteria: string[];
}

export interface HandoffContext {
  schemaVersion: '1.0';
  generatedAt: string;
  projectRoot: string;
  story: {
    name: string;
    path: string;
    specificationPath?: string;
    creativePlanPath?: string;
    tasksPath: string;
  };
  currentChapter: {
    path: string | null;
    source: 'next-task-output' | 'latest-content' | 'none';
    exists: boolean;
    chars: number;
    taskId?: string;
  };
  nextTask: HandoffTask | null;
  unfinishedTasks: HandoffTask[];
  mustReadFiles: string[];
  allowedWriteFiles: string[];
  riskBoundaries: string[];
  blockers: ArtifactIssue[];
}

export interface GenerateHandoffInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  output?: string;
  write?: boolean;
  now?: () => Date;
}

export interface GenerateHandoffResult {
  context: HandoffContext;
  markdown: string;
  outputPath?: string;
}

interface ContentFile {
  path: string;
  mtimeMs: number;
  chars: number;
}

const toPosixPath = (value: string): string => value.split(path.sep).join('/');

const unique = (values: string[]): string[] => [...new Set(values.filter(Boolean))];

const artifactPath = (
  story: ScannedStoryProject,
  kind: StoryArtifact['kind']
): string | undefined => story.artifacts.find(artifact => artifact.kind === kind && artifact.exists)?.path;

const visibleCharCount = (content: string): number => content
  .replace(/```[\s\S]*?```/g, '')
  .replace(/[#>*_`\-\[\]()]/g, '')
  .replace(/\s+/g, '')
  .length;

const listMarkdownFiles = async (
  fs: ProjectFileSystem,
  dirPath: string
): Promise<string[]> => {
  if (!await fs.pathExists(dirPath)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of await fs.readDir(dirPath)) {
    const entryPath = path.join(dirPath, entry);
    const stat = await fs.stat(entryPath);
    if (stat.isDirectory()) {
      files.push(...await listMarkdownFiles(fs, entryPath));
    } else if (stat.isFile() && entry.endsWith('.md')) {
      files.push(entryPath);
    }
  }

  return files.sort();
};

const normalizeProjectRelativePath = (
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

const normalizeTaskPaths = (
  task: WritingTask,
  projectRoot: string,
  storyPath: string
): HandoffTask => ({
  id: task.id,
  title: task.title,
  priority: task.priority,
  writeReady: task.writeReady,
  planOnly: task.planOnly,
  dependencies: task.dependencies,
  outputs: task.outputs.map(item => normalizeProjectRelativePath(projectRoot, storyPath, item)),
  requiredReads: task.requiredReads.map(item => normalizeProjectRelativePath(projectRoot, storyPath, item)),
  allowedWrites: task.allowedWrites.map(item => normalizeProjectRelativePath(projectRoot, storyPath, item)),
  acceptanceCriteria: task.acceptanceCriteria
});

const isChapterLikePath = (filePath: string): boolean => {
  const normalized = toPosixPath(filePath).toLowerCase();
  return normalized.endsWith('.md')
    && (normalized.startsWith('content/') || normalized.includes('/content/'))
    && /(?:chapter|第|chap|ch[-_ ]?\d+)/i.test(path.basename(normalized));
};

const readContentFile = async (
  fs: ProjectFileSystem,
  filePath: string
): Promise<ContentFile> => {
  const [stat, content] = await Promise.all([
    fs.stat(filePath),
    fs.readFile(filePath)
  ]);

  return {
    path: filePath,
    mtimeMs: stat.mtimeMs,
    chars: visibleCharCount(content)
  };
};

const findCurrentChapter = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  story: ScannedStoryProject,
  nextTask: WritingTask | undefined
): Promise<HandoffContext['currentChapter']> => {
  const nextOutput = nextTask?.outputs.find(isChapterLikePath);
  if (nextOutput && nextTask) {
    const absolutePath = path.join(story.path, nextOutput);
    const exists = await fs.pathExists(absolutePath);
    const chars = exists ? visibleCharCount(await fs.readFile(absolutePath)) : 0;

    return {
      path: toPosixPath(path.relative(projectRoot, absolutePath)),
      source: 'next-task-output',
      exists,
      chars,
      taskId: nextTask.id
    };
  }

  const contentFiles = await Promise.all(
    (await listMarkdownFiles(fs, path.join(story.path, 'content'))).map(file => readContentFile(fs, file))
  );
  const latest = contentFiles.sort((a, b) => b.mtimeMs - a.mtimeMs)[0];

  if (!latest) {
    return {
      path: null,
      source: 'none',
      exists: false,
      chars: 0
    };
  }

  return {
    path: toPosixPath(path.relative(projectRoot, latest.path)),
    source: 'latest-content',
    exists: true,
    chars: latest.chars
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
    throw new HandoffGenerationError('NO_STORIES', '项目中还没有 stories/* 故事目录');
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
    throw new HandoffGenerationError('STORY_NOT_FOUND', `未找到故事：${selector}`);
  }

  return story;
};

const requireTasksPath = (story: ScannedStoryProject): string => {
  const tasksPath = artifactPath(story, 'tasks');
  if (!tasksPath) {
    throw new HandoffGenerationError('MISSING_TASKS', `故事缺少 tasks.md：${story.name}`);
  }

  return tasksPath;
};

const buildRiskBoundaries = (
  nextTask: WritingTask | undefined,
  blockers: ArtifactIssue[]
): string[] => {
  const boundaries = [
    '写作前先读取“必须读取”列表中的文件，确认规格、计划、任务边界和 AGENTS.md 约定。',
    '默认只修改“允许修改”列表中的文件；新增正文文件应来自下一任务的输出路径。',
    '涉及高风险或成人向情节时，先按 AGENTS.md、specification.md 与 creative-plan.md 的边界处理，不在 handoff.md 中展开正文。'
  ];

  if (nextTask?.planOnly) {
    boundaries.push('下一任务标记为 PLAN-ONLY，应继续规划或整理设定，不应直接写正文。');
  }

  if (nextTask && !nextTask.writeReady) {
    boundaries.push('下一任务未标记 WRITE-READY，写正文前应补齐任务边界或验收标准。');
  }

  if (blockers.length > 0) {
    boundaries.push('存在 artifact blocker，继续写作前优先处理缺失产物或结构问题。');
  }

  return boundaries;
};

const buildContext = async (
  projectRoot: string,
  fs: ProjectFileSystem,
  story: ScannedStoryProject,
  now: () => Date
): Promise<HandoffContext> => {
  const tasksPath = requireTasksPath(story);
  const unfinished = story.tasks.filter(task => task.status === 'todo');
  const nextTask = unfinished[0];
  const nextHandoffTask = nextTask ? normalizeTaskPaths(nextTask, projectRoot, story.path) : null;
  const unfinishedTasks = unfinished.map(task => normalizeTaskPaths(task, projectRoot, story.path));
  const specificationPath = artifactPath(story, 'specification');
  const creativePlanPath = artifactPath(story, 'creative-plan');
  const baseMustRead = await Promise.all([
    path.join(projectRoot, 'AGENTS.md'),
    path.join(projectRoot, '.specify', 'memory', 'constitution.md')
  ].map(async file => await fs.pathExists(file) ? toPosixPath(path.relative(projectRoot, file)) : ''));
  const mustReadFiles = unique([
    ...baseMustRead,
    specificationPath ? toPosixPath(path.relative(projectRoot, specificationPath)) : '',
    creativePlanPath ? toPosixPath(path.relative(projectRoot, creativePlanPath)) : '',
    toPosixPath(path.relative(projectRoot, tasksPath)),
    ...unfinishedTasks.flatMap(task => task.requiredReads)
  ]);
  const allowedWriteFiles = unique(unfinishedTasks.flatMap(task => [
    ...task.allowedWrites,
    ...task.outputs
  ]));
  const currentChapter = await findCurrentChapter(fs, projectRoot, story, nextTask);
  const blockers = story.issues.filter(issue => issue.severity !== 'info');

  return {
    schemaVersion: '1.0',
    generatedAt: now().toISOString(),
    projectRoot,
    story: {
      name: story.name,
      path: story.path,
      specificationPath,
      creativePlanPath,
      tasksPath
    },
    currentChapter,
    nextTask: nextHandoffTask,
    unfinishedTasks,
    mustReadFiles,
    allowedWriteFiles,
    riskBoundaries: buildRiskBoundaries(nextTask, blockers),
    blockers
  };
};

const checkList = (items: string[]): string => {
  if (items.length === 0) {
    return '- 无';
  }

  return items.map(item => `- [ ] \`${item}\``).join('\n');
};

const bulletList = (items: string[]): string => {
  if (items.length === 0) {
    return '- 无';
  }

  return items.map(item => `- ${item}`).join('\n');
};

const tableCell = (value: string): string => value.replace(/\|/g, '\\|');

const renderTasksTable = (tasks: HandoffTask[]): string => {
  if (tasks.length === 0) {
    return '暂无未完成任务。';
  }

  return [
    '| ID | 优先级 | 标记 | 标题 | 依赖 | 输出 |',
    '|----|--------|------|------|------|------|',
    ...tasks.map(task => {
      const flags = [
        task.writeReady ? 'WRITE-READY' : '',
        task.planOnly ? 'PLAN-ONLY' : ''
      ].filter(Boolean).join(', ') || '-';

      return [
        `\`${task.id}\``,
        task.priority,
        flags,
        tableCell(task.title),
        task.dependencies.length > 0 ? task.dependencies.join(', ') : '-',
        task.outputs.length > 0 ? task.outputs.map(item => `\`${item}\``).join('<br>') : '-'
      ].join(' | ');
    }).map(row => `| ${row} |`)
  ].join('\n');
};

const renderNextTask = (task: HandoffTask | null): string[] => {
  if (!task) {
    return ['下一任务：暂无未完成任务'];
  }

  return [
    `下一任务：\`${task.id}\` ${task.title}`,
    `优先级：${task.priority}`,
    `标记：${[
      task.writeReady ? 'WRITE-READY' : '',
      task.planOnly ? 'PLAN-ONLY' : ''
    ].filter(Boolean).join(', ') || '-'}`
  ];
};

export const renderHandoffMarkdown = (context: HandoffContext): string => {
  const currentChapter = context.currentChapter.path
    ? `\`${context.currentChapter.path}\`（${context.currentChapter.exists ? '已存在' : '待创建'}，${context.currentChapter.chars} 字）`
    : '未找到正文文件或下一章节输出';
  const blockers = context.blockers.length > 0
    ? context.blockers.map(issue => `- [${issue.severity}] ${issue.code}: \`${toPosixPath(path.relative(context.projectRoot, issue.path))}\` - ${issue.message}`).join('\n')
    : '- 无';

  return [
    '# Handoff',
    '',
    `生成时间：${context.generatedAt}`,
    `项目根目录：\`${context.projectRoot}\``,
    `故事：${context.story.name}`,
    `当前章节：${currentChapter}`,
    ...renderNextTask(context.nextTask),
    '',
    '## 必须读取',
    '',
    checkList(context.mustReadFiles),
    '',
    '## 允许修改',
    '',
    checkList(context.allowedWriteFiles),
    '',
    '## 未完成任务',
    '',
    renderTasksTable(context.unfinishedTasks),
    '',
    '## 风险边界',
    '',
    bulletList(context.riskBoundaries),
    '',
    '## 阻塞项',
    '',
    blockers,
    '',
    '## 继续步骤',
    '',
    '1. 运行 `novel status` 确认项目状态。',
    '2. 按“必须读取”顺序加载上下文。',
    '3. 只围绕“下一任务”和“允许修改”推进。',
    '4. 完成后更新 `tasks.md`、tracking 数据和对应正文文件。'
  ].join('\n');
};

export const generateHandoff = async (
  input: GenerateHandoffInput
): Promise<GenerateHandoffResult> => {
  const { projectRoot, fileSystem: fs } = input;
  const story = await selectStory(projectRoot, fs, input.story);
  const context = await buildContext(projectRoot, fs, story, input.now ?? (() => new Date()));
  const markdown = renderHandoffMarkdown(context);

  if (input.write === false) {
    return { context, markdown };
  }

  const outputPath = input.output
    ? path.resolve(projectRoot, input.output)
    : path.join(story.path, 'handoff.md');

  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, markdown);

  return { context, markdown, outputPath };
};

export const renderHandoffSummary = (result: GenerateHandoffResult): string => {
  const { context } = result;
  const nextTask = context.nextTask
    ? `${context.nextTask.id} ${context.nextTask.title}`
    : '暂无未完成任务';
  const lines = [
    'Novel Writer 断点续写上下文包',
    '',
    `故事：${context.story.name}`,
    `当前章节：${context.currentChapter.path ?? '未找到'}`,
    `下一任务：${nextTask}`,
    `必须读取：${context.mustReadFiles.length}`,
    `未完成任务：${context.unfinishedTasks.length}`,
    `阻塞项：${context.blockers.length}`
  ];

  if (result.outputPath) {
    lines.push(`输出：${result.outputPath}`);
  }

  return lines.join('\n');
};
