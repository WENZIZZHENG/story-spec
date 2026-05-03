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
import { loadAuthorProfile } from './manage-author-profile.js';
import type { AuthorProfileSummary } from '../domain/author-profile.js';

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
  authorProfile: AuthorProfileSummary;
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

const createFollowUpQuestion = (
  id: string,
  topic: string,
  question: string,
  whyItMatters: string,
  exampleAnswers: string[]
): ClarificationQuestion => ({
  id,
  stage: 'specify',
  topic,
  question,
  whyItMatters,
  type: 'textarea',
  required: false,
  options: [],
  exampleAnswers,
  exampleBranches: [],
  dependsOn: []
});

const answerTextIncludes = (answer: ClarificationAnswer, pattern: RegExp): boolean =>
  answer.confirmed
  && hasResolvedClarificationAnswer(answer.answer)
  && pattern.test(clarificationAnswerToText(answer.answer));

const buildFollowUpQuestions = (
  record: ClarificationRecord | undefined
): ClarificationQuestion[] => {
  if (!record) {
    return [];
  }

  const existingQuestionIds = new Set(record.questions.map(question => question.id));
  const answersById = new Map(record.answers.map(answer => [answer.questionId, answer]));
  const followUps: ClarificationQuestion[] = [];
  const magicAnswer = answersById.get('magic.rule-hardness');
  if (
    magicAnswer
    && answerTextIncludes(magicAnswer, /轻量隐喻|metaphor|soft/i)
    && !existingQuestionIds.has('followup.magic.light-metaphor-boundary')
  ) {
    followUps.push(createFollowUpQuestion(
      'followup.magic.light-metaphor-boundary',
      'magic-system',
      '选择轻量隐喻后，能力爽点来自哪里？主角的能力明确不能做什么？',
      '轻量隐喻需要靠场景限制、失败代价和角色选择保持边界。',
      [
        '爽点来自把复杂魔法问题拆成可验证步骤，但不能凭空创造资源。',
        '爽点来自调试事故后的聪明补救，但不能越过本地魔法材料和伦理限制。'
      ]
    ));
  }

  const threatAnswer = answersById.get('threat.first-symptom');
  if (
    threatAnswer
    && answerTextIncludes(threatAnswer, /文明|威胁|寂静|异常|旧日志|第三次/)
    && !existingQuestionIds.has('followup.threat.first-volume-corner')
  ) {
    followUps.push(createFollowUpQuestion(
      'followup.threat.first-volume-corner',
      'threat',
      '第一卷只看到第三次寂静的哪一角？角色会如何误判它？',
      '文明级威胁需要先给局部回报，避免开局就压垮轻松冒险。',
      [
        '第一卷只看到旧日志和民生法器故障，角色先误判成地方贵族隐瞒事故。',
        '第一卷只看到遗迹防护脚本自启，角色先以为是古代遗迹单点异常。'
      ]
    ));
  }

  const romanceAnswer = record.answers.find(answer =>
    answer.questionId.includes('romance')
    || answer.questionId.includes('relationship')
  );
  if (
    romanceAnswer
    && answerTextIncludes(romanceAnswer, /慢热|搭档|信任|关系|感情/)
    && !existingQuestionIds.has('followup.romance.starting-tension')
  ) {
    followUps.push(createFollowUpQuestion(
      'followup.romance.starting-tension',
      'relationship',
      '慢热关系开局的张力和边界是什么？哪件事会让双方开始信任？',
      '慢热感情需要有功能和阻力，不能只作为奖励关系。',
      [
        '双方先因任务合作互不服气，第一次信任来自共同承担一次法术事故后果。',
        '对方能指出晏无忽略的人情和制度代价，但不会立刻站到主角一边。'
      ]
    ));
  }

  if (
    romanceAnswer
    && answerTextIncludes(romanceAnswer, /慢热|搭档|信任|关系|感情|互相|对立/)
    && !existingQuestionIds.has('followup.romance.relationship-arc')
  ) {
    followUps.push(createFollowUpQuestion(
      'followup.romance.relationship-arc',
      'relationship',
      '这段关系的信任、距离、冲突、脆弱和修复节点分别会怎样变化？',
      '慢热关系需要可追踪的变化证据，写作任务和正文才能知道每一场互动推进了什么。',
      [
        '第一卷从互相试探到能共同承担一次事故后果；信任上升，但立场冲突仍未解决。',
        '双方保持距离，因为各自害怕失去署名权和行动自由；第一次修复来自一场失败后的坦白。'
      ]
    ));
  }

  return followUps;
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
  result: Pick<InterviewStoryResult, 'projectRoot' | 'jsonPath' | 'record' | 'authorProfile'>
): string => [
  `/storyspec-specify ${result.record.premise}`,
  '',
  `请先读取 \`${relativePath(result.projectRoot, result.jsonPath)}\`，并按澄清记录继续创作。`,
  ...(result.authorProfile.exists
    ? [
      `可读取 \`${relativePath(result.projectRoot, result.authorProfile.path)}\` 作为作者长期偏好上下文。`,
      '作者画像只影响推荐、示例和风味参考，不得覆盖 clarifications.json 中当前故事的明确回答，也不得写入正典。'
    ]
    : ['当前没有作者画像；首次使用只能做可跳过偏好采样，不能假装已有历史画像可回填。']),
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
  const authorProfile = await loadAuthorProfile({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem
  });
  const prepared = await prepareInterviewQuestions({
    premise,
    maxQuestions: input.maxQuestions
  });
  const roundQuestions = [
    ...buildFollowUpQuestions(state.existingRecord),
    ...filterQuestionsForCurrentRound(prepared.questions, state.existingRecord)
  ].slice(0, input.maxQuestions ?? prepared.questions.length);
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
    authorProfile: authorProfile.summary,
    written: input.write ?? true,
    updatedAnswerIds,
    reusedAnswerIds
  };
  const handoffPrompt = renderInterviewHandoffPrompt({
    projectRoot: resultBase.projectRoot,
    jsonPath: resultBase.jsonPath,
    record,
    authorProfile: resultBase.authorProfile
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
  `作者画像：${result.authorProfile.exists ? `${result.authorProfile.activeHints.length} 条可用提示` : '未建立，可选采样'}`,
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
