import type { ClarificationAnswer, ClarificationQuestion } from '../domain/clarification.js';
import { clarificationAnswerToText, isDeferredClarificationAnswer } from '../domain/clarification-answer-utils.js';
import type { StoryMaturityStage } from '../domain/story-stage.js';
import {
  normalizeCoCreationEntrypointId,
  type StoryCoCreationEntrypointId
} from '../domain/co-creation-workbench.js';
import type { ClarificationRecord } from './manage-clarifications.js';

export interface DeferredDecisionItem {
  questionId: string;
  question: string;
  topic: string;
  answer: string;
  reason: string;
  trigger: string;
  resumeFocus?: StoryCoCreationEntrypointId;
  resumeCommand: string;
  evidencePath: string;
  createdAt: string;
  updatedAt: string;
}

export interface DecisionLogSummary {
  deferredItems: DeferredDecisionItem[];
  confirmedCount: number;
  pendingAiSuggestionCount: number;
}

const TOPIC_FOCUS_MAP: Record<string, StoryCoCreationEntrypointId> = {
  protagonist: 'protagonist',
  hero: 'protagonist',
  partner: 'partner',
  companion: 'partner',
  relationship: 'partner',
  romance: 'partner',
  world: 'world',
  setting: 'world',
  stage: 'stage',
  location: 'stage',
  'magic-system': 'power',
  magic: 'power',
  power: 'power',
  ability: 'power',
  faction: 'faction',
  conflict: 'conflict',
  threat: 'conflict',
  civilization: 'conflict',
  scene: 'scene',
  ending: 'ending',
  branch: 'branch'
};

const answerText = (answer: ClarificationAnswer): string =>
  clarificationAnswerToText(answer.answer).replace(/\s+/g, ' ').trim();

const questionMapFor = (questions: ClarificationQuestion[]): Map<string, ClarificationQuestion> =>
  new Map(questions.map(question => [question.id, question]));

export const focusForDeferredQuestion = (
  question: ClarificationQuestion | undefined
): StoryCoCreationEntrypointId | undefined => {
  if (!question) {
    return undefined;
  }

  const topicFocus = TOPIC_FOCUS_MAP[question.topic.trim().toLowerCase()];
  if (topicFocus) {
    return topicFocus;
  }

  const idParts = question.id.split(/[.:_-]/);
  for (const part of idParts) {
    const normalized = normalizeCoCreationEntrypointId(part);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
};

const triggerForStage = (stage: StoryMaturityStage | undefined, question: ClarificationQuestion | undefined): string => {
  const topic = question?.topic ?? '该主题';
  if (stage === 'specified' || stage === 'planned' || stage === 'tasked') {
    return `进入 plan / tasks 前重新确认 ${topic}`;
  }

  if (stage === 'drafting' || stage === 'revising') {
    return `写到相关场景或回修 ${topic} 时重新确认`;
  }

  return `下一轮共创 ${topic} 时重新确认`;
};

const resumeCommandFor = (
  story: string,
  focus: StoryCoCreationEntrypointId | undefined
): string => focus
  ? `storyspec interview ${story} --focus ${focus}`
  : `storyspec interview ${story}`;

export const summarizeDecisionLog = (
  record: ClarificationRecord | undefined,
  story: string,
  stage?: StoryMaturityStage
): DecisionLogSummary => {
  if (!record) {
    return {
      deferredItems: [],
      confirmedCount: 0,
      pendingAiSuggestionCount: 0
    };
  }

  const questionsById = questionMapFor(record.questions);
  const deferredItems = record.answers
    .filter(answer => answer.confirmed && isDeferredClarificationAnswer(answer.answer))
    .map(answer => {
      const question = questionsById.get(answer.questionId);
      const focus = focusForDeferredQuestion(question);

      return {
        questionId: answer.questionId,
        question: question?.question ?? answer.questionId,
        topic: question?.topic ?? 'unknown',
        answer: answerText(answer),
        reason: question?.whyItMatters ?? '这个选择会影响后续创作，需要在相关上下文中重新确认。',
        trigger: triggerForStage(stage, question),
        resumeFocus: focus,
        resumeCommand: resumeCommandFor(story, focus),
        evidencePath: `clarifications.json#answers.${answer.questionId}`,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt
      };
    });
  const confirmedCount = record.answers.filter(answer =>
    answer.confirmed
    && !isDeferredClarificationAnswer(answer.answer)
    && answer.source !== 'ai-suggested'
  ).length;
  const pendingAiSuggestionCount = record.answers.filter(answer =>
    answer.source === 'ai-suggested'
    && !answer.confirmed
  ).length;

  return {
    deferredItems,
    confirmedCount,
    pendingAiSuggestionCount
  };
};

export const renderDeferredDecisionItems = (
  items: DeferredDecisionItem[],
  fallback = '- 暂无。'
): string[] => items.length > 0
  ? items.map(item => [
    `- ${item.questionId}：${item.question}`,
    `  - 当初选择：${item.answer}`,
    `  - 决策理由：${item.reason}`,
    `  - 回流条件：${item.trigger}`,
    `  - 继续命令：${item.resumeCommand}`,
    `  - 证据：${item.evidencePath}`
  ].join('\n'))
  : [fallback];
