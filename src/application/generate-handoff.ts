import path from 'node:path';
import {
  getAgentIntegration,
  type AgentIntegrationId
} from '../agent/registry.js';
import type { AgentCapabilities } from '../agent/capabilities.js';
import type { ProjectFileSystem } from './project-ports.js';
import type { ScannedStoryProject } from '../validation/artifact-scanner.js';
import { scanStoryArtifacts, type ArtifactIssue } from '../validation/artifact-scanner.js';
import type { StoryArtifact, WritingTask } from '../domain/story-artifact.js';
import { inspectScenes, inspectStoryGraph } from './inspect-story-structure.js';
import type { SceneCard } from '../domain/story-structure.js';
import {
  summarizeCreativeControl,
  type CreativeControlSummary
} from './creative-control-summary.js';
import { getStoryStageNextQuestions } from '../domain/story-stage.js';

export type HandoffGenerationErrorCode =
  | 'NO_STORIES'
  | 'STORY_NOT_FOUND'
  | 'MISSING_TASKS'
  | 'UNKNOWN_AGENT';

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
  storyStructure: {
    graphEntities: number;
    graphEdges: number;
    sceneCards: number;
    relevantSceneIds: string[];
    sceneFiles: string[];
    graphFiles: string[];
  };
  creativeControl: CreativeControlSummary;
  mustReadFiles: string[];
  allowedWriteFiles: string[];
  riskBoundaries: string[];
  blockers: ArtifactIssue[];
  targetAgent?: {
    id: AgentIntegrationId;
    displayName: string;
    commandSurface: string;
    capabilities: AgentCapabilities;
  };
}

export interface GenerateHandoffInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  output?: string;
  write?: boolean;
  targetAgent?: string;
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

const globToRegExp = (value: string): RegExp => {
  const escaped = value
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__DOUBLE_STAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/__DOUBLE_STAR__/g, '.*');

  return new RegExp(`^${escaped}$`);
};

const matchesPathPattern = (pattern: string, candidate: string): boolean => {
  const normalizedPattern = toPosixPath(pattern);
  const normalizedCandidate = toPosixPath(candidate);

  if (normalizedPattern === normalizedCandidate) {
    return true;
  }

  if (normalizedPattern.includes('*')) {
    return globToRegExp(normalizedPattern).test(normalizedCandidate);
  }

  return normalizedCandidate.endsWith(normalizedPattern);
};

const sceneMatchesTask = (scene: SceneCard, task: HandoffTask | null): boolean => {
  if (!task) {
    return false;
  }

  const taskPaths = [
    ...task.outputs,
    ...task.requiredReads,
    ...task.allowedWrites
  ];
  const scenePaths = [
    scene.draftPath ?? '',
    ...scene.requiredReads,
    ...scene.allowedWrites
  ].filter(Boolean);

  return scenePaths.some(scenePath => taskPaths.some(taskPath =>
    matchesPathPattern(taskPath, scenePath)
    || matchesPathPattern(scenePath, taskPath)
  ));
};

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
  blockers: ArtifactIssue[],
  targetAgent?: HandoffContext['targetAgent']
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

  if (targetAgent?.capabilities.runShell === false) {
    boundaries.push(`目标 agent ${targetAgent.displayName} 不支持 shell；不要要求它执行 CLI/脚本，应改为人工检查和记录未验证项。`);
  }

  if (targetAgent?.capabilities.writeFiles === false) {
    boundaries.push(`目标 agent ${targetAgent.displayName} 是只读模式；不要让它创建、修改或删除文件，只输出检查结果和补丁式建议。`);
  }

  return boundaries;
};

const buildContext = async (
  projectRoot: string,
  fs: ProjectFileSystem,
  story: ScannedStoryProject,
  targetAgent: HandoffContext['targetAgent'],
  now: () => Date
): Promise<HandoffContext> => {
  const tasksPath = requireTasksPath(story);
  const unfinished = story.tasks.filter(task => task.status === 'todo');
  const nextTask = unfinished[0];
  const nextHandoffTask = nextTask ? normalizeTaskPaths(nextTask, projectRoot, story.path) : null;
  const unfinishedTasks = unfinished.map(task => normalizeTaskPaths(task, projectRoot, story.path));
  const specificationPath = artifactPath(story, 'specification');
  const creativePlanPath = artifactPath(story, 'creative-plan');
  const graph = await inspectStoryGraph({ projectRoot, fileSystem: fs });
  const scenes = await inspectScenes({ projectRoot, fileSystem: fs, story: story.name });
  const creativeControl = await summarizeCreativeControl({
    projectRoot,
    storyPath: story.path,
    fileSystem: fs,
    fallbackNextQuestions: getStoryStageNextQuestions(story.stage)
  });
  const relevantScenes = scenes.scenes.filter(scene => sceneMatchesTask(scene, nextHandoffTask));
  const baseMustRead = await Promise.all([
    path.join(projectRoot, 'AGENTS.md'),
    path.join(projectRoot, '.specify', 'memory', 'constitution.md')
  ].map(async file => await fs.pathExists(file) ? toPosixPath(path.relative(projectRoot, file)) : ''));
  const mustReadFiles = unique([
    ...baseMustRead,
    specificationPath ? toPosixPath(path.relative(projectRoot, specificationPath)) : '',
    creativePlanPath ? toPosixPath(path.relative(projectRoot, creativePlanPath)) : '',
    creativeControl.recordPath ? toPosixPath(path.relative(projectRoot, creativeControl.recordPath)) : '',
    creativeControl.markdownPath ? toPosixPath(path.relative(projectRoot, creativeControl.markdownPath)) : '',
    toPosixPath(path.relative(projectRoot, tasksPath)),
    ...graph.files.map(file => toPosixPath(path.relative(projectRoot, file))),
    ...scenes.files.map(file => toPosixPath(path.relative(projectRoot, file))),
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
    storyStructure: {
      graphEntities: graph.entities.length,
      graphEdges: graph.edges.length,
      sceneCards: scenes.scenes.length,
      relevantSceneIds: relevantScenes.map(scene => scene.id),
      sceneFiles: scenes.files.map(file => toPosixPath(path.relative(projectRoot, file))),
      graphFiles: graph.files.map(file => toPosixPath(path.relative(projectRoot, file)))
    },
    creativeControl,
    mustReadFiles,
    allowedWriteFiles,
    riskBoundaries: buildRiskBoundaries(nextTask, blockers, targetAgent),
    blockers,
    targetAgent
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

const renderStoryStructureSection = (context: HandoffContext): string[] => [
  '',
  '## 结构上下文',
  '',
  `- Entity Graph：${context.storyStructure.graphEntities} entities / ${context.storyStructure.graphEdges} edges`,
  `- Scene Cards：${context.storyStructure.sceneCards}`,
  `- 下一任务相关 Scene：${context.storyStructure.relevantSceneIds.length > 0 ? context.storyStructure.relevantSceneIds.map(id => `\`${id}\``).join(', ') : '无'}`,
  '- Graph 文件：',
  checkList(context.storyStructure.graphFiles),
  '- Scene 文件：',
  checkList(context.storyStructure.sceneFiles)
];

const renderCreativeControlSection = (context: HandoffContext): string[] => [
  '',
  '## 创作控制摘要',
  '',
  `- 澄清记录：${context.creativeControl.hasClarifications ? '已发现' : '未发现'}`,
  `- 已确认决策：${context.creativeControl.confirmedDecisions}`,
  `- 待确认决策：${context.creativeControl.pendingDecisions}`,
  `- AI 建议未确认：${context.creativeControl.unconfirmedAiSuggestions}`,
  '- 不能擅自定稿：',
  bulletList(context.creativeControl.cannotFinalize),
  '- 下一个 Agent 应先问：',
  bulletList(context.creativeControl.mustAskNext)
];

const resolveTargetAgent = (targetAgent: string | undefined): HandoffContext['targetAgent'] => {
  if (!targetAgent) {
    return undefined;
  }

  const integration = getAgentIntegration(targetAgent);
  if (!integration) {
    throw new HandoffGenerationError('UNKNOWN_AGENT', `未知 agent integration：${targetAgent}`);
  }

  return {
    id: integration.id,
    displayName: integration.displayName,
    commandSurface: integration.commandSurface,
    capabilities: { ...integration.capabilities }
  };
};

const renderTargetAgentSection = (targetAgent: HandoffContext['targetAgent']): string[] => {
  if (!targetAgent) {
    return [];
  }

  const capabilities = [
    targetAgent.capabilities.readFiles ? 'read' : '',
    targetAgent.capabilities.writeFiles ? 'write' : 'read-only',
    targetAgent.capabilities.runShell ? 'shell' : 'no-shell',
    targetAgent.capabilities.supportsSlashCommands ? 'slash' : '',
    targetAgent.capabilities.supportsProjectInstructions ? 'instructions' : ''
  ].filter(Boolean).join(', ');

  return [
    '',
    '## 目标 Agent',
    '',
    `- ID：\`${targetAgent.id}\``,
    `- 名称：${targetAgent.displayName}`,
    `- 命令界面：${targetAgent.commandSurface}`,
    `- 能力：${capabilities}`
  ];
};

const renderContinueSteps = (context: HandoffContext): string[] => {
  const targetAgent = context.targetAgent;
  const canRunShell = targetAgent?.capabilities.runShell !== false;
  const canWriteFiles = targetAgent?.capabilities.writeFiles !== false;

  if (!canWriteFiles) {
    return [
      '1. 按“必须读取”顺序加载上下文。',
      '2. 只围绕“下一任务”和“建议修改范围”做检查，不创建、修改或删除文件。',
      '3. 输出检查结果、目标路径、建议内容和补丁式修改说明。',
      canRunShell
        ? '4. 如需验证，只给出建议命令，等待具备执行权限的 agent 或用户运行。'
        : '4. 不执行 CLI/脚本；人工核对必须读取、建议范围和验收标准，并记录无法自动验证的部分。'
    ];
  }

  return [
    canRunShell
      ? '1. 运行 `storyspec status` 确认项目状态。'
      : '1. 不执行 CLI/脚本；人工确认项目状态、任务边界和已知阻塞项。',
    '2. 按“必须读取”顺序加载上下文。',
    '3. 只围绕“下一任务”和“允许修改”推进。',
    '4. 完成后更新 `tasks.md`、tracking 数据和对应正文文件。'
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
    ...renderTargetAgentSection(context.targetAgent),
    ...renderCreativeControlSection(context),
    ...renderStoryStructureSection(context),
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
    ...renderContinueSteps(context)
  ].join('\n');
};

export const generateHandoff = async (
  input: GenerateHandoffInput
): Promise<GenerateHandoffResult> => {
  const { projectRoot, fileSystem: fs } = input;
  const story = await selectStory(projectRoot, fs, input.story);
  const targetAgent = resolveTargetAgent(input.targetAgent);
  const context = await buildContext(projectRoot, fs, story, targetAgent, input.now ?? (() => new Date()));
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
    'StorySpec 断点续写上下文包',
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
