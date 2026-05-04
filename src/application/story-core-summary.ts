import type { StoryCoreElementStatus } from '../domain/story-core-elements.js';
import {
  getStoryCoreElementSourceLabel,
  getStoryCoreElementStatusText
} from '../domain/story-core-elements.js';
import type { ProjectFileSystem } from './project-ports.js';
import {
  createCreativeReport,
  type CreativeReportAnswer,
  type CreativeReportResult
} from './creative-report.js';

export type StoryCoreSummaryItemStatus = StoryCoreElementStatus;

export interface StoryCoreSummaryInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  missingOnly?: boolean;
}

export interface StoryCoreSummaryItem {
  id: string;
  label: string;
  status: StoryCoreSummaryItemStatus;
  sourceLabel: string;
  summary: string;
  nextPrompt?: string;
  qualityNotes: string[];
  questionIds: string[];
}

export interface StoryCoreSummaryResult {
  projectRoot: string;
  story: string;
  storyPath: string;
  missingOnly: boolean;
  items: StoryCoreSummaryItem[];
}

const STATUS_ORDER: StoryCoreSummaryItemStatus[] = [
  'missing',
  'partial',
  'deferred',
  'suggested',
  'confirmed'
];

const statusRank = (status: StoryCoreSummaryItemStatus): number =>
  STATUS_ORDER.indexOf(status);

const findConfirmedAnswer = (
  confirmed: CreativeReportAnswer[],
  questionIds: readonly string[]
): string | undefined => confirmed.find(answer => questionIds.includes(answer.questionId))?.answer;

const buildSingleAnswerItem = (
  report: CreativeReportResult,
  id: string,
  label: string,
  questionIds: string[],
  fallbackSummary: string
): StoryCoreSummaryItem => {
  const answer = findConfirmedAnswer(report.confirmed, questionIds);

  return {
    id,
    label,
    status: answer ? 'confirmed' : 'missing',
    sourceLabel: answer ? getStoryCoreElementSourceLabel('confirmed') : getStoryCoreElementSourceLabel('missing'),
    summary: answer ?? fallbackSummary,
    nextPrompt: answer ? undefined : `继续确认${label}。`,
    qualityNotes: [],
    questionIds
  };
};

const buildCoreItems = (report: CreativeReportResult): StoryCoreSummaryItem[] => {
  const elementItems: StoryCoreSummaryItem[] = report.coreElements.map(element => ({
    id: element.id,
    label: element.label,
    status: element.status,
    sourceLabel: element.sourceLabel,
    summary: element.summary,
    nextPrompt: element.nextPrompt,
    qualityNotes: element.qualityNotes,
    questionIds: element.questionIds
  }));

  return [
    buildSingleAnswerItem(
      report,
      'premise',
      '核心创意',
      ['core.premise'],
      report.storySkeleton.summary || '核心创意缺失，需要继续共创。'
    ),
    ...elementItems,
    buildSingleAnswerItem(
      report,
      'scope',
      '创作边界',
      ['core.scope'],
      report.cannotFinalize.length > 0
        ? report.cannotFinalize.join('；')
        : '创作边界缺失，需要继续确认哪些内容不能提前定稿。'
    )
  ];
};

export const createStoryCoreSummary = async (
  input: StoryCoreSummaryInput
): Promise<StoryCoreSummaryResult> => {
  const report = await createCreativeReport({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem,
    story: input.story
  });
  const missingOnly = input.missingOnly ?? false;
  const items = buildCoreItems(report)
    .filter(item => !missingOnly || item.status !== 'confirmed')
    .sort((left, right) => {
      if (left.status === right.status) {
        return left.label.localeCompare(right.label);
      }

      return statusRank(left.status) - statusRank(right.status);
    });

  return {
    projectRoot: report.projectRoot,
    story: report.story,
    storyPath: report.storyPath,
    missingOnly,
    items
  };
};

export const renderStoryCoreSummary = (result: StoryCoreSummaryResult): string => [
  'StorySpec 核心信息面板',
  '',
  `故事：${result.story}`,
  ...(result.missingOnly ? ['视图：只显示缺失或未完成项'] : []),
  '',
  ...(result.items.length > 0
    ? result.items.flatMap(item => [
      `${item.label}：${getStoryCoreElementStatusText(item.status)} [${item.sourceLabel}]`,
      `- ${item.summary}`,
      ...(item.qualityNotes.length > 0 ? item.qualityNotes.map(note => `- ${note}`) : []),
      ...(item.nextPrompt ? [`- 下一步：${item.nextPrompt}`] : []),
      ''
    ])
    : ['暂无需要补齐的核心信息。'])
].join('\n').trimEnd();
