import path from 'node:path';
import type { ClarificationAnswer, ClarificationQuestion } from '../domain/clarification.js';
import {
  clarificationAnswerToText,
  hasClarificationAnswerContent,
  hasResolvedClarificationAnswer
} from '../domain/clarification-answer-utils.js';
import {
  getStoryStageNextQuestions
} from '../domain/story-stage.js';
import {
  evaluateStoryCoreElements,
  getStoryCoreElementStatusText,
  type StoryCoreElementAssessment
} from '../domain/story-core-elements.js';
import type { ProjectFileSystem } from './project-ports.js';
import type { ClarificationRecord } from './manage-clarifications.js';
import { summarizeCreativeControl } from './creative-control-summary.js';
import { detectCreativeIntentDrift, type CreativeIntentDriftIssue } from './detect-creative-intent-drift.js';
import {
  relativePath,
  selectStoryProject
} from './workbench-utils.js';

export interface CreativeReportInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
}

export interface CreativeReportAnswer {
  questionId: string;
  answer: string;
  source: ClarificationAnswer['source'];
}

export interface CreativeReportQuestion {
  questionId: string;
  question: string;
}

export interface CreativeReportResult {
  projectRoot: string;
  story: string;
  storyPath: string;
  hasClarifications: boolean;
  confirmed: CreativeReportAnswer[];
  pendingQuestions: CreativeReportQuestion[];
  aiSuggestions: CreativeReportAnswer[];
  coreElements: StoryCoreElementAssessment[];
  driftIssues: CreativeIntentDriftIssue[];
  cannotFinalize: string[];
  nextActions: string[];
}

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

const answerText = (answer: ClarificationAnswer): string =>
  clarificationAnswerToText(answer.answer).replace(/\s+/g, ' ').trim();

const hasConfirmedAnswer = (
  answers: ClarificationAnswer[],
  question: ClarificationQuestion
): boolean => answers.some(answer =>
  answer.questionId === question.id
  && answer.confirmed
  && hasResolvedClarificationAnswer(answer.answer)
);

const buildNextActions = (
  result: Omit<CreativeReportResult, 'nextActions'>
): string[] => {
  const actions: string[] = [];

  if (!result.hasClarifications) {
    actions.push(`storyspec interview ${result.story}`);
    actions.push(`storyspec next ${result.story}`);
    return actions;
  }

  if (result.pendingQuestions.length > 0 || result.aiSuggestions.length > 0) {
    actions.push(`storyspec interview ${result.story}`);
  }

  if (result.driftIssues.length > 0) {
    actions.push('storyspec review --panel continuity');
  }

  actions.push(`storyspec preview specify ${result.story}`);
  actions.push('storyspec validate');

  return [...new Set(actions)].slice(0, 4);
};

export const createCreativeReport = async (
  input: CreativeReportInput
): Promise<CreativeReportResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const record = await readClarificationRecord(input.fileSystem, story.path);
  const summary = await summarizeCreativeControl({
    projectRoot: input.projectRoot,
    storyPath: story.path,
    fileSystem: input.fileSystem,
    fallbackNextQuestions: getStoryStageNextQuestions(story.stage)
  });
  const drift = await detectCreativeIntentDrift({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem
  });
  const storyDriftIssues = drift.issues.filter(issue => issue.story === story.name);
  const confirmed = record?.answers
    .filter(answer =>
      answer.confirmed
      && answer.source !== 'ai-suggested'
      && hasResolvedClarificationAnswer(answer.answer)
    )
    .map(answer => ({
      questionId: answer.questionId,
      answer: answerText(answer),
      source: answer.source
    })) ?? [];
  const aiSuggestions = record?.answers
    .filter(answer =>
      answer.source === 'ai-suggested'
      && !answer.confirmed
      && hasClarificationAnswerContent(answer.answer)
    )
    .map(answer => ({
      questionId: answer.questionId,
      answer: answerText(answer),
      source: answer.source
    })) ?? [];
  const pendingQuestions = record?.questions
    .filter(question => question.required && !hasConfirmedAnswer(record.answers, question))
    .map(question => ({
      questionId: question.id,
      question: question.question
    })) ?? [];
  const coreElements = record
    ? evaluateStoryCoreElements({
      premise: record.premise,
      questions: record.questions,
      answers: record.answers
    })
    : [];
  const base = {
    projectRoot: input.projectRoot,
    story: story.name,
    storyPath: story.path,
    hasClarifications: summary.hasClarifications,
    confirmed,
    pendingQuestions,
    aiSuggestions,
    coreElements,
    driftIssues: storyDriftIssues,
    cannotFinalize: summary.cannotFinalize
  };

  return {
    ...base,
    nextActions: buildNextActions(base)
  };
};

export const renderCreativeReport = (result: CreativeReportResult): string => [
  'StorySpec 创作控制权报告',
  '',
  `故事：${result.story}`,
  `路径：${relativePath(result.projectRoot, result.storyPath)}`,
  `澄清记录：${result.hasClarifications ? '已建立' : '缺失'}`,
  '',
  '用户已确认：',
  ...(result.confirmed.length > 0
    ? result.confirmed.map(item => `- ${item.questionId}：${item.answer}`)
    : ['- 暂无。']),
  '',
  '需要澄清：',
  ...(result.pendingQuestions.length > 0
    ? result.pendingQuestions.map(item => `- ${item.questionId}：${item.question}`)
    : ['- 暂无 required 待确认问题。']),
  '',
  'AI 建议待确认：',
  ...(result.aiSuggestions.length > 0
    ? result.aiSuggestions.map(item => `- ${item.questionId}：${item.answer}`)
    : ['- 暂无。']),
  '',
  '核心要素面板：',
  ...(result.coreElements.length > 0
    ? result.coreElements.map(item => [
      `- ${item.label}：${getStoryCoreElementStatusText(item.status)}。${item.summary}`,
      ...item.qualityNotes.map(note => `  - ${note}`)
    ].join('\n'))
    : ['- 暂无结构化核心要素；请先运行 storyspec interview。']),
  '',
  '可能偏离：',
  ...(result.driftIssues.length > 0
    ? result.driftIssues.map(item => `- ${item.code}：${relativePath(result.projectRoot, item.path)} - ${item.evidence}`)
    : ['- 暂未发现。']),
  '',
  '不能擅自定稿：',
  ...(result.cannotFinalize.length > 0 ? result.cannotFinalize.map(item => `- ${item}`) : ['- 暂无。']),
  '',
  '建议下一步：',
  ...result.nextActions.map(action => `- ${action}`)
].join('\n');
