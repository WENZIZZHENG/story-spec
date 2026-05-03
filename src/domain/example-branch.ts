import yaml from 'js-yaml';

export interface ExampleBranch {
  label: string;
  tone: string;
  assumptions: string[];
  sampleAnswer: string;
  tradeoffs: string[];
}

export type ExampleBranchIssueSeverity = 'error' | 'warning';

export type ExampleBranchIssueCode =
  | 'INVALID_EXAMPLE_BRANCH_DOCUMENT'
  | 'INVALID_EXAMPLE_BRANCH'
  | 'MISSING_EXAMPLE_BRANCH_FIELD'
  | 'TOO_FEW_EXAMPLE_BRANCHES'
  | 'MISSING_AUTHOR_CONTROL_BRANCH'
  | 'MISSING_EXAMPLE_BRANCH_TRADEOFF';

export interface ExampleBranchIssue {
  severity: ExampleBranchIssueSeverity;
  code: ExampleBranchIssueCode;
  path: string;
  message: string;
}

export interface ParsedExampleBranchSet {
  branches: ExampleBranch[];
  issues: ExampleBranchIssue[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(isNonEmptyString).map(item => item.trim())
    : [];

const issue = (
  code: ExampleBranchIssueCode,
  path: string,
  message: string,
  severity: ExampleBranchIssueSeverity = 'warning'
): ExampleBranchIssue => ({
  code,
  path,
  message,
  severity
});

const readRequiredString = (
  record: Record<string, unknown>,
  field: string,
  basePath: string,
  issues: ExampleBranchIssue[]
): string => {
  const value = record[field];
  if (!isNonEmptyString(value)) {
    issues.push(issue('MISSING_EXAMPLE_BRANCH_FIELD', `${basePath}.${field}`, `缺少 ${field}`));
    return '';
  }

  return value.trim();
};

const parseYamlOrJson = (content: string): unknown => yaml.load(content);

const readItems = (document: unknown): unknown[] => {
  if (!isRecord(document)) {
    return [];
  }

  return Array.isArray(document.branches) ? document.branches : [];
};

const isAuthorControlBranch = (branch: ExampleBranch): boolean =>
  /作者主导|继续提问|先不定|先别定/.test(branch.label);

export const validateExampleBranches = (
  branches: ExampleBranch[],
  filePath: string
): ExampleBranchIssue[] => {
  const issues: ExampleBranchIssue[] = [];

  if (branches.length < 3) {
    issues.push(issue(
      'TOO_FEW_EXAMPLE_BRANCHES',
      filePath,
      '示例分叉至少需要 3 个，才能覆盖不同创作方向'
    ));
  }

  if (!branches.some(isAuthorControlBranch)) {
    issues.push(issue(
      'MISSING_AUTHOR_CONTROL_BRANCH',
      filePath,
      '至少需要一个“作者主导/继续提问”的示例分叉'
    ));
  }

  branches.forEach((branch, index) => {
    if (branch.tradeoffs.length === 0) {
      issues.push(issue(
        'MISSING_EXAMPLE_BRANCH_TRADEOFF',
        `${filePath}#branches[${index}].tradeoffs`,
        `示例分叉必须说明取舍：${branch.label}`
      ));
    }
  });

  return issues;
};

export const parseExampleBranchSet = (
  content: string,
  filePath: string
): ParsedExampleBranchSet => {
  let document: unknown;
  try {
    document = parseYamlOrJson(content);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      branches: [],
      issues: [issue(
        'INVALID_EXAMPLE_BRANCH_DOCUMENT',
        filePath,
        `示例分叉文档无法解析：${detail}`,
        'error'
      )]
    };
  }

  if (!isRecord(document)) {
    return {
      branches: [],
      issues: [issue(
        'INVALID_EXAMPLE_BRANCH_DOCUMENT',
        filePath,
        '示例分叉文档顶层必须是对象',
        'error'
      )]
    };
  }

  const branches: ExampleBranch[] = [];
  const issues: ExampleBranchIssue[] = [];

  readItems(document).forEach((candidate, index) => {
    const basePath = `${filePath}#branches[${index}]`;
    if (!isRecord(candidate)) {
      issues.push(issue('INVALID_EXAMPLE_BRANCH', basePath, 'ExampleBranch 必须是对象'));
      return;
    }

    const label = readRequiredString(candidate, 'label', basePath, issues);
    const tone = readRequiredString(candidate, 'tone', basePath, issues);
    const sampleAnswer = readRequiredString(candidate, 'sampleAnswer', basePath, issues);
    if (!label || !tone || !sampleAnswer) {
      return;
    }

    branches.push({
      label,
      tone,
      assumptions: toStringArray(candidate.assumptions),
      sampleAnswer,
      tradeoffs: toStringArray(candidate.tradeoffs)
    });
  });

  issues.push(...validateExampleBranches(branches, filePath));

  return { branches, issues };
};

export const renderExampleBranchMarkdown = (branch: ExampleBranch): string => [
  `### ExampleBranch：${branch.label}`,
  '',
  `- 语气：${branch.tone}`,
  `- 假设：${branch.assumptions.length > 0 ? branch.assumptions.join('；') : '无'}`,
  `- 示例回答：${branch.sampleAnswer}`,
  `- 取舍：${branch.tradeoffs.length > 0 ? branch.tradeoffs.join('；') : '无'}`,
  '- confirmed: false',
  ''
].join('\n');
