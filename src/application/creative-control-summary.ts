import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import type { ClarificationRecord } from './manage-clarifications.js';

export interface CreativeControlSummary {
  hasClarifications: boolean;
  recordPath?: string;
  markdownPath?: string;
  confirmedDecisions: number;
  pendingDecisions: number;
  unconfirmedAiSuggestions: number;
  pendingQuestions: string[];
  nextQuestions: string[];
  cannotFinalize: string[];
  mustAskNext: string[];
}

export interface SummarizeCreativeControlInput {
  projectRoot: string;
  storyPath: string;
  fileSystem: ProjectFileSystem;
  fallbackNextQuestions?: string[];
}

const hasAnswerContent = (answer: unknown): boolean => {
  if (typeof answer === 'string') {
    return answer.trim().length > 0;
  }

  if (Array.isArray(answer)) {
    return answer.some(hasAnswerContent);
  }

  return typeof answer === 'number' || typeof answer === 'boolean';
};

const hasConfirmedAnswer = (record: ClarificationRecord, questionId: string): boolean =>
  record.answers.some(answer =>
    answer.questionId === questionId
    && answer.confirmed
    && hasAnswerContent(answer.answer)
  );

const emptySummary = (
  hasClarifications: boolean,
  fallbackNextQuestions: string[],
  paths: Pick<CreativeControlSummary, 'recordPath' | 'markdownPath'> = {}
): CreativeControlSummary => ({
  hasClarifications,
  ...paths,
  confirmedDecisions: 0,
  pendingDecisions: 0,
  unconfirmedAiSuggestions: 0,
  pendingQuestions: [],
  nextQuestions: fallbackNextQuestions.slice(0, 3),
  cannotFinalize: hasClarifications
    ? ['澄清记录只有 Markdown 或暂不可解析，写入正典前需要人工确认来源与确认状态。']
    : ['尚未建立澄清记录，不要擅自定稿主角、舞台、关系线或高影响设定。'],
  mustAskNext: fallbackNextQuestions.slice(0, 3)
});

const summarizeRecord = (
  record: ClarificationRecord,
  fallbackNextQuestions: string[],
  paths: Pick<CreativeControlSummary, 'recordPath' | 'markdownPath'>
): CreativeControlSummary => {
  const confirmedDecisions = record.answers.filter(answer =>
    answer.confirmed && hasAnswerContent(answer.answer)
  ).length;
  const unconfirmedAiAnswers = record.answers.filter(answer =>
    answer.source === 'ai-suggested' && !answer.confirmed && hasAnswerContent(answer.answer)
  );
  const pendingRequiredQuestions = record.questions.filter(question =>
    question.required && !hasConfirmedAnswer(record, question.id)
  );
  const pendingQuestionIds = new Set([
    ...pendingRequiredQuestions.map(question => question.id),
    ...unconfirmedAiAnswers.map(answer => answer.questionId)
  ]);
  const pendingQuestions = pendingRequiredQuestions.map(question => `${question.id}：${question.question}`);
  const nextQuestions = pendingRequiredQuestions.length > 0
    ? pendingRequiredQuestions.map(question => question.question).slice(0, 3)
    : fallbackNextQuestions.slice(0, 3);
  const cannotFinalize = [
    ...pendingRequiredQuestions.map(question => `未确认：${question.question}`),
    ...unconfirmedAiAnswers.map(answer => `AI 建议待确认：${answer.questionId}`)
  ].slice(0, 6);

  return {
    hasClarifications: true,
    ...paths,
    confirmedDecisions,
    pendingDecisions: pendingQuestionIds.size,
    unconfirmedAiSuggestions: unconfirmedAiAnswers.length,
    pendingQuestions,
    nextQuestions,
    cannotFinalize,
    mustAskNext: nextQuestions
  };
};

export const summarizeCreativeControl = async (
  input: SummarizeCreativeControlInput
): Promise<CreativeControlSummary> => {
  const recordPath = path.join(input.storyPath, 'clarifications.json');
  const markdownPath = path.join(input.storyPath, 'clarifications.md');
  const [hasRecord, hasMarkdown] = await Promise.all([
    input.fileSystem.pathExists(recordPath),
    input.fileSystem.pathExists(markdownPath)
  ]);
  const paths = {
    ...(hasRecord ? { recordPath } : {}),
    ...(hasMarkdown ? { markdownPath } : {})
  };

  if (!hasRecord) {
    return emptySummary(hasMarkdown, input.fallbackNextQuestions ?? [], paths);
  }

  try {
    const record = await input.fileSystem.readJson<ClarificationRecord>(recordPath);
    return summarizeRecord(record, input.fallbackNextQuestions ?? [], paths);
  } catch {
    return emptySummary(true, input.fallbackNextQuestions ?? [], paths);
  }
};
