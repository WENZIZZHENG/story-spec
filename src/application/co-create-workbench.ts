import type { ProjectFileSystem } from './project-ports.js';
import {
  ingestStoryInput,
  renderIngestStoryInputResult,
  type IngestStoryInputResult
} from './ingest-story-input.js';
import {
  createStoryCoreSummary,
  renderStoryCoreSummary,
  type StoryCoreSummaryResult
} from './story-core-summary.js';
import {
  createPlanPreview,
  createSpecifyPreview,
  renderPlanPreview,
  renderSpecifyPreview,
  type CreatePlanPreviewResult,
  type CreateSpecifyPreviewResult
} from './preview-apply.js';
import {
  quoteCliArgument
} from './story-idea.js';
import { relativePath } from './workbench-utils.js';

export type CoCreatePreviewMode = 'none' | 'specify' | 'plan' | 'both';

export interface CoCreateWorkbenchInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  text?: string;
  file?: string;
  applyConfirmed?: boolean;
  preview?: CoCreatePreviewMode;
  now?: () => Date;
}

export interface CoCreateWorkbenchResult {
  projectRoot: string;
  story: string;
  storyPath: string;
  ingest?: IngestStoryInputResult;
  core: StoryCoreSummaryResult;
  previews: {
    specify?: CreateSpecifyPreviewResult;
    plan?: CreatePlanPreviewResult;
  };
  nextCommands: string[];
}

const hasInput = (input: CoCreateWorkbenchInput): boolean =>
  Boolean(input.text?.trim() || input.file?.trim());

const normalizePreviewMode = (value: CoCreatePreviewMode | undefined): CoCreatePreviewMode =>
  value ?? 'none';

const storyArg = (story: string): string => quoteCliArgument(story);

const buildReplayCommand = (result: CoCreateWorkbenchResult): string | undefined => {
  const sourceFile = result.ingest?.sourceFile;
  if (!result.ingest || result.ingest.written || !sourceFile) {
    return undefined;
  }

  return `storyspec co:create ${storyArg(result.story)} --file ${quoteCliArgument(relativePath(result.projectRoot, sourceFile))} --apply-confirmed`;
};

const buildNextCommands = (result: Omit<CoCreateWorkbenchResult, 'nextCommands'>): string[] => {
  const commands = [
    buildReplayCommand(result as CoCreateWorkbenchResult),
    result.previews.specify ? `storyspec apply ${result.previews.specify.record.id} --yes` : undefined,
    result.previews.plan ? `storyspec apply ${result.previews.plan.record.id} --yes` : undefined,
    `storyspec core ${storyArg(result.story)} --missing`,
    `storyspec creative:report ${storyArg(result.story)}`
  ];

  return commands.filter((command): command is string => Boolean(command));
};

export const runCoCreateWorkbench = async (
  input: CoCreateWorkbenchInput
): Promise<CoCreateWorkbenchResult> => {
  const ingest = hasInput(input)
    ? await ingestStoryInput({
      projectRoot: input.projectRoot,
      fileSystem: input.fileSystem,
      story: input.story,
      text: input.text,
      file: input.file,
      applyConfirmed: input.applyConfirmed,
      now: input.now
    })
    : undefined;
  const story = ingest?.story ?? input.story;
  const core = await createStoryCoreSummary({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem,
    story,
    missingOnly: false
  });
  const previewMode = normalizePreviewMode(input.preview);
  const previews: CoCreateWorkbenchResult['previews'] = {};

  if (previewMode === 'specify' || previewMode === 'both') {
    previews.specify = await createSpecifyPreview({
      projectRoot: input.projectRoot,
      fileSystem: input.fileSystem,
      story: core.story,
      now: input.now
    });
  }

  if (previewMode === 'plan' || previewMode === 'both') {
    previews.plan = await createPlanPreview({
      projectRoot: input.projectRoot,
      fileSystem: input.fileSystem,
      story: core.story,
      now: input.now
    });
  }

  const resultWithoutCommands = {
    projectRoot: input.projectRoot,
    story: core.story,
    storyPath: core.storyPath,
    ingest,
    core,
    previews
  };

  return {
    ...resultWithoutCommands,
    nextCommands: buildNextCommands(resultWithoutCommands)
  };
};

export const renderCoCreateWorkbench = (result: CoCreateWorkbenchResult): string => [
  'StorySpec 共创输入工作台',
  '',
  `故事：${result.story}`,
  '',
  ...(result.ingest
    ? [
      `输入吸收：${result.ingest.written ? '已写入' : '预览未写入'}`,
      `识别确认项：${result.ingest.confirmedItems.length}`,
      '',
      renderIngestStoryInputResult(result.ingest),
      ''
    ]
    : [
      '输入吸收：未提供 --text 或 --file，本次只查看核心面板。',
      ''
    ]),
  '核心信息面板',
  '',
  renderStoryCoreSummary(result.core),
  '',
  ...(result.previews.specify
    ? [
      '规格预览',
      '',
      renderSpecifyPreview(result.previews.specify),
      ''
    ]
    : []),
  ...(result.previews.plan
    ? [
      '计划预览',
      '',
      renderPlanPreview(result.previews.plan),
      ''
    ]
    : []),
  '建议下一步',
  '',
  ...result.nextCommands.map(command => `- ${command}`)
].join('\n').trimEnd();
