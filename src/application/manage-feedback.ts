import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import type {
  ReaderFeedback,
  ReaderFeedbackStatus,
  ReaderFeedbackType
} from '../domain/workbench.js';
import {
  relativePath,
  resolveProjectPath,
  slugifyPathPart,
  toPosixPath
} from './workbench-utils.js';

export interface FeedbackInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
}

export interface ImportFeedbackInput extends FeedbackInput {
  filePath: string;
  source?: string;
  targetPath?: string;
  type?: ReaderFeedbackType;
  suggestedAction?: string;
  now?: () => Date;
}

export interface ListFeedbackInput extends FeedbackInput {
  status?: ReaderFeedbackStatus;
}

export interface TriageFeedbackInput extends FeedbackInput {
  id: string;
  status: ReaderFeedbackStatus;
}

export interface FeedbackTaskDraft {
  task_title: string;
  description: string;
  sourceFinding: string;
  suggestedAction: string;
  targetPath: string;
}

export interface FeedbackDocument {
  schemaVersion: '1.0';
  items: ReaderFeedback[];
}

export interface ImportFeedbackResult {
  projectRoot: string;
  feedbackPath: string;
  imported: ReaderFeedback[];
  total: number;
}

export interface FeedbackListResult {
  projectRoot: string;
  feedbackPath: string;
  items: ReaderFeedback[];
}

export interface TriageFeedbackResult {
  projectRoot: string;
  feedbackPath: string;
  item: ReaderFeedback;
  total: number;
}

export interface FeedbackTasksResult {
  projectRoot: string;
  feedbackPath: string;
  taskDrafts: FeedbackTaskDraft[];
}

const VALID_TYPES: ReaderFeedbackType[] = [
  'confusion',
  'boredom',
  'excitement',
  'continuity',
  'style',
  'character',
  'world'
];

const VALID_STATUSES: ReaderFeedbackStatus[] = [
  'new',
  'triaged',
  'accepted',
  'rejected',
  'done'
];

const feedbackPath = (projectRoot: string): string => path.join(projectRoot, 'feedback', 'feedback.json');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const normalizeType = (value: unknown): ReaderFeedbackType =>
  VALID_TYPES.includes(String(value) as ReaderFeedbackType)
    ? value as ReaderFeedbackType
    : 'confusion';

const normalizeStatus = (value: unknown): ReaderFeedbackStatus =>
  VALID_STATUSES.includes(String(value) as ReaderFeedbackStatus)
    ? value as ReaderFeedbackStatus
    : 'new';

const parseFeedbackDocument = (content: string): FeedbackDocument => {
  const document = JSON.parse(content) as unknown;
  if (!isRecord(document) || !Array.isArray(document.items)) {
    return { schemaVersion: '1.0', items: [] };
  }

  return {
    schemaVersion: '1.0',
    items: document.items
      .filter(isRecord)
      .filter(item =>
        isNonEmptyString(item.id)
        && isNonEmptyString(item.source)
        && isNonEmptyString(item.targetPath)
        && isNonEmptyString(item.comment)
      )
      .map(item => ({
        id: String(item.id).trim(),
        source: String(item.source).trim(),
        targetPath: toPosixPath(String(item.targetPath).trim()),
        type: normalizeType(item.type),
        comment: String(item.comment).trim(),
        suggestedAction: isNonEmptyString(item.suggestedAction) ? item.suggestedAction.trim() : undefined,
        status: normalizeStatus(item.status),
        createdAt: isNonEmptyString(item.createdAt) ? item.createdAt.trim() : new Date(0).toISOString()
      }))
  };
};

const readFeedback = async (input: FeedbackInput): Promise<FeedbackDocument> => {
  const filePath = feedbackPath(input.projectRoot);
  if (!await input.fileSystem.pathExists(filePath)) {
    return { schemaVersion: '1.0', items: [] };
  }

  try {
    return parseFeedbackDocument(await input.fileSystem.readFile(filePath));
  } catch {
    return { schemaVersion: '1.0', items: [] };
  }
};

const writeFeedback = async (
  input: FeedbackInput,
  document: FeedbackDocument
): Promise<void> => {
  await input.fileSystem.ensureDir(path.dirname(feedbackPath(input.projectRoot)));
  await input.fileSystem.writeJson(feedbackPath(input.projectRoot), document, { spaces: 2 });
};

const splitFeedbackComments = (content: string): string[] =>
  content
    .split(/\r?\n\s*\r?\n/)
    .map(item => item.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean);

const createFeedbackId = (
  source: string,
  index: number,
  existing: readonly ReaderFeedback[]
): string => {
  const base = `feedback.${slugifyPathPart(source)}.${String(index + 1).padStart(3, '0')}`;
  const existingIds = new Set(existing.map(item => item.id));
  if (!existingIds.has(base)) {
    return base;
  }

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (existingIds.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
};

export const importFeedback = async (
  input: ImportFeedbackInput
): Promise<ImportFeedbackResult> => {
  const sourcePath = resolveProjectPath(input.projectRoot, input.filePath);
  const content = await input.fileSystem.readFile(sourcePath);
  const current = await readFeedback(input);
  const source = input.source?.trim() || path.basename(input.filePath, path.extname(input.filePath));
  const targetPath = input.targetPath
    ? relativePath(input.projectRoot, resolveProjectPath(input.projectRoot, input.targetPath))
    : relativePath(input.projectRoot, sourcePath);
  const createdAt = (input.now ?? (() => new Date()))().toISOString();
  const imported = splitFeedbackComments(content).map((comment, index) => ({
    id: createFeedbackId(source, current.items.length + index, [...current.items]),
    source,
    targetPath,
    type: input.type ?? 'confusion',
    comment,
    suggestedAction: input.suggestedAction?.trim() || undefined,
    status: 'new' as const,
    createdAt
  }));
  const document: FeedbackDocument = {
    schemaVersion: '1.0',
    items: [...current.items, ...imported]
  };
  await writeFeedback(input, document);

  return {
    projectRoot: input.projectRoot,
    feedbackPath: feedbackPath(input.projectRoot),
    imported,
    total: document.items.length
  };
};

export const listFeedback = async (
  input: ListFeedbackInput
): Promise<FeedbackListResult> => {
  const document = await readFeedback(input);
  const items = document.items
    .filter(item => !input.status || item.status === input.status)
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    projectRoot: input.projectRoot,
    feedbackPath: feedbackPath(input.projectRoot),
    items
  };
};

export const triageFeedback = async (
  input: TriageFeedbackInput
): Promise<TriageFeedbackResult> => {
  const document = await readFeedback(input);
  const index = document.items.findIndex(item => item.id === input.id);
  if (index < 0) {
    throw new Error(`FEEDBACK_NOT_FOUND:${input.id}`);
  }

  document.items[index] = {
    ...document.items[index],
    status: input.status
  };
  await writeFeedback(input, document);

  return {
    projectRoot: input.projectRoot,
    feedbackPath: feedbackPath(input.projectRoot),
    item: document.items[index],
    total: document.items.length
  };
};

export const feedbackToTasks = async (
  input: FeedbackInput
): Promise<FeedbackTasksResult> => {
  const document = await readFeedback(input);
  const taskDrafts = document.items
    .filter(item => ['new', 'triaged', 'accepted'].includes(item.status))
    .map(item => ({
      task_title: `[读者反馈] ${item.type} ${item.id}`,
      description: `${item.targetPath}：${item.comment}`,
      sourceFinding: `feedback:${item.id}`,
      suggestedAction: item.suggestedAction ?? '人工判断是否转入 tasks.md；确认前不要自动改正文。',
      targetPath: item.targetPath
    }));

  return {
    projectRoot: input.projectRoot,
    feedbackPath: feedbackPath(input.projectRoot),
    taskDrafts
  };
};

export const renderFeedbackImport = (result: ImportFeedbackResult): string => [
  'Feedback Import',
  '',
  `文件：${toPosixPath(result.feedbackPath)}`,
  `新增：${result.imported.length}`,
  `总数：${result.total}`,
  '',
  ...(result.imported.length > 0
    ? result.imported.map(item => `- ${item.id}：${item.type} ${item.comment}`)
    : ['- 无'])
].join('\n').trimEnd();

export const renderFeedbackList = (result: FeedbackListResult): string => [
  'Feedback List',
  '',
  `文件：${toPosixPath(result.feedbackPath)}`,
  `Items：${result.items.length}`,
  '',
  ...(result.items.length > 0
    ? result.items.map(item => `- ${item.id} [${item.status}/${item.type}] ${item.targetPath}：${item.comment}`)
    : ['- 暂无 feedback'])
].join('\n').trimEnd();

export const renderFeedbackTriage = (result: TriageFeedbackResult): string => [
  'Feedback Triage',
  '',
  `Item：${result.item.id}`,
  `状态：${result.item.status}`,
  `文件：${toPosixPath(result.feedbackPath)}`
].join('\n');

export const renderFeedbackTasks = (result: FeedbackTasksResult): string => [
  'Feedback Task Drafts',
  '',
  `文件：${toPosixPath(result.feedbackPath)}`,
  `草稿：${result.taskDrafts.length}`,
  '',
  ...(result.taskDrafts.length > 0
    ? result.taskDrafts.map(task => `- ${task.task_title}：${task.description}；建议：${task.suggestedAction}`)
    : ['- 无'])
].join('\n').trimEnd();
