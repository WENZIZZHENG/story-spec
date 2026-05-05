import path from 'node:path';
import type { GitAdapter, VerificationRunner } from './project-ports.js';

export interface DocsFinishCheck {
  name: string;
  command: string;
  id?: string;
  status?: 'passed' | 'failed' | 'skipped';
  message?: string;
  exitCode?: number;
}

export interface DocsFinishInput {
  projectRoot: string;
  message?: string;
  commit?: boolean;
  gitAdapter?: GitAdapter;
  verificationRunner?: VerificationRunner;
}

export interface DocsFinishPreview {
  projectRoot: string;
  mode: 'preview' | 'commit';
  writesFiles: false;
  placeholderPatterns: string[];
  checks: DocsFinishCheck[];
  commitCommand?: string;
  blocked?: boolean;
  blockedReasons?: string[];
  nextActions?: string[];
  changedFiles?: string[];
  commit?: DocsFinishCommitResult;
}

export interface DocsFinishCommitResult {
  requested: boolean;
  created: boolean;
  message?: string;
  skippedReason?: string;
}

const PLACEHOLDER_PATTERNS = ['TBD', 'TODO', '待定'];
const PLACEHOLDER_SCAN_COMMAND = "Select-String -Path docs\\**\\*.md,changes\\*.md -Pattern 'TBD|TODO|待定' -CaseSensitive";

const escapeCommitMessage = (message: string): string => message.replace(/"/g, '\\"');

const docsFinishChecks = (): DocsFinishCheck[] => [
  { id: 'git-diff-check', name: '空白和补丁格式检查', command: 'git diff --check' },
  {
    id: 'placeholder-scan',
    name: 'placeholder 扫描',
    command: PLACEHOLDER_SCAN_COMMAND
  },
  { id: 'git-status-summary', name: 'Git 状态摘要', command: 'git status --short --branch' }
];

export const createDocsFinishPreview = (input: DocsFinishInput): DocsFinishPreview => ({
  projectRoot: input.projectRoot,
  mode: 'preview',
  writesFiles: false,
  placeholderPatterns: PLACEHOLDER_PATTERNS,
  checks: docsFinishChecks().map(({ name, command }) => ({ name, command })),
  commitCommand: input.message
    ? `git commit -m "${escapeCommitMessage(input.message)}"`
    : undefined
});

const compactOutput = (stdout?: string, stderr?: string): string => {
  const output = [stdout, stderr]
    .filter((item): item is string => Boolean(item?.trim()))
    .join('\n')
    .trim();

  if (!output) {
    return '检查命令返回失败';
  }

  return output.length > 200 ? `${output.slice(0, 200)}...` : output;
};

const stripOuterQuotes = (value: string): string => value.replace(/^"(.+)"$/, '$1');

const normalizeToPosix = (value: string): string => value.replace(/\\/g, '/').replace(/\/+/g, '/');

const gitStatusPath = (line: string): string | undefined => {
  const match = line.trim().match(/^(?:[ MADRCU?!]{1,2})\s+(.+)$/);
  if (!match) {
    return undefined;
  }

  const statusPath = match[1].includes(' -> ')
    ? match[1].split(' -> ').at(-1) ?? match[1]
    : match[1];

  return normalizeToPosix(stripOuterQuotes(statusPath.trim())).replace(/^\.\//, '');
};

const uniqueStable = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(value);
  }

  return result;
};

const isDocumentationOnlyChange = (filePath: string): boolean => {
  const normalized = normalizeToPosix(filePath);

  if (normalized.startsWith('docs/')) {
    return normalized.endsWith('.md');
  }

  if (/^changes\/[^/]+\.md$/.test(normalized)) {
    return true;
  }

  if (normalized.startsWith('openspec/changes/')) {
    return normalized.endsWith('.md');
  }

  return ['README.md', 'AGENTS.md', 'SDD.md'].includes(normalized);
};

const defaultDocsFinishCommitMessage = (): string => '完成文档收尾';

const createSkippedCommitResult = (
  requested: boolean,
  skippedReason: string,
  message?: string
): DocsFinishCommitResult => ({
  requested,
  created: false,
  ...(message ? { message } : {}),
  skippedReason
});

const runDocsFinishChecks = async (
  input: DocsFinishInput
): Promise<{ checks: DocsFinishCheck[]; blockedReasons: string[]; nextActions: string[] }> => {
  const checks: DocsFinishCheck[] = [];
  const blockedReasons: string[] = [];
  const nextActions: string[] = [];

  if (!input.verificationRunner) {
    checks.push({
      id: 'verification-runner',
      name: '验证执行器',
      command: '',
      status: 'failed',
      message: '缺少 verification runner'
    });
    blockedReasons.push('缺少 verification runner');
    nextActions.push('为 docs:finish 注入验证执行器后重试');
    return { checks, blockedReasons, nextActions };
  }

  for (const check of docsFinishChecks().slice(0, 2)) {
    const result = await input.verificationRunner.run(input.projectRoot, check.command);
    const output = compactOutput(result.stdout, result.stderr);
    const hasPlaceholderOutput = check.id === 'placeholder-scan' && Boolean(output && output !== '检查命令返回失败' && [result.stdout, result.stderr].some(item => item?.trim()));
    const failed = result.exitCode !== 0 || hasPlaceholderOutput;
    const checked: DocsFinishCheck = {
      ...check,
      status: failed ? 'failed' : 'passed',
      message: failed ? output : '检查通过',
      exitCode: result.exitCode
    };
    checks.push(checked);

    if (failed) {
      blockedReasons.push(`检查失败：${check.command === 'git diff --check' ? check.command : check.name}`);
      nextActions.push('修复文档收尾检查失败后重新运行 docs:finish --commit');
      break;
    }
  }

  return { checks, blockedReasons, nextActions };
};

const getChangedFiles = async (
  projectRoot: string,
  gitAdapter?: GitAdapter
): Promise<{ changedFiles: string[]; skippedReason?: string }> => {
  if (!gitAdapter) {
    return {
      changedFiles: [],
      skippedReason: '缺少 Git adapter，无法创建本地 commit'
    };
  }

  try {
    const changedFiles = uniqueStable(
      (await gitAdapter.statusShort(projectRoot))
        .map(gitStatusPath)
        .filter((file): file is string => Boolean(file))
    );

    return { changedFiles };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      changedFiles: [],
      skippedReason: `Git 不可用或状态读取失败：${message}`
    };
  }
};

export const finishDocsChange = async (input: DocsFinishInput): Promise<DocsFinishPreview> => {
  const message = input.message?.trim() || defaultDocsFinishCommitMessage();

  if (!input.commit) {
    return {
      ...createDocsFinishPreview({ projectRoot: input.projectRoot, message }),
      blocked: false,
      blockedReasons: [],
      nextActions: [],
      changedFiles: [],
      commit: {
        requested: false,
        created: false,
        message
      }
    };
  }

  const { checks, blockedReasons, nextActions } = await runDocsFinishChecks(input);
  const blocked = blockedReasons.length > 0;
  if (blocked) {
    return {
      projectRoot: input.projectRoot,
      mode: 'commit',
      writesFiles: false,
      placeholderPatterns: PLACEHOLDER_PATTERNS,
      checks,
      blocked,
      blockedReasons,
      nextActions,
      changedFiles: [],
      commit: createSkippedCommitResult(true, '文档收尾检查被阻断', message)
    };
  }

  const { changedFiles, skippedReason } = await getChangedFiles(input.projectRoot, input.gitAdapter);
  if (skippedReason) {
    return {
      projectRoot: input.projectRoot,
      mode: 'commit',
      writesFiles: false,
      placeholderPatterns: PLACEHOLDER_PATTERNS,
      checks,
      blocked: false,
      blockedReasons: [],
      nextActions: ['确认当前目录是 Git 仓库，并重新运行 docs:finish --commit'],
      changedFiles,
      commit: createSkippedCommitResult(true, skippedReason, message)
    };
  }

  if (changedFiles.length === 0) {
    return {
      projectRoot: input.projectRoot,
      mode: 'commit',
      writesFiles: false,
      placeholderPatterns: PLACEHOLDER_PATTERNS,
      checks,
      blocked: false,
      blockedReasons: [],
      nextActions: [],
      changedFiles,
      commit: createSkippedCommitResult(true, 'Git 工作区没有可提交改动', message)
    };
  }

  const nonDocumentationFiles = changedFiles.filter(file => !isDocumentationOnlyChange(file));
  if (nonDocumentationFiles.length > 0) {
    return {
      projectRoot: input.projectRoot,
      mode: 'commit',
      writesFiles: false,
      placeholderPatterns: PLACEHOLDER_PATTERNS,
      checks,
      blocked: false,
      blockedReasons: [],
      nextActions: ['先拆分或提交非文档-only change，再重新运行 docs:finish --commit'],
      changedFiles,
      commit: createSkippedCommitResult(
        true,
        `存在非文档-only change：${nonDocumentationFiles.join('、')}`,
        message
      )
    };
  }

  if (!input.gitAdapter) {
    return {
      projectRoot: input.projectRoot,
      mode: 'commit',
      writesFiles: false,
      placeholderPatterns: PLACEHOLDER_PATTERNS,
      checks,
      blocked: false,
      blockedReasons: [],
      nextActions: ['为 docs:finish 注入 Git adapter 后重试'],
      changedFiles,
      commit: createSkippedCommitResult(true, '缺少 Git adapter，无法创建本地 commit', message)
    };
  }

  try {
    await input.gitAdapter.addAll(input.projectRoot);
    await input.gitAdapter.commit(input.projectRoot, message);
    return {
      projectRoot: input.projectRoot,
      mode: 'commit',
      writesFiles: false,
      placeholderPatterns: PLACEHOLDER_PATTERNS,
      checks,
      blocked: false,
      blockedReasons: [],
      nextActions: [],
      changedFiles,
      commit: {
        requested: true,
        created: true,
        message
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      projectRoot: input.projectRoot,
      mode: 'commit',
      writesFiles: false,
      placeholderPatterns: PLACEHOLDER_PATTERNS,
      checks,
      blocked: false,
      blockedReasons: [],
      nextActions: ['修复 Git 提交失败后重试'],
      changedFiles,
      commit: createSkippedCommitResult(true, `Git 不可用或提交失败：${errorMessage}`, message)
    };
  }
};

const renderCheckLine = (check: DocsFinishCheck): string => {
  if (!check.status) {
    return `- ${check.command}`;
  }

  return `- [${check.status}] ${check.command}${check.status === 'failed' && check.message ? `：${check.message}` : ''}`;
};

export const renderDocsFinishSummary = (result: DocsFinishPreview): string => [
  '文档变更收尾',
  '',
  `模式：${result.mode === 'commit' ? '提交模式' : '预览模式'}`,
  '写入文件：否',
  ...(typeof result.blocked === 'boolean' ? [`门禁状态：${result.blocked ? '阻断' : '通过'}`] : []),
  '',
  result.mode === 'commit' ? '检查结果：' : '建议检查：',
  ...result.checks.map(renderCheckLine),
  ...(result.blockedReasons && result.blockedReasons.length > 0 ? [
    '',
    '阻断原因：',
    ...result.blockedReasons.map(reason => `- ${reason}`)
  ] : []),
  ...(result.changedFiles && result.changedFiles.length > 0 ? [
    '',
    'Git 变更：',
    ...result.changedFiles.map(file => `- ${file}`)
  ] : []),
  ...(result.commit ? [
    '',
    `Commit：${result.commit.created ? `已创建 ${result.commit.message}` : `未创建（${result.commit.skippedReason ?? '未请求'}）`}`
  ] : result.commitCommand ? ['', '建议提交：', `- ${result.commitCommand}`] : []),
  ...(result.nextActions && result.nextActions.length > 0 ? [
    '',
    '下一步：',
    ...result.nextActions.map(action => `- ${action}`)
  ] : [])
].join('\n');
