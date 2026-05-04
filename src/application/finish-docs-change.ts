export interface DocsFinishCheck {
  name: string;
  command: string;
}

export interface DocsFinishInput {
  projectRoot: string;
  message?: string;
}

export interface DocsFinishPreview {
  projectRoot: string;
  mode: 'preview';
  writesFiles: false;
  placeholderPatterns: string[];
  checks: DocsFinishCheck[];
  commitCommand?: string;
}

const PLACEHOLDER_PATTERNS = ['TBD', 'TODO', '待定'];

const escapeCommitMessage = (message: string): string => message.replace(/"/g, '\\"');

export const createDocsFinishPreview = (input: DocsFinishInput): DocsFinishPreview => ({
  projectRoot: input.projectRoot,
  mode: 'preview',
  writesFiles: false,
  placeholderPatterns: PLACEHOLDER_PATTERNS,
  checks: [
    { name: '空白和补丁格式检查', command: 'git diff --check' },
    {
      name: '占位符扫描',
      command: "Select-String -Path docs\\**\\*.md,changes\\*.md -Pattern 'TBD|TODO|待定' -CaseSensitive"
    },
    { name: 'Git 状态摘要', command: 'git status --short --branch' }
  ],
  commitCommand: input.message
    ? `git commit -m "${escapeCommitMessage(input.message)}"`
    : undefined
});

export const renderDocsFinishSummary = (result: DocsFinishPreview): string => [
  '文档变更收尾',
  '',
  '模式：预览模式',
  '写入文件：否',
  '',
  '建议检查：',
  ...result.checks.map(check => `- ${check.command}`),
  ...(result.commitCommand ? ['', '建议提交：', `- ${result.commitCommand}`] : [])
].join('\n');
