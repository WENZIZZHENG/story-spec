import path from 'node:path';
import yaml from 'js-yaml';
import type { ProjectFileSystem } from './project-ports.js';
import type {
  StyleLintFinding,
  StyleRule,
  StyleRuleSeverity
} from '../domain/workbench.js';
import {
  relativePath,
  toPosixPath
} from './workbench-utils.js';

export interface StyleInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
}

export interface StyleLintInput extends StyleInput {
  story?: string;
  chapter?: string;
  adapterRunner?: ProseLintAdapterRunner;
}

export interface StyleLintResult {
  projectRoot: string;
  scannedFiles: string[];
  ruleFiles: string[];
  rules: StyleRule[];
  adapters: ProseLintAdapterStatus[];
  findings: StyleLintFinding[];
  summary: {
    error: number;
    warning: number;
    info: number;
  };
}

export interface StyleExplainResult {
  projectRoot: string;
  ruleId: string;
  rule?: StyleRule;
  ruleFiles: string[];
}

export interface ProseLintAdapterConfig {
  id: 'vale' | 'textlint' | (string & {});
  enabled: boolean;
}

export interface ProseLintAdapterStatus {
  id: string;
  source: string;
  status: 'pass' | 'skipped' | 'failed';
  message: string;
}

export interface ProseLintAdapterRunnerInput {
  adapter: ProseLintAdapterConfig;
  projectRoot: string;
  files: string[];
  fileSystem: ProjectFileSystem;
}

export type ProseLintAdapterRunner = (
  input: ProseLintAdapterRunnerInput
) => Promise<StyleLintFinding[]>;

const DEFAULT_RULES: StyleRule[] = [
  {
    id: 'style.ai-empty-abstract',
    description: '避免空泛抽象总结替代具体动作和感官细节。',
    pattern: '一种无法言说的感觉',
    severity: 'warning',
    suggestion: '改成角色可感知的动作、环境细节或具体心理反应。'
  },
  {
    id: 'style.explain-known-motive',
    description: '避免对白直接解释双方已经知道的动机。',
    pattern: '你应该明白',
    severity: 'info',
    suggestion: '让角色通过回避、误导、动作或冲突透露动机。'
  }
];

const styleDir = (projectRoot: string): string => path.join(projectRoot, 'spec', 'style');
const adaptersConfigPath = (projectRoot: string): string => path.join(styleDir(projectRoot), 'adapters.json');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const normalizeSeverity = (value: unknown): StyleRuleSeverity =>
  ['error', 'warning', 'info', 'off'].includes(String(value))
    ? value as StyleRuleSeverity
    : 'warning';

const parseStyleDocument = (
  content: string,
  filePath: string
): { rules: StyleRule[]; findings: StyleLintFinding[] } => {
  let document: unknown;
  try {
    document = yaml.load(content);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      rules: [],
      findings: [{
        severity: 'error',
        code: 'INVALID_STYLE_RULE_DOCUMENT',
        ruleId: 'style.document',
        path: filePath,
        evidence: detail,
        message: 'style 规则文档无法解析',
        suggestion: '修正 YAML/JSON 格式后重新运行 style:lint'
      }]
    };
  }

  if (!isRecord(document)) {
    return {
      rules: [],
      findings: [{
        severity: 'error',
        code: 'INVALID_STYLE_RULE_DOCUMENT',
        ruleId: 'style.document',
        path: filePath,
        evidence: 'document root is not object',
        message: 'style 规则文档顶层必须是对象',
        suggestion: '把规则写入 rules 数组'
      }]
    };
  }

  const candidateRules = Array.isArray(document.rules) ? document.rules : [];
  const rules: StyleRule[] = [];
  const findings: StyleLintFinding[] = [];

  candidateRules.forEach((candidate, index) => {
    const itemPath = `${filePath}#rules[${index}]`;
    if (!isRecord(candidate)) {
      findings.push({
        severity: 'error',
        code: 'INVALID_STYLE_RULE',
        ruleId: 'style.invalid-rule',
        path: itemPath,
        evidence: 'rule is not object',
        message: 'style rule 必须是对象',
        suggestion: '删除无效项或改成包含 id/pattern/suggestion 的规则对象'
      });
      return;
    }

    if (!isNonEmptyString(candidate.id) || !isNonEmptyString(candidate.pattern) || !isNonEmptyString(candidate.suggestion)) {
      findings.push({
        severity: 'warning',
        code: 'INVALID_STYLE_RULE',
        ruleId: isNonEmptyString(candidate.id) ? candidate.id.trim() : 'style.missing-id',
        path: itemPath,
        evidence: JSON.stringify(candidate),
        message: 'style rule 缺少 id、pattern 或 suggestion',
        suggestion: '补齐规则字段；若不想启用可设置 severity: off'
      });
      return;
    }

    rules.push({
      id: candidate.id.trim(),
      description: isNonEmptyString(candidate.description) ? candidate.description.trim() : candidate.id.trim(),
      pattern: candidate.pattern.trim(),
      severity: normalizeSeverity(candidate.severity),
      suggestion: candidate.suggestion.trim(),
      regex: candidate.regex === true,
      enabled: candidate.enabled !== false
    });
  });

  return { rules, findings };
};

const listStyleRuleFiles = async (
  fs: ProjectFileSystem,
  projectRoot: string
): Promise<string[]> => {
  const dir = styleDir(projectRoot);
  if (!await fs.pathExists(dir)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of await fs.readDir(dir)) {
    const filePath = path.join(dir, entry);
    if ((await fs.stat(filePath)).isFile() && /\.(ya?ml|json)$/i.test(entry)) {
      files.push(filePath);
    }
  }

  return files.sort();
};

const readStyleRules = async (
  input: StyleInput
): Promise<{ ruleFiles: string[]; rules: StyleRule[]; findings: StyleLintFinding[] }> => {
  const ruleFiles = await listStyleRuleFiles(input.fileSystem, input.projectRoot);
  const rules: StyleRule[] = [];
  const findings: StyleLintFinding[] = [];

  for (const filePath of ruleFiles) {
    const parsed = parseStyleDocument(await input.fileSystem.readFile(filePath), filePath);
    rules.push(...parsed.rules);
    findings.push(...parsed.findings);
  }

  return {
    ruleFiles,
    rules: rules.length > 0 ? rules : DEFAULT_RULES,
    findings
  };
};

const readProseLintAdapters = async (
  input: StyleInput
): Promise<ProseLintAdapterConfig[]> => {
  const configPath = adaptersConfigPath(input.projectRoot);
  if (!await input.fileSystem.pathExists(configPath)) {
    return [];
  }

  const document = await input.fileSystem.readJson<unknown>(configPath);
  if (!isRecord(document) || !Array.isArray(document.adapters)) {
    return [];
  }

  return document.adapters.flatMap(adapter => {
    if (!isRecord(adapter) || !isNonEmptyString(adapter.id)) {
      return [];
    }

    return [{
      id: adapter.id.trim() as ProseLintAdapterConfig['id'],
      enabled: adapter.enabled !== false
    }];
  });
};

const normalizeChapter = (chapter?: string): string | undefined => {
  if (!chapter) {
    return undefined;
  }

  const trimmed = chapter.trim();
  return /^\d+$/.test(trimmed) ? `chapter-${trimmed.padStart(3, '0')}` : trimmed;
};

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

const collectContentFiles = async (
  input: StyleLintInput
): Promise<string[]> => {
  if (input.story) {
    return listMarkdownFiles(input.fileSystem, path.join(input.projectRoot, 'stories', input.story, 'content'));
  }

  const storiesDir = path.join(input.projectRoot, 'stories');
  if (!await input.fileSystem.pathExists(storiesDir)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of await input.fileSystem.readDir(storiesDir)) {
    const storyPath = path.join(storiesDir, entry);
    if ((await input.fileSystem.stat(storyPath)).isDirectory()) {
      files.push(...await listMarkdownFiles(input.fileSystem, path.join(storyPath, 'content')));
    }
  }

  return files.sort();
};

const createMatcher = (rule: StyleRule): ((line: string) => boolean) => {
  if (!rule.regex) {
    return line => line.includes(rule.pattern);
  }

  try {
    const regexp = new RegExp(rule.pattern, 'u');
    return line => regexp.test(line);
  } catch {
    return () => false;
  }
};

const lintFile = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  filePath: string,
  rules: readonly StyleRule[]
): Promise<StyleLintFinding[]> => {
  const content = await fs.readFile(filePath);
  const lines = content.split(/\r?\n/);
  const findings: StyleLintFinding[] = [];

  for (const rule of rules) {
    const severity = rule.severity;
    if (severity === 'off' || rule.enabled === false) {
      continue;
    }

    const matches = createMatcher(rule);
    lines.forEach((line, index) => {
      if (!matches(line)) {
        return;
      }

      findings.push({
        severity,
        code: 'STYLE_RULE_MATCH',
        ruleId: rule.id,
        path: `${relativePath(projectRoot, filePath)}:${index + 1}`,
        evidence: line.trim().slice(0, 180),
        message: rule.description,
        suggestion: rule.suggestion,
        source: 'built-in'
      });
    });
  }

  return findings;
};

const runProseLintAdapters = async (
  input: StyleLintInput,
  files: string[]
): Promise<{ statuses: ProseLintAdapterStatus[]; findings: StyleLintFinding[] }> => {
  const adapters = await readProseLintAdapters(input);
  const statuses: ProseLintAdapterStatus[] = [];
  const findings: StyleLintFinding[] = [];

  for (const adapter of adapters) {
    if (!adapter.enabled) {
      statuses.push({
        id: adapter.id,
        source: adapter.id,
        status: 'skipped',
        message: 'adapter 已禁用'
      });
      continue;
    }

    if (!input.adapterRunner) {
      statuses.push({
        id: adapter.id,
        source: adapter.id,
        status: 'skipped',
        message: '未配置外部 prose lint runner'
      });
      continue;
    }

    try {
      const adapterFindings = await input.adapterRunner({
        adapter,
        projectRoot: input.projectRoot,
        files,
        fileSystem: input.fileSystem
      });
      findings.push(...adapterFindings.map(finding => ({
        ...finding,
        source: finding.source ?? adapter.id
      })));
      statuses.push({
        id: adapter.id,
        source: adapter.id,
        status: 'pass',
        message: `adapter 返回 ${adapterFindings.length} 个 finding`
      });
    } catch (error) {
      statuses.push({
        id: adapter.id,
        source: adapter.id,
        status: 'failed',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return { statuses, findings };
};

const summarize = (findings: readonly StyleLintFinding[]): StyleLintResult['summary'] => ({
  error: findings.filter(finding => finding.severity === 'error').length,
  warning: findings.filter(finding => finding.severity === 'warning').length,
  info: findings.filter(finding => finding.severity === 'info').length
});

export const lintStyle = async (
  input: StyleLintInput
): Promise<StyleLintResult> => {
  const chapter = normalizeChapter(input.chapter);
  const ruleResult = await readStyleRules(input);
  const files = (await collectContentFiles(input))
    .filter(file => !chapter || path.basename(file).includes(chapter));
  const lintFindings = (await Promise.all(files.map(file =>
    lintFile(input.fileSystem, input.projectRoot, file, ruleResult.rules)
  ))).flat();
  const adapterResult = await runProseLintAdapters(input, files);
  const findings = [...ruleResult.findings, ...lintFindings, ...adapterResult.findings];

  return {
    projectRoot: input.projectRoot,
    scannedFiles: files,
    ruleFiles: ruleResult.ruleFiles,
    rules: ruleResult.rules,
    adapters: adapterResult.statuses,
    findings,
    summary: summarize(findings)
  };
};

export const explainStyleRule = async (
  input: StyleInput & { ruleId: string }
): Promise<StyleExplainResult> => {
  const ruleResult = await readStyleRules(input);
  return {
    projectRoot: input.projectRoot,
    ruleId: input.ruleId,
    rule: ruleResult.rules.find(rule => rule.id === input.ruleId),
    ruleFiles: ruleResult.ruleFiles
  };
};

export const renderStyleLint = (result: StyleLintResult): string => [
  'Style Lint',
  '',
  `扫描文件：${result.scannedFiles.length}`,
  `规则：${result.rules.length}`,
  `Findings：${result.findings.length}`,
  `Error/Warning/Info：${result.summary.error}/${result.summary.warning}/${result.summary.info}`,
  `Adapters：${result.adapters.length > 0 ? result.adapters.map(adapter => `${adapter.id}:${adapter.status}`).join(', ') : '无'}`,
  '',
  ...(result.findings.length > 0
    ? result.findings.map(item => `- [${item.severity}] ${item.ruleId}: ${toPosixPath(item.path)} - ${item.evidence}；建议：${item.suggestion}`)
    : ['- 无'])
].join('\n').trimEnd();

export const renderStyleExplain = (result: StyleExplainResult): string => {
  if (!result.rule) {
    return [
      'Style Rule',
      '',
      `规则：${result.ruleId}`,
      '结果：未找到',
      `规则文件：${result.ruleFiles.map(toPosixPath).join(', ') || '内置默认规则'}`
    ].join('\n');
  }

  return [
    'Style Rule',
    '',
    `规则：${result.rule.id}`,
    `描述：${result.rule.description}`,
    `Pattern：${result.rule.pattern}`,
    `Severity：${result.rule.severity}`,
    `Suggestion：${result.rule.suggestion}`,
    `Regex：${result.rule.regex ? 'yes' : 'no'}`
  ].join('\n');
};
