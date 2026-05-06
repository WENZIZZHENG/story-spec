import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import {
  findStoryArtifactPath,
  relativePath,
  resolveProjectPath,
  selectStoryProject,
  slugifyPathPart,
  toPosixPath
} from './workbench-utils.js';

export type OutlineCandidateStatus = 'candidate' | 'promoted';
export type OutlineCandidateSource = 'current-plan' | 'author-text' | 'author-file';

export type OutlineCandidateErrorCode =
  | 'UNSUPPORTED_OUTLINE_SOURCE'
  | 'MISSING_CREATIVE_PLAN'
  | 'MISSING_OUTLINE_INPUT'
  | 'OUTLINE_NOT_FOUND'
  | 'OUTLINE_CONTENT_NOT_FOUND';

export class OutlineCandidateError extends Error {
  constructor(
    public readonly code: OutlineCandidateErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'OutlineCandidateError';
  }
}

export interface OutlineCandidateRecord {
  schemaVersion: '1.0';
  id: string;
  title: string;
  story: string;
  status: OutlineCandidateStatus;
  source: OutlineCandidateSource;
  sourcePath?: string;
  createdAt: string;
  updatedAt: string;
  promotedAt?: string;
  summary: string;
  risks: string[];
}

export interface OutlineCandidateInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  now?: () => Date;
}

export interface ForkOutlineCandidateInput extends OutlineCandidateInput {
  title: string;
  from?: string;
}

export interface CreateOutlineCandidateInput extends OutlineCandidateInput {
  title: string;
  text?: string;
  file?: string;
}

export interface ListOutlineCandidatesInput extends OutlineCandidateInput {}

export interface CompareOutlineCandidatesInput extends OutlineCandidateInput {
  leftId: string;
  rightId: string;
}

export interface PromoteOutlineCandidateInput extends OutlineCandidateInput {
  outlineId: string;
  yes?: boolean;
}

export interface OutlineCandidateWriteResult {
  story: string;
  outline: OutlineCandidateRecord;
  outlineDir: string;
  outlinePath: string;
  planPath: string;
  summaryPath: string;
  risksPath: string;
}

export interface OutlineCandidateListResult {
  story: string;
  outlineRoot: string;
  outlines: OutlineCandidateRecord[];
}

export interface OutlineCompareDimension {
  dimension: '主线目标' | '人物弧线' | '节奏' | '风险' | '读者承诺';
  left: string;
  right: string;
  changed: boolean;
}

export interface OutlineCandidateCompareResult {
  story: string;
  left: OutlineCandidateRecord;
  right: OutlineCandidateRecord;
  dimensions: OutlineCompareDimension[];
}

export interface OutlineCandidatePromoteResult {
  story: string;
  outline: OutlineCandidateRecord;
  outlinePath: string;
  sourcePlanPath: string;
  targetPlanPath: string;
  dryRun: boolean;
  reminders: string[];
}

const outlineRoot = (storyPath: string): string => path.join(storyPath, 'outlines');
const outlineDir = (storyPath: string, outlineId: string): string =>
  path.join(outlineRoot(storyPath), outlineId);
const outlineJsonPath = (storyPath: string, outlineId: string): string =>
  path.join(outlineDir(storyPath, outlineId), 'outline.json');
const outlinePlanPath = (storyPath: string, outlineId: string): string =>
  path.join(outlineDir(storyPath, outlineId), 'creative-plan.md');
const outlineSummaryPath = (storyPath: string, outlineId: string): string =>
  path.join(outlineDir(storyPath, outlineId), 'summary.md');
const outlineRisksPath = (storyPath: string, outlineId: string): string =>
  path.join(outlineDir(storyPath, outlineId), 'risks.md');

const DEFAULT_PROMOTION_REMINDERS = [
  '重新检查 tasks、Scene Card 和 Context Pack 是否仍符合新的 creative-plan.md。',
  '不要自动修改正文、tracking 或 canon；需要迁移时另建明确任务。'
] as const;

const createUniqueOutlineId = async (
  fs: ProjectFileSystem,
  storyPath: string,
  title: string
): Promise<string> => {
  const baseId = slugifyPathPart(title);
  let candidate = baseId;
  let suffix = 2;

  while (await fs.pathExists(outlineDir(storyPath, candidate))) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const normalizeStatus = (status: unknown): OutlineCandidateStatus =>
  status === 'promoted' ? 'promoted' : 'candidate';

const normalizeSource = (source: unknown): OutlineCandidateSource =>
  source === 'author-file' || source === 'author-text' || source === 'current-plan'
    ? source
    : 'author-text';

const trimText = (value: string | undefined): string => value?.trim() ?? '';

const firstMeaningfulLine = (content: string): string => {
  const line = content
    .split(/\r?\n/)
    .map(item => item.replace(/^#+\s*/, '').trim())
    .find(Boolean);

  return line ?? '候选大纲';
};

const buildRisks = (): string[] => [
  '提升后需要重新检查 tasks、Scene Card 和 Context Pack。',
  '候选大纲不是正典；promote 前不要据此改正文或 tracking。',
  '如果候选改变人物关系、世界规则或读者承诺，需要重新人工确认。'
];

const buildSummary = (title: string, source: OutlineCandidateSource, content: string): string => {
  const prefix = source === 'current-plan'
    ? '从当前正式 creative-plan.md fork。'
    : source === 'author-file'
      ? '从作者提供的本地文件创建。'
      : '从作者提供的文本创建。';

  return `${prefix} ${title}：${firstMeaningfulLine(content)}`;
};

const renderSummaryMarkdown = (outline: OutlineCandidateRecord): string => [
  `# ${outline.title} 摘要`,
  '',
  `ID：${outline.id}`,
  `状态：${outline.status}`,
  `来源：${outline.source}`,
  outline.sourcePath ? `来源路径：${outline.sourcePath}` : undefined,
  '',
  outline.summary
].filter((line): line is string => line !== undefined).join('\n');

const renderRisksMarkdown = (outline: OutlineCandidateRecord): string => [
  `# ${outline.title} 风险`,
  '',
  ...outline.risks.map(risk => `- ${risk}`)
].join('\n');

const writeOutlineFiles = async (
  fs: ProjectFileSystem,
  storyPath: string,
  outline: OutlineCandidateRecord,
  content: string
): Promise<OutlineCandidateWriteResult> => {
  const dir = outlineDir(storyPath, outline.id);
  await fs.ensureDir(dir);
  await fs.writeFile(outlinePlanPath(storyPath, outline.id), content);
  await fs.writeFile(outlineSummaryPath(storyPath, outline.id), renderSummaryMarkdown(outline));
  await fs.writeFile(outlineRisksPath(storyPath, outline.id), renderRisksMarkdown(outline));
  await fs.writeJson(outlineJsonPath(storyPath, outline.id), outline, { spaces: 2 });

  return {
    story: outline.story,
    outline,
    outlineDir: dir,
    outlinePath: outlineJsonPath(storyPath, outline.id),
    planPath: outlinePlanPath(storyPath, outline.id),
    summaryPath: outlineSummaryPath(storyPath, outline.id),
    risksPath: outlineRisksPath(storyPath, outline.id)
  };
};

const readOutline = async (
  fs: ProjectFileSystem,
  storyPath: string,
  outlineId: string
): Promise<OutlineCandidateRecord> => {
  const filePath = outlineJsonPath(storyPath, outlineId);
  if (!await fs.pathExists(filePath)) {
    throw new OutlineCandidateError('OUTLINE_NOT_FOUND', `未找到大纲候选：${outlineId}`);
  }

  const record = await fs.readJson<OutlineCandidateRecord>(filePath);
  return {
    ...record,
    schemaVersion: '1.0',
    status: normalizeStatus(record.status),
    source: normalizeSource(record.source),
    risks: Array.isArray(record.risks) ? record.risks.map(String) : buildRisks()
  };
};

const readOutlineContent = async (
  fs: ProjectFileSystem,
  storyPath: string,
  outlineId: string
): Promise<string> => {
  const filePath = outlinePlanPath(storyPath, outlineId);
  if (!await fs.pathExists(filePath)) {
    throw new OutlineCandidateError('OUTLINE_CONTENT_NOT_FOUND', `候选缺少 creative-plan.md：${outlineId}`);
  }

  return fs.readFile(filePath);
};

const createRecord = async (
  input: OutlineCandidateInput & {
    title: string;
    source: OutlineCandidateSource;
    sourcePath?: string;
    content: string;
  }
): Promise<OutlineCandidateWriteResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const now = (input.now ?? (() => new Date()))().toISOString();
  const id = await createUniqueOutlineId(input.fileSystem, story.path, input.title);
  const outline: OutlineCandidateRecord = {
    schemaVersion: '1.0',
    id,
    title: input.title.trim(),
    story: story.name,
    status: 'candidate',
    source: input.source,
    ...(input.sourcePath ? { sourcePath: input.sourcePath } : {}),
    createdAt: now,
    updatedAt: now,
    summary: buildSummary(input.title.trim(), input.source, input.content),
    risks: buildRisks()
  };

  return writeOutlineFiles(input.fileSystem, story.path, outline, input.content);
};

export const forkOutlineCandidate = async (
  input: ForkOutlineCandidateInput
): Promise<OutlineCandidateWriteResult> => {
  if ((input.from ?? 'current') !== 'current') {
    throw new OutlineCandidateError('UNSUPPORTED_OUTLINE_SOURCE', 'outline:fork 第一版只支持 --from current。');
  }

  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const planPath = findStoryArtifactPath(story, 'creative-plan');
  if (!planPath) {
    throw new OutlineCandidateError('MISSING_CREATIVE_PLAN', `故事缺少正式 creative-plan.md：${story.name}`);
  }

  const content = await input.fileSystem.readFile(planPath);
  return createRecord({
    ...input,
    story: story.name,
    source: 'current-plan',
    sourcePath: relativePath(input.projectRoot, planPath),
    content
  });
};

const resolveAuthorFile = (projectRoot: string, filePath: string): string =>
  path.isAbsolute(filePath) ? filePath : resolveProjectPath(projectRoot, filePath);

export const createOutlineCandidate = async (
  input: CreateOutlineCandidateInput
): Promise<OutlineCandidateWriteResult> => {
  const hasText = Boolean(input.text?.trim());
  const hasFile = Boolean(input.file?.trim());
  if (hasText === hasFile) {
    throw new OutlineCandidateError('MISSING_OUTLINE_INPUT', '请且只请提供 --text 或 --file 创建候选大纲。');
  }

  if (hasText) {
    return createRecord({
      ...input,
      source: 'author-text',
      content: input.text!.trim()
    });
  }

  const sourceFile = resolveAuthorFile(input.projectRoot, input.file!.trim());
  const content = (await input.fileSystem.readFile(sourceFile)).trim();
  if (!content) {
    throw new OutlineCandidateError('MISSING_OUTLINE_INPUT', '候选大纲文件为空。');
  }

  return createRecord({
    ...input,
    source: 'author-file',
    sourcePath: relativePath(input.projectRoot, sourceFile),
    content
  });
};

export const listOutlineCandidates = async (
  input: ListOutlineCandidatesInput
): Promise<OutlineCandidateListResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const root = outlineRoot(story.path);
  if (!await input.fileSystem.pathExists(root)) {
    return {
      story: story.name,
      outlineRoot: root,
      outlines: []
    };
  }

  const entries = await input.fileSystem.readDir(root);
  const outlines: OutlineCandidateRecord[] = [];
  for (const entry of entries) {
    const stat = await input.fileSystem.stat(path.join(root, entry));
    if (!stat.isDirectory()) {
      continue;
    }

    try {
      outlines.push(await readOutline(input.fileSystem, story.path, entry));
    } catch (error) {
      if (!(error instanceof OutlineCandidateError && error.code === 'OUTLINE_NOT_FOUND')) {
        throw error;
      }
    }
  }

  outlines.sort((left, right) => {
    const byUpdated = Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
    return byUpdated !== 0 ? byUpdated : left.id.localeCompare(right.id);
  });

  return {
    story: story.name,
    outlineRoot: root,
    outlines
  };
};

const normalizeContentLine = (value: string): string =>
  value.replace(/\s+/g, ' ').replace(/^[-*]\s*/, '').trim();

const extractSection = (content: string, labels: readonly string[]): string => {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^#{1,4}\s*(.+?)\s*$/);
    if (!heading) {
      continue;
    }

    const title = heading[1].trim();
    if (!labels.some(label => title.includes(label))) {
      continue;
    }

    const sectionLines: string[] = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (/^#{1,4}\s+/.test(lines[cursor])) {
        break;
      }
      const cleaned = normalizeContentLine(lines[cursor]);
      if (cleaned) {
        sectionLines.push(cleaned);
      }
    }

    if (sectionLines.length > 0) {
      return sectionLines.join(' ');
    }
  }

  return '';
};

const fallbackByKeywords = (content: string, keywords: readonly string[]): string => {
  const lines = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(normalizeContentLine)
    .filter(Boolean);
  const found = lines.find(line => keywords.some(keyword => line.includes(keyword)));
  return found ?? '未明确';
};

const extractDimension = (
  content: string,
  labels: readonly string[],
  keywords: readonly string[]
): string => {
  const section = extractSection(content, labels);
  return section || fallbackByKeywords(content, keywords);
};

const buildCompareDimensions = (
  leftContent: string,
  rightContent: string
): OutlineCompareDimension[] => {
  const configs: Array<{
    dimension: OutlineCompareDimension['dimension'];
    labels: string[];
    keywords: string[];
  }> = [
    { dimension: '主线目标', labels: ['主线目标', '作品定位', '核心目标'], keywords: ['目标', '主线', '第一卷'] },
    { dimension: '人物弧线', labels: ['人物弧线', '主角核心', '角色弧线'], keywords: ['弧线', '成长', '晏无', '关系'] },
    { dimension: '节奏', labels: ['节奏', '章节节奏', '推进'], keywords: ['节奏', '前三章', '第一章', '第六章'] },
    { dimension: '风险', labels: ['风险', '代价', '隐患'], keywords: ['风险', '容易', '代价', '问题'] },
    { dimension: '读者承诺', labels: ['读者承诺', '阅读承诺', '爽点'], keywords: ['读者', '承诺', '回报', '期待'] }
  ];

  return configs.map(config => {
    const left = extractDimension(leftContent, config.labels, config.keywords);
    const right = extractDimension(rightContent, config.labels, config.keywords);

    return {
      dimension: config.dimension,
      left,
      right,
      changed: left !== right
    };
  });
};

export const compareOutlineCandidates = async (
  input: CompareOutlineCandidatesInput
): Promise<OutlineCandidateCompareResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const left = await readOutline(input.fileSystem, story.path, input.leftId);
  const right = await readOutline(input.fileSystem, story.path, input.rightId);
  const [leftContent, rightContent] = await Promise.all([
    readOutlineContent(input.fileSystem, story.path, left.id),
    readOutlineContent(input.fileSystem, story.path, right.id)
  ]);

  return {
    story: story.name,
    left,
    right,
    dimensions: buildCompareDimensions(leftContent, rightContent)
  };
};

export const promoteOutlineCandidate = async (
  input: PromoteOutlineCandidateInput
): Promise<OutlineCandidatePromoteResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const outline = await readOutline(input.fileSystem, story.path, input.outlineId);
  const sourcePlanPath = outlinePlanPath(story.path, outline.id);
  const targetPlanPath = path.join(story.path, 'creative-plan.md');
  const content = await readOutlineContent(input.fileSystem, story.path, outline.id);
  const reminders = [...DEFAULT_PROMOTION_REMINDERS];

  if (!input.yes) {
    return {
      story: story.name,
      outline,
      outlinePath: outlineJsonPath(story.path, outline.id),
      sourcePlanPath,
      targetPlanPath,
      dryRun: true,
      reminders
    };
  }

  const now = (input.now ?? (() => new Date()))().toISOString();
  const promoted: OutlineCandidateRecord = {
    ...outline,
    status: 'promoted',
    updatedAt: now,
    promotedAt: now
  };
  await input.fileSystem.writeFile(targetPlanPath, content);
  await input.fileSystem.writeJson(outlineJsonPath(story.path, outline.id), promoted, { spaces: 2 });
  await input.fileSystem.writeFile(outlineSummaryPath(story.path, outline.id), renderSummaryMarkdown(promoted));
  await input.fileSystem.writeFile(outlineRisksPath(story.path, outline.id), renderRisksMarkdown(promoted));

  return {
    story: story.name,
    outline: promoted,
    outlinePath: outlineJsonPath(story.path, outline.id),
    sourcePlanPath,
    targetPlanPath,
    dryRun: false,
    reminders
  };
};

export const renderOutlineCreate = (result: OutlineCandidateWriteResult): string => [
  'Outline Candidate',
  '',
  `故事：${result.story}`,
  `候选：${result.outline.id}`,
  `标题：${result.outline.title}`,
  `状态：${result.outline.status}`,
  `来源：${result.outline.source}`,
  `目录：${toPosixPath(result.outlineDir)}`,
  '',
  `比较：storyspec outline:compare ${result.story} ${result.outline.id} <another-outline-id>`,
  `提升预览：storyspec outline:promote ${result.story} ${result.outline.id}`
].join('\n');

export const renderOutlineList = (result: OutlineCandidateListResult): string => [
  'Outline Candidates',
  '',
  `故事：${result.story}`,
  `目录：${toPosixPath(result.outlineRoot)}`,
  `候选数：${result.outlines.length}`,
  '',
  ...(result.outlines.length > 0
    ? result.outlines.map(outline =>
      `- ${outline.id}：${outline.status}，${outline.title}，来源 ${outline.source}，更新 ${outline.updatedAt}`
    )
    : ['- 暂无 outline candidate'])
].join('\n').trimEnd();

export const renderOutlineCompare = (result: OutlineCandidateCompareResult): string => [
  'Outline Compare',
  '',
  `故事：${result.story}`,
  `左：${result.left.id}（${result.left.title}）`,
  `右：${result.right.id}（${result.right.title}）`,
  '',
  '| 维度 | 左 | 右 | 是否变化 |',
  '| --- | --- | --- | --- |',
  ...result.dimensions.map(item =>
    `| ${item.dimension} | ${item.left.replace(/\|/g, '/')} | ${item.right.replace(/\|/g, '/')} | ${item.changed ? '是' : '否'} |`
  )
].join('\n').trimEnd();

export const renderOutlinePromote = (result: OutlineCandidatePromoteResult): string => [
  'Outline Promote',
  '',
  `故事：${result.story}`,
  `候选：${result.outline.id}`,
  `标题：${result.outline.title}`,
  `模式：${result.dryRun ? '预览' : '已写入'}`,
  `来源：${toPosixPath(result.sourcePlanPath)}`,
  `目标：${toPosixPath(result.targetPlanPath)}`,
  '',
  ...(result.dryRun
    ? [`确认写入：storyspec outline:promote ${result.story} ${result.outline.id} --yes`, '']
    : []),
  '## 后续检查',
  '',
  ...result.reminders.map(item => `- ${item}`)
].join('\n').trimEnd();
