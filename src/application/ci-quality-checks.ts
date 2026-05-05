import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';

export type CiQualityCheckStatus = 'pass' | 'fail';

export interface CiQualityCheck {
  checkId: string;
  status: CiQualityCheckStatus;
  command: string;
  files: string[];
  message: string;
  suggestedAction: string;
}

export interface CiQualityCheckResult {
  projectRoot: string;
  valid: boolean;
  checks: CiQualityCheck[];
}

export interface CiQualityCheckInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
}

interface CiQualityCheckDefinition {
  checkId: string;
  command: string;
  files: string[];
  passMessage: string;
  failMessage: string;
  suggestedAction: string;
  extra?: (input: CiQualityCheckInput) => Promise<string[]>;
}

const normalize = (filePath: string): string => filePath.split('/').join(path.sep);

const fileExists = async (
  input: CiQualityCheckInput,
  relativePath: string
): Promise<boolean> => input.fileSystem.pathExists(path.join(input.projectRoot, normalize(relativePath)));

const readTextIfExists = async (
  input: CiQualityCheckInput,
  relativePath: string
): Promise<string> => {
  const absolutePath = path.join(input.projectRoot, normalize(relativePath));
  return await input.fileSystem.pathExists(absolutePath)
    ? input.fileSystem.readFile(absolutePath)
    : '';
};

const checkTodoBoundary = async (input: CiQualityCheckInput): Promise<string[]> => {
  const index = await readTextIfExists(input, 'docs/tech/todo-index.md');
  return index.includes('(storyspec-ecosystem-roadmap.md)')
    ? ['todo-index 仍链接已归档生态路线的旧活跃路径']
    : [];
};

const CI_CHECK_DEFINITIONS: readonly CiQualityCheckDefinition[] = [
  {
    checkId: 'changes.records',
    command: 'npm run check:changes',
    files: [
      'changes',
      'scripts/build/check-change-records.ts'
    ],
    passMessage: '变更记录检查入口存在。',
    failMessage: '变更记录检查入口缺失。',
    suggestedAction: '补齐 changes/ 和脚本后运行 npm run check:changes。'
  },
  {
    checkId: 'command.manifest',
    command: 'npm run check:command-manifest',
    files: [
      'scripts/build/command-artifact-manifest.ts',
      'tests/fixtures/command-artifacts.manifest.json',
      'templates/commands'
    ],
    passMessage: '命令产物 manifest 检查入口存在。',
    failMessage: '命令产物 manifest 检查入口缺失。',
    suggestedAction: '确认模板和 manifest fixture 存在，必要时运行 npm run update:command-manifest。'
  },
  {
    checkId: 'agent.acceptance',
    command: 'npx vitest run tests/unit/agent-registry.test.ts tests/unit/platform-renderers.test.ts',
    files: [
      'src/agent/acceptance.ts',
      'docs/tech/agent-integration-acceptance.md',
      'tests/unit/agent-registry.test.ts',
      'tests/unit/platform-renderers.test.ts'
    ],
    passMessage: 'Agent integration 准入检查入口存在。',
    failMessage: 'Agent integration 准入检查入口缺失。',
    suggestedAction: '补齐 agent acceptance 文档、检查器和 registry/renderer 单测。'
  },
  {
    checkId: 'todo.boundary',
    command: 'git diff --check',
    files: [
      'docs/tech/todo-index.md',
      'docs/tech/todo-archive.md'
    ],
    passMessage: '待办入口和归档边界存在。',
    failMessage: '待办入口或归档边界缺失。',
    suggestedAction: '同步 todo-index 与 todo-archive，确保已完成路线不再留在活跃入口。',
    extra: checkTodoBoundary
  }
];

const evaluateCheck = async (
  input: CiQualityCheckInput,
  definition: CiQualityCheckDefinition
): Promise<CiQualityCheck> => {
  const missingFiles: string[] = [];
  for (const file of definition.files) {
    if (!await fileExists(input, file)) {
      missingFiles.push(file);
    }
  }

  const extraIssues = await definition.extra?.(input) ?? [];
  const issues = [...missingFiles.map(file => `缺少 ${file}`), ...extraIssues];
  const status: CiQualityCheckStatus = issues.length === 0 ? 'pass' : 'fail';

  return {
    checkId: definition.checkId,
    status,
    command: definition.command,
    files: definition.files,
    message: status === 'pass' ? definition.passMessage : `${definition.failMessage} ${issues.join('；')}`,
    suggestedAction: definition.suggestedAction
  };
};

export const getCiQualityChecks = async (
  input: CiQualityCheckInput
): Promise<CiQualityCheckResult> => {
  const checks = await Promise.all(CI_CHECK_DEFINITIONS.map(definition => evaluateCheck(input, definition)));

  return {
    projectRoot: input.projectRoot,
    valid: checks.every(check => check.status === 'pass'),
    checks
  };
};

export const renderCiQualityCheckReport = (result: CiQualityCheckResult): string => [
  'StorySpec CI 检查清单',
  '',
  `根目录：${result.projectRoot}`,
  `状态：${result.valid ? '通过' : '需要处理'}`,
  '',
  ...result.checks.flatMap(check => [
    `## ${check.checkId} [${check.status}]`,
    `命令：${check.command}`,
    `文件：${check.files.join(', ')}`,
    `说明：${check.message}`,
    `建议：${check.suggestedAction}`,
    ''
  ])
].join('\n').trimEnd();
