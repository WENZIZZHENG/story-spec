import {
  validateFirstRoundScript,
  type FirstRoundScript
} from './co-creation-first-round-script.js';

export type CoCreationExperienceItemKind = 'automatic' | 'snapshot' | 'manual';
export type CoCreationExperienceItemStatus = 'pass' | 'fail' | 'manual';

export type CoCreationExperienceIssueCode =
  | 'ENTRY_FREEDOM_MISSING'
  | 'ROUND_TOO_HEAVY_OR_THIN'
  | 'CHOICE_CONSEQUENCES_MISSING'
  | 'CREATION_ECHO_MISSING'
  | 'CANDIDATE_BOUNDARY_MISSING'
  | 'PLAN_GATE_MISSING'
  | 'AUTHOR_RESPONSE_RANGE_MISSING';

export interface CoCreationExperienceIssue {
  code: CoCreationExperienceIssueCode;
  itemId: string;
  message: string;
}

export interface CoCreationExperienceItem {
  id: string;
  kind: CoCreationExperienceItemKind;
  status: CoCreationExperienceItemStatus;
  description: string;
  prompt: string;
}

export interface CoCreationExperienceAcceptanceResult {
  summary: string;
  items: CoCreationExperienceItem[];
  issues: CoCreationExperienceIssue[];
}

const issue = (
  code: CoCreationExperienceIssueCode,
  itemId: string,
  message: string
): CoCreationExperienceIssue => ({ code, itemId, message });

const automaticItem = (
  id: string,
  passed: boolean,
  description: string,
  prompt: string
): CoCreationExperienceItem => ({
  id,
  kind: 'automatic',
  status: passed ? 'pass' : 'fail',
  description,
  prompt
});

const manualItem = (
  id: string,
  description: string,
  prompt: string
): CoCreationExperienceItem => ({
  id,
  kind: 'manual',
  status: 'manual',
  description,
  prompt
});

const hasInterestingChoices = (script: FirstRoundScript): boolean =>
  script.entries.length > 0
  && script.entries.every(entry =>
    entry.candidates.length >= 2
    && entry.candidates.every(candidate =>
      candidate.interestingChoice.appeal
      && candidate.interestingChoice.cost
      && candidate.interestingChoice.relationshipImpact
      && candidate.interestingChoice.worldImpact
      && candidate.interestingChoice.futureHook
      && candidate.interestingChoice.confirmationBoundary.includes('候选')
    )
  );

const hasCandidateBoundary = (script: FirstRoundScript): boolean =>
  script.forbidden.some(item => item.includes('未确认角色和势力'))
  && script.forbidden.some(item => item.includes('正典'))
  && script.entries.every(entry =>
    entry.candidates.every(candidate => candidate.interestingChoice.confirmationBoundary.includes('候选'))
  );

const hasResponseRange = (script: FirstRoundScript): boolean => {
  const kinds = new Set(script.userResponseExamples.map(item => item.kind));
  return ['confirm', 'rewrite', 'reject', 'defer'].every(kind => kinds.has(kind as any));
};

const addFailIssue = (
  issues: CoCreationExperienceIssue[],
  passed: boolean,
  code: CoCreationExperienceIssueCode,
  itemId: string,
  message: string
): void => {
  if (!passed) {
    issues.push(issue(code, itemId, message));
  }
};

export const evaluateCoCreationExperience = (
  firstRoundScript: unknown
): CoCreationExperienceAcceptanceResult => {
  const firstRound = validateFirstRoundScript(firstRoundScript);
  const script = firstRound.script;
  const issues: CoCreationExperienceIssue[] = [];
  const entries = script?.entries ?? [];
  const flow = script?.flow ?? [];
  const recommendedEntries = script?.recommendedEntries ?? [];
  const forbidden = script?.forbidden ?? [];
  const nextRecommendations = script?.nextRecommendations ?? [];
  const userResponseExamples = script?.userResponseExamples ?? [];
  const creationEcho = script?.creationEcho;

  const entryFreedom = ['power', 'stage', 'faction'].every(id => recommendedEntries.includes(id as any));
  const lowBurdenRound = entries.length >= 3
    && entries.every(entry => entry.candidates.length >= 2 && entry.candidates.length <= 3);
  const interestingChoices = script ? hasInterestingChoices(script) : false;
  const hasCreationEcho = Boolean(creationEcho?.created && creationEcho.stillOpen && creationEcho.next);
  const candidateBoundary = script ? hasCandidateBoundary(script) : false;
  const planGate = !flow.some(step => step.includes('完整计划') || step.includes('写完整计划'))
    && !nextRecommendations.some(item => /完整\s*creative-plan\.md|完整计划|分卷大纲/.test(item))
    && forbidden.some(item => item.includes('完整 creative-plan.md'));
  const responseRange = userResponseExamples.length > 0 && (script ? hasResponseRange(script) : false);

  addFailIssue(issues, entryFreedom, 'ENTRY_FREEDOM_MISSING', 'entry-freedom', '作者应能从能力、舞台、势力等核心入口开始。');
  addFailIssue(issues, lowBurdenRound, 'ROUND_TOO_HEAVY_OR_THIN', 'low-burden-round', '首轮应少量高价值候选，避免过重或过薄。');
  addFailIssue(issues, interestingChoices, 'CHOICE_CONSEQUENCES_MISSING', 'interesting-choice-consequences', '高影响候选必须展示吸引力、代价、关系影响、世界影响和后续钩子。');
  addFailIssue(issues, hasCreationEcho, 'CREATION_ECHO_MISSING', 'creation-echo', '系统必须能说清作者刚刚创造了什么。');
  addFailIssue(issues, candidateBoundary, 'CANDIDATE_BOUNDARY_MISSING', 'candidate-boundary', '候选、确认和正典边界必须清楚。');
  addFailIssue(issues, planGate, 'PLAN_GATE_MISSING', 'plan-gate', '核心要素不足时不能直接生成完整 creative-plan。');
  addFailIssue(issues, responseRange, 'AUTHOR_RESPONSE_RANGE_MISSING', 'author-response-range', '用户必须能确认、改写、拒绝或稍后决定。');

  const items: CoCreationExperienceItem[] = [
    automaticItem(
      'entry-freedom',
      entryFreedom,
      '作者能从多个核心入口开始，而不是被迫按固定表单顺序填写。',
      '检查推荐入口是否覆盖能力、舞台、势力等高价值入口。'
    ),
    automaticItem(
      'low-burden-round',
      lowBurdenRound,
      '每轮突出少量高价值候选，避免让首轮变成重表单。',
      '检查每个入口是否给 2-3 个候选。'
    ),
    automaticItem(
      'interesting-choice-consequences',
      interestingChoices,
      '高影响选择必须能看见后果。',
      '检查吸引力、代价、关系影响、世界影响、后续钩子和确认边界。'
    ),
    automaticItem(
      'creation-echo',
      hasCreationEcho,
      '系统能说清作者刚刚创造了什么，以及还可以探索什么。',
      '检查首轮脚本是否提供创作回声。'
    ),
    automaticItem(
      'candidate-boundary',
      candidateBoundary,
      '候选、确认、正典和未决项状态清楚。',
      '检查候选确认边界和禁止写入正典的说明。'
    ),
    automaticItem(
      'plan-gate',
      planGate,
      '核心要素不足时不会直接生成完整 creative-plan。',
      '检查流程和下一步是否避免完整计划优先。'
    ),
    automaticItem(
      'author-response-range',
      responseRange,
      '作者可以确认、改写、拒绝或稍后决定。',
      '检查用户回应示例是否覆盖四种选择。'
    ),
    manualItem(
      'manual-fun-review',
      '人工走查：体验是否像共创，而不是填系统字段。',
      '阅读首轮输出，判断作者是否像在创造小说世界，是否看到可玩的岔路。'
    ),
    manualItem(
      'manual-burden-review',
      '人工走查：功能是否增加了过多项目管理负担。',
      '判断本轮是否让作者更想继续创作，而不是更想关掉流程。'
    ),
    manualItem(
      'manual-reference-review',
      '人工走查：参考项目只借鉴结构，不照搬为复杂工具。',
      '说明借鉴了 Cucumber.js、GitHub Spec Kit、Inquirer.js 或 Twine 的哪一点，以及没有照搬什么。'
    )
  ];

  return {
    summary: issues.length === 0 ? '体验验收通过：系统保留了共创乐趣、确认边界和阶段门禁。' : '体验验收未通过：存在共创体验回归。',
    items,
    issues
  };
};
