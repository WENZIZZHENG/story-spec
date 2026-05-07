import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import { exportTaskBoard, type TaskBoard } from './export-task-board.js';
import { listDrafts } from './manage-drafts.js';
import {
  findStoryArtifactPath,
  relativePath,
  selectStoryProject,
  toPosixPath
} from './workbench-utils.js';

export type ChapterWritingLaneStepId =
  | 'outline'
  | 'tasks'
  | 'scene'
  | 'sample'
  | 'draft'
  | 'review';

export type ChapterWritingLaneStepStatus = 'ready' | 'blocked' | 'done';

export interface ChapterWritingLaneStep {
  id: ChapterWritingLaneStepId;
  label: string;
  status: ChapterWritingLaneStepStatus;
  summary: string;
  nextAction: string;
  blockedReasons: string[];
  commands: string[];
}

export interface ChapterWritingLaneResult {
  projectRoot: string;
  story: string;
  chapter?: string;
  currentStep: ChapterWritingLaneStepId;
  lane: ChapterWritingLaneStep[];
  boundaries: string[];
}

export interface GetChapterWritingLaneInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  chapter?: string;
  taskBoard?: (input: {
    projectRoot: string;
    fileSystem: ProjectFileSystem;
    story?: string;
    write: boolean;
  }) => Promise<unknown>;
  listChapterDrafts?: (input: {
    projectRoot: string;
    fileSystem: ProjectFileSystem;
    story?: string;
    chapter?: string;
  }) => Promise<unknown>;
}

const normalizeChapter = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return /^\d+$/.test(trimmed) ? `chapter-${trimmed.padStart(3, '0')}` : trimmed;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asTaskBoard = (value: unknown): TaskBoard | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }
  const board = value.board;
  return isRecord(board) ? board as unknown as TaskBoard : undefined;
};

const readTaskBoard = async (input: GetChapterWritingLaneInput): Promise<TaskBoard | undefined> => {
  try {
    const result = input.taskBoard
      ? await input.taskBoard({
        projectRoot: input.projectRoot,
        fileSystem: input.fileSystem,
        story: input.story,
        write: false
      })
      : await exportTaskBoard({
        projectRoot: input.projectRoot,
        fileSystem: input.fileSystem,
        story: input.story,
        write: false
      });

    return asTaskBoard(result);
  } catch {
    return undefined;
  }
};

const readDraftRecords = async (input: GetChapterWritingLaneInput, chapter?: string): Promise<unknown[]> => {
  try {
    const result = input.listChapterDrafts
      ? await input.listChapterDrafts({
        projectRoot: input.projectRoot,
        fileSystem: input.fileSystem,
        story: input.story,
        chapter
      })
      : await listDrafts({
        projectRoot: input.projectRoot,
        fileSystem: input.fileSystem,
        story: input.story,
        chapter
      });

    return isRecord(result) && Array.isArray(result.records) ? result.records : [];
  } catch {
    return [];
  }
};

const hasSceneCard = async (
  fs: ProjectFileSystem,
  storyPath: string,
  chapter?: string
): Promise<boolean> => {
  const scenesDir = path.join(storyPath, 'scenes');
  if (!await fs.pathExists(scenesDir)) {
    return false;
  }

  const entries = await fs.readDir(scenesDir);
  if (!chapter) {
    return entries.some(entry => entry.endsWith('.yaml') || entry.endsWith('.yml') || entry.endsWith('.md'));
  }

  const loweredChapter = chapter.toLowerCase();
  return entries.some(entry => entry.toLowerCase().includes(loweredChapter));
};

const hasChapterContent = async (
  fs: ProjectFileSystem,
  storyPath: string,
  chapter?: string
): Promise<boolean> => {
  if (!chapter) {
    return false;
  }

  return fs.pathExists(path.join(storyPath, 'content', `${chapter}.md`));
};

const step = (input: ChapterWritingLaneStep): ChapterWritingLaneStep => input;

const currentWritingStep = (steps: ChapterWritingLaneStep[]): ChapterWritingLaneStepId => {
  const sample = steps.find(item => item.id === 'sample');
  const draft = steps.find(item => item.id === 'draft');
  if (sample?.status === 'ready' && draft?.status === 'blocked') {
    return 'sample';
  }

  return (steps.find(item => item.status === 'blocked') ?? steps.find(item => item.status === 'ready') ?? steps[steps.length - 1]).id;
};

export const getChapterWritingLane = async (
  input: GetChapterWritingLaneInput
): Promise<ChapterWritingLaneResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const chapter = normalizeChapter(input.chapter);
  const creativePlanPath = findStoryArtifactPath(story, 'creative-plan');
  const tasksPath = findStoryArtifactPath(story, 'tasks');
  const [board, draftRecords, sceneReady, contentReady] = await Promise.all([
    readTaskBoard(input),
    readDraftRecords(input, chapter),
    hasSceneCard(input.fileSystem, story.path, chapter),
    hasChapterContent(input.fileSystem, story.path, chapter)
  ]);
  const writeReady = (board?.summary.writeReady ?? 0) > 0;
  const planOnly = (board?.summary.planOnly ?? 0) > 0;
  const hasDraft = draftRecords.length > 0;
  const storyName = story.name;
  const chapterArg = chapter ?? '<chapter>';
  const outlineReady = Boolean(creativePlanPath);
  const tasksReady = Boolean(tasksPath) && writeReady && !planOnly;

  const steps: ChapterWritingLaneStep[] = [
    step({
      id: 'outline',
      label: '正式大纲',
      status: outlineReady ? 'ready' : 'blocked',
      summary: outlineReady
        ? `已找到 ${relativePath(input.projectRoot, creativePlanPath ?? '')}`
        : '缺少 creative-plan.md，无法稳定进入章节生产。',
      nextAction: outlineReady
        ? '继续检查任务清单。'
        : '先生成或提升正式 creative-plan.md。',
      blockedReasons: outlineReady ? [] : ['缺少正式创作计划 creative-plan.md'],
      commands: outlineReady ? [] : [`storyspec preview plan ${storyName}`]
    }),
    step({
      id: 'tasks',
      label: '写作任务',
      status: tasksReady ? 'ready' : 'blocked',
      summary: tasksReady
        ? `任务板可读，writeReady ${board?.summary.writeReady ?? 0} 个。`
        : '缺少可写任务或仍存在 PLAN-ONLY 阻断。',
      nextAction: tasksReady
        ? '继续检查 Scene Card。'
        : '先生成或修正 tasks.md，确保目标任务标记 WRITE-READY。',
      blockedReasons: tasksReady
        ? []
        : [
          ...(tasksPath ? [] : ['缺少 tasks.md']),
          ...(writeReady ? [] : ['没有 WRITE-READY 任务']),
          ...(planOnly ? ['存在 PLAN-ONLY 任务，需要先补规划'] : [])
        ],
      commands: [`storyspec tasks:board ${storyName}`]
    }),
    step({
      id: 'scene',
      label: 'Scene Card',
      status: sceneReady ? 'ready' : 'blocked',
      summary: sceneReady
        ? '已找到可用 Scene Card。'
        : '还没有找到当前章节可用 Scene Card。',
      nextAction: sceneReady
        ? '进入 beat 预览和章节小样。'
        : '先初始化或补齐 Scene Card。',
      blockedReasons: sceneReady ? [] : ['缺少目标章节 Scene Card'],
      commands: sceneReady ? [] : [`storyspec scene:init ${storyName} --id ${chapterArg}`]
    }),
    step({
      id: 'sample',
      label: '章节小样',
      status: outlineReady && tasksReady && sceneReady ? 'ready' : 'blocked',
      summary: '先输出 800-1500 字左右精简预览稿，确认读感后再扩写完整章节。',
      nextAction: outlineReady && tasksReady && sceneReady
        ? '在 agent 中执行 /storyspec-write，完成约束卡、beat 和章节小样确认。'
        : '完成前置大纲、任务和 Scene Card 后再生成小样。',
      blockedReasons: outlineReady && tasksReady && sceneReady
        ? []
        : ['章节小样需要先完成正式大纲、WRITE-READY 任务和 Scene Card'],
      commands: [`/storyspec-write ${chapterArg}`]
    }),
    step({
      id: 'draft',
      label: '章节草稿',
      status: hasDraft ? 'ready' : 'blocked',
      summary: hasDraft
        ? `已有 ${draftRecords.length} 个章节草稿。`
        : '还没有章节草稿记录。',
      nextAction: hasDraft
        ? '可查看发布 dry-run 或继续 review。'
        : '小样确认后创建章节草稿，再分块扩写完整正文。',
      blockedReasons: hasDraft ? [] : ['缺少章节草稿'],
      commands: [`storyspec draft:new ${storyName} --chapter ${chapterArg}`]
    }),
    step({
      id: 'review',
      label: '写后自检',
      status: hasDraft || contentReady ? 'ready' : 'blocked',
      summary: hasDraft || contentReady
        ? '可以运行章节级写后自检。'
        : '需要先有草稿或正式正文。',
      nextAction: hasDraft || contentReady
        ? '运行 review，检查约束卡、漂移和章节质量。'
        : '完成草稿后再 review。',
      blockedReasons: hasDraft || contentReady ? [] : ['缺少可 review 的草稿或正文'],
      commands: [`storyspec review --chapter ${chapterArg}`]
    })
  ];

  return {
    projectRoot: input.projectRoot,
    story: story.name,
    chapter,
    currentStep: currentWritingStep(steps),
    lane: steps,
    boundaries: [
      '写作通道只读展示，不自动修改正文。',
      '章节小样默认不写入 content、tracking、canon 或 tasks。',
      '完整正文仍需作者确认小样后再分块生成。'
    ]
  };
};

export const renderChapterWritingLane = (result: ChapterWritingLaneResult): string => [
  'StorySpec 章节写作通道',
  '',
  `故事：${result.story}`,
  `章节：${result.chapter ?? '未指定'}`,
  `当前步骤：${result.currentStep}`,
  '',
  ...result.lane.map(item => [
    `- ${item.label}：${item.status}`,
    `  ${item.summary}`,
    `  下一步：${item.nextAction}`,
    ...(item.commands.length ? [`  命令：${item.commands.join('；')}`] : [])
  ].join('\n')),
  '',
  '边界：',
  ...result.boundaries.map(item => `- ${item}`)
].join('\n');
