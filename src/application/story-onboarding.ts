import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import {
  relativePath,
  selectStoryProject,
  slugifyPathPart
} from './workbench-utils.js';
import { scanStoryArtifacts } from '../validation/artifact-scanner.js';
import {
  getStoryStageCreativeGaps,
  getStoryStageNextQuestions,
  type StoryMaturityStage
} from '../domain/story-stage.js';
import {
  evaluateStoryCoreElements,
  getPlanBlockingCoreElements,
  summarizeCoreElementGaps,
  type StoryCoreElementAssessment
} from '../domain/story-core-elements.js';
import { summarizeCreativeControl } from './creative-control-summary.js';
import type { ClarificationRecord } from './manage-clarifications.js';
import {
  loadAuthorProfile,
  renderAuthorProfileSamplingGuide
} from './manage-author-profile.js';
import type { AuthorProfileSummary } from '../domain/author-profile.js';
import {
  summarizeActiveBranches,
  type ActiveBranchSummary
} from './manage-branches.js';
import {
  CO_CREATION_ENTRYPOINTS,
  CO_CREATION_MODES,
  type CoCreationEntrypointDefinition,
  type StoryCoCreationEntrypointId,
  type StoryCreationModeId,
  type StoryCreationModeStatus
} from '../domain/co-creation-workbench.js';
import {
  renderDeferredDecisionItems,
  summarizeDecisionLog,
  type DecisionLogSummary
} from './decision-log.js';

export type StoryOnboardingErrorCode =
  | 'MISSING_STORY_NAME'
  | 'STORY_ALREADY_EXISTS'
  | 'NO_STORIES';

export class StoryOnboardingError extends Error {
  constructor(
    public readonly code: StoryOnboardingErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'StoryOnboardingError';
  }
}

export interface CreateStoryIdeaInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  name: string;
  idea?: string;
  now?: () => Date;
}

export interface CreateStoryIdeaResult {
  story: string;
  storyPath: string;
  ideaPath: string;
  idea: string;
  nextCommands: string[];
  markdown: string;
  authorProfile: AuthorProfileSummary;
}

export interface GetStoryNextInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
}

export interface StoryNextAction {
  priority: number;
  command: string;
  reason: string;
}

export interface StoryCoCreationEntrypoint {
  id: StoryCoCreationEntrypointId;
  label: string;
  mode: StoryCreationModeId;
  command: string;
  reason: string;
  whenToUse: string;
  guidingQuestion: string;
  candidateArtifact: string;
  canonBoundary: string;
  nextRecommendation: string;
}

export interface StoryCreationModeOption {
  id: StoryCreationModeId;
  label: string;
  status: StoryCreationModeStatus;
  command: string;
  reason: string;
}

export interface StoryNextResult {
  projectRoot: string;
  story: string;
  storyPath: string;
  stage: StoryMaturityStage;
  issues: string[];
  creativeGaps: string[];
  pendingQuestions: string[];
  creationModes: StoryCreationModeOption[];
  coCreationEntrypoints: StoryCoCreationEntrypoint[];
  activeBranches: ActiveBranchSummary[];
  coreElements: StoryCoreElementAssessment[];
  decisionLog: DecisionLogSummary;
  authorProfile: AuthorProfileSummary;
  actions: StoryNextAction[];
}

const normalizeStoryName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new StoryOnboardingError('MISSING_STORY_NAME', '请提供故事名称，例如：storyspec story:new 法术编译纪元');
  }

  return slugifyPathPart(trimmed);
};

const renderIdeaMarkdown = (
  story: string,
  idea: string,
  timestamp: string
): string => [
  `# ${story} 创意草稿`,
  '',
  `创建时间：${timestamp}`,
  '',
  '## 用户原文',
  '',
  idea || '（尚未记录一句话创意；请用 `storyspec interview` 补充。）',
  '',
  '## 待澄清',
  '',
  '- 主角是谁，开局最想要什么？',
  '- 故事从哪里开始，第一眼异界差异是什么？',
  '- 第一卷的核心冲突和失败代价是什么？',
  '',
  '## AI 候选建议',
  '',
  '- 暂无。AI 候选必须经过用户确认，才能进入 specification、tasks 或正文。',
  '',
  '## 下一步',
  '',
  `- 运行 \`storyspec interview ${story}\`，先回答澄清问题。`,
  `- 运行 \`storyspec next ${story}\`，随时查看当前下一步。`,
  ''
].join('\n');

export const createStoryIdea = async (
  input: CreateStoryIdeaInput
): Promise<CreateStoryIdeaResult> => {
  const story = normalizeStoryName(input.name);
  const storyPath = path.join(input.projectRoot, 'stories', story);
  const ideaPath = path.join(storyPath, 'idea.md');
  const idea = input.idea?.trim() ?? '';

  if (await input.fileSystem.pathExists(storyPath)) {
    throw new StoryOnboardingError(
      'STORY_ALREADY_EXISTS',
      `故事已存在：${story}。请换一个名称，或运行 storyspec next ${story} 继续现有故事。`
    );
  }

  const markdown = renderIdeaMarkdown(
    story,
    idea,
    (input.now ?? (() => new Date()))().toISOString()
  );
  const authorProfile = await loadAuthorProfile({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem
  });
  const nextCommands = [
    ...(authorProfile.summary.firstUse ? ['storyspec author-profile --init'] : []),
    `storyspec interview ${story}`,
    `storyspec next ${story}`
  ];
  await input.fileSystem.ensureDir(storyPath);
  await input.fileSystem.writeFile(ideaPath, markdown);

  return {
    story,
    storyPath,
    ideaPath,
    idea,
    nextCommands,
    markdown,
    authorProfile: authorProfile.summary
  };
};

const action = (priority: number, command: string, reason: string): StoryNextAction => ({
  priority,
  command,
  reason
});

const commandForMode = (
  story: string,
  commandKind: typeof CO_CREATION_MODES[number]['commandKind']
): string => {
  switch (commandKind) {
    case 'next':
      return `storyspec next ${story}`;
    case 'interview':
      return `storyspec interview ${story}`;
    case 'preview-plan':
      return `storyspec preview plan ${story}`;
    case 'context-pack':
      return `storyspec context:pack ${story}`;
    case 'creative-report':
      return `storyspec creative:report ${story}`;
  }
};

const resolveActiveCreationMode = (
  stage: StoryMaturityStage,
  coreElements: StoryCoreElementAssessment[]
): StoryCreationModeId => {
  const planBlockingElements = getPlanBlockingCoreElements(coreElements);

  if (stage === 'idea') {
    return 'discover';
  }

  if (
    stage === 'interviewing'
    || ((stage === 'specified' || stage === 'planned') && planBlockingElements.length > 0)
  ) {
    return 'co-create';
  }

  if (stage === 'specified' || stage === 'planned') {
    return 'plan';
  }

  if (stage === 'tasked') {
    return 'write';
  }

  return 'reflect';
};

const buildCreationModes = (
  story: string,
  stage: StoryMaturityStage,
  coreElements: StoryCoreElementAssessment[]
): StoryCreationModeOption[] => {
  const activeMode = resolveActiveCreationMode(stage, coreElements);
  const planBlockingElements = getPlanBlockingCoreElements(coreElements);

  return CO_CREATION_MODES.map(mode => {
    const isPlanLocked = mode.id === 'plan'
      && (stage === 'idea' || stage === 'interviewing' || planBlockingElements.length > 0);
    const isWriteLocked = mode.id === 'write'
      && (stage === 'idea'
        || stage === 'interviewing'
        || stage === 'specified'
        || stage === 'planned');

    return {
      id: mode.id,
      label: mode.label,
      status: mode.id === activeMode
        ? 'active'
        : isPlanLocked || isWriteLocked
          ? 'locked'
          : 'available',
      command: commandForMode(story, mode.commandKind),
      reason: mode.reason
    };
  });
};

const entrypointToResult = (
  story: string,
  entrypoint: CoCreationEntrypointDefinition
): StoryCoCreationEntrypoint => ({
  id: entrypoint.id,
  label: entrypoint.label,
  mode: entrypoint.mode,
  command: `storyspec interview ${story} --focus ${entrypoint.id}`,
  reason: entrypoint.reason,
  whenToUse: entrypoint.whenToUse,
  guidingQuestion: entrypoint.guidingQuestion,
  candidateArtifact: entrypoint.candidateArtifact,
  canonBoundary: entrypoint.canonBoundary,
  nextRecommendation: entrypoint.nextRecommendation
});

const buildCoCreationEntrypoints = (
  story: string,
  stage: StoryMaturityStage
): StoryCoCreationEntrypoint[] => {
  if (![
    'idea',
    'interviewing',
    'specified',
    'planned',
    'tasked',
    'drafting',
    'revising'
  ].includes(stage)) {
    return [];
  }

  return CO_CREATION_ENTRYPOINTS.map(entrypoint =>
    entrypointToResult(story, entrypoint)
  );
};

const buildActions = (
  result: Omit<StoryNextResult, 'actions'>
): StoryNextAction[] => {
  const actions: StoryNextAction[] = [];
  const planBlockingElements = getPlanBlockingCoreElements(result.coreElements);
  const activeBranch = result.activeBranches[0];
  const deferredItem = result.decisionLog.deferredItems[0];

  if (deferredItem && result.stage !== 'idea') {
    actions.push(action(1, deferredItem.resumeCommand, `${deferredItem.question} 曾选择“${deferredItem.answer}”；${deferredItem.trigger}。`));
  }

  if (result.stage === 'idea') {
    actions.push(action(1, `storyspec interview ${result.story}`, '先把一句话创意转成澄清记录，不急着生成完整设定。'));
    actions.push(action(2, `storyspec creative:report ${result.story}`, '查看哪些内容仍不能被当作正典。'));
    actions.push(action(3, `storyspec preview specify ${result.story}`, '生成写入前规格预览，确认后再 apply。'));
    if (activeBranch) {
      actions.push(action(2, activeBranch.compareCommand, '比较活跃 what-if 会长成什么小说，再决定是否 promote 或继续探索。'));
    }
    if (result.authorProfile.firstUse) {
      actions.push(action(4, 'storyspec author-profile --init', '首次使用暂无历史画像可回填，可做 2-4 个可跳过偏好采样。'));
    }
    return actions;
  }

  if (
    planBlockingElements.length > 0
    && (result.stage === 'specified' || result.stage === 'planned')
  ) {
    actions.push(action(
      1,
      `storyspec interview ${result.story}`,
      `${summarizeCoreElementGaps(result.coreElements).join('；')}，先共创再进入完整计划。`
    ));
    actions.push(action(2, `storyspec creative:report ${result.story}`, '查看核心要素面板和仍不能进入正典的内容。'));
    actions.push(action(3, `storyspec preview specify ${result.story}`, '仅生成写入前预览，处理缺口后再 apply。'));
    if (activeBranch) {
      actions.push(action(2, activeBranch.compareCommand, '比较活跃 what-if 会长成什么小说，再决定是否 promote 或继续探索。'));
    }
    return actions;
  }

  if (result.pendingQuestions.length > 0) {
    actions.push(action(1, `storyspec interview ${result.story}`, '继续回答 required 问题或处理 AI 候选。'));
  }

  if (result.stage === 'interviewing') {
    actions.push(action(2, `storyspec preview specify ${result.story}`, '用已确认答案生成规格预览，不直接覆盖 specification。'));
    actions.push(action(3, `storyspec creative:report ${result.story}`, '检查用户确认、AI 候选和漂移风险。'));
  } else if (result.stage === 'specified') {
    actions.push(action(1, `storyspec review --panel continuity`, '检查规格是否引用未确认建议或待澄清主题。'));
    actions.push(action(2, '继续运行平台对应 plan 命令', '规格已存在，下一步应生成创作计划。'));
  } else if (result.stage === 'planned') {
    actions.push(action(1, '继续运行平台对应 tasks 命令', '创作计划已存在，下一步应拆成可执行任务。'));
  } else if (result.stage === 'tasked') {
    actions.push(action(1, `storyspec context:pack ${result.story}`, '任务已存在，先生成上下文包再写作。'));
    actions.push(action(2, `storyspec review ${result.story}`, '开始写作前做一次 reviewer loop。'));
  } else {
    actions.push(action(1, `storyspec review ${result.story}`, '已有正文，优先复核连续性、风格和创作控制权。'));
    actions.push(action(2, `storyspec validate`, '确认项目结构和写作产物仍可通过校验。'));
  }

  if (actions.length === 0) {
    actions.push(action(1, `storyspec interview ${result.story}`, '当前状态不完整，先回到澄清访谈。'));
  }

  if (activeBranch) {
    actions.push(action(2, activeBranch.compareCommand, '比较活跃 what-if 会长成什么小说，再决定是否 promote 或继续探索。'));
  }

  return actions.sort((left, right) =>
    left.priority - right.priority
    || left.command.localeCompare(right.command)
  ).slice(0, 4);
};

const readClarificationRecord = async (
  fs: ProjectFileSystem,
  storyPath: string
): Promise<ClarificationRecord | undefined> => {
  const recordPath = path.join(storyPath, 'clarifications.json');
  if (!await fs.pathExists(recordPath)) {
    return undefined;
  }

  try {
    return await fs.readJson<ClarificationRecord>(recordPath);
  } catch {
    return undefined;
  }
};

export const getStoryNext = async (
  input: GetStoryNextInput
): Promise<StoryNextResult> => {
  const scan = await scanStoryArtifacts({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem
  });

  if (scan.stories.length === 0) {
    throw new StoryOnboardingError(
      'NO_STORIES',
      '项目中还没有故事。请先运行 storyspec story:new <name> --idea "一句话创意"。'
    );
  }

  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const record = await readClarificationRecord(input.fileSystem, story.path);
  const authorProfile = await loadAuthorProfile({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem
  });
  const activeBranches = await summarizeActiveBranches({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem,
    story: story.name
  });
  const creativeControl = await summarizeCreativeControl({
    projectRoot: input.projectRoot,
    storyPath: story.path,
    fileSystem: input.fileSystem,
    fallbackNextQuestions: getStoryStageNextQuestions(story.stage)
  });
  const coreElements = record
    ? evaluateStoryCoreElements({
      premise: record.premise,
      questions: record.questions,
      answers: record.answers
    })
    : [];
  const decisionLog = summarizeDecisionLog(record, story.name, story.stage);
  const base = {
    projectRoot: input.projectRoot,
    story: story.name,
    storyPath: story.path,
    stage: story.stage,
    issues: story.issues.map(issue => `${issue.code}: ${relativePath(input.projectRoot, issue.path)} - ${issue.message}`),
    creativeGaps: getStoryStageCreativeGaps(story.stage),
    pendingQuestions: [
      ...creativeControl.pendingQuestions,
      ...creativeControl.cannotFinalize.filter(item => item.startsWith('AI 建议待确认'))
    ],
    creationModes: buildCreationModes(story.name, story.stage, coreElements),
    coCreationEntrypoints: buildCoCreationEntrypoints(story.name, story.stage),
    activeBranches,
    coreElements,
    decisionLog,
    authorProfile: authorProfile.summary
  };

  return {
    ...base,
    actions: buildActions(base)
  };
};

export const renderCreateStoryIdea = (result: CreateStoryIdeaResult): string => [
  'StorySpec 新故事',
  '',
  `故事：${result.story}`,
  `创意草稿：${result.ideaPath}`,
  '',
  '下一步：',
  ...result.nextCommands.map(command => `- ${command}`),
  '',
  '作者画像：',
  ...renderAuthorProfileSamplingGuide(result.authorProfile),
  '',
  '提示：这里只记录用户原文和待澄清问题，不会自动扩写完整设定。'
].join('\n');

export const renderStoryNext = (result: StoryNextResult): string => [
  'StorySpec 下一步导航',
  '',
  `故事：${result.story}`,
  `阶段：${result.stage}`,
  '',
  '建议动作：',
  ...result.actions.map(item => `- ${item.command}：${item.reason}`),
  '',
  '创作模式：',
  ...result.creationModes.map(item => `- ${item.label}（${item.id}，${item.status}）：${item.command}。${item.reason}`),
  '',
  '你想从哪里继续？',
  ...(result.coCreationEntrypoints.length > 0
    ? result.coCreationEntrypoints.map(item => [
      `- ${item.label}（${item.mode}）：${item.command}`,
      `  - 适用场景：${item.whenToUse}`,
      `  - 引导问题：${item.guidingQuestion}`,
      `  - 候选产物：${item.candidateArtifact}`,
      `  - 正典边界：${item.canonBoundary}`,
      `  - 下一步推荐：${item.nextRecommendation}`
    ].join('\n'))
    : ['- 当前阶段暂无专门入口；请按建议动作继续。']),
  '',
  '活跃 what-if 分支：',
  ...(result.activeBranches.length > 0
    ? result.activeBranches.map(branch =>
      `- ${branch.id}：${branch.status}。${branch.flavor} 下一步：${branch.compareCommand}`
    )
    : ['- 暂无。']),
  '',
  '未决项回流：',
  ...renderDeferredDecisionItems(result.decisionLog.deferredItems),
  '',
  '作者画像：',
  ...renderAuthorProfileSamplingGuide(result.authorProfile),
  '',
  '核心要素：',
  ...(result.coreElements.length > 0
    ? result.coreElements.map(item => `- ${item.label}：${item.status}`)
    : ['- 暂无结构化核心要素；请先运行 storyspec interview。']),
  '',
  '创作缺口：',
  ...(result.creativeGaps.length > 0 ? result.creativeGaps.map(item => `- ${item}`) : ['- 暂无明显缺口。']),
  '',
  '待确认：',
  ...(result.pendingQuestions.length > 0 ? result.pendingQuestions.map(item => `- ${item}`) : ['- 暂无 required 待确认项。']),
  '',
  '结构问题：',
  ...(result.issues.length > 0 ? result.issues.map(item => `- ${item}`) : ['- 暂无。'])
].join('\n');
