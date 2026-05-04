import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import {
  buildMissingTasksGuidance,
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
  TODAY_CREATION_MODES,
  type CoCreationEntryMaturityImpact,
  type CoCreationEntrypointDefinition,
  type StoryCoCreationEntrypointId,
  type StoryCreationModeId,
  type StoryCreationModeStatus,
  type TodayCreationModeId
} from '../domain/co-creation-workbench.js';
import type { InterestingChoice } from '../domain/clarification.js';
import {
  renderDeferredDecisionItems,
  summarizeDecisionLog,
  type DecisionLogSummary
} from './decision-log.js';
import {
  buildInterviewCommand,
  quoteCliArgument,
  readIdeaPremise
} from './story-idea.js';

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

export const STORY_NEXT_ACTION_IDS = [
  'continue_interview',
  'review_creative_report',
  'preview_specification',
  'preview_plan',
  'compare_branch',
  'sample_author_profile',
  'review_story',
  'build_context_pack',
  'validate_project',
  'check_status',
  'open_tasks_board',
  'generate_tasks',
  'generate_plan',
  'run_command'
] as const;

export type StoryNextActionId = typeof STORY_NEXT_ACTION_IDS[number];

export interface StoryNextAction {
  action: StoryNextActionId;
  priority: number;
  command: string;
  copyableCommand: string;
  requiresPremise: boolean;
  reason: string;
}

export interface StoryCoCreationEntrypoint {
  id: StoryCoCreationEntrypointId;
  label: string;
  title: string;
  mode: StoryCreationModeId;
  command: string;
  copyableCommand: string;
  requiresPremise: boolean;
  reason: string;
  whenToUse: string;
  openingQuestions: string[];
  guidingQuestion: string;
  interestingChoices: InterestingChoice[];
  candidateArtifacts: string[];
  candidateArtifact: string;
  canonBoundary: string;
  nextRecommendations: string[];
  nextRecommendation: string;
  maturityImpact: CoCreationEntryMaturityImpact[];
  recommended: boolean;
  recommendationReason: string;
}

export interface StoryCreationModeOption {
  id: StoryCreationModeId;
  label: string;
  status: StoryCreationModeStatus;
  command: string;
  reason: string;
}

export interface StoryTodayCreationMode {
  id: TodayCreationModeId;
  label: string;
  command: string;
  copyableCommand: string;
  requiresPremise: boolean;
  entrypointIds: StoryCoCreationEntrypointId[];
  maxQuestions: number;
  candidateLimit: number;
  writesFiles: boolean;
  outputContract: string;
  canonBoundary: string;
  toneGuide: string;
  reason: string;
  responseOptions: string[];
}

export type StorySourceMaterialEntrypointId =
  | 'longform-material'
  | 'short-idea'
  | 'table-material'
  | 'casual-chat';

export interface StorySourceMaterialEntrypoint {
  id: StorySourceMaterialEntrypointId;
  action: string;
  label: string;
  description: string;
  recommendedCommand: string;
  copyableCommand: string;
  inputGuidance: string;
}

export interface StoryMinimumFunLoop {
  steps: string[];
  planGate: string;
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
  todayCreationModes: StoryTodayCreationMode[];
  sourceMaterialEntrypoints: StorySourceMaterialEntrypoint[];
  minimumFunLoop: StoryMinimumFunLoop;
  coCreationEntrypoints: StoryCoCreationEntrypoint[];
  activeBranches: ActiveBranchSummary[];
  coreElements: StoryCoreElementAssessment[];
  decisionLog: DecisionLogSummary;
  authorProfile: AuthorProfileSummary;
  ideaPremise: string;
  actions: StoryNextAction[];
}

export interface RenderStoryNextOptions {
  verbose?: boolean;
  modes?: boolean;
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
  `- 运行 \`${buildInterviewCommand(story, { premise: idea || '一句话创意' })}\`，先回答澄清问题。`,
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
    buildInterviewCommand(story, { premise: idea || '一句话创意' }),
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

const action = (
  priority: number,
  actionId: StoryNextActionId,
  command: string,
  reason: string,
  requiresPremise = false
): StoryNextAction => ({
  action: actionId,
  priority,
  command,
  copyableCommand: command,
  requiresPremise,
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
  entrypoint: CoCreationEntrypointDefinition,
  premise: string,
  recommendationReason = ''
): StoryCoCreationEntrypoint => ({
  id: entrypoint.id,
  label: entrypoint.label,
  title: entrypoint.title,
  mode: entrypoint.mode,
  command: buildInterviewCommand(story, {
    focus: entrypoint.id,
    premise: premise || '一句话创意'
  }),
  copyableCommand: buildInterviewCommand(story, {
    focus: entrypoint.id,
    premise: premise || '一句话创意'
  }),
  requiresPremise: !premise,
  reason: entrypoint.reason,
  whenToUse: entrypoint.whenToUse,
  openingQuestions: entrypoint.openingQuestions,
  guidingQuestion: entrypoint.guidingQuestion,
  interestingChoices: entrypoint.interestingChoices,
  candidateArtifacts: entrypoint.candidateArtifacts,
  candidateArtifact: entrypoint.candidateArtifact,
  canonBoundary: entrypoint.canonBoundary,
  nextRecommendations: entrypoint.nextRecommendations,
  nextRecommendation: entrypoint.nextRecommendation,
  maturityImpact: entrypoint.maturityImpact,
  recommended: recommendationReason.length > 0,
  recommendationReason
});

type EntryRecommendation = {
  entrypoint: CoCreationEntrypointDefinition;
  score: number;
  reason: string;
};

const ENTRYPOINT_TIE_BREAKER: Record<StoryCoCreationEntrypointId, number> = {
  protagonist: 1,
  partner: 2,
  stage: 3,
  power: 4,
  faction: 5,
  conflict: 6,
  world: 7,
  scene: 8,
  ending: 9,
  branch: 10
};

const statusScore: Record<StoryCoreElementAssessment['status'], number> = {
  missing: 60,
  suggested: 55,
  deferred: 58,
  partial: 50,
  confirmed: 0
};

const normalizeIdeaText = (value: string): string => value.toLowerCase();

const ideaTextScores = (
  ideaText: string
): Partial<Record<StoryCoCreationEntrypointId, EntryRecommendation>> => {
  const text = normalizeIdeaText(ideaText);
  const recommendations: Partial<Record<StoryCoCreationEntrypointId, EntryRecommendation>> = {};

  const add = (id: StoryCoCreationEntrypointId, score: number, reason: string): void => {
    const entrypoint = CO_CREATION_ENTRYPOINTS.find(entry => entry.id === id);
    if (!entrypoint) {
      return;
    }
    const current = recommendations[id];
    if (!current || current.score < score) {
      recommendations[id] = { entrypoint, score, reason };
    }
  };

  if (/编程|施法|魔法|能力|金手指|系统|法术/.test(text)) {
    add('power', 95, '创意里已经出现能力或金手指，适合先玩爽点、限制和失败代价。');
  }
  if (/异界|世界|剑与魔法|学院|边境|城市|舞台|开局|地点/.test(text)) {
    add('stage', 85, '创意里已经出现世界或开局空间，适合先把第一舞台做成可写场景。');
  }
  if (/文明|威胁|寂静|异常|危机|灭世/.test(text)) {
    add('conflict', 78, '创意里有长线威胁，适合先拆成第一卷能看见的小异常和阶段冲突。');
  }
  if (/贵族|学院|垄断|势力|工会|教会|商会|合法性|资源/.test(text)) {
    add('faction', 76, '创意里有组织或资源结构，适合先确认谁垄断知识、资源或合法性。');
  }
  if (/伙伴|同伴|关系|感情|慢热|搭档|恋/.test(text)) {
    add('partner', 68, '创意里有关系线或伙伴线，适合先找能挑战主角的人。');
  }
  if (/主角|晏无|穿越|价值观|工科|青年/.test(text)) {
    add('protagonist', 45, '创意里已有主角轮廓，可继续补欲望、误判和成长代价。');
  }

  return recommendations;
};

const recommendEntrypoints = (
  coreElements: readonly StoryCoreElementAssessment[],
  ideaText: string
): EntryRecommendation[] => {
  const recommendations = new Map<StoryCoCreationEntrypointId, EntryRecommendation>();
  const coreById = new Map(coreElements.map(element => [element.id, element]));

  for (const entrypoint of CO_CREATION_ENTRYPOINTS) {
    for (const impact of entrypoint.maturityImpact) {
      const element = coreById.get(impact.coreElement);
      if (!element || element.status === 'confirmed') {
        continue;
      }

      const signalBoost = element.questionIds.length > 0
        || element.suggestedAnswerIds.length > 0
        || element.deferredAnswerIds.length > 0
        ? 40
        : 0;
      const score = statusScore[element.status] + signalBoost - impact.priority * 5;
      const reason = element.nextPrompt
        ? `${element.nextPrompt}${impact.reason}`
        : impact.reason;
      const current = recommendations.get(entrypoint.id);

      if (!current || current.score < score) {
        recommendations.set(entrypoint.id, { entrypoint, score, reason });
      }
    }
  }

  for (const [id, recommendation] of Object.entries(ideaTextScores(ideaText))) {
    const current = recommendations.get(id as StoryCoCreationEntrypointId);
    if (!current || current.score < recommendation.score) {
      recommendations.set(id as StoryCoCreationEntrypointId, recommendation);
    }
  }

  return [...recommendations.values()]
    .filter(recommendation => recommendation.score > 0)
    .sort((left, right) =>
      right.score - left.score
      || ENTRYPOINT_TIE_BREAKER[left.entrypoint.id] - ENTRYPOINT_TIE_BREAKER[right.entrypoint.id]
    );
};

const buildCoCreationEntrypoints = (
  story: string,
  stage: StoryMaturityStage,
  coreElements: readonly StoryCoreElementAssessment[],
  ideaText: string,
  premise: string
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

  const recommendations = recommendEntrypoints(coreElements, ideaText);
  const recommendationById = new Map(recommendations.map(item => [item.entrypoint.id, item]));
  const ordered = [
    ...recommendations.map(item => item.entrypoint),
    ...CO_CREATION_ENTRYPOINTS.filter(entrypoint => !recommendationById.has(entrypoint.id))
  ];

  return ordered.map(entrypoint =>
    entrypointToResult(story, entrypoint, premise, recommendationById.get(entrypoint.id)?.reason)
  );
};

const buildTodayCreationModes = (story: string, premise: string): StoryTodayCreationMode[] =>
  TODAY_CREATION_MODES.map(mode => ({
    id: mode.id,
    label: mode.label,
    command: buildInterviewCommand(story, {
      focus: mode.entrypointIds[0],
      maxQuestions: mode.maxQuestions,
      noWrite: true,
      premise: premise || '一句话创意'
    }),
    copyableCommand: buildInterviewCommand(story, {
      focus: mode.entrypointIds[0],
      maxQuestions: mode.maxQuestions,
      noWrite: true,
      premise: premise || '一句话创意'
    }),
    requiresPremise: !premise,
    entrypointIds: [...mode.entrypointIds],
    maxQuestions: mode.maxQuestions,
    candidateLimit: mode.candidateLimit,
    writesFiles: mode.writesFiles,
    outputContract: mode.outputContract,
    canonBoundary: mode.canonBoundary,
    toneGuide: mode.toneGuide,
    reason: mode.reason,
    responseOptions: [...mode.responseOptions]
  }));

const buildSourceMaterialEntrypoints = (
  story: string,
  premise: string
): StorySourceMaterialEntrypoint[] => {
  const premiseArgument = premise || '把你的原始素材粘贴在这里';
  const command = (focus: StoryCoCreationEntrypointId): string =>
    buildInterviewCommand(story, {
      focus,
      premise: premiseArgument
    });

  return [
    {
      id: 'longform-material',
      action: 'ingest_longform_material',
      label: '我有长文资料',
      description: '适合已有设定片段、人物小传、世界观说明、旧稿摘要或混杂笔记。',
      recommendedCommand: command('world'),
      copyableCommand: command('world'),
      inputGuidance: '长文首轮建议 500-3000 字，先粘最能代表故事方向的一段；示例：主角小传 + 世界规则 + 第一卷冲突各一段。超长资料建议分段输入，系统会先提炼候选和待澄清点。'
    },
    {
      id: 'short-idea',
      action: 'start_from_short_idea',
      label: '我只有一句灵感',
      description: '适合一句话脑洞、题材组合、主角钩子或一个还没有展开的场面。',
      recommendedCommand: command('protagonist'),
      copyableCommand: command('protagonist'),
      inputGuidance: '一句灵感可以 20-200 字，先保留你的原话；示例：某类主角 + 某个舞台 + 一个关系或爽点钩子。信息少也没关系，后续问题会把它慢慢变成可选择的故事方向。'
    },
    {
      id: 'table-material',
      action: 'ingest_table_material',
      label: '我有表格资料',
      description: '适合 Markdown 表格、角色表、势力表、章节表或资料清单。',
      recommendedCommand: command('faction'),
      copyableCommand: command('faction'),
      inputGuidance: '表格会保守作为候选：示例：角色、定位、关系备注、第一场景；先识别列名、未识别列和字段映射建议，未确认前不会自动写入正典或 specification。'
    },
    {
      id: 'casual-chat',
      action: 'start_casual_chat',
      label: '我想先随便聊聊',
      description: '适合还不想整理素材，只想让系统用低负担问题陪你摸清方向。',
      recommendedCommand: command('scene'),
      copyableCommand: command('scene'),
      inputGuidance: '可以从零散想法开始；示例：先说“我想写轻松冒险，但还没想好主角”。待澄清不是导入失败，只是把不确定内容留在候选区，等你确认、改写、拒绝或稍后。'
    }
  ];
};

const buildMinimumFunLoop = (): StoryMinimumFunLoop => ({
  steps: [
    '选择一个今日创作模式',
    '看 2 个有后果的候选',
    '确认、改写、拒绝或稍后',
    '得到一句创作回声',
    '核心要素不足时阻止完整 plan'
  ],
  planGate: '核心要素不足时不生成完整 creative-plan，只给候选、回声和下一轮入口。'
});

const buildActions = (
  result: Omit<StoryNextResult, 'actions'>
): StoryNextAction[] => {
  const actions: StoryNextAction[] = [];
  const planBlockingElements = getPlanBlockingCoreElements(result.coreElements);
  const activeBranch = result.activeBranches[0];
  const deferredItem = result.decisionLog.deferredItems[0];
  const recommendedEntry = result.coCreationEntrypoints.find(entry => entry.recommended);
  const interviewCommand = recommendedEntry?.command ?? buildInterviewCommand(result.story, {
    premise: result.ideaPremise || '一句话创意'
  });
  const interviewRequiresPremise = recommendedEntry?.requiresPremise ?? !result.ideaPremise;
  const interviewReason = recommendedEntry
    ? `推荐入口：${recommendedEntry.label}。${recommendedEntry.recommendationReason}`
    : '先把一句话创意转成澄清记录，不急着生成完整设定。';

  if (deferredItem && result.stage !== 'idea') {
    const resumeCommand = deferredItem.resumeCommand.includes('storyspec interview')
      ? `${deferredItem.resumeCommand} --premise ${quoteCliArgument(result.ideaPremise || '一句话创意')}`
      : deferredItem.resumeCommand;
    actions.push(action(1, 'continue_interview', resumeCommand, `${deferredItem.question} 曾选择“${deferredItem.answer}”；${deferredItem.trigger}。`, !result.ideaPremise));
  }

  if (result.stage === 'idea') {
    actions.push(action(1, 'continue_interview', interviewCommand, interviewReason, interviewRequiresPremise));
    actions.push(action(2, 'review_creative_report', `storyspec creative:report ${result.story}`, '查看哪些内容仍不能被当作正典。'));
    actions.push(action(3, 'preview_specification', `storyspec preview specify ${result.story}`, '生成写入前规格预览，确认后再 apply。'));
    if (activeBranch) {
      actions.push(action(2, 'compare_branch', activeBranch.compareCommand, '比较活跃 what-if 会长成什么小说，再决定是否 promote 或继续探索。'));
    }
    if (result.authorProfile.firstUse) {
      actions.push(action(4, 'sample_author_profile', 'storyspec author-profile --init', '首次使用暂无历史画像可回填，可做 2-4 个可跳过偏好采样。'));
    }
    return actions;
  }

  if (
    planBlockingElements.length > 0
    && (result.stage === 'specified' || result.stage === 'planned')
  ) {
    actions.push(action(
      1,
      'continue_interview',
      interviewCommand,
      recommendedEntry
        ? `推荐入口：${recommendedEntry.label}。${recommendedEntry.recommendationReason}`
        : `${summarizeCoreElementGaps(result.coreElements).join('；')}，先共创再进入完整计划。`
      ,
      interviewRequiresPremise
    ));
    actions.push(action(2, 'review_creative_report', `storyspec creative:report ${result.story}`, '查看核心要素面板和仍不能进入正典的内容。'));
    actions.push(action(3, 'preview_specification', `storyspec preview specify ${result.story}`, '仅生成写入前预览，处理缺口后再 apply。'));
    if (activeBranch) {
      actions.push(action(2, 'compare_branch', activeBranch.compareCommand, '比较活跃 what-if 会长成什么小说，再决定是否 promote 或继续探索。'));
    }
    return actions;
  }

  if (result.pendingQuestions.length > 0) {
    actions.push(action(
      1,
      'continue_interview',
      buildInterviewCommand(result.story, { premise: result.ideaPremise || '一句话创意' }),
      '继续回答 required 问题或处理 AI 候选。',
      !result.ideaPremise
    ));
  }

  if (result.stage === 'interviewing') {
    actions.push(action(2, 'preview_specification', `storyspec preview specify ${result.story}`, '用已确认答案生成规格预览，不直接覆盖 specification。'));
    actions.push(action(3, 'review_creative_report', `storyspec creative:report ${result.story}`, '检查用户确认、AI 候选和漂移风险。'));
  } else if (result.stage === 'specified') {
    actions.push(action(1, 'review_story', `storyspec review --panel continuity`, '检查规格是否引用未确认建议或待澄清主题。'));
    actions.push(action(2, 'generate_plan', '继续运行平台对应 plan 命令', '规格已存在，下一步应生成创作计划。'));
  } else if (result.stage === 'planned') {
    const tasksGuidance = buildMissingTasksGuidance(result.story);
    actions.push(action(1, 'generate_tasks', tasksGuidance.agentCommand, `创作计划已存在，下一步应生成 ${tasksGuidance.targetPath}。${tasksGuidance.summary}`));
    actions.push(action(2, 'check_status', tasksGuidance.statusCommand, '生成 tasks 后再确认项目阶段和缺口。'));
    actions.push(action(3, 'open_tasks_board', tasksGuidance.boardCommand, 'tasks.md 生成后导出本地看板，检查 WRITE-READY、PLAN-ONLY 和输出路径。'));
  } else if (result.stage === 'tasked') {
    actions.push(action(1, 'build_context_pack', `storyspec context:pack ${result.story}`, '任务已存在，先生成上下文包再写作。'));
    actions.push(action(2, 'review_story', `storyspec review ${result.story}`, '开始写作前做一次 reviewer loop。'));
  } else {
    actions.push(action(1, 'review_story', `storyspec review ${result.story}`, '已有正文，优先复核连续性、风格和创作控制权。'));
    actions.push(action(2, 'validate_project', `storyspec validate`, '确认项目结构和写作产物仍可通过校验。'));
  }

  if (actions.length === 0) {
    actions.push(action(
      1,
      'continue_interview',
      buildInterviewCommand(result.story, { premise: result.ideaPremise || '一句话创意' }),
      '当前状态不完整，先回到澄清访谈。',
      !result.ideaPremise
    ));
  }

  if (activeBranch) {
    actions.push(action(2, 'compare_branch', activeBranch.compareCommand, '比较活跃 what-if 会长成什么小说，再决定是否 promote 或继续探索。'));
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

const readIdeaText = async (
  fs: ProjectFileSystem,
  storyPath: string
): Promise<string> => {
  const ideaPath = path.join(storyPath, 'idea.md');
  if (!await fs.pathExists(ideaPath)) {
    return '';
  }

  try {
    return await fs.readFile(ideaPath);
  } catch {
    return '';
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
  const ideaText = await readIdeaText(input.fileSystem, story.path);
  const ideaPremise = record?.premise.trim() || await readIdeaPremise(input.fileSystem, story.path);
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
    todayCreationModes: buildTodayCreationModes(story.name, ideaPremise),
    sourceMaterialEntrypoints: buildSourceMaterialEntrypoints(story.name, ideaPremise),
    minimumFunLoop: buildMinimumFunLoop(),
    coCreationEntrypoints: buildCoCreationEntrypoints(story.name, story.stage, coreElements, ideaText, ideaPremise),
    activeBranches,
    coreElements,
    decisionLog,
    authorProfile: authorProfile.summary,
    ideaPremise
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

const renderStoryNextSummary = (result: StoryNextResult): string => {
  const primaryAction = result.actions[0];
  const alternativeEntrypoints = result.coCreationEntrypoints
    .filter(entry => entry.copyableCommand !== primaryAction?.copyableCommand)
    .slice(0, 2);
  const gaps = [
    ...result.creativeGaps,
    ...result.pendingQuestions
  ].slice(0, 3);

  return [
    'StorySpec 下一步导航',
    '',
    `故事：${result.story}`,
    `阶段：${result.stage}`,
    '',
    '先选你手里的素材：',
    ...result.sourceMaterialEntrypoints.map(item =>
      `- ${item.label}：${item.inputGuidance}`
    ),
    '',
    '可复制命令：',
    ...(primaryAction ? [`- 推荐下一步：${primaryAction.copyableCommand}`] : []),
    ...result.sourceMaterialEntrypoints.map(item =>
      `- ${item.label}：${item.copyableCommand}`
    ),
    '',
    '为什么：',
    primaryAction ? `  ${primaryAction.reason}` : '  当前状态不完整，先回到澄清访谈。',
    '',
    '也可以从这里继续：',
    ...(alternativeEntrypoints.length > 0
      ? alternativeEntrypoints.map(entry =>
        `- ${entry.label}：${entry.copyableCommand}${entry.recommended ? `。${entry.recommendationReason}` : ''}`
      )
      : result.actions.slice(1, 3).map(item => `- ${item.copyableCommand}：${item.reason}`)),
    '',
    '当前还缺：',
    ...(gaps.length > 0 ? gaps.map(item => `- ${item}`) : ['- 暂无明显缺口。']),
    '',
    '展开更多：',
    `- storyspec next ${result.story} --verbose：查看完整入口卡、作者画像、核心要素和结构问题。`,
    `- storyspec next ${result.story} --modes：查看低负担模式。`,
    `- storyspec next ${result.story} --json：输出完整结构化数据。`
  ].join('\n');
};

const renderStoryNextModes = (result: StoryNextResult): string => [
  'StorySpec 今日创作模式',
  '',
  `故事：${result.story}`,
  `阶段：${result.stage}`,
  '',
  '今日创作模式：',
  ...result.todayCreationModes.map(item => [
    `- ${item.label}（${item.id}）：${item.copyableCommand}`,
    `  - 入口：${item.entrypointIds.join(' / ')}`,
    `  - 低负担：最多 ${item.maxQuestions} 个问题，${item.candidateLimit} 个候选，不写入文件。`,
    `  - 输出边界：${item.outputContract}`,
    `  - 正典边界：${item.canonBoundary}`,
    `  - 回应方式：${item.responseOptions.join(' / ')}`,
    `  - 语气：${item.toneGuide}`
  ].join('\n')),
  '',
  '最小快乐闭环：',
  ...result.minimumFunLoop.steps.map((step, index) => `- ${index + 1}. ${step}`),
  `- Plan 门禁：${result.minimumFunLoop.planGate}`,
  '',
  `完整入口卡：storyspec next ${result.story} --verbose`
].join('\n');

const renderStoryNextVerbose = (result: StoryNextResult): string => [
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
  '今日创作模式：',
  ...result.todayCreationModes.map(item => [
    `- ${item.label}（${item.id}）：${item.command}`,
    `  - 入口：${item.entrypointIds.join(' / ')}`,
    `  - 低负担：最多 ${item.maxQuestions} 个问题，${item.candidateLimit} 个候选，不写入文件。`,
    `  - 输出边界：${item.outputContract}`,
    `  - 正典边界：${item.canonBoundary}`,
    `  - 回应方式：${item.responseOptions.join(' / ')}`,
    `  - 语气：${item.toneGuide}`
  ].join('\n')),
  '',
  '最小快乐闭环：',
  ...result.minimumFunLoop.steps.map((step, index) => `- ${index + 1}. ${step}`),
  `- Plan 门禁：${result.minimumFunLoop.planGate}`,
  '',
  '你想从哪里继续？',
  ...(result.coCreationEntrypoints.length > 0
    ? result.coCreationEntrypoints.map(item => [
      `- ${item.label}（${item.mode}${item.recommended ? '，推荐入口' : ''}）：${item.command}`,
      ...(item.recommended ? [`  - 推荐原因：${item.recommendationReason}`] : []),
      `  - 适用场景：${item.whenToUse}`,
      `  - 开场问题：${item.openingQuestions.join(' / ')}`,
      `  - 有趣选择：${item.interestingChoices.map(choice => `${choice.appeal} 代价：${choice.cost}`).join('；')}`,
      `  - 候选产物：${item.candidateArtifacts.join('、')}`,
      `  - 正典边界：${item.canonBoundary}`,
      `  - 下一步推荐：${item.nextRecommendations.join('；')}`
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

export const renderStoryNext = (
  result: StoryNextResult,
  options: RenderStoryNextOptions = {}
): string => {
  if (options.modes) {
    return renderStoryNextModes(result);
  }

  if (options.verbose) {
    return renderStoryNextVerbose(result);
  }

  return renderStoryNextSummary(result);
};
