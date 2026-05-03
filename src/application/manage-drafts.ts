import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import type {
  DraftIndex,
  DraftRecord,
} from '../domain/workbench.js';
import {
  relativePath,
  requireTasksPath,
  selectStoryProject,
  slugifyPathPart,
  toPosixPath
} from './workbench-utils.js';

export interface CreateDraftInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  chapter: string;
  basedOn?: string;
  contextPack?: string;
  now?: () => Date;
}

export interface ListDraftsInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  chapter?: string;
}

export interface PromoteDraftInput extends ListDraftsInput {
  draftId: string;
  yes?: boolean;
}

export interface CreateDraftResult {
  record: DraftRecord;
  indexPath: string;
  draftPath: string;
}

export interface ListDraftsResult {
  projectRoot: string;
  story: string;
  indexPath: string;
  records: DraftRecord[];
}

export interface PromoteDraftResult {
  record: DraftRecord;
  targetPath: string;
  indexPath: string;
  dryRun: boolean;
}

const normalizeChapter = (value: string): string => {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? `chapter-${trimmed.padStart(3, '0')}` : trimmed;
};

const draftIndexPath = (storyPath: string): string =>
  path.join(storyPath, 'drafts', 'draft-index.json');

const readDraftIndex = async (
  fs: ProjectFileSystem,
  storyName: string,
  storyPath: string
): Promise<DraftIndex> => {
  const indexPath = draftIndexPath(storyPath);
  if (!await fs.pathExists(indexPath)) {
    return {
      schemaVersion: '1.0',
      story: storyName,
      records: []
    };
  }

  const index = await fs.readJson<DraftIndex>(indexPath);
  return {
    schemaVersion: '1.0',
    story: index.story || storyName,
    records: Array.isArray(index.records) ? index.records : []
  };
};

const writeDraftIndex = async (
  fs: ProjectFileSystem,
  storyPath: string,
  index: DraftIndex
): Promise<string> => {
  const indexPath = draftIndexPath(storyPath);
  await fs.ensureDir(path.dirname(indexPath));
  await fs.writeJson(indexPath, index, { spaces: 2 });
  return indexPath;
};

const nextVersion = (records: DraftRecord[], chapter: string): number =>
  records
    .filter(record => record.chapter === chapter)
    .reduce((max, record) => Math.max(max, record.version), 0) + 1;

const chapterContentPath = (storyPath: string, chapter: string): string =>
  path.join(storyPath, 'content', `${chapter}.md`);

const createDraftContent = (
  record: DraftRecord,
  basedOnContent?: string
): string => [
  `# ${record.chapter} v${record.version}`,
  '',
  `DraftRecord：${record.id}`,
  `状态：${record.status}`,
  ...(record.contextPack ? [`ContextPack：${record.contextPack}`] : []),
  '',
  basedOnContent?.trim() || '<!-- 在此起草章节内容；完成后运行 draft:promote。 -->',
  ''
].join('\n');

export const createDraft = async (input: CreateDraftInput): Promise<CreateDraftResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const chapter = normalizeChapter(input.chapter);
  const index = await readDraftIndex(input.fileSystem, story.name, story.path);
  const version = nextVersion(index.records, chapter);
  const id = `${chapter}.v${version}`;
  const draftPath = path.join(story.path, 'drafts', `${id}.md`);
  const basedOnPath = input.basedOn
    ? path.resolve(input.projectRoot, input.basedOn)
    : chapterContentPath(story.path, chapter);
  const basedOnContent = await input.fileSystem.pathExists(basedOnPath)
    ? await input.fileSystem.readFile(basedOnPath)
    : undefined;
  const record: DraftRecord = {
    id,
    chapter,
    version,
    path: relativePath(input.projectRoot, draftPath),
    basedOn: basedOnContent ? relativePath(input.projectRoot, basedOnPath) : undefined,
    contextPack: input.contextPack,
    status: 'draft',
    reviewerFindings: [],
    createdAt: (input.now ?? (() => new Date()))().toISOString()
  };

  await input.fileSystem.ensureDir(path.dirname(draftPath));
  await input.fileSystem.writeFile(draftPath, createDraftContent(record, basedOnContent));
  index.records.push(record);
  const indexPath = await writeDraftIndex(input.fileSystem, story.path, index);

  return {
    record,
    indexPath,
    draftPath
  };
};

export const listDrafts = async (input: ListDraftsInput): Promise<ListDraftsResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const indexPath = draftIndexPath(story.path);
  const index = await readDraftIndex(input.fileSystem, story.name, story.path);
  const chapter = input.chapter ? normalizeChapter(input.chapter) : undefined;

  return {
    projectRoot: input.projectRoot,
    story: story.name,
    indexPath,
    records: chapter ? index.records.filter(record => record.chapter === chapter) : index.records
  };
};

export const promoteDraft = async (input: PromoteDraftInput): Promise<PromoteDraftResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  requireTasksPath(story);
  const index = await readDraftIndex(input.fileSystem, story.name, story.path);
  const record = index.records.find(item => item.id === input.draftId);
  if (!record) {
    throw new Error(`DRAFT_NOT_FOUND:${input.draftId}`);
  }

  const sourcePath = path.join(input.projectRoot, ...record.path.split('/'));
  const targetPath = chapterContentPath(story.path, record.chapter);
  if (input.yes) {
    await input.fileSystem.ensureDir(path.dirname(targetPath));
    await input.fileSystem.copy(sourcePath, targetPath, { overwrite: true });
    const updatedRecord: DraftRecord = {
      ...record,
      status: 'published'
    };
    index.records = index.records.map(item => item.id === record.id ? updatedRecord : item);
    const indexPath = await writeDraftIndex(input.fileSystem, story.path, index);
    return {
      record: updatedRecord,
      targetPath,
      indexPath,
      dryRun: false
    };
  }

  return {
    record,
    targetPath,
    indexPath: draftIndexPath(story.path),
    dryRun: true
  };
};

export const renderDraftCreateSummary = (result: CreateDraftResult): string => [
  'StorySpec Draft',
  '',
  `Draft：${result.record.id}`,
  `状态：${result.record.status}`,
  `路径：${result.draftPath}`,
  `索引：${result.indexPath}`
].join('\n');

export const renderDraftList = (result: ListDraftsResult): string => [
  'StorySpec Drafts',
  '',
  `故事：${result.story}`,
  `Drafts：${result.records.length}`,
  '',
  ...(result.records.length > 0
    ? result.records.map(record => `- ${record.id}：${record.status}，${record.path}`)
    : ['- 暂无 draft'])
].join('\n').trimEnd();

export const renderDraftPromoteSummary = (result: PromoteDraftResult): string => [
  'Draft Promote',
  '',
  `Draft：${result.record.id}`,
  `目标：${toPosixPath(result.targetPath)}`,
  `模式：${result.dryRun ? '预览' : '已发布'}`,
  `索引：${result.indexPath}`
].join('\n');
