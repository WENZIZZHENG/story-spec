import path from 'node:path';
import type { ClarificationAnswer, ClarificationQuestion } from '../domain/clarification.js';
import type { ProjectFileSystem } from './project-ports.js';
import {
  renderClarificationMarkdown,
  type ClarificationRecord
} from './manage-clarifications.js';
import {
  clarificationAnswerToText,
  hasResolvedClarificationAnswer
} from '../domain/clarification-answer-utils.js';
import {
  loadClarificationExampleBranches,
  loadClarificationQuestionPacks,
  selectClarificationQuestions,
  type ClarificationSelectionResult
} from './select-clarification-questions.js';
import {
  relativePath,
  selectStoryProject
} from './workbench-utils.js';

export type InterviewStoryErrorCode =
  | 'MISSING_PREMISE'
  | 'INVALID_ANSWERS'
  | 'NO_QUESTIONS_SELECTED';

export class InterviewStoryError extends Error {
  constructor(
    public readonly code: InterviewStoryErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'InterviewStoryError';
  }
}

export interface InterviewStoryStateInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
}

export interface InterviewStoryState {
  projectRoot: string;
  story: string;
  storyPath: string;
  jsonPath: string;
  markdownPath: string;
  existingRecord?: ClarificationRecord;
}

export interface PrepareInterviewQuestionsInput {
  premise: string;
  maxQuestions?: number;
}

export interface PrepareInterviewQuestionsResult {
  premise: string;
  selection: ClarificationSelectionResult;
  questions: ClarificationQuestion[];
}

export interface InterviewStoryInput extends InterviewStoryStateInput {
  premise?: string;
  answers?: Record<string, unknown>;
  useExamples?: boolean;
  maxQuestions?: number;
  write?: boolean;
  now?: () => Date;
}

export interface InterviewStoryResult extends InterviewStoryState {
  record: ClarificationRecord;
  selection: ClarificationSelectionResult;
  markdown: string;
  handoffPrompt: string;
  written: boolean;
  updatedAnswerIds: string[];
  reusedAnswerIds: string[];
}

const clarificationJsonPath = (storyPath: string): string =>
  path.join(storyPath, 'clarifications.json');

const clarificationMarkdownPath = (storyPath: string): string =>
  path.join(storyPath, 'clarifications.md');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasMeaningfulAnswer = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some(item => hasMeaningfulAnswer(item));
  }

  return true;
};

const normalizeQuestionAnswer = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map(item => typeof item === 'string' ? item.trim() : item)
      .filter(item => hasMeaningfulAnswer(item));
  }

  return value;
};

const mergeQuestions = (
  existing: ClarificationQuestion[],
  selected: ClarificationQuestion[]
): ClarificationQuestion[] => {
  const questions = new Map<string, ClarificationQuestion>();

  for (const question of existing) {
    questions.set(question.id, question);
  }

  for (const question of selected) {
    if (!questions.has(question.id)) {
      questions.set(question.id, question);
    }
  }

  return [...questions.values()];
};

const createUserAnswer = (
  questionId: string,
  answer: unknown,
  timestamp: string,
  existing?: ClarificationAnswer
): ClarificationAnswer => ({
  questionId,
  answer: normalizeQuestionAnswer(answer),
  source: 'user-explicit',
  confidence: 1,
  confirmed: true,
  createdAt: existing?.createdAt ?? timestamp,
  updatedAt: timestamp
});

const answerMatchesDependency = (
  answer: unknown,
  dependency: ClarificationQuestion['dependsOn'][number]
): boolean => {
  const text = clarificationAnswerToText(answer);

  if (dependency.answerIncludes && !text.includes(dependency.answerIncludes)) {
    return false;
  }

  if (dependency.answerEquals && text.trim() !== dependency.answerEquals) {
    return false;
  }

  return true;
};

const isQuestionAvailable = (
  question: ClarificationQuestion,
  existingAnswers: Map<string, ClarificationAnswer>
): boolean => question.dependsOn.length === 0 || question.dependsOn.every(dependency => {
  const answer = existingAnswers.get(dependency.questionId);
  return Boolean(answer && answer.confirmed && answerMatchesDependency(answer.answer, dependency));
});

const filterQuestionsForCurrentRound = (
  selected: ClarificationQuestion[],
  existingRecord: ClarificationRecord | undefined
): ClarificationQuestion[] => {
  const existingAnswers = new Map<string, ClarificationAnswer>(
    existingRecord?.answers.map(answer => [answer.questionId, answer]) ?? []
  );

  return selected.filter(question => {
    const existingAnswer = existingAnswers.get(question.id);
    if (
      existingAnswer?.confirmed
      && hasResolvedClarificationAnswer(existingAnswer.answer)
      && existingAnswer.source !== 'ai-suggested'
    ) {
      return false;
    }

    return isQuestionAvailable(question, existingAnswers);
  });
};

const readExistingRecord = async (
  fs: ProjectFileSystem,
  jsonPath: string
): Promise<ClarificationRecord | undefined> => {
  if (!await fs.pathExists(jsonPath)) {
    return undefined;
  }

  return fs.readJson<ClarificationRecord>(jsonPath);
};

export const getInterviewStoryState = async (
  input: InterviewStoryStateInput
): Promise<InterviewStoryState> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const jsonPath = clarificationJsonPath(story.path);
  const markdownPath = clarificationMarkdownPath(story.path);

  return {
    projectRoot: input.projectRoot,
    story: story.name,
    storyPath: story.path,
    jsonPath,
    markdownPath,
    existingRecord: await readExistingRecord(input.fileSystem, jsonPath)
  };
};

export const prepareInterviewQuestions = async (
  input: PrepareInterviewQuestionsInput
): Promise<PrepareInterviewQuestionsResult> => {
  const premise = input.premise.trim();
  if (!premise) {
    throw new InterviewStoryError('MISSING_PREMISE', '请先提供一句话创意或创作方向。');
  }

  const { packs } = await loadClarificationQuestionPacks();
  const { packs: exampleBranchPacks } = await loadClarificationExampleBranches();
  const selection = selectClarificationQuestions(premise, packs, {
    mode: 'fewer',
    maxQuestions: input.maxQuestions ?? 6,
    maxExamples: 3,
    exampleBranchPacks
  });
  const questions = selection.selectedQuestions.map(item => item.question);

  if (questions.length === 0) {
    throw new InterviewStoryError('NO_QUESTIONS_SELECTED', '没有从问题库中选出可用澄清问题。');
  }

  return {
    premise,
    selection,
    questions
  };
};

const resolvePremise = (
  inputPremise: string | undefined,
  existingRecord: ClarificationRecord | undefined
): string => {
  const premise = inputPremise?.trim() || existingRecord?.premise.trim() || '';
  if (!premise) {
    throw new InterviewStoryError('MISSING_PREMISE', '请先提供一句话创意或创作方向。');
  }

  return premise;
};

const buildAnswerUpdates = (
  questions: ClarificationQuestion[],
  inputAnswers: Record<string, unknown>,
  useExamples: boolean
): Map<string, unknown> => {
  const updates = new Map<string, unknown>();

  for (const [questionId, answer] of Object.entries(inputAnswers)) {
    if (hasMeaningfulAnswer(answer)) {
      updates.set(questionId, answer);
    }
  }

  if (!useExamples) {
    return updates;
  }

  for (const question of questions) {
    if (!updates.has(question.id) && hasMeaningfulAnswer(question.exampleAnswers[0])) {
      updates.set(question.id, question.exampleAnswers[0]);
    }
  }

  return updates;
};

const renderInterviewHandoffPrompt = (
  result: Pick<InterviewStoryResult, 'projectRoot' | 'jsonPath' | 'record'>
): string => [
  `/storyspec-specify ${result.record.premise}`,
  '',
  `请先读取 \`${relativePath(result.projectRoot, result.jsonPath)}\`，并按澄清记录继续创作。`,
  '只把 `confirmed: true` 且 `source: user-explicit/imported` 的答案视为用户已确认。',
  '`source: ai-suggested` 或 `confirmed: false` 的内容只能作为待确认建议。',
  'required 未答问题必须继续输出为 `[需要澄清]`，不得写入正典或 specification。',
  '请先输出写入前预览，等待我确认后再落盘。'
].join('\n');

export const interviewStory = async (
  input: InterviewStoryInput
): Promise<InterviewStoryResult> => {
  const state = await getInterviewStoryState(input);
  const premise = resolvePremise(input.premise, state.existingRecord);
  const prepared = await prepareInterviewQuestions({
    premise,
    maxQuestions: input.maxQuestions
  });
  const roundQuestions = filterQuestionsForCurrentRound(prepared.questions, state.existingRecord);
  const timestamp = (input.now ?? (() => new Date()))().toISOString();
  const existingRecord = state.existingRecord;
  const answerUpdates = buildAnswerUpdates(
    roundQuestions,
    input.answers ?? {},
    input.useExamples ?? false
  );
  const existingAnswers = new Map<string, ClarificationAnswer>(
    existingRecord?.answers.map(answer => [answer.questionId, answer]) ?? []
  );
  const answerMap = new Map<string, ClarificationAnswer>(existingAnswers);
  const updatedAnswerIds: string[] = [];

  for (const [questionId, answer] of answerUpdates) {
    answerMap.set(questionId, createUserAnswer(
      questionId,
      answer,
      timestamp,
      existingAnswers.get(questionId)
    ));
    updatedAnswerIds.push(questionId);
  }

  const updatedIdSet = new Set(updatedAnswerIds);
  const reusedAnswerIds = [...existingAnswers.keys()].filter(questionId => !updatedIdSet.has(questionId));
  const record: ClarificationRecord = {
    schemaVersion: '1.0',
    story: state.story,
    premise,
    createdAt: existingRecord?.createdAt ?? timestamp,
    updatedAt: timestamp,
    questions: mergeQuestions(existingRecord?.questions ?? [], roundQuestions),
    answers: [...answerMap.values()]
  };
  const markdown = renderClarificationMarkdown(record);
  const resultBase = {
    ...state,
    record,
    selection: prepared.selection,
    markdown,
    written: input.write ?? true,
    updatedAnswerIds,
    reusedAnswerIds
  };
  const handoffPrompt = renderInterviewHandoffPrompt({
    projectRoot: resultBase.projectRoot,
    jsonPath: resultBase.jsonPath,
    record
  });
  const result: InterviewStoryResult = {
    ...resultBase,
    handoffPrompt
  };

  if (input.write ?? true) {
    await input.fileSystem.writeJson(state.jsonPath, record, { spaces: 2 });
    await input.fileSystem.writeFile(state.markdownPath, markdown);
  }

  return result;
};

export const renderInterviewSummary = (result: InterviewStoryResult): string => [
  'StorySpec 创作访谈',
  '',
  `故事：${result.story}`,
  `JSON：${relativePath(result.projectRoot, result.jsonPath)}`,
  `Markdown：${relativePath(result.projectRoot, result.markdownPath)}`,
  `匹配问题包：${result.selection.matchedPacks.join(', ') || '无'}`,
  `问题数：${result.record.questions.length}`,
  `本轮新增/更新答案：${result.updatedAnswerIds.length}`,
  `复用旧答案：${result.reusedAnswerIds.length}`,
  `写入状态：${result.written ? '已写入' : '预览未写入'}`,
  '',
  '可复制给 Codex：',
  '',
  '```text',
  result.handoffPrompt,
  '```',
  ''
].join('\n');

export const normalizeInterviewAnswers = (
  answers: Record<string, unknown> | undefined
): Record<string, unknown> =>
  isRecord(answers) ? answers : {};
