export type StoryMaturityStage =
  | 'idea'
  | 'interviewing'
  | 'specified'
  | 'planned'
  | 'tasked'
  | 'drafting'
  | 'revising';

export type StageRequiredArtifact = 'specification' | 'creative-plan' | 'tasks';

export interface StoryStageSignals {
  hasIdea: boolean;
  hasClarifications: boolean;
  hasCandidates: boolean;
  hasSpecification: boolean;
  hasCreativePlan: boolean;
  hasTasks: boolean;
  contentFiles: number;
}

export interface StoryStageArtifactState {
  stage: StoryMaturityStage;
  hasSpecification: boolean;
  hasCreativePlan: boolean;
  hasTasks: boolean;
}

export const STORY_MATURITY_STAGES: readonly StoryMaturityStage[] = [
  'idea',
  'interviewing',
  'specified',
  'planned',
  'tasked',
  'drafting',
  'revising'
] as const;

export const createEmptyStoryStageCounts = (): Record<StoryMaturityStage, number> => ({
  idea: 0,
  interviewing: 0,
  specified: 0,
  planned: 0,
  tasked: 0,
  drafting: 0,
  revising: 0
});

export const determineStoryMaturityStage = (signals: StoryStageSignals): StoryMaturityStage => {
  if (signals.contentFiles > 0) {
    return 'drafting';
  }

  if (signals.hasTasks) {
    return 'tasked';
  }

  if (signals.hasCreativePlan) {
    return 'planned';
  }

  if (signals.hasSpecification) {
    return 'specified';
  }

  if (signals.hasClarifications) {
    return 'interviewing';
  }

  return 'idea';
};

export const getStoryStageMissingArtifacts = (
  state: StoryStageArtifactState
): StageRequiredArtifact[] => {
  const missing: StageRequiredArtifact[] = [];

  if (state.stage === 'idea' || state.stage === 'interviewing') {
    return missing;
  }

  if (!state.hasSpecification) {
    missing.push('specification');
  }

  if (!state.hasCreativePlan) {
    missing.push('creative-plan');
  }

  if (
    (state.stage === 'planned'
      || state.stage === 'tasked'
      || state.stage === 'drafting'
      || state.stage === 'revising')
    && !state.hasTasks
  ) {
    missing.push('tasks');
  }

  return missing;
};

export const getStoryStageCreativeGaps = (stage: StoryMaturityStage): string[] => {
  switch (stage) {
    case 'idea':
      return [
        '主角欲望、核心伙伴、第一舞台和第一卷冲突仍未确认',
        '能力边界、势力冲突细节和类型标签还没有转成可执行的故事选择'
      ];
    case 'interviewing':
      return [
        '澄清记录正在形成，仍需确认关键答案',
        'AI 建议需要用户选择或改写后才能进入正典'
      ];
    case 'specified':
      return [
        '故事规格已存在，下一步需要预览并确认创作计划'
      ];
    case 'planned':
      return [
        '创作计划已存在，下一步需要拆成可执行任务'
      ];
    default:
      return [];
  }
};

export const getStoryStageNextQuestions = (stage: StoryMaturityStage): string[] => {
  switch (stage) {
    case 'idea':
      return [
        '主角是谁，当前最想要什么？',
        '故事从哪里开始，舞台的第一眼差异是什么？',
        '第一卷的核心冲突和失败代价是什么？'
      ];
    case 'interviewing':
      return [
        '哪些 AI 建议可以确认，哪些需要删除或改写？',
        '还有哪些 required 问题必须先回答？',
        '下一步要生成 Level 1、Level 2，还是继续访谈？'
      ];
    case 'specified':
      return [
        '创作计划要优先解决结构、角色弧线，还是章节节奏？',
        '哪些规格内容仍然只能作为待确认假设？',
        '第一卷计划需要覆盖多少章节或字数？'
      ];
    case 'planned':
      return [
        '哪些计划段落可以拆成第一批写作任务？',
        '哪些任务应标记 PLAN-ONLY，避免过早写正文？',
        '哪些任务已经足够 WRITE-READY？'
      ];
    default:
      return [];
  }
};
