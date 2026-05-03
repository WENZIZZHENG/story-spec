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
  nextActions: string[];
}

export type CodexStatus = ProjectStatus;

export interface GetProjectStatusInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  git: GitAdapter;
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
    creativeControl
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

const buildNextActions = (status: Omit<ProjectStatus, 'nextActions'>): string[] => {
  const actions: string[] = [];

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
    actions.push('在 AI 助手中使用 `/specify` 或平台对应命令创建第一个故事规格');
  } else if (status.story.stage === 'idea' || status.story.stage === 'interviewing') {
    actions.push('继续创作访谈：回答 3 个早期问题，或运行 `/clarify` 生成澄清记录');
  } else if (status.story.creativeControl.pendingDecisions > 0) {
    actions.push(`先确认 ${status.story.creativeControl.pendingDecisions} 个创作决策，再进入下一轮写入`);
  } else if (!status.story.hasSpecification) {
    actions.push('先补齐 `stories/*/specification.md`');
  } else if (!status.story.hasCreativePlan) {
    actions.push('继续执行 `/plan` 或平台对应命令生成创作计划');
  } else if (!status.story.hasTasks) {
    actions.push('继续执行 `/tasks` 或平台对应命令生成可执行任务清单');
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

  return {
    ...baseStatus,
    nextActions: buildNextActions(baseStatus)
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
      lines.push('创作缺口：');
      for (const gap of status.story.creativeGaps) {
        lines.push(`- ${gap}`);
      }
    }
    if (status.story.nextQuestions.length > 0) {
      lines.push('下一步问题：');
      for (const question of status.story.nextQuestions.slice(0, 3)) {
        lines.push(`- ${question}`);
      }
    }
  } else {
    lines.push('当前故事：未发现 stories/* 目录');
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
