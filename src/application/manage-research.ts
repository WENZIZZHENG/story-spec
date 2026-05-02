import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import type {
  CitationLink,
  ResearchIssue,
  ResearchSource,
  ResearchSourceType
} from '../domain/workbench.js';
import {
  relativePath,
  resolveProjectPath,
  slugifyPathPart,
  toPosixPath,
  unique
} from './workbench-utils.js';

export interface ResearchInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
}

export interface AddResearchSourceInput extends ResearchInput {
  title: string;
  type?: ResearchSourceType;
  path?: string;
  url?: string;
  note?: string;
  accessedAt?: string;
  now?: () => Date;
}

export interface LinkResearchCitationInput extends ResearchInput {
  sourceId: string;
  targetPath: string;
  targetId?: string;
  reason: string;
}

export interface ResearchSourceDocument {
  schemaVersion: '1.0';
  sources: ResearchSource[];
}

export interface CitationDocument {
  schemaVersion: '1.0';
  links: CitationLink[];
}

export interface AddResearchSourceResult {
  projectRoot: string;
  sourcesPath: string;
  notePath?: string;
  source: ResearchSource;
  sources: ResearchSource[];
}

export interface ResearchListResult {
  projectRoot: string;
  sourcesPath: string;
  sources: ResearchSource[];
  issues: ResearchIssue[];
}

export interface LinkResearchCitationResult {
  projectRoot: string;
  citationsPath: string;
  link: CitationLink;
  links: CitationLink[];
}

export interface ResearchCheckResult {
  projectRoot: string;
  sourcesPath: string;
  citationsPath: string;
  sources: ResearchSource[];
  links: CitationLink[];
  issues: ResearchIssue[];
  valid: boolean;
}

const VALID_SOURCE_TYPES: ResearchSourceType[] = [
  'book',
  'article',
  'web',
  'video',
  'interview',
  'personal-note'
];

const researchRoot = (projectRoot: string): string => path.join(projectRoot, 'research');
const researchNotesDir = (projectRoot: string): string => path.join(researchRoot(projectRoot), 'notes');
const researchSourcesDir = (projectRoot: string): string => path.join(researchRoot(projectRoot), 'sources');
const researchSourcesPath = (projectRoot: string): string => path.join(researchSourcesDir(projectRoot), 'sources.json');
const citationsPath = (projectRoot: string): string => path.join(researchRoot(projectRoot), 'citations.json');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(isNonEmptyString).map(item => item.trim())
    : [];

const normalizeType = (value: unknown): ResearchSourceType =>
  VALID_SOURCE_TYPES.includes(String(value) as ResearchSourceType)
    ? value as ResearchSourceType
    : 'personal-note';

const issue = (
  code: ResearchIssue['code'],
  filePath: string,
  message: string,
  suggestedAction: string,
  severity: ResearchIssue['severity'] = 'warning'
): ResearchIssue => ({
  severity,
  code,
  path: filePath,
  message,
  suggestedAction
});

const parseJsonDocument = <T>(
  content: string,
  filePath: string,
  code: ResearchIssue['code']
): { document?: T; issues: ResearchIssue[] } => {
  try {
    return { document: JSON.parse(content) as T, issues: [] };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      issues: [issue(
        code,
        filePath,
        `JSON 无法解析：${detail}`,
        '修正 research JSON 格式后重新运行 research:check',
        'error'
      )]
    };
  }
};

const parseSources = (
  content: string,
  filePath: string
): { sources: ResearchSource[]; issues: ResearchIssue[] } => {
  const parsed = parseJsonDocument<unknown>(content, filePath, 'INVALID_RESEARCH_DOCUMENT');
  if (!parsed.document) {
    return { sources: [], issues: parsed.issues };
  }

  if (!isRecord(parsed.document) || !Array.isArray(parsed.document.sources)) {
    return {
      sources: [],
      issues: [issue(
        'INVALID_RESEARCH_DOCUMENT',
        filePath,
        'sources.json 顶层必须包含 sources 数组',
        '把资料来源记录到 { "schemaVersion": "1.0", "sources": [] } 中',
        'error'
      )]
    };
  }

  const sources: ResearchSource[] = [];
  const issues: ResearchIssue[] = [];
  parsed.document.sources.forEach((candidate, index) => {
    const itemPath = `${filePath}#sources[${index}]`;
    if (!isRecord(candidate)) {
      issues.push(issue(
        'INVALID_RESEARCH_SOURCE',
        itemPath,
        'ResearchSource 必须是对象',
        '删除无效项或改成 ResearchSource 对象',
        'error'
      ));
      return;
    }

    const required = ['id', 'title'];
    for (const field of required) {
      if (!isNonEmptyString(candidate[field])) {
        issues.push(issue(
          'MISSING_RESEARCH_SOURCE_FIELD',
          `${itemPath}.${field}`,
          `ResearchSource 缺少 ${field}`,
          `补齐 ${field} 后再检查 research vault`,
          'warning'
        ));
      }
    }

    if (required.some(field => !isNonEmptyString(candidate[field]))) {
      return;
    }

    sources.push({
      id: String(candidate.id).trim(),
      title: String(candidate.title).trim(),
      type: normalizeType(candidate.type),
      path: isNonEmptyString(candidate.path) ? candidate.path.trim() : undefined,
      url: isNonEmptyString(candidate.url) ? candidate.url.trim() : undefined,
      accessedAt: isNonEmptyString(candidate.accessedAt) ? candidate.accessedAt.trim() : undefined,
      notes: toStringArray(candidate.notes)
    });
  });

  return { sources, issues };
};

const parseCitations = (
  content: string,
  filePath: string
): { links: CitationLink[]; issues: ResearchIssue[] } => {
  const parsed = parseJsonDocument<unknown>(content, filePath, 'INVALID_CITATION_DOCUMENT');
  if (!parsed.document) {
    return { links: [], issues: parsed.issues };
  }

  if (!isRecord(parsed.document) || !Array.isArray(parsed.document.links)) {
    return {
      links: [],
      issues: [issue(
        'INVALID_CITATION_DOCUMENT',
        filePath,
        'citations.json 顶层必须包含 links 数组',
        '把引用关系记录到 { "schemaVersion": "1.0", "links": [] } 中',
        'error'
      )]
    };
  }

  const links: CitationLink[] = [];
  const issues: ResearchIssue[] = [];
  parsed.document.links.forEach((candidate, index) => {
    const itemPath = `${filePath}#links[${index}]`;
    if (!isRecord(candidate)) {
      issues.push(issue(
        'INVALID_CITATION_LINK',
        itemPath,
        'CitationLink 必须是对象',
        '删除无效项或改成 CitationLink 对象',
        'error'
      ));
      return;
    }

    const required = ['sourceId', 'targetPath', 'reason'];
    for (const field of required) {
      if (!isNonEmptyString(candidate[field])) {
        issues.push(issue(
          'INVALID_CITATION_LINK',
          `${itemPath}.${field}`,
          `CitationLink 缺少 ${field}`,
          `补齐 ${field} 后再检查 citation`,
          'warning'
        ));
      }
    }

    if (required.some(field => !isNonEmptyString(candidate[field]))) {
      return;
    }

    links.push({
      sourceId: String(candidate.sourceId).trim(),
      targetPath: toPosixPath(String(candidate.targetPath).trim()),
      targetId: isNonEmptyString(candidate.targetId) ? candidate.targetId.trim() : undefined,
      reason: String(candidate.reason).trim()
    });
  });

  return { links, issues };
};

const readSourceDocument = async (
  input: ResearchInput
): Promise<{ sourcesPath: string; sources: ResearchSource[]; issues: ResearchIssue[] }> => {
  const filePath = researchSourcesPath(input.projectRoot);
  if (!await input.fileSystem.pathExists(filePath)) {
    return {
      sourcesPath: filePath,
      sources: [],
      issues: [issue(
        'INVALID_RESEARCH_DOCUMENT',
        filePath,
        '缺少 research/sources/sources.json',
        '运行 research:add 或从模板创建 sources.json',
        'info'
      )]
    };
  }

  const parsed = parseSources(await input.fileSystem.readFile(filePath), filePath);
  return {
    sourcesPath: filePath,
    sources: parsed.sources,
    issues: parsed.issues
  };
};

const readCitationDocument = async (
  input: ResearchInput
): Promise<{ citationsPath: string; links: CitationLink[]; issues: ResearchIssue[] }> => {
  const filePath = citationsPath(input.projectRoot);
  if (!await input.fileSystem.pathExists(filePath)) {
    return {
      citationsPath: filePath,
      links: [],
      issues: [issue(
        'INVALID_CITATION_DOCUMENT',
        filePath,
        '缺少 research/citations.json',
        '运行 research:link 或从模板创建 citations.json',
        'info'
      )]
    };
  }

  const parsed = parseCitations(await input.fileSystem.readFile(filePath), filePath);
  return {
    citationsPath: filePath,
    links: parsed.links,
    issues: parsed.issues
  };
};

const createUniqueSourceId = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  title: string,
  existing: readonly ResearchSource[]
): Promise<string> => {
  const baseId = `source.${slugifyPathPart(title)}`;
  const existingIds = new Set(existing.map(source => source.id));
  let candidate = baseId;
  let suffix = 2;

  while (existingIds.has(candidate) || await fs.pathExists(path.join(researchSourcesDir(projectRoot), `${candidate}.json`))) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const renderPersonalNote = (source: ResearchSource, note: string): string => [
  `# ${source.title}`,
  '',
  `Source ID: ${source.id}`,
  `Type: ${source.type}`,
  source.url ? `URL: ${source.url}` : '',
  source.accessedAt ? `Accessed: ${source.accessedAt}` : '',
  '',
  '## Notes',
  '',
  note || '待补充。'
].filter(line => line !== '').join('\n');

export const addResearchSource = async (
  input: AddResearchSourceInput
): Promise<AddResearchSourceResult> => {
  const current = await readSourceDocument(input);
  const sourceId = await createUniqueSourceId(input.fileSystem, input.projectRoot, input.title, current.sources);
  const type = input.type ?? 'personal-note';
  const accessedAt = input.accessedAt ?? (input.url ? (input.now ?? (() => new Date()))().toISOString().slice(0, 10) : undefined);
  let sourcePath = input.path ? relativePath(input.projectRoot, resolveProjectPath(input.projectRoot, input.path)) : undefined;
  let notePath: string | undefined;

  if (type === 'personal-note' && !sourcePath) {
    notePath = path.join(researchNotesDir(input.projectRoot), `${slugifyPathPart(input.title)}.md`);
    sourcePath = relativePath(input.projectRoot, notePath);
  }

  const source: ResearchSource = {
    id: sourceId,
    title: input.title.trim(),
    type,
    path: sourcePath,
    url: input.url?.trim() || undefined,
    accessedAt,
    notes: input.note?.trim() ? [input.note.trim()] : []
  };
  const sources = [...current.sources, source].sort((left, right) => left.id.localeCompare(right.id));

  if (notePath) {
    await input.fileSystem.writeFile(notePath, renderPersonalNote(source, input.note?.trim() ?? ''));
  }

  await input.fileSystem.ensureDir(researchSourcesDir(input.projectRoot));
  await input.fileSystem.writeJson(researchSourcesPath(input.projectRoot), {
    schemaVersion: '1.0',
    sources
  } satisfies ResearchSourceDocument, { spaces: 2 });

  return {
    projectRoot: input.projectRoot,
    sourcesPath: researchSourcesPath(input.projectRoot),
    notePath,
    source,
    sources
  };
};

export const listResearchSources = async (
  input: ResearchInput
): Promise<ResearchListResult> => {
  const result = await readSourceDocument(input);
  return {
    projectRoot: input.projectRoot,
    sourcesPath: result.sourcesPath,
    sources: result.sources,
    issues: result.issues.filter(item => item.severity !== 'info')
  };
};

export const linkResearchCitation = async (
  input: LinkResearchCitationInput
): Promise<LinkResearchCitationResult> => {
  const current = await readCitationDocument(input);
  const link: CitationLink = {
    sourceId: input.sourceId.trim(),
    targetPath: relativePath(input.projectRoot, resolveProjectPath(input.projectRoot, input.targetPath)),
    targetId: input.targetId?.trim() || undefined,
    reason: input.reason.trim()
  };
  const links = [...current.links, link];

  await input.fileSystem.ensureDir(researchRoot(input.projectRoot));
  await input.fileSystem.writeJson(citationsPath(input.projectRoot), {
    schemaVersion: '1.0',
    links
  } satisfies CitationDocument, { spaces: 2 });

  return {
    projectRoot: input.projectRoot,
    citationsPath: citationsPath(input.projectRoot),
    link,
    links
  };
};

const validateSourcePaths = async (
  input: ResearchInput,
  sources: readonly ResearchSource[],
  sourceFilePath: string
): Promise<ResearchIssue[]> => {
  const issues: ResearchIssue[] = [];

  for (const source of sources) {
    if (source.path && !await input.fileSystem.pathExists(resolveProjectPath(input.projectRoot, source.path))) {
      issues.push(issue(
        'INVALID_RESEARCH_SOURCE',
        `${sourceFilePath}#${source.id}.path`,
        `ResearchSource 路径不存在：${source.path}`,
        '修正 path，或把对应资料文件放入 research/notes 或 research/sources',
        'warning'
      ));
    }
  }

  return issues;
};

const validateCitationLinks = async (
  input: ResearchInput,
  sources: readonly ResearchSource[],
  links: readonly CitationLink[],
  citationFilePath: string
): Promise<ResearchIssue[]> => {
  const sourceIds = new Set(sources.map(source => source.id));
  const issues: ResearchIssue[] = [];

  for (const link of links) {
    const itemPath = `${citationFilePath}#${link.sourceId}->${link.targetPath}`;
    if (!sourceIds.has(link.sourceId)) {
      issues.push(issue(
        'MISSING_CITATION_SOURCE',
        itemPath,
        `citation 引用不存在的 source：${link.sourceId}`,
        '先用 research:add 创建 source，或修正 citations.json 中的 sourceId',
        'error'
      ));
    }

    if (!await input.fileSystem.pathExists(resolveProjectPath(input.projectRoot, link.targetPath))) {
      issues.push(issue(
        'MISSING_CITATION_TARGET',
        itemPath,
        `citation target 不存在：${link.targetPath}`,
        '修正 targetPath，或先创建对应 world/canon/spec 文件',
        'warning'
      ));
    }
  }

  return issues;
};

export const checkResearch = async (
  input: ResearchInput
): Promise<ResearchCheckResult> => {
  const [sourceResult, citationResult] = await Promise.all([
    readSourceDocument(input),
    readCitationDocument(input)
  ]);
  const issues = [
    ...sourceResult.issues.filter(item => item.severity !== 'info'),
    ...citationResult.issues.filter(item => item.severity !== 'info'),
    ...await validateSourcePaths(input, sourceResult.sources, sourceResult.sourcesPath),
    ...await validateCitationLinks(input, sourceResult.sources, citationResult.links, citationResult.citationsPath)
  ];

  return {
    projectRoot: input.projectRoot,
    sourcesPath: sourceResult.sourcesPath,
    citationsPath: citationResult.citationsPath,
    sources: sourceResult.sources,
    links: citationResult.links,
    issues,
    valid: !issues.some(item => item.severity === 'error')
  };
};

export const renderResearchAdd = (result: AddResearchSourceResult): string => [
  'Research Source',
  '',
  `Source：${result.source.id}`,
  `标题：${result.source.title}`,
  `类型：${result.source.type}`,
  `Sources：${toPosixPath(result.sourcesPath)}`,
  ...(result.notePath ? [`Note：${toPosixPath(result.notePath)}`] : [])
].join('\n');

export const renderResearchList = (result: ResearchListResult): string => [
  'Research Sources',
  '',
  `文件：${toPosixPath(result.sourcesPath)}`,
  `Sources：${result.sources.length}`,
  '',
  ...(result.sources.length > 0
    ? result.sources.map(source => `- ${source.id}：${source.title}（${source.type}）`)
    : ['- 暂无 source']),
  '',
  ...(result.issues.length > 0
    ? result.issues.map(item => `- [${item.severity}] ${item.code}: ${toPosixPath(item.path)} - ${item.message}`)
    : [])
].join('\n').trimEnd();

export const renderResearchLink = (result: LinkResearchCitationResult): string => [
  'Research Citation',
  '',
  `Source：${result.link.sourceId}`,
  `Target：${result.link.targetPath}${result.link.targetId ? `#${result.link.targetId}` : ''}`,
  `原因：${result.link.reason}`,
  `文件：${toPosixPath(result.citationsPath)}`
].join('\n');

export const renderResearchCheck = (result: ResearchCheckResult): string => [
  'Research Check',
  '',
  `Sources：${result.sources.length}`,
  `Citations：${result.links.length}`,
  `结果：${result.valid ? '通过' : '失败'}`,
  `问题：${result.issues.length}`,
  '',
  ...(result.issues.length > 0
    ? result.issues.map(item => `- [${item.severity}] ${item.code}: ${toPosixPath(item.path)} - ${item.message}；建议：${item.suggestedAction}`)
    : ['- 无'])
].join('\n').trimEnd();

export const collectResearchSourceIds = (sources: readonly ResearchSource[]): string[] =>
  unique(sources.map(source => source.id));
