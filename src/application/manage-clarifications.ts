import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import { relativePath, selectStoryProject } from './workbench-utils.js';
import type {
  ClarificationAnswer,
  ClarificationExampleBranch,
  ClarificationQuestion
} from '../domain/clarification.js';
import {
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
      `- 适合：${branch.recommendedFor.length > 0 ? branch.recommendedFor.join('；') : '未限定'}`,
      '- confirmed: false',
      ''
    ])
    : ['- 暂无问题级示例分叉。', ''])
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
