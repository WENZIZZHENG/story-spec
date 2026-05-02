import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { getProjectInfo } from './project.js';

interface StorySummary {
  name: string;
  path: string;
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
}

interface TrackingSummary {
  file: string;
  valid: boolean;
  error?: string;
}

interface GitSummary {
  available: boolean;
  dirty: boolean;
  changedFiles: number;
  files: string[];
}

export interface CodexStatus {
  projectRoot: string;
  projectName: string;
  version: string;
  method: string;
  configuredAI: string[];
  codex: {
    prompts: boolean;
    agentsFile: boolean;
  };
  story: StorySummary | null;
  tracking: TrackingSummary[];
  git: GitSummary;
  nextActions: string[];
}

async function readJsonSafe(filePath: string): Promise<Record<string, unknown>> {
  try {
    return await fs.readJson(filePath);
  } catch {
    return {};
  }
}

function extractVersion(content: string): string {
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
}

async function readMarkdownVersion(filePath: string): Promise<string> {
  if (!await fs.pathExists(filePath)) {
    return '缺失';
  }

  const content = await fs.readFile(filePath, 'utf-8');
  return extractVersion(content);
}

function normalizeTaskLine(line: string): string {
  return line
    .replace(/^\s*-\s*\[\s\]\s*/, '')
    .replace(/\*\*/g, '')
    .trim();
}

async function findNextTask(tasksPath: string): Promise<string> {
  if (!await fs.pathExists(tasksPath)) {
    return '缺失 tasks.md';
  }

  const content = await fs.readFile(tasksPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const numberedTask = lines.find(line =>
    /^\s*-\s*\[\s\]\s*(?:\[[^\]]+\]\s*)?(?:\*\*)?T\d+/i.test(line)
  );
  const anyTask = numberedTask ?? lines.find(line => /^\s*-\s*\[\s\]\s+\S/.test(line));

  return anyTask ? normalizeTaskLine(anyTask) : '暂无未完成任务';
}

async function listMarkdownFiles(dirPath: string): Promise<string[]> {
  if (!await fs.pathExists(dirPath)) {
    return [];
  }

  const result: string[] = [];
  const entries = await fs.readdir(dirPath);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      result.push(...await listMarkdownFiles(fullPath));
    } else if (entry.endsWith('.md')) {
      result.push(fullPath);
    }
  }

  return result;
}

async function countContentChars(files: string[]): Promise<number> {
  let total = 0;

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const normalized = content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[#>*_`\-\[\]()]/g, '')
      .replace(/\s+/g, '');
    total += normalized.length;
  }

  return total;
}

async function findLatestStory(projectRoot: string): Promise<string | null> {
  const storiesDir = path.join(projectRoot, 'stories');
  if (!await fs.pathExists(storiesDir)) {
    return null;
  }

  const entries = await fs.readdir(storiesDir);
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
}

async function buildStorySummary(projectRoot: string): Promise<StorySummary | null> {
  const storyPath = await findLatestStory(projectRoot);
  if (!storyPath) {
    return null;
  }

  const specificationPath = path.join(storyPath, 'specification.md');
  const creativePlanPath = path.join(storyPath, 'creative-plan.md');
  const tasksPath = path.join(storyPath, 'tasks.md');
  const contentDir = path.join(storyPath, 'content');
  const contentFiles = await listMarkdownFiles(contentDir);
  const chapterFiles = contentFiles.filter(file =>
    /(?:chapter|第)\s*[-_0-9一二三四五六七八九十百千零〇]+/i.test(path.basename(file))
  ).length;

  return {
    name: path.basename(storyPath),
    path: storyPath,
    hasSpecification: await fs.pathExists(specificationPath),
    hasCreativePlan: await fs.pathExists(creativePlanPath),
    hasTasks: await fs.pathExists(tasksPath),
    specificationVersion: await readMarkdownVersion(specificationPath),
    creativePlanVersion: await readMarkdownVersion(creativePlanPath),
    tasksVersion: await readMarkdownVersion(tasksPath),
    nextTask: await findNextTask(tasksPath),
    chapterFiles,
    contentFiles: contentFiles.length,
    contentChars: await countContentChars(contentFiles)
  };
}

async function validateTracking(projectRoot: string): Promise<TrackingSummary[]> {
  const trackingDir = path.join(projectRoot, 'spec', 'tracking');
  if (!await fs.pathExists(trackingDir)) {
    return [];
  }

  const files = (await fs.readdir(trackingDir))
    .filter(file => file.endsWith('.json'))
    .sort();

  const result: TrackingSummary[] = [];
  for (const file of files) {
    const filePath = path.join(trackingDir, file);
    try {
      JSON.parse(await fs.readFile(filePath, 'utf-8'));
      result.push({ file, valid: true });
    } catch (error: any) {
      result.push({ file, valid: false, error: error.message });
    }
  }

  return result;
}

function readGitSummary(projectRoot: string): GitSummary {
  try {
    const output = execSync('git status --short', {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    const files = output.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
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
}

function buildNextActions(status: Omit<CodexStatus, 'nextActions'>): string[] {
  const actions: string[] = [];

  if (!status.codex.prompts) {
    actions.push('运行 `novel upgrade --ai codex` 或重新执行 `novel init --ai codex` 补齐 Codex prompts');
  }

  if (!status.codex.agentsFile) {
    actions.push('补充 `AGENTS.md`，让 Codex 明确只读/规划/写作边界');
  }

  if (!status.story) {
    actions.push('在 Codex 中使用 `/novel-specify` 创建第一个故事规格');
  } else if (!status.story.hasSpecification) {
    actions.push('先补齐 `stories/*/specification.md`');
  } else if (!status.story.hasCreativePlan) {
    actions.push('继续执行 `/novel-plan` 生成创作计划');
  } else if (!status.story.hasTasks) {
    actions.push('继续执行 `/novel-tasks` 生成可执行任务清单');
  } else if (status.story.nextTask !== '暂无未完成任务') {
    actions.push(`下一步任务：${status.story.nextTask}`);
  } else {
    actions.push('任务清单暂无未完成项，可运行 `/novel-analyze` 做阶段复核');
  }

  const invalidTracking = status.tracking.filter(item => !item.valid);
  if (invalidTracking.length > 0) {
    actions.push(`修复追踪 JSON：${invalidTracking.map(item => item.file).join(', ')}`);
  }

  if (status.git.dirty) {
    actions.push('提交前审阅 `git diff`，确认没有混入无关改动');
  }

  return actions;
}

export async function getCodexStatus(projectRoot: string): Promise<CodexStatus> {
  const config = await readJsonSafe(path.join(projectRoot, '.specify', 'config.json'));
  const projectInfo = await getProjectInfo(projectRoot);
  const baseStatus = {
    projectRoot,
    projectName: String(config.name ?? path.basename(projectRoot)),
    version: projectInfo?.version ?? String(config.version ?? '未知'),
    method: String(config.method ?? '未设置'),
    configuredAI: projectInfo?.installedAI ?? [],
    codex: {
      prompts: await fs.pathExists(path.join(projectRoot, '.codex', 'prompts')),
      agentsFile: await fs.pathExists(path.join(projectRoot, 'AGENTS.md'))
    },
    story: await buildStorySummary(projectRoot),
    tracking: await validateTracking(projectRoot),
    git: readGitSummary(projectRoot)
  };

  return {
    ...baseStatus,
    nextActions: buildNextActions(baseStatus)
  };
}

export function renderCodexStatus(status: CodexStatus): string {
  const lines: string[] = [];
  const trackingOk = status.tracking.every(item => item.valid);

  lines.push('Codex 项目状态');
  lines.push('');
  lines.push(`项目：${status.projectName}`);
  lines.push(`根目录：${status.projectRoot}`);
  lines.push(`版本：${status.version}`);
  lines.push(`写作方法：${status.method}`);
  lines.push(`AI 配置：${status.configuredAI.join(', ') || '未检测到'}`);
  lines.push(`Codex prompts：${status.codex.prompts ? '已安装' : '缺失'}`);
  lines.push(`AGENTS.md：${status.codex.agentsFile ? '已存在' : '缺失'}`);
  lines.push('');

  if (status.story) {
    lines.push(`当前故事：${status.story.name}`);
    lines.push(`规格：${status.story.hasSpecification ? status.story.specificationVersion : '缺失'}`);
    lines.push(`计划：${status.story.hasCreativePlan ? status.story.creativePlanVersion : '缺失'}`);
    lines.push(`任务：${status.story.hasTasks ? status.story.tasksVersion : '缺失'}`);
    lines.push(`下一任务：${status.story.nextTask}`);
    lines.push(`正文：${status.story.contentFiles} 个 Markdown，约 ${status.story.contentChars} 字符`);
  } else {
    lines.push('当前故事：未发现 stories/* 目录');
  }

  lines.push('');
  lines.push(`追踪 JSON：${status.tracking.length === 0 ? '未发现' : trackingOk ? '全部有效' : '存在错误'}`);
  for (const item of status.tracking.filter(item => !item.valid)) {
    lines.push(`- ${item.file}: ${item.error}`);
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
}
