import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import { relativePath, selectStoryProject } from './workbench-utils.js';
import type {
  ClarificationAnswer,
  ClarificationExampleBranch,
  ClarificationQuestion
} from '../domain/clarification.js';
import {
  hasClarificationAnswerContent,
  hasResolvedClarificationAnswer,
  isDeferredClarificationAnswer
} from '../domain/clarification-answer-utils.js';
import {
  renderExampleBranchMarkdown,
  type ExampleBranch
} from '../domain/example-branch.js';
import {
  renderDeferredDecisionItems,
  summarizeDecisionLog
} from './decision-log.js';

export interface ClarificationRecord {
  schemaVersion: '1.0';
  story: string;
  premise: string;
  createdAt: string;
  updatedAt: string;
  questions: ClarificationQuestion[];
  answers: ClarificationAnswer[];
  archivedAnswers?: ArchivedClarificationAnswer[];
}

export interface ArchivedClarificationAnswer extends ClarificationAnswer {
  archivedAt: string;
  reason: string;
}

export interface ClarificationNextStep {
  label: string;
  description: string;
}

export interface DraftClarificationAnswer extends Omit<ClarificationAnswer, 'createdAt' | 'updatedAt'> {
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClarificationRecordInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  premise: string;
  selectedQuestions: ClarificationQuestion[];
  confirmed?: DraftClarificationAnswer[];
  suggestions?: DraftClarificationAnswer[];
  now?: () => Date;
}

export interface ClarificationRecordResult {
  projectRoot: string;
  story: string;
  storyPath: string;
  jsonPath: string;
  markdownPath: string;
  record?: ClarificationRecord;
  markdown: string;
}

export interface CreatedClarificationRecordResult extends ClarificationRecordResult {
  record: ClarificationRecord;
}

export interface ListClarificationRecordsInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
}

export interface RollbackClarificationAnswerInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  questionId?: string;
  mode?: 'candidate';
  now?: () => Date;
}

export interface DoctorClarificationRecordInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  fix?: boolean;
  now?: () => Date;
}

export interface ClarificationDoctorOrphanAnswer {
  questionId: string;
  answer: unknown;
  source: ClarificationAnswer['source'];
  confirmed: boolean;
  confidence: number;
  evidencePath: string;
  action: 'archive';
}

export interface ClarificationDoctorDuplicateQuestion {
  questionId: string;
  count: number;
  evidencePath: string;
}

export interface ClarificationDoctorSuggestion {
  questionId: string;
  answer: unknown;
  evidencePath: string;
}

export interface ClarificationDoctorSummary {
  orphanAnswers: number;
  duplicateQuestions: number;
  unconfirmedSuggestions: number;
}

export interface DoctorClarificationRecordResult extends ClarificationRecordResult {
  record: ClarificationRecord;
  fixed: boolean;
  orphanAnswers: ClarificationDoctorOrphanAnswer[];
  duplicateQuestions: ClarificationDoctorDuplicateQuestion[];
  unconfirmedSuggestions: ClarificationDoctorSuggestion[];
  summary: ClarificationDoctorSummary;
}

export interface RolledBackClarificationAnswer {
  questionId: string;
  answer: unknown;
  previousConfirmed: boolean;
  nextConfirmed: boolean;
  previousSource: ClarificationAnswer['source'];
  nextSource: ClarificationAnswer['source'];
  evidencePath: string;
}

export interface RollbackClarificationAnswerResult extends CreatedClarificationRecordResult {
  rolledBack: RolledBackClarificationAnswer;
  summary: string;
}

export interface ClarificationSummaryInput {
  explicit: string[];
  pending: string[];
  examples: string[];
  questionExampleBranches?: ClarificationExampleBranch[];
  exampleBranches?: ExampleBranch[];
  nextSteps?: ClarificationNextStep[];
}

const clarificationJsonPath = (storyPath: string): string =>
  path.join(storyPath, 'clarifications.json');

const clarificationMarkdownPath = (storyPath: string): string =>
  path.join(storyPath, 'clarifications.md');

const answerToMarkdown = (answer: unknown): string =>
  Array.isArray(answer)
    ? answer.map(item => String(item)).join('、')
    : String(answer);

const normalizeAnswer = (
  answer: DraftClarificationAnswer,
  timestamp: string
): ClarificationAnswer => ({
  ...answer,
  createdAt: answer.createdAt ?? timestamp,
  updatedAt: answer.updatedAt ?? timestamp
});

const answerUpdatedTime = (answer: ClarificationAnswer): number => {
  const time = Date.parse(answer.updatedAt);
  return Number.isFinite(time) ? time : 0;
};

const findRollbackAnswerIndex = (
  answers: readonly ClarificationAnswer[],
  questionId: string | undefined
): number => {
  if (questionId) {
    return answers.findIndex(answer =>
      answer.questionId === questionId
      && answer.confirmed
      && answer.source !== 'ai-suggested'
    );
  }

  let latestIndex = -1;
  let latestTime = -1;
  answers.forEach((answer, index) => {
    if (!answer.confirmed || answer.source === 'ai-suggested') {
      return;
    }

    const time = answerUpdatedTime(answer);
    if (time >= latestTime) {
      latestIndex = index;
      latestTime = time;
    }
  });

  return latestIndex;
};

const findOrphanAnswers = (record: ClarificationRecord): ClarificationDoctorOrphanAnswer[] => {
  const questionIds = new Set(record.questions.map(question => question.id));
  return record.answers
    .filter(answer => !questionIds.has(answer.questionId))
    .map(answer => ({
      questionId: answer.questionId,
      answer: answer.answer,
      source: answer.source,
      confirmed: answer.confirmed,
      confidence: answer.confidence,
      evidencePath: `clarifications.json#answers.${answer.questionId}`,
      action: 'archive'
    }));
};

const findDuplicateQuestions = (record: ClarificationRecord): ClarificationDoctorDuplicateQuestion[] => {
  const counts = new Map<string, number>();
  record.questions.forEach(question => counts.set(question.id, (counts.get(question.id) ?? 0) + 1));

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([questionId, count]) => ({
      questionId,
      count,
      evidencePath: `clarifications.json#questions.${questionId}`
    }));
};

const findUnconfirmedSuggestions = (record: ClarificationRecord): ClarificationDoctorSuggestion[] =>
  record.answers
    .filter(answer =>
      answer.source === 'ai-suggested'
      && !answer.confirmed
      && hasClarificationAnswerContent(answer.answer)
    )
    .map(answer => ({
      questionId: answer.questionId,
      answer: answer.answer,
      evidencePath: `clarifications.json#answers.${answer.questionId}`
    }));

const bulletList = (items: string[], fallback: string): string[] =>
  items.length > 0
    ? items.map(item => `- ${item}`)
    : [`- ${fallback}`];

const renderInterestingChoice = (branch: ClarificationExampleBranch): string[] => {
  if (!branch.interestingChoice) {
    return [];
  }

  return [
    `- 吸引力：${branch.interestingChoice.appeal}`,
    `- 代价：${branch.interestingChoice.cost}`,
    `- 关系影响：${branch.interestingChoice.relationshipImpact}`,
    `- 世界影响：${branch.interestingChoice.worldImpact}`,
    `- 后续钩子：${branch.interestingChoice.futureHook}`,
    `- 确认边界：${branch.interestingChoice.confirmationBoundary}`
  ];
};

const renderPowerStructure = (branch: ClarificationExampleBranch): string[] => {
  if (!branch.powerStructure) {
    return [];
  }

  return [
    `- 权力结构：${branch.powerStructure.name}`,
    `- 资源控制：${branch.powerStructure.resourceControl}`,
    `- 合法性来源：${branch.powerStructure.legitimacySource}`,
    `- 获利者：${branch.powerStructure.beneficiaries.join('；')}`,
    `- 受损者：${branch.powerStructure.victims.join('；')}`,
    `- 公开叙事：${branch.powerStructure.publicNarrative}`,
    `- 内部裂缝：${branch.powerStructure.internalCracks.join('；')}`,
    `- 第一碰撞场景：${branch.powerStructure.firstCollisionScene}`,
    `- 关系钩子：${branch.powerStructure.relationshipHooks.join('；')}`
  ];
};

const renderClarificationExampleBranches = (branches: ClarificationExampleBranch[]): string[] => [
  '## 示例分叉',
  '',
  ...(branches.length > 0
    ? branches.flatMap(branch => [
      `### ${branch.label}`,
      '',
      `- 示例回答：${branch.answer}`,
      `- 风味：${branch.flavor}`,
      `- 取舍：${branch.tradeoffs.length > 0 ? branch.tradeoffs.join('；') : '无'}`,
      `- 后续影响：${branch.downstreamImpact}`,
      ...renderInterestingChoice(branch),
      ...renderPowerStructure(branch),
      `- 适合：${branch.recommendedFor.length > 0 ? branch.recommendedFor.join('；') : '未限定'}`,
      '- confirmed: false',
      ''
    ])
    : ['- 暂无问题级示例分叉。', ''])
];

const renderArchivedClarificationAnswers = (answers: ArchivedClarificationAnswer[] = []): string[] => [
  '## 已归档澄清答案',
  '',
  ...bulletList(
    answers.map(answer =>
      `${answer.questionId}：${answerToMarkdown(answer.answer)}（${answer.reason}；archivedAt ${answer.archivedAt}）`
    ),
    '暂无已归档澄清答案。'
  )
];

export const renderClarificationSummary = (input: ClarificationSummaryInput): string => [
  '## 用户已明确',
  '',
  ...bulletList(input.explicit, '尚未记录明确创作决策。'),
  '',
  '## 需要澄清',
  '',
  ...bulletList(input.pending, '暂未发现必须立即澄清的问题。'),
  '',
  '## 可复制示例',
  '',
  ...bulletList(input.examples, '暂无示例；请先选择一个澄清问题包。'),
  '',
  ...renderClarificationExampleBranches(input.questionExampleBranches ?? []),
  ...(input.exampleBranches?.length
    ? input.exampleBranches.flatMap(branch => renderExampleBranchMarkdown(branch).trimEnd().split('\n'))
    : ['- 示例分叉：暂无。']),
  '',
  '## 下一步建议',
  '',
  ...bulletList(
    (input.nextSteps ?? defaultClarificationNextSteps()).map(step => `${step.label}：${step.description}`),
    '继续回答问题，或生成写入前预览。'
  ),
  ''
].join('\n');

export const defaultClarificationNextSteps = (): ClarificationNextStep[] => [
  {
    label: '继续回答问题',
    description: '保留当前澄清记录，下一轮继续补齐未决创作选择。'
  },
  {
    label: '生成 Level 1/2/3 规格',
    description: '根据已确认答案生成不同详细程度的规格草案。'
  },
  {
    label: '进入写入前预览',
    description: '先展示将写入哪些内容、来源是什么、哪些仍待确认。'
  }
];

export const renderClarificationMarkdown = (record: ClarificationRecord): string => {
  const decisionLog = summarizeDecisionLog(record, record.story);
  const deferredAnswerIds = new Set(decisionLog.deferredItems.map(item => item.questionId));
  const confirmed = record.answers.filter(answer =>
    answer.confirmed
    && answer.source !== 'ai-suggested'
    && !isDeferredClarificationAnswer(answer.answer)
  );
  const aiSuggestions = record.answers.filter(answer => answer.source === 'ai-suggested' && !answer.confirmed);
  const pendingQuestions = record.questions.filter(question =>
    question.required && !record.answers.some(answer =>
      answer.questionId === question.id
      && answer.confirmed
      && hasResolvedClarificationAnswer(answer.answer)
    )
  );
  const examples = record.questions.flatMap(question => question.exampleAnswers.slice(0, 2)).slice(0, 6);
  const questionExampleBranches = record.questions
    .flatMap(question => question.exampleBranches ?? [])
    .slice(0, 6);
  const exampleBranches = record.questions.slice(0, 3).map((question, index) => ({
    label: index === 0 ? '作者主导：继续提问' : `示例分叉 ${index + 1}`,
    tone: index === 0 ? '保留创作空间' : '不同创作方向',
    assumptions: [question.question],
    sampleAnswer: question.exampleAnswers[0] ?? '暂无示例。',
    tradeoffs: [question.whyItMatters]
  }));

  return [
    `# ${record.story} 澄清记录`,
    '',
    `创建时间：${record.createdAt}`,
    `更新时间：${record.updatedAt}`,
    '',
    '## 原始创意',
    '',
    record.premise || '未记录。',
    '',
    renderClarificationSummary({
      explicit: confirmed.map(answer => `${answer.questionId}：${answerToMarkdown(answer.answer)}`),
      pending: pendingQuestions.map(question => `${question.id}：${question.question}`),
      examples,
      questionExampleBranches,
      exampleBranches
    }).trimEnd(),
    '',
    '## 未决项回流与决策日志',
    '',
    ...renderDeferredDecisionItems(decisionLog.deferredItems),
    '',
    '## AI 建议，待确认',
    '',
    ...bulletList(
      aiSuggestions.map(answer => `${answer.questionId}：${answerToMarkdown(answer.answer)}（confidence ${answer.confidence}）`),
      '暂无 AI 建议。'
    ),
    '',
    ...renderArchivedClarificationAnswers(record.archivedAnswers),
    '',
    '## 全部问题',
    '',
    ...bulletList(
      record.questions.map(question =>
        `${question.id}：${question.question}（${question.whyItMatters}${deferredAnswerIds.has(question.id) ? '；当前为稍后决定，需回流' : ''}）`
      ),
      '暂无问题。'
    ),
    ''
  ].join('\n');
};

export const createClarificationRecord = async (
  input: CreateClarificationRecordInput
): Promise<CreatedClarificationRecordResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const timestamp = (input.now ?? (() => new Date()))().toISOString();
  const answers = [
    ...(input.confirmed ?? []),
    ...(input.suggestions ?? [])
  ].map(answer => normalizeAnswer(answer, timestamp));
  const record: ClarificationRecord = {
    schemaVersion: '1.0',
    story: story.name,
    premise: input.premise,
    createdAt: timestamp,
    updatedAt: timestamp,
    questions: input.selectedQuestions,
    answers
  };
  const jsonPath = clarificationJsonPath(story.path);
  const markdownPath = clarificationMarkdownPath(story.path);
  const markdown = renderClarificationMarkdown(record);

  await input.fileSystem.writeJson(jsonPath, record, { spaces: 2 });
  await input.fileSystem.writeFile(markdownPath, markdown);

  return {
    projectRoot: input.projectRoot,
    story: story.name,
    storyPath: story.path,
    jsonPath,
    markdownPath,
    record,
    markdown
  };
};

export const listClarificationRecords = async (
  input: ListClarificationRecordsInput
): Promise<ClarificationRecordResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const jsonPath = clarificationJsonPath(story.path);
  const markdownPath = clarificationMarkdownPath(story.path);
  const exists = await input.fileSystem.pathExists(jsonPath);
  const record = exists
    ? await input.fileSystem.readJson<ClarificationRecord>(jsonPath)
    : undefined;
  const markdown = record ? renderClarificationMarkdown(record) : '';

  return {
    projectRoot: input.projectRoot,
    story: story.name,
    storyPath: story.path,
    jsonPath,
    markdownPath,
    record,
    markdown
  };
};

export const rollbackLatestClarificationAnswer = async (
  input: RollbackClarificationAnswerInput
): Promise<RollbackClarificationAnswerResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const jsonPath = clarificationJsonPath(story.path);
  if (!await input.fileSystem.pathExists(jsonPath)) {
    throw new Error('CLARIFICATION_RECORD_NOT_FOUND');
  }

  const record = await input.fileSystem.readJson<ClarificationRecord>(jsonPath);
  const answerIndex = findRollbackAnswerIndex(record.answers, input.questionId);
  if (answerIndex === -1) {
    throw new Error(input.questionId
      ? `CONFIRMED_ANSWER_NOT_FOUND:${input.questionId}`
      : 'CONFIRMED_ANSWER_NOT_FOUND');
  }

  const timestamp = (input.now ?? (() => new Date()))().toISOString();
  const previous = record.answers[answerIndex];
  const updatedAnswer: ClarificationAnswer = {
    ...previous,
    source: 'ai-suggested',
    confirmed: false,
    confidence: Math.min(previous.confidence, 0.8),
    updatedAt: timestamp
  };
  const updatedRecord: ClarificationRecord = {
    ...record,
    updatedAt: timestamp,
    answers: record.answers.map((answer, index) => index === answerIndex ? updatedAnswer : answer)
  };
  const markdownPath = clarificationMarkdownPath(story.path);
  const markdown = renderClarificationMarkdown(updatedRecord);
  const rolledBack: RolledBackClarificationAnswer = {
    questionId: previous.questionId,
    answer: previous.answer,
    previousConfirmed: previous.confirmed,
    nextConfirmed: updatedAnswer.confirmed,
    previousSource: previous.source,
    nextSource: updatedAnswer.source,
    evidencePath: `clarifications.json#answers.${previous.questionId}`
  };

  await input.fileSystem.writeJson(jsonPath, updatedRecord, { spaces: 2 });
  await input.fileSystem.writeFile(markdownPath, markdown);

  return {
    projectRoot: input.projectRoot,
    story: story.name,
    storyPath: story.path,
    jsonPath,
    markdownPath,
    record: updatedRecord,
    markdown,
    rolledBack,
    summary: `${previous.questionId} 已退回候选，保留原答案与来源证据，等待作者重新确认。`
  };
};

export const doctorClarificationRecord = async (
  input: DoctorClarificationRecordInput
): Promise<DoctorClarificationRecordResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const jsonPath = clarificationJsonPath(story.path);
  if (!await input.fileSystem.pathExists(jsonPath)) {
    throw new Error('CLARIFICATION_RECORD_NOT_FOUND');
  }

  const record = await input.fileSystem.readJson<ClarificationRecord>(jsonPath);
  const orphanAnswers = findOrphanAnswers(record);
  const duplicateQuestions = findDuplicateQuestions(record);
  const unconfirmedSuggestions = findUnconfirmedSuggestions(record);
  const timestamp = (input.now ?? (() => new Date()))().toISOString();
  const fixed = Boolean(input.fix && orphanAnswers.length > 0);
  const updatedRecord: ClarificationRecord = fixed
    ? {
      ...record,
      updatedAt: timestamp,
      answers: record.answers.filter(answer =>
        !orphanAnswers.some(orphan => orphan.questionId === answer.questionId)
      ),
      archivedAnswers: [
        ...(record.archivedAnswers ?? []),
        ...record.answers
          .filter(answer => orphanAnswers.some(orphan => orphan.questionId === answer.questionId))
          .map(answer => ({
            ...answer,
            archivedAt: timestamp,
            reason: 'orphan-answer-question-not-found'
          }))
      ]
    }
    : record;
  const markdownPath = clarificationMarkdownPath(story.path);
  const markdown = renderClarificationMarkdown(updatedRecord);

  if (fixed) {
    await input.fileSystem.writeJson(jsonPath, updatedRecord, { spaces: 2 });
    await input.fileSystem.writeFile(markdownPath, markdown);
  }

  return {
    projectRoot: input.projectRoot,
    story: story.name,
    storyPath: story.path,
    jsonPath,
    markdownPath,
    record: updatedRecord,
    markdown,
    fixed,
    orphanAnswers,
    duplicateQuestions,
    unconfirmedSuggestions,
    summary: {
      orphanAnswers: orphanAnswers.length,
      duplicateQuestions: duplicateQuestions.length,
      unconfirmedSuggestions: unconfirmedSuggestions.length
    }
  };
};

export const renderClarificationRecordSummary = (result: CreatedClarificationRecordResult): string => [
  'StorySpec Clarifications',
  '',
  `故事：${result.story}`,
  `JSON：${relativePath(result.projectRoot, result.jsonPath)}`,
  `Markdown：${relativePath(result.projectRoot, result.markdownPath)}`,
  `问题数：${result.record.questions.length}`,
  `答案数：${result.record.answers.length}`,
  ''
].join('\n');

export const renderClarificationRollbackSummary = (
  result: RollbackClarificationAnswerResult
): string => [
  'StorySpec Clarification Rollback',
  '',
  `故事：${result.story}`,
  `退回问题：${result.rolledBack.questionId}`,
  `原状态：${result.rolledBack.previousSource} / confirmed=${result.rolledBack.previousConfirmed}`,
  `新状态：${result.rolledBack.nextSource} / confirmed=${result.rolledBack.nextConfirmed}`,
  `证据：${result.rolledBack.evidencePath}`,
  `JSON：${relativePath(result.projectRoot, result.jsonPath)}`,
  `Markdown：${relativePath(result.projectRoot, result.markdownPath)}`,
  '',
  result.summary,
  ''
].join('\n');

export const renderClarificationDoctorSummary = (
  result: DoctorClarificationRecordResult
): string => [
  'StorySpec Clarification Doctor',
  '',
  `故事：${result.story}`,
  `JSON：${relativePath(result.projectRoot, result.jsonPath)}`,
  `模式：${result.fixed ? '已修复' : '预览'}`,
  `孤儿答案：${result.summary.orphanAnswers}`,
  `重复问题：${result.summary.duplicateQuestions}`,
  `未确认候选：${result.summary.unconfirmedSuggestions}`,
  '',
  '孤儿答案处理：',
  ...bulletList(
    result.orphanAnswers.map(answer =>
      `${answer.questionId}：将归档，保留 answer/source/confirmed/confidence`
    ),
    '未发现孤儿答案。'
  ),
  '',
  result.fixed
    ? '已将孤儿答案移入 archivedAnswers，并重写 clarifications.md。'
    : '预览未写入；确认后运行同一命令加 --fix。',
  ''
].join('\n');
