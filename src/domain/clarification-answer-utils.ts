const DEFERRED_ANSWER_TEXTS = new Set([
  '不知道',
  '暂不知道',
  '不确定',
  '待定',
  '稍后决定',
  '稍后回答',
  '以后再说',
  '给我示例',
  '需要示例',
  '先看示例'
]);

export const isDeferredClarificationAnswer = (answer: unknown): boolean => {
  if (typeof answer === 'string') {
    return DEFERRED_ANSWER_TEXTS.has(answer.trim());
  }

  if (Array.isArray(answer)) {
    return answer.length > 0 && answer.every(isDeferredClarificationAnswer);
  }

  return false;
};

export const hasClarificationAnswerContent = (answer: unknown): boolean => {
  if (answer === undefined || answer === null) {
    return false;
  }

  if (typeof answer === 'string') {
    return answer.trim().length > 0;
  }

  if (Array.isArray(answer)) {
    return answer.some(hasClarificationAnswerContent);
  }

  return typeof answer === 'number' || typeof answer === 'boolean';
};

export const hasResolvedClarificationAnswer = (answer: unknown): boolean =>
  hasClarificationAnswerContent(answer) && !isDeferredClarificationAnswer(answer);

export const clarificationAnswerToText = (answer: unknown): string => {
  if (Array.isArray(answer)) {
    return answer.map(clarificationAnswerToText).join('\n');
  }

  if (answer === undefined || answer === null) {
    return '';
  }

  return String(answer);
};
