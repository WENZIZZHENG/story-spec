import yaml from 'js-yaml';
import type {
  ClarificationAnswer,
  ClarificationAnswerSource,
  ClarificationDependency,
  ClarificationOption,
  ClarificationQuestion,
  ClarificationQuestionType,
  CreativeDecision
} from './clarification.js';
import {
  clarificationAnswerToText,
  hasClarificationAnswerContent,
  hasResolvedClarificationAnswer
} from './clarification-answer-utils.js';

export type ClarificationIssueSeverity = 'error' | 'warning' | 'info';

export type ClarificationIssueCode =
  | 'INVALID_CLARIFICATION_DOCUMENT'
  | 'INVALID_CLARIFICATION_QUESTION'
  | 'MISSING_CLARIFICATION_QUESTION_FIELD'
  | 'INVALID_CLARIFICATION_QUESTION_TYPE'
  | 'INVALID_CLARIFICATION_OPTION'
  | 'INVALID_CLARIFICATION_DEPENDENCY'
  | 'INVALID_CLARIFICATION_ANSWER'
  | 'MISSING_CLARIFICATION_ANSWER_FIELD'
  | 'INVALID_CLARIFICATION_ANSWER_SOURCE'
  | 'INVALID_CLARIFICATION_ANSWER_CONFIDENCE'
  | 'MISSING_REQUIRED_CLARIFICATION_ANSWER'
  | 'UNKNOWN_CLARIFICATION_ANSWER_QUESTION'
  | 'MISSING_DECISION_SOURCE_ANSWER'
  | 'UNCONFIRMED_AI_SUGGESTION_AS_DECISION';

export interface ClarificationIssue {
  severity: ClarificationIssueSeverity;
  code: ClarificationIssueCode;
  path: string;
  message: string;
}

export interface ParsedClarificationQuestionSet {
  questions: ClarificationQuestion[];
  issues: ClarificationIssue[];
}

export interface ParsedClarificationAnswerSet {
  answers: ClarificationAnswer[];
  issues: ClarificationIssue[];
}

export interface ClarificationSession {
  questions: ClarificationQuestion[];
  answers: ClarificationAnswer[];
}

const QUESTION_TYPES = new Set<ClarificationQuestionType>([
  'text',
  'textarea',
  'single-choice',
  'multi-choice',
  'scale',
  'confirm'
]);

const ANSWER_SOURCES = new Set<ClarificationAnswerSource>([
  'user-explicit',
  'ai-suggested',
  'imported',
  'default'
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(isNonEmptyString).map(item => item.trim())
    : [];

const issue = (
  code: ClarificationIssueCode,
  path: string,
  message: string,
  severity: ClarificationIssueSeverity = 'warning'
): ClarificationIssue => ({
  code,
  path,
  message,
  severity
});

const parseYamlOrJson = (content: string): unknown => yaml.load(content);

const readItems = (document: unknown, field: 'questions' | 'answers'): unknown[] => {
  if (!isRecord(document)) {
    return [];
  }

  return Array.isArray(document[field]) ? document[field] : [];
};

const normalizeDate = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return isNonEmptyString(value) ? value.trim() : '';
};

const readRequiredString = (
  record: Record<string, unknown>,
  field: string,
  basePath: string,
  issues: ClarificationIssue[],
  code: ClarificationIssueCode
): string => {
  const value = record[field];
  if (!isNonEmptyString(value)) {
    issues.push(issue(code, `${basePath}.${field}`, `缺少 ${field}`));
    return '';
  }

  return value.trim();
};

const parseOptions = (
  value: unknown,
  basePath: string,
  issues: ClarificationIssue[]
): ClarificationOption[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    issues.push(issue('INVALID_CLARIFICATION_OPTION', `${basePath}.options`, 'options 必须是数组'));
    return [];
  }

  return value.flatMap((option, index) => {
    const optionPath = `${basePath}.options[${index}]`;
    if (!isRecord(option)) {
      issues.push(issue('INVALID_CLARIFICATION_OPTION', optionPath, 'ClarificationOption 必须是对象'));
      return [];
    }

    const value = readRequiredString(option, 'value', optionPath, issues, 'INVALID_CLARIFICATION_OPTION');
    const label = readRequiredString(option, 'label', optionPath, issues, 'INVALID_CLARIFICATION_OPTION');
    if (!value || !label) {
      return [];
    }

    return [{
      value,
      label,
      description: isNonEmptyString(option.description) ? option.description.trim() : undefined
    }];
  });
};

const parseDependsOn = (
  value: unknown,
  basePath: string,
  issues: ClarificationIssue[]
): ClarificationDependency[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    issues.push(issue('INVALID_CLARIFICATION_DEPENDENCY', `${basePath}.dependsOn`, 'dependsOn 必须是数组'));
    return [];
  }

  return value.flatMap((dependency, index) => {
    const dependencyPath = `${basePath}.dependsOn[${index}]`;
    if (!isRecord(dependency)) {
      issues.push(issue('INVALID_CLARIFICATION_DEPENDENCY', dependencyPath, 'ClarificationDependency 必须是对象'));
      return [];
    }

    const questionId = readRequiredString(
      dependency,
      'questionId',
      dependencyPath,
      issues,
      'INVALID_CLARIFICATION_DEPENDENCY'
    );
    if (!questionId) {
      return [];
    }

    return [{
      questionId,
      answerIncludes: isNonEmptyString(dependency.answerIncludes)
        ? dependency.answerIncludes.trim()
        : undefined,
      answerEquals: isNonEmptyString(dependency.answerEquals)
        ? dependency.answerEquals.trim()
        : undefined
    }];
  });
};

export const parseClarificationQuestionSet = (
  content: string,
  filePath: string
): ParsedClarificationQuestionSet => {
  let document: unknown;
  try {
    document = parseYamlOrJson(content);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      questions: [],
      issues: [issue('INVALID_CLARIFICATION_DOCUMENT', filePath, `澄清问题文档无法解析：${detail}`, 'error')]
    };
  }

  if (!isRecord(document)) {
    return {
      questions: [],
      issues: [issue('INVALID_CLARIFICATION_DOCUMENT', filePath, '澄清问题文档顶层必须是对象', 'error')]
    };
  }

  const questions: ClarificationQuestion[] = [];
  const issues: ClarificationIssue[] = [];
  readItems(document, 'questions').forEach((candidate, index) => {
    const basePath = `${filePath}#questions[${index}]`;
    if (!isRecord(candidate)) {
      issues.push(issue('INVALID_CLARIFICATION_QUESTION', basePath, 'ClarificationQuestion 必须是对象'));
      return;
    }

    const id = readRequiredString(candidate, 'id', basePath, issues, 'MISSING_CLARIFICATION_QUESTION_FIELD');
    const stage = readRequiredString(candidate, 'stage', basePath, issues, 'MISSING_CLARIFICATION_QUESTION_FIELD');
    const topic = readRequiredString(candidate, 'topic', basePath, issues, 'MISSING_CLARIFICATION_QUESTION_FIELD');
    const questionText = readRequiredString(candidate, 'question', basePath, issues, 'MISSING_CLARIFICATION_QUESTION_FIELD');
    const whyItMatters = readRequiredString(candidate, 'whyItMatters', basePath, issues, 'MISSING_CLARIFICATION_QUESTION_FIELD');
    const type = isNonEmptyString(candidate.type) ? candidate.type.trim() : '';
    if (!QUESTION_TYPES.has(type as ClarificationQuestionType)) {
      issues.push(issue('INVALID_CLARIFICATION_QUESTION_TYPE', `${basePath}.type`, `不支持的澄清问题类型：${type || 'empty'}`));
    }

    if (!id || !stage || !topic || !questionText || !whyItMatters || !QUESTION_TYPES.has(type as ClarificationQuestionType)) {
      return;
    }

    questions.push({
      id,
      stage,
      topic,
      question: questionText,
      whyItMatters,
      type: type as ClarificationQuestionType,
      required: candidate.required === true,
      options: parseOptions(candidate.options, basePath, issues),
      exampleAnswers: toStringArray(candidate.exampleAnswers),
      dependsOn: parseDependsOn(candidate.dependsOn, basePath, issues)
    });
  });

  return { questions, issues };
};

export const parseClarificationAnswerSet = (
  content: string,
  filePath: string
): ParsedClarificationAnswerSet => {
  let document: unknown;
  try {
    document = parseYamlOrJson(content);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      answers: [],
      issues: [issue('INVALID_CLARIFICATION_DOCUMENT', filePath, `澄清答案文档无法解析：${detail}`, 'error')]
    };
  }

  if (!isRecord(document)) {
    return {
      answers: [],
      issues: [issue('INVALID_CLARIFICATION_DOCUMENT', filePath, '澄清答案文档顶层必须是对象', 'error')]
    };
  }

  const answers: ClarificationAnswer[] = [];
  const issues: ClarificationIssue[] = [];
  readItems(document, 'answers').forEach((candidate, index) => {
    const basePath = `${filePath}#answers[${index}]`;
    if (!isRecord(candidate)) {
      issues.push(issue('INVALID_CLARIFICATION_ANSWER', basePath, 'ClarificationAnswer 必须是对象'));
      return;
    }

    const questionId = readRequiredString(candidate, 'questionId', basePath, issues, 'MISSING_CLARIFICATION_ANSWER_FIELD');
    if (!hasClarificationAnswerContent(candidate.answer)) {
      issues.push(issue('MISSING_CLARIFICATION_ANSWER_FIELD', `${basePath}.answer`, 'ClarificationAnswer 缺少 answer'));
    }

    const source = isNonEmptyString(candidate.source) ? candidate.source.trim() : '';
    if (!ANSWER_SOURCES.has(source as ClarificationAnswerSource)) {
      issues.push(issue('INVALID_CLARIFICATION_ANSWER_SOURCE', `${basePath}.source`, `不支持的答案来源：${source || 'empty'}`));
    }

    const confidence = Number(candidate.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      issues.push(issue('INVALID_CLARIFICATION_ANSWER_CONFIDENCE', `${basePath}.confidence`, 'confidence 必须在 0 到 1 之间'));
    }

    const createdAt = normalizeDate(candidate.createdAt);
    const updatedAt = normalizeDate(candidate.updatedAt);
    if (!createdAt) {
      issues.push(issue('MISSING_CLARIFICATION_ANSWER_FIELD', `${basePath}.createdAt`, 'ClarificationAnswer 缺少 createdAt'));
    }
    if (!updatedAt) {
      issues.push(issue('MISSING_CLARIFICATION_ANSWER_FIELD', `${basePath}.updatedAt`, 'ClarificationAnswer 缺少 updatedAt'));
    }

    if (!questionId || !hasClarificationAnswerContent(candidate.answer) || !ANSWER_SOURCES.has(source as ClarificationAnswerSource) || !Number.isFinite(confidence) || confidence < 0 || confidence > 1 || !createdAt || !updatedAt) {
      return;
    }

    answers.push({
      questionId,
      answer: candidate.answer,
      source: source as ClarificationAnswerSource,
      confidence,
      confirmed: candidate.confirmed === true,
      createdAt,
      updatedAt
    });
  });

  return { answers, issues };
};

const findAnswer = (
  answers: ClarificationAnswer[],
  questionId: string
): ClarificationAnswer | undefined =>
  answers.find(answer => answer.questionId === questionId && hasResolvedClarificationAnswer(answer.answer));

const isDependencySatisfied = (
  dependency: ClarificationDependency,
  answers: ClarificationAnswer[]
): boolean => {
  const answer = findAnswer(answers, dependency.questionId);
  if (!answer) {
    return false;
  }

  const text = clarificationAnswerToText(answer.answer);
  if (dependency.answerIncludes && !text.includes(dependency.answerIncludes)) {
    return false;
  }

  if (dependency.answerEquals && text.trim() !== dependency.answerEquals) {
    return false;
  }

  return true;
};

const isQuestionActive = (
  question: ClarificationQuestion,
  answers: ClarificationAnswer[]
): boolean =>
  question.dependsOn.length === 0 || question.dependsOn.every(dependency => isDependencySatisfied(dependency, answers));

export const validateClarificationSession = (
  session: ClarificationSession
): ClarificationIssue[] => {
  const issues: ClarificationIssue[] = [];
  const questionIds = new Set(session.questions.map(question => question.id));

  for (const answer of session.answers) {
    if (!questionIds.has(answer.questionId)) {
      issues.push(issue(
        'UNKNOWN_CLARIFICATION_ANSWER_QUESTION',
        `answers[${answer.questionId}]`,
        `答案引用了不存在的澄清问题：${answer.questionId}`,
        'info'
      ));
    }
  }

  for (const question of session.questions) {
    if (!question.required || !isQuestionActive(question, session.answers)) {
      continue;
    }

    const answer = findAnswer(session.answers, question.id);
    if (!answer || !answer.confirmed) {
      issues.push(issue(
        'MISSING_REQUIRED_CLARIFICATION_ANSWER',
        `questions[${question.id}]`,
        `必答澄清问题尚未获得用户确认：${question.question}`
      ));
    }
  }

  return issues;
};

export const validateCreativeDecisions = (
  decisions: CreativeDecision[],
  answers: ClarificationAnswer[]
): ClarificationIssue[] => {
  const issues: ClarificationIssue[] = [];
  const answersByQuestionId = new Map(answers.map(answer => [answer.questionId, answer]));

  for (const decision of decisions) {
    for (const questionId of decision.sourceAnswers) {
      const answer = answersByQuestionId.get(questionId);
      if (!answer) {
        issues.push(issue(
          'MISSING_DECISION_SOURCE_ANSWER',
          `decisions[${decision.id}].sourceAnswers[${questionId}]`,
          `创作决策引用了不存在的澄清答案：${questionId}`,
          'warning'
        ));
        continue;
      }

      if (answer.source === 'ai-suggested' && !answer.confirmed) {
        issues.push(issue(
          'UNCONFIRMED_AI_SUGGESTION_AS_DECISION',
          `decisions[${decision.id}].sourceAnswers[${questionId}]`,
          'AI 建议尚未被用户确认，不能作为进入正典的创作决策',
          'error'
        ));
      }
    }
  }

  return issues;
};
