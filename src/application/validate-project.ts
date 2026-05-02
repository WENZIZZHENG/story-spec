import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import type { ArtifactIssue } from '../validation/artifact-scanner.js';
import { scanStoryArtifacts } from '../validation/artifact-scanner.js';
import {
  validateTrackingDocument,
  validateWritingTask,
  type ValidationIssue,
  type ValidationSeverity
} from '../validation/schema/index.js';
import {
  createDefaultWritingRules,
  runWritingRules,
  type WritingRuleIssue
} from '../validation/rules/writing-rules.js';
import {
  countIssuesBySeverity,
  filterIssuesBySeverity,
  sortIssuesBySeverity
} from '../validation/severity.js';

export type ProjectValidationIssueCode =
  | ValidationIssue['code']
  | ArtifactIssue['code']
  | WritingRuleIssue['code']
  | 'MISSING_PROJECT_CONFIG'
  | 'MISSING_PROJECT_DIR'
  | 'MISSING_TEMPLATE';

export interface ProjectValidationIssue {
  severity: ValidationSeverity;
  code: ProjectValidationIssueCode;
  path: string;
  message: string;
}

export interface ProjectValidationSummary {
  stories: number;
  tasks: number;
  trackingFiles: number;
  templatesChecked: number;
}

export interface ProjectValidationResult {
  projectRoot: string;
  valid: boolean;
  summary: ProjectValidationSummary;
  issueCounts: Record<ValidationSeverity, number>;
  issues: ProjectValidationIssue[];
}

export interface ValidateProjectInput {
  projectRoot: string;
  packageRoot?: string;
  fileSystem: ProjectFileSystem;
}

export interface RenderProjectValidationOptions {
  minSeverity?: ValidationSeverity;
}

interface TemplateValidationResult {
  templatesChecked: number;
  issues: ProjectValidationIssue[];
}

const createIssue = (
  code: ProjectValidationIssueCode,
  pathValue: string,
  message: string,
  severity: ValidationSeverity = 'error'
): ProjectValidationIssue => ({
  severity,
  code,
  path: pathValue,
  message
});

const toProjectIssue = (issue: ValidationIssue | ArtifactIssue | WritingRuleIssue): ProjectValidationIssue => ({
  severity: issue.severity,
  code: issue.code,
  path: issue.path,
  message: issue.message
});

const listFiles = async (
  fs: ProjectFileSystem,
  rootDir: string,
  currentDir = rootDir
): Promise<string[]> => {
  if (!await fs.pathExists(rootDir)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of await fs.readDir(currentDir)) {
    const entryPath = path.join(currentDir, entry);
    const stat = await fs.stat(entryPath);
    if (stat.isDirectory()) {
      files.push(...await listFiles(fs, rootDir, entryPath));
    } else if (stat.isFile()) {
      files.push(path.relative(rootDir, entryPath).split(path.sep).join('/'));
    }
  }

  return files.sort();
};

const validateProjectStructure = async (
  fs: ProjectFileSystem,
  projectRoot: string
): Promise<ProjectValidationIssue[]> => {
  const requiredDirs = ['.specify', '.specify/templates', 'stories', 'spec', 'spec/tracking'];
  const issues: ProjectValidationIssue[] = [];
  const configPath = path.join(projectRoot, '.specify', 'config.json');

  if (!await fs.pathExists(configPath)) {
    issues.push(createIssue('MISSING_PROJECT_CONFIG', configPath, '缺少 .specify/config.json'));
  }

  for (const dir of requiredDirs) {
    const dirPath = path.join(projectRoot, dir);
    if (!await fs.pathExists(dirPath)) {
      issues.push(createIssue('MISSING_PROJECT_DIR', dirPath, `缺少项目目录：${dir}`, 'warning'));
    }
  }

  return issues;
};

const validateTrackingFiles = async (
  fs: ProjectFileSystem,
  projectRoot: string
): Promise<{ count: number; issues: ProjectValidationIssue[] }> => {
  const trackingDir = path.join(projectRoot, 'spec', 'tracking');
  if (!await fs.pathExists(trackingDir)) {
    return { count: 0, issues: [] };
  }

  const files = (await fs.readDir(trackingDir)).filter(file => file.endsWith('.json')).sort();
  const issues: ProjectValidationIssue[] = [];

  for (const file of files) {
    const filePath = path.join(trackingDir, file);
    try {
      const document = JSON.parse(await fs.readFile(filePath));
      issues.push(...validateTrackingDocument(document, filePath).map(toProjectIssue));
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      issues.push(createIssue('INVALID_TRACKING_JSON', filePath, `tracking JSON 无效：${file} (${detail})`));
    }
  }

  return { count: files.length, issues };
};

const validateTemplates = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  packageRoot?: string
): Promise<TemplateValidationResult> => {
  if (!packageRoot) {
    return { templatesChecked: 0, issues: [] };
  }

  const sourceRoot = path.join(packageRoot, 'templates');
  const targetRoot = path.join(projectRoot, '.specify', 'templates');
  const templates = await listFiles(fs, sourceRoot);
  const issues: ProjectValidationIssue[] = [];

  for (const template of templates) {
    const targetPath = path.join(targetRoot, ...template.split('/'));
    if (!await fs.pathExists(targetPath)) {
      issues.push(createIssue('MISSING_TEMPLATE', targetPath, `缺少模板：${template}`));
    }
  }

  return {
    templatesChecked: templates.length,
    issues
  };
};

export const validateProject = async (input: ValidateProjectInput): Promise<ProjectValidationResult> => {
  const { projectRoot, fileSystem: fs } = input;
  const artifactScan = await scanStoryArtifacts({ projectRoot, fileSystem: fs });
  const trackingResult = await validateTrackingFiles(fs, projectRoot);
  const templateResult = await validateTemplates(fs, projectRoot, input.packageRoot);
  const writingRuleResult = await runWritingRules({
    projectRoot,
    fileSystem: fs,
    artifactScan,
    rules: createDefaultWritingRules()
  });
  const taskIssues = artifactScan.stories.flatMap(story =>
    story.tasks.flatMap(task =>
      validateWritingTask(task).map(issue => ({
        ...toProjectIssue(issue),
        path: `${task.tasksPath}#${task.id}:${issue.path}`
      }))
    )
  );
  const artifactIssues = artifactScan.issues
    .filter(issue => issue.code !== 'INVALID_TRACKING_JSON')
    .map(toProjectIssue);
  const issues = sortIssuesBySeverity([
    ...await validateProjectStructure(fs, projectRoot),
    ...artifactIssues,
    ...trackingResult.issues,
    ...taskIssues,
    ...writingRuleResult.issues.map(toProjectIssue),
    ...templateResult.issues
  ]);
  const issueCounts = countIssuesBySeverity(issues);

  return {
    projectRoot,
    valid: issueCounts.error === 0,
    summary: {
      stories: artifactScan.stories.length,
      tasks: artifactScan.stories.reduce((total, story) => total + story.tasks.length, 0),
      trackingFiles: trackingResult.count,
      templatesChecked: templateResult.templatesChecked
    },
    issueCounts,
    issues
  };
};

export const renderProjectValidation = (
  result: ProjectValidationResult,
  options: RenderProjectValidationOptions = {}
): string => {
  const visibleIssues = filterIssuesBySeverity(result.issues, options.minSeverity ?? 'info');
  const lines = [
    'Novel Writer 项目校验',
    '',
    `根目录：${result.projectRoot}`,
    `结果：${result.valid ? '通过' : '失败'}`,
    `故事：${result.summary.stories}`,
    `任务：${result.summary.tasks}`,
    `tracking JSON：${result.summary.trackingFiles}`,
    `模板检查：${result.summary.templatesChecked}`,
    `问题：${result.issueCounts.error} error / ${result.issueCounts.warning} warning / ${result.issueCounts.info} info`
  ];

  if (visibleIssues.length > 0) {
    lines.push('', '问题列表：');
    for (const issue of visibleIssues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.path} - ${issue.message}`);
    }
  }

  return lines.join('\n');
};
