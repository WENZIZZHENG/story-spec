import path from 'node:path';
import { AI_PLATFORMS } from '../utils/ai-platforms.js';
import type { ArtifactIssue } from '../validation/artifact-scanner.js';
import { scanStoryArtifacts } from '../validation/artifact-scanner.js';
import { createArtifactGraph } from '../validation/artifact-graph.js';
import type { GitAdapter, ProjectFileSystem } from './project-ports.js';
import {
  determineStoryMaturityStage,
  getStoryStageCreativeGaps,
  getStoryStageNextQuestions,
  type StoryMaturityStage
} from '../domain/story-stage.js';
import {
  summarizeCreativeControl,
  type CreativeControlSummary
} from './creative-control-summary.js';
import type { ClarificationRecord } from './manage-clarifications.js';
import {
  evaluateStoryCoreElements
} from '../domain/story-core-elements.js';
import {
  summarizeCreationEcho,
  type CreationEchoSummary
} from './creation-echo.js';
import { buildMissingTasksGuidance } from './workbench-utils.js';
import { quoteCliArgument } from './story-idea.js';

export interface StorySummary {
  name: string;
  path: string;
  stage: StoryMaturityStage;
  hasIdea: boolean;
  hasClarifications: boolean;
  hasCandidates: boolean;
  hasSpecification: boolean;
  hasCreativePlan: boolean;
  hasTasks: boolean;
  specificationVersion: string;
  creativePlanVersion: string;
  tasksVersion: string;
  nextTask: string;
  chapterFiles: number;
  contentFiles: number;
  contentChars: number;
  creativeGaps: string[];
  nextQuestions: string[];
  creativeControl: CreativeControlSummary;
  creationEcho: CreationEchoSummary;
}

export interface TrackingSummary {
  file: string;
  valid: boolean;
  error?: string;
}

export interface GitSummary {
  available: boolean;
  dirty: boolean;
  changedFiles: number;
  files: string[];
}

export interface ProjectStatus {
  projectRoot: string;
  projectName: string;
  version: string;
  method: string;
  configuredAI: string[];
  handoff: {
    codexPrompts: boolean;
    agentsFile: boolean;
  };
  codex: {
    prompts: boolean;
    agentsFile: boolean;
  };
  story: StorySummary | null;
  tracking: TrackingSummary[];
  blockers: ArtifactIssue[];
  git: GitSummary;
  navigationEntries: ProjectNavigationEntry[];
  nextActions: string[];
  resume: ProjectResumeSummary;
}

export type CodexStatus = ProjectStatus;

export interface GetProjectStatusInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  git: GitAdapter;
}

export interface ProjectNavigationEntry {
  action: string;
  label: string;
  description: string;
  copyableCommand: string;
}

export type ProjectResumeWriteMode = 'candidate' | 'preview' | 'apply' | 'dry-run' | 'blocked' | 'read-only';

export interface ProjectResumeAction {
  label: string;
  reason: string;
  copyableCommand: string;
  writesFiles: boolean;
  writeMode: ProjectResumeWriteMode;
  boundary: string;
}

export interface ProjectStatusGlossaryEntry {
  term: string;
  meaning: string;
}

export interface ProjectResumeSummary {
  projectRoot: string;
  projectName: string;
  storyName?: string;
  stage?: StoryMaturityStage;
  stateLabel: string;
  primaryAction: ProjectResumeAction;
  statusGlossary: ProjectStatusGlossaryEntry[];
  recentProjectHint: string;
  boundaries: string[];
}

const readJsonSafe = async (fs: ProjectFileSystem, filePath: string): Promise<Record<string, unknown>> => {
  try {
    return await fs.readJson(filePath);
  } catch {
    return {};
  }
};

const extractVersion = (content: string): string => {
  const patterns = [
    /(?:^|\n)\s*[-*]\s*(?:\*\*)?版本(?:\*\*)?[：:]\s*([^\n]+)/,
    /(?:^|\n)\s*版本[：:]\s*([^\n]+)/
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/\*/g, '').trim();
    }
  }

  return '未标注';
};

const readMarkdownVersion = async (fs: ProjectFileSystem, filePath: string): Promise<string> => {
  if (!await fs.pathExists(filePath)) {
    return '缺失';
  }

  const content = await fs.readFile(filePath);
  return extractVersion(content);
};

const readClarificationRecord = async (
  fs: ProjectFileSystem,
  filePath: string
): Promise<ClarificationRecord | undefined> => {
  if (!await fs.pathExists(filePath)) {
    return undefined;
  }

  try {
    return await fs.readJson<ClarificationRecord>(filePath);
  } catch {
    return undefined;
  }
};

const normalizeTaskLine = (line: string): string => line
  .replace(/^\s*-\s*\[\s\]\s*/, '')
  .replace(/^\[[^\]]+\]\s*/, '')
  .replace(/\*\*/g, '')
  .trim();

const findNextTask = async (fs: ProjectFileSystem, tasksPath: string): Promise<string> => {
  if (!await fs.pathExists(tasksPath)) {
    return '缺失 tasks.md';
  }

  const content = await fs.readFile(tasksPath);
  const lines = content.split(/\r?\n/);
  const numberedTask = lines.find(line =>
    /^\s*-\s*\[\s\]\s*(?:\[[^\]]+\]\s*)?(?:\*\*)?T\d+/i.test(line)
  );
  const anyTask = numberedTask ?? lines.find(line => /^\s*-\s*\[\s\]\s+\S/.test(line));

  return anyTask ? normalizeTaskLine(anyTask) : '暂无未完成任务';
};

const listMarkdownFiles = async (fs: ProjectFileSystem, dirPath: string): Promise<string[]> => {
  if (!await fs.pathExists(dirPath)) {
    return [];
  }

  const result: string[] = [];
  const entries = await fs.readDir(dirPath);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      result.push(...await listMarkdownFiles(fs, fullPath));
    } else if (entry.endsWith('.md')) {
      result.push(fullPath);
    }
  }

  return result;
};

const countContentChars = async (fs: ProjectFileSystem, files: string[]): Promise<number> => {
  let total = 0;

  for (const file of files) {
    const content = await fs.readFile(file);
    const normalized = content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[#>*_`\-\[\]()]/g, '')
      .replace(/\s+/g, '');
    total += normalized.length;
  }

  return total;
};

const findLatestStory = async (fs: ProjectFileSystem, projectRoot: string): Promise<string | null> => {
  const storiesDir = path.join(projectRoot, 'stories');
  if (!await fs.pathExists(storiesDir)) {
    return null;
  }

  const entries = await fs.readDir(storiesDir);
  const dirs: Array<{ path: string; mtimeMs: number }> = [];

  for (const entry of entries) {
    const fullPath = path.join(storiesDir, entry);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      dirs.push({ path: fullPath, mtimeMs: stat.mtimeMs });
    }
  }

  dirs.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return dirs[0]?.path ?? null;
};

const buildStorySummary = async (fs: ProjectFileSystem, projectRoot: string): Promise<StorySummary | null> => {
  const storyPath = await findLatestStory(fs, projectRoot);
  if (!storyPath) {
    return null;
  }

  const specificationPath = path.join(storyPath, 'specification.md');
  const creativePlanPath = path.join(storyPath, 'creative-plan.md');
  const tasksPath = path.join(storyPath, 'tasks.md');
  const ideaPath = path.join(storyPath, 'idea.md');
  const clarificationsPath = path.join(storyPath, 'clarifications.md');
  const clarificationsJsonPath = path.join(storyPath, 'clarifications.json');
  const candidatesPath = path.join(storyPath, 'candidates.md');
  const contentDir = path.join(storyPath, 'content');
  const contentFiles = await listMarkdownFiles(fs, contentDir);
  const hasIdea = await fs.pathExists(ideaPath);
  const hasClarifications = await fs.pathExists(clarificationsPath)
    || await fs.pathExists(clarificationsJsonPath);
  const hasCandidates = await fs.pathExists(candidatesPath);
  const hasSpecification = await fs.pathExists(specificationPath);
  const hasCreativePlan = await fs.pathExists(creativePlanPath);
  const hasTasks = await fs.pathExists(tasksPath);
  const stage = determineStoryMaturityStage({
    hasIdea,
    hasClarifications,
    hasCandidates,
    hasSpecification,
    hasCreativePlan,
    hasTasks,
    contentFiles: contentFiles.length
  });
  const chapterFiles = contentFiles.filter(file =>
    /(?:chapter|第)\s*[-_0-9一二三四五六七八九十百千零〇]+/i.test(path.basename(file))
  ).length;

  const nextQuestions = getStoryStageNextQuestions(stage);
  const creativeControl = await summarizeCreativeControl({
    projectRoot,
    storyPath,
    fileSystem: fs,
    fallbackNextQuestions: nextQuestions
  });
  const clarificationRecord = await readClarificationRecord(fs, clarificationsJsonPath);
  const coreElements = clarificationRecord
    ? evaluateStoryCoreElements({
      premise: clarificationRecord.premise,
      questions: clarificationRecord.questions,
      answers: clarificationRecord.answers
    })
    : [];

  return {
    name: path.basename(storyPath),
    path: storyPath,
    stage,
    hasIdea,
    hasClarifications,
    hasCandidates,
    hasSpecification,
    hasCreativePlan,
    hasTasks,
    specificationVersion: await readMarkdownVersion(fs, specificationPath),
    creativePlanVersion: await readMarkdownVersion(fs, creativePlanPath),
    tasksVersion: await readMarkdownVersion(fs, tasksPath),
    nextTask: await findNextTask(fs, tasksPath),
    chapterFiles,
    contentFiles: contentFiles.length,
    contentChars: await countContentChars(fs, contentFiles),
    creativeGaps: getStoryStageCreativeGaps(stage),
    nextQuestions,
    creativeControl,
    creationEcho: summarizeCreationEcho(path.basename(storyPath), clarificationRecord?.premise, coreElements)
  };
};

const validateTracking = async (fs: ProjectFileSystem, projectRoot: string): Promise<TrackingSummary[]> => {
  const trackingDir = path.join(projectRoot, 'spec', 'tracking');
  if (!await fs.pathExists(trackingDir)) {
    return [];
  }

  const files = (await fs.readDir(trackingDir))
    .filter(file => file.endsWith('.json'))
    .sort();

  const result: TrackingSummary[] = [];
  for (const file of files) {
    const filePath = path.join(trackingDir, file);
    try {
      JSON.parse(await fs.readFile(filePath));
      result.push({ file, valid: true });
    } catch (error) {
      result.push({ file, valid: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return result;
};

const readGitSummary = async (git: GitAdapter, projectRoot: string): Promise<GitSummary> => {
  try {
    const files = await git.statusShort(projectRoot);
    return {
      available: true,
      dirty: files.length > 0,
      changedFiles: files.length,
      files
    };
  } catch {
    return {
      available: false,
      dirty: false,
      changedFiles: 0,
      files: []
    };
  }
};

const detectConfiguredAI = async (
  fs: ProjectFileSystem,
  projectRoot: string
): Promise<string[]> => {
  const configuredAI: string[] = [];

  for (const platform of AI_PLATFORMS) {
    if (await fs.pathExists(path.join(projectRoot, platform.dir))) {
      configuredAI.push(platform.name);
    }
  }

  return configuredAI;
};

type ProjectStatusBase = Omit<ProjectStatus, 'navigationEntries' | 'nextActions' | 'resume'>;

const storyCliArgument = (storyName: string): string =>
  /[\s"'`|&;<>()[\]{}$\\]/.test(storyName) ? quoteCliArgument(storyName) : storyName;

const buildNextActions = (status: ProjectStatusBase): string[] => {
  const actions: string[] = [];
  const storyArg = status.story ? storyCliArgument(status.story.name) : '<故事名>';

  if (status.configuredAI.length === 0) {
    actions.push('运行 `storyspec upgrade` 或重新执行 `storyspec init --ai <platform>` 补齐 AI 平台命令');
  }

  if (!status.handoff.codexPrompts) {
    actions.push('运行 `storyspec upgrade --ai codex` 或重新执行 `storyspec init --ai codex` 补齐 Codex prompts');
  }

  if (!status.handoff.agentsFile) {
    actions.push('补充 `AGENTS.md`，让 Codex 明确只读/规划/写作边界');
  }

  if (!status.story) {
    actions.push('先保存一句灵感：`storyspec story:new <故事名> --idea "<一句话创意>"`');
    actions.push('然后运行 `storyspec next <故事名>` 选择角色、场景、设定或分支入口');
  } else if (status.story.stage === 'idea' || status.story.stage === 'interviewing') {
    actions.push(`继续创作访谈：运行 \`storyspec next ${storyArg}\` 查看推荐入口`);
    actions.push(`或直接运行 \`storyspec interview ${storyArg} --premise "<一句话创意>"\` 补齐第一版 StorySpec`);
  } else if (status.story.creativeControl.pendingDecisions > 0) {
    actions.push(`先确认 ${status.story.creativeControl.pendingDecisions} 个创作决策，再进入下一轮写入`);
  } else if (!status.story.hasSpecification) {
    actions.push(`生成规格预览：\`storyspec preview specify ${storyArg}\`，确认后再 apply`);
  } else if (!status.story.hasCreativePlan) {
    actions.push(`生成计划预览：\`storyspec preview plan ${storyArg}\`，确认后再 apply`);
  } else if (!status.story.hasTasks) {
    const tasksGuidance = buildMissingTasksGuidance(status.story.name);
    actions.push(`生成任务清单：在 agent 中执行 \`${tasksGuidance.agentCommand}\`，写入 \`${tasksGuidance.targetPath}\``);
    actions.push(`任务生成后运行 \`${tasksGuidance.boardCommand}\` 检查任务看板，再运行 \`${tasksGuidance.contextPackCommand}\``);
  } else if (status.story.nextTask !== '暂无未完成任务') {
    actions.push(`下一步任务：${status.story.nextTask}`);
  } else {
    actions.push('任务清单暂无未完成项，可运行 `/analyze` 或平台对应命令做阶段复核');
  }

  const invalidTracking = status.tracking.filter(item => !item.valid);
  if (invalidTracking.length > 0) {
    actions.push(`修复追踪 JSON：${invalidTracking.map(item => item.file).join(', ')}`);
  }

  if (status.blockers.length > 0) {
    actions.push(`处理阻塞原因：${status.blockers.map(item => item.code).join(', ')}`);
  }

  if (status.git.dirty) {
    actions.push('提交前审阅 `git diff`，确认没有混入无关改动');
  }

  return actions;
};

const buildNavigationEntries = (
  status: ProjectStatusBase
): ProjectNavigationEntry[] => {
  const isFirstRun = !status.story || status.story.stage === 'idea' || status.story.stage === 'interviewing';
  if (!isFirstRun) {
    return [];
  }

  const storyArg = status.story ? storyCliArgument(status.story.name) : '<故事名>';
  const longformCommand = status.story
    ? `storyspec ingest ${storyArg} --text "<长文资料>"`
    : 'storyspec story:new <故事名> --idea "<先贴最核心的一段资料>"';
  const ideaCommand = status.story
    ? `storyspec interview ${storyArg} --premise "<一句话创意>"`
    : 'storyspec story:new <故事名> --idea "<一句话创意>"';
  const tableCommand = status.story
    ? `storyspec ingest ${storyArg} --text "<Markdown 表格资料>"`
    : 'storyspec story:new <故事名> --idea "<表格资料摘要>"';
  const chatCommand = status.story
    ? `storyspec next ${storyArg} --modes`
    : 'storyspec story:new <故事名> --idea "<一句话创意>"';

  return [
    {
      action: 'ingest_longform_material',
      label: '我有长文资料',
      description: '粘贴设定片段、人物小传、世界观说明或旧稿摘要，先提炼候选和待澄清点。',
      copyableCommand: longformCommand
    },
    {
      action: 'start_from_short_idea',
      label: '我只有一句灵感',
      description: '保存 20-200 字脑洞，再用低负担问题慢慢长成可选择的故事方向。',
      copyableCommand: ideaCommand
    },
    {
      action: 'ingest_table_material',
      label: '我有表格资料',
      description: '先识别列名、未识别列和字段映射候选，未确认前不写入正典。',
      copyableCommand: tableCommand
    },
    {
      action: 'start_casual_chat',
      label: '我想先随便聊聊',
      description: '从零散想法开始，只给候选、回声和下一轮入口，不自动定稿。',
      copyableCommand: chatCommand
    }
  ];
};

const statusGlossary = (): ProjectStatusGlossaryEntry[] => [
  {
    term: 'candidate',
    meaning: '候选内容，只能用于讨论和比较；作者确认前不是正典。'
  },
  {
    term: 'preview',
    meaning: '写入前预览，只展示将生成或覆盖什么，不直接改正式文件。'
  },
  {
    term: 'apply',
    meaning: '作者显式确认后的写入动作，会把已确认内容落到对应文件。'
  },
  {
    term: 'dry-run',
    meaning: '演练模式，只展示将发生的改动，不执行覆盖或发布。'
  },
  {
    term: 'blocked',
    meaning: '缺少必要输入或存在风险，当前不能继续自动推进。'
  },
  {
    term: 'read-only',
    meaning: '只读检查、导航或看板，不写入项目文件。'
  },
  {
    term: 'active',
    meaning: '当前可以继续处理的阶段或路线。'
  },
  {
    term: 'planned',
    meaning: '已经登记但尚未激活的后续路线，需要单独确认后再开发。'
  }
];

const resumeBoundaries = (): string[] => [
  '不会绕过 preview / confirm / apply。',
  '不会把 AI 候选静默写入 specification、creative-plan、tasks、正文、tracking 或 canon。',
  'App 会记住最近项目，但不做云端同步或多用户共享。'
];

const stateLabelForStage = (stage?: StoryMaturityStage): string => {
  switch (stage) {
    case undefined:
      return '尚未创建故事';
    case 'idea':
    case 'interviewing':
      return '共创澄清中';
    case 'specified':
      return '规格已确认，等待规划';
    case 'planned':
      return '创作计划已生成，等待任务拆分';
    case 'tasked':
      return '任务已生成，准备写作';
    case 'drafting':
      return '章节草稿推进中';
    case 'revising':
      return '复核修订中';
    default:
      return '继续创作';
  }
};

const buildResumePrimaryAction = (status: ProjectStatusBase): ProjectResumeAction => {
  if (!status.story) {
    return {
      label: '保存一句灵感',
      reason: '当前项目还没有故事，先保存作者原始想法，再进入低负担共创。',
      copyableCommand: 'storyspec story:new <故事名> --idea "<一句话创意>"',
      writesFiles: true,
      writeMode: 'apply',
      boundary: '只保存作者明确输入的一句话灵感，不生成正典设定。'
    };
  }

  const storyArg = storyCliArgument(status.story.name);

  if (status.story.stage === 'idea' || status.story.stage === 'interviewing') {
    return {
      label: '继续创作访谈',
      reason: '当前最重要的是把灵感转成作者确认的主角、伙伴、舞台、能力和冲突选择。',
      copyableCommand: `storyspec next ${storyArg}`,
      writesFiles: false,
      writeMode: 'read-only',
      boundary: '`storyspec next` 只导航；真正写入澄清记录需要作者进入 interview 并确认。'
    };
  }

  if (status.story.creativeControl.pendingDecisions > 0) {
    return {
      label: '处理待确认决策',
      reason: `还有 ${status.story.creativeControl.pendingDecisions} 个创作决策未确认，先处理它们再写入后续产物。`,
      copyableCommand: `storyspec creative:report ${storyArg}`,
      writesFiles: false,
      writeMode: 'read-only',
      boundary: '报告只读展示确认状态，不会把候选变成正典。'
    };
  }

  if (!status.story.hasSpecification) {
    return {
      label: '生成规格预览',
      reason: '故事核心已可整理，但正式 specification 必须先预览再 apply。',
      copyableCommand: `storyspec preview specify ${storyArg}`,
      writesFiles: false,
      writeMode: 'preview',
      boundary: '预览写入 .specify/previews/，确认前不覆盖正式 specification。'
    };
  }

  if (!status.story.hasCreativePlan) {
    return {
      label: '生成计划预览',
      reason: '规格已存在，下一步是生成创作计划预览。',
      copyableCommand: `storyspec preview plan ${storyArg}`,
      writesFiles: false,
      writeMode: 'preview',
      boundary: '计划预览不会覆盖 creative-plan.md，必须 apply 后才写入。'
    };
  }

  if (!status.story.hasTasks) {
    const tasksGuidance = buildMissingTasksGuidance(status.story.name);
    return {
      label: '生成任务清单',
      reason: '创作计划已存在，接下来需要拆成可执行写作任务。',
      copyableCommand: tasksGuidance.agentCommand,
      writesFiles: true,
      writeMode: 'apply',
      boundary: '任务由 agent 写入 tasks.md；生成后应运行任务看板检查。'
    };
  }

  if (status.story.nextTask !== '暂无未完成任务') {
    return {
      label: '继续下一项写作任务',
      reason: status.story.nextTask,
      copyableCommand: `storyspec context:pack ${storyArg}`,
      writesFiles: false,
      writeMode: 'read-only',
      boundary: '先生成上下文包；正文写入仍由草稿和写作入口控制。'
    };
  }

  return {
    label: '阶段复核',
    reason: '任务清单暂无未完成项，适合做阶段复核或校验。',
    copyableCommand: 'storyspec validate',
    writesFiles: false,
    writeMode: 'read-only',
    boundary: '校验只读检查项目结构和规则。'
  };
};

const buildResumeSummary = (status: ProjectStatusBase): ProjectResumeSummary => ({
  projectRoot: status.projectRoot,
  projectName: status.projectName,
  ...(status.story ? {
    storyName: status.story.name,
    stage: status.story.stage
  } : {}),
  stateLabel: stateLabelForStage(status.story?.stage),
  primaryAction: buildResumePrimaryAction(status),
  statusGlossary: statusGlossary(),
  recentProjectHint: '本机 App 会在本机配置中记住最近项目，重新打开后可从最近项目回到当前状态。',
  boundaries: resumeBoundaries()
});

export const getProjectStatus = async (input: GetProjectStatusInput): Promise<ProjectStatus> => {
  const { projectRoot, fileSystem: fs, git } = input;
  const artifactScan = await scanStoryArtifacts({ projectRoot, fileSystem: fs });
  const artifactGraph = createArtifactGraph(artifactScan);

  const config = await readJsonSafe(fs, path.join(projectRoot, '.specify', 'config.json'));
  const handoff = {
    codexPrompts: await fs.pathExists(path.join(projectRoot, '.codex', 'prompts')),
    agentsFile: await fs.pathExists(path.join(projectRoot, 'AGENTS.md'))
  };
  const baseStatus = {
    projectRoot,
    projectName: String(config.name ?? path.basename(projectRoot)),
    version: String(config.version ?? '未知'),
    method: String(config.method ?? '未设置'),
    configuredAI: await detectConfiguredAI(fs, projectRoot),
    handoff,
    codex: {
      prompts: handoff.codexPrompts,
      agentsFile: handoff.agentsFile
    },
    story: await buildStorySummary(fs, projectRoot),
    tracking: await validateTracking(fs, projectRoot),
    blockers: artifactGraph.getBlockedTasks().flatMap(item => item.issues),
    git: await readGitSummary(git, projectRoot)
  };

  const navigationEntries = buildNavigationEntries(baseStatus);

  return {
    ...baseStatus,
    navigationEntries,
    nextActions: buildNextActions(baseStatus),
    resume: buildResumeSummary(baseStatus)
  };
};

export const getCodexStatus = getProjectStatus;

export const renderProjectStatus = (status: ProjectStatus): string => {
  const lines: string[] = [];
  const trackingOk = status.tracking.every(item => item.valid);

  lines.push('StorySpec 项目状态');
  lines.push('');
  lines.push(`项目：${status.projectName}`);
  lines.push(`根目录：${status.projectRoot}`);
  lines.push(`版本：${status.version}`);
  lines.push(`写作方法：${status.method}`);
  lines.push(`AI 配置：${status.configuredAI.join(', ') || '未检测到'}`);
  lines.push(`Codex prompts：${status.handoff.codexPrompts ? '已安装' : '缺失'}`);
  lines.push(`AGENTS.md：${status.handoff.agentsFile ? '已存在' : '缺失'}`);
  lines.push('');

  if (status.story) {
    lines.push(`当前故事：${status.story.name}`);
    lines.push(`创作阶段：${status.story.stage}`);
    lines.push(`规格：${status.story.hasSpecification ? status.story.specificationVersion : '缺失'}`);
    lines.push(`计划：${status.story.hasCreativePlan ? status.story.creativePlanVersion : '缺失'}`);
    lines.push(`任务：${status.story.hasTasks ? status.story.tasksVersion : '缺失'}`);
    lines.push(`下一任务：${status.story.nextTask}`);
    lines.push(`正文：${status.story.contentFiles} 个 Markdown，约 ${status.story.contentChars} 字符`);
    lines.push('当前故事长成了什么：');
    lines.push(`- 当前风味：${status.story.creationEcho.flavor}`);
    lines.push(`- 成熟度：${status.story.creationEcho.maturityNote}`);
    lines.push('- 已长出的关键部件：');
    for (const item of status.story.creationEcho.strongestParts.slice(0, 3)) {
      lines.push(`  - ${item}`);
    }
    lines.push('- 还差的关键部件：');
    if (status.story.creationEcho.missingPieces.length > 0) {
      for (const item of status.story.creationEcho.missingPieces.slice(0, 3)) {
        lines.push(`  - ${item}`);
      }
    } else {
      lines.push('  - 暂无明显缺口。');
    }
    lines.push('创作空间：');
    lines.push(`- 已确认决策：${status.story.creativeControl.confirmedDecisions}`);
    lines.push(`- 待确认决策：${status.story.creativeControl.pendingDecisions}`);
    lines.push(`- AI 建议未确认：${status.story.creativeControl.unconfirmedAiSuggestions}`);
    if (status.story.creativeControl.cannotFinalize.length > 0) {
      lines.push('- 不能擅自定稿：');
      for (const item of status.story.creativeControl.cannotFinalize.slice(0, 3)) {
        lines.push(`  - ${item}`);
      }
    }
    if (status.story.creativeGaps.length > 0) {
      lines.push('还需要补齐：');
      for (const gap of status.story.creativeGaps.slice(0, 3)) {
        lines.push(`- ${gap}`);
      }
    }
    if (status.story.nextQuestions.length > 0) {
      lines.push('下一轮问题：');
      for (const question of status.story.nextQuestions.slice(0, 3)) {
        lines.push(`- ${question}`);
      }
    }
  } else {
    lines.push('当前故事：尚未创建故事');
  }

  if (status.navigationEntries.length > 0) {
    lines.push('');
    lines.push('创作入口：');
    for (const entry of status.navigationEntries) {
      lines.push(`- ${entry.label}：${entry.description}`);
    }
    lines.push('可复制命令：');
    for (const entry of status.navigationEntries) {
      lines.push(`- ${entry.label}：${entry.copyableCommand}`);
    }
  }

  lines.push('');
  lines.push(`追踪 JSON：${status.tracking.length === 0 ? '未发现' : trackingOk ? '全部有效' : '存在错误'}`);
  for (const item of status.tracking.filter(item => !item.valid)) {
    lines.push(`- ${item.file}: ${item.error}`);
  }

  if (status.blockers.length > 0) {
    lines.push('');
    lines.push('阻塞原因：');
    for (const blocker of status.blockers) {
      lines.push(`- [${blocker.severity}] ${blocker.code}: ${blocker.message}`);
    }
  }

  lines.push(`Git 状态：${status.git.available ? status.git.dirty ? `${status.git.changedFiles} 个改动` : '干净' : '不可用'}`);
  if (status.git.files.length > 0) {
    for (const file of status.git.files.slice(0, 5)) {
      lines.push(`- ${file}`);
    }
    if (status.git.files.length > 5) {
      lines.push(`- ... 还有 ${status.git.files.length - 5} 个`);
    }
  }

  lines.push('');
  lines.push('建议下一步：');
  for (const action of status.nextActions) {
    lines.push(`- ${action}`);
  }

  return lines.join('\n');
};

export const renderCodexStatus = renderProjectStatus;
