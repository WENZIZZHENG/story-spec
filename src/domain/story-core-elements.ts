import type {
  ClarificationAnswer,
  ClarificationQuestion
} from './clarification.js';
import {
  clarificationAnswerToText,
  hasClarificationAnswerContent,
  hasResolvedClarificationAnswer,
  isDeferredClarificationAnswer
} from './clarification-answer-utils.js';

export type StoryCoreElementId =
  | 'protagonist'
  | 'partner'
  | 'stage'
  | 'power'
  | 'factionConflict'
  | 'longThreat'
  | 'genrePromise'
  | 'growthRoute'
  | 'voice';

export type StoryCoreElementStatus =
  | 'missing'
  | 'suggested'
  | 'partial'
  | 'confirmed'
  | 'deferred';

export interface StoryCoreElementDefinition {
  id: StoryCoreElementId;
  label: string;
  description: string;
  planCritical: boolean;
}

export interface StoryCoreElementAssessment extends StoryCoreElementDefinition {
  status: StoryCoreElementStatus;
  questionIds: string[];
  confirmedAnswerIds: string[];
  suggestedAnswerIds: string[];
  deferredAnswerIds: string[];
  summary: string;
  nextPrompt?: string;
  qualityNotes: string[];
}

export interface EvaluateStoryCoreElementsInput {
  premise?: string;
  questions: ClarificationQuestion[];
  answers: ClarificationAnswer[];
}

interface ElementSignals {
  questionIds: string[];
  confirmedAnswerIds: string[];
  suggestedAnswerIds: string[];
  deferredAnswerIds: string[];
  confirmedTexts: string[];
  suggestedTexts: string[];
  deferredTexts: string[];
}

const ELEMENT_DEFINITIONS: readonly StoryCoreElementDefinition[] = [
  {
    id: 'protagonist',
    label: '主角',
    description: '身份、欲望、价值观、缺陷或误判。',
    planCritical: true
  },
  {
    id: 'partner',
    label: '核心伙伴',
    description: '重要同伴或关系线的功能、立场、与主角的张力。',
    planCritical: true
  },
  {
    id: 'stage',
    label: '第一舞台',
    description: '第一卷主要地点或社会空间，以及它如何呈现世界规则。',
    planCritical: true
  },
  {
    id: 'power',
    label: '能力体系',
    description: '能力用途、限制、代价、与世界本地规则的关系。',
    planCritical: true
  },
  {
    id: 'factionConflict',
    label: '势力与冲突',
    description: '压迫或阻碍来源，以及其合理性或利益逻辑。',
    planCritical: true
  },
  {
    id: 'longThreat',
    label: '长线威胁',
    description: '早期异常、揭示节奏和阶段性回报。',
    planCritical: true
  },
  {
    id: 'genrePromise',
    label: '类型体验',
    description: '轻松冒险、慢热感情、成人向边界、建设流边界等阅读承诺。',
    planCritical: false
  },
  {
    id: 'growthRoute',
    label: '成功路线',
    description: '主角如何阶段性获得资源、能力、信任、组织能力或影响力，以及每一步代价。',
    planCritical: false
  },
  {
    id: 'voice',
    label: '独特声音',
    description: '主角观察世界的方式、叙述语气、幽默、痛感、价值判断和明确不写的风格。',
    planCritical: false
  }
];

const ELEMENT_KEYWORDS: Record<StoryCoreElementId, readonly string[]> = {
  protagonist: ['protagonist', 'hero', 'main-character', 'main_character', '主角', '晏无', '欲望', '价值观', '误判', '缺陷'],
  partner: ['partner', 'companion', 'relationship', 'romance', 'ally', '伙伴', '同伴', '关系', '感情', '慢热'],
  stage: ['stage', 'setting', 'location', 'world', 'scene', '舞台', '地点', '学院', '边境', '城市', '社会空间'],
  power: ['power', 'magic', 'magic-system', 'ability', 'system', 'spell', '能力', '魔法', '法术', '施法', '金手指', '编程'],
  factionConflict: ['faction', 'conflict', 'force', 'politic', 'opposition', '势力', '冲突', '贵族', '学院', '垄断', '压迫', '阻碍'],
  longThreat: ['threat', 'civilization', 'silence', 'apocalypse', '危机', '威胁', '寂静', '异常', '文明', '灭世'],
  genrePromise: ['premise', 'genre', 'tone', 'style', 'adult', 'building', '类型', '题材', '风格', '轻松', '冒险', '成人', '建设流'],
  growthRoute: ['growth', 'route', 'success', 'progression', 'arc', '成长', '成功路线', '升级', '资源', '信任', '组织'],
  voice: ['voice', 'narration', 'pov', 'humor', '声音', '叙述', '语气', '幽默', '价值判断', '不写']
};

const DIRECT_TOPIC_ELEMENT_IDS: Record<string, StoryCoreElementId> = {
  protagonist: 'protagonist',
  hero: 'protagonist',
  partner: 'partner',
  companion: 'partner',
  relationship: 'partner',
  romance: 'partner',
  setting: 'stage',
  stage: 'stage',
  location: 'stage',
  world: 'stage',
  'magic-system': 'power',
  magic: 'power',
  power: 'power',
  ability: 'power',
  faction: 'factionConflict',
  conflict: 'factionConflict',
  threat: 'longThreat',
  civilization: 'longThreat',
  premise: 'genrePromise',
  genre: 'genrePromise',
  tone: 'genrePromise',
  growth: 'growthRoute',
  route: 'growthRoute',
  success: 'growthRoute',
  voice: 'voice',
  style: 'voice'
};

const PROTAGONIST_MATURITY_KEYWORDS = ['想要', '欲望', '目标', '价值观', '误判', '缺陷', '代价', '恐惧', '选择'];
const STAGE_PRESSURE_KEYWORDS = ['垄断', '债', '审查', '代价', '压迫', '利益', '资源', '法律', '禁令', '阶层', '冲突', '必须', '失败'];
const PARTNER_DEPTH_KEYWORDS = [
  '想要',
  '欲望',
  '目标',
  '恐惧',
  '怕',
  '误判',
  '质疑',
  '反驳',
  '挑战',
  '冲突',
  '立场',
  '价值观',
  '张力',
  '不信任',
  '署名权',
  '责任',
  '代价',
  '修复'
];

const statusText: Record<StoryCoreElementStatus, string> = {
  missing: '缺失',
  suggested: '候选待确认',
  partial: '部分确认',
  confirmed: '已确认',
  deferred: '稍后决定'
};

const normalize = (value: string): string => value.toLowerCase();

const includesAny = (text: string, keywords: readonly string[]): boolean =>
  keywords.some(keyword => text.includes(normalize(keyword)));

const matchElementIds = (question: ClarificationQuestion): StoryCoreElementId[] => {
  const strongSignals = normalize([question.id, question.topic].join(' '));
  const directMatches = ELEMENT_DEFINITIONS
    .filter(definition => includesAny(strongSignals, ELEMENT_KEYWORDS[definition.id]))
    .map(definition => definition.id);
  const directTopic = DIRECT_TOPIC_ELEMENT_IDS[normalize(question.topic)];
  if (directTopic) {
    addUnique(directMatches, directTopic);
  }

  if (directMatches.length > 0) {
    return directMatches;
  }

  const haystack = normalize([
    question.id,
    question.topic,
    question.question,
    question.whyItMatters
  ].join(' '));

  return ELEMENT_DEFINITIONS
    .filter(definition => includesAny(haystack, ELEMENT_KEYWORDS[definition.id]))
    .map(definition => definition.id);
};

const answerText = (answer: ClarificationAnswer): string =>
  clarificationAnswerToText(answer.answer).replace(/\s+/g, ' ').trim();

const addUnique = <T>(items: T[], item: T): void => {
  if (!items.includes(item)) {
    items.push(item);
  }
};

const emptySignals = (): ElementSignals => ({
  questionIds: [],
  confirmedAnswerIds: [],
  suggestedAnswerIds: [],
  deferredAnswerIds: [],
  confirmedTexts: [],
  suggestedTexts: [],
  deferredTexts: []
});

const createSignalMap = (): Map<StoryCoreElementId, ElementSignals> =>
  new Map(ELEMENT_DEFINITIONS.map(definition => [definition.id, emptySignals()]));

const primaryStatus = (
  definition: StoryCoreElementDefinition,
  signals: ElementSignals,
  qualityNotes: string[]
): StoryCoreElementStatus => {
  if (signals.confirmedTexts.length > 0) {
    if (qualityNotes.length > 0) {
      return 'partial';
    }

    if (
      definition.id === 'protagonist'
      && signals.confirmedTexts.length < 2
      && !signals.confirmedTexts.some(text => includesAny(normalize(text), PROTAGONIST_MATURITY_KEYWORDS))
    ) {
      return 'partial';
    }

    return 'confirmed';
  }

  if (signals.deferredTexts.length > 0) {
    return 'deferred';
  }

  if (signals.suggestedTexts.length > 0) {
    return 'suggested';
  }

  return 'missing';
};

const buildQualityNotes = (
  definition: StoryCoreElementDefinition,
  signals: ElementSignals
): string[] => {
  if (definition.id === 'partner' && signals.confirmedTexts.length > 0) {
    const text = normalize(signals.confirmedTexts.join(' '));
    if (!includesAny(text, PARTNER_DEPTH_KEYWORDS)) {
      return ['核心伙伴还偏功能位，缺少独立欲望、立场冲突或能挑战主角的张力。'];
    }

    return [];
  }

  if (definition.id !== 'stage' || signals.confirmedTexts.length === 0) {
    return [];
  }

  const text = normalize(signals.confirmedTexts.join(' '));
  if (includesAny(text, STAGE_PRESSURE_KEYWORDS)) {
    return [];
  }

  return ['第一舞台还缺少会改变角色行动的利益结构或代价，容易停留在百科式设定。'];
};

const firstText = (texts: string[]): string | undefined =>
  texts.find(text => text.length > 0);

const buildSummary = (
  definition: StoryCoreElementDefinition,
  status: StoryCoreElementStatus,
  signals: ElementSignals
): string => {
  const text = firstText(signals.confirmedTexts)
    ?? firstText(signals.suggestedTexts)
    ?? firstText(signals.deferredTexts);

  if (text) {
    return text.length > 80 ? `${text.slice(0, 77)}...` : text;
  }

  return `${definition.label}${statusText[status]}，需要继续共创。`;
};

const nextPromptFor = (definition: StoryCoreElementDefinition, status: StoryCoreElementStatus): string | undefined => {
  if (status === 'confirmed') {
    return undefined;
  }

  switch (definition.id) {
    case 'protagonist':
      return '继续确认主角的欲望、误判和成长代价。';
    case 'partner':
      return '继续确认核心伙伴的独立欲望、立场冲突，以及如何挑战主角。';
    case 'stage':
      return '继续确认第一舞台的利益结构、普通人压力和失败代价。';
    case 'power':
      return '继续确认能力用途、限制、代价和本地魔法规则的关系。';
    case 'factionConflict':
      return '继续确认第一卷势力冲突、阻碍逻辑和阶段胜利。';
    case 'longThreat':
      return '继续确认文明级威胁的早期异常、揭示节奏和阶段回报。';
    case 'genrePromise':
      return '继续确认类型体验和不写边界。';
    case 'growthRoute':
      return '继续确认主角如何获得资源、信任和影响力，以及每一步代价。';
    case 'voice':
      return '继续确认叙述声音、幽默感、价值判断和明确不写的风格。';
  }
};

export const getStoryCoreElementStatusText = (status: StoryCoreElementStatus): string =>
  statusText[status];

export const evaluateStoryCoreElements = (
  input: EvaluateStoryCoreElementsInput
): StoryCoreElementAssessment[] => {
  const signals = createSignalMap();
  const questionsById = new Map(input.questions.map(question => [question.id, question]));

  for (const question of input.questions) {
    for (const id of matchElementIds(question)) {
      const elementSignals = signals.get(id);
      if (elementSignals) {
        addUnique(elementSignals.questionIds, question.id);
      }
    }
  }

  for (const answer of input.answers) {
    const question = questionsById.get(answer.questionId);
    if (!question || !hasClarificationAnswerContent(answer.answer)) {
      continue;
    }

    const text = answerText(answer);
    for (const id of matchElementIds(question)) {
      const elementSignals = signals.get(id);
      if (!elementSignals) {
        continue;
      }

      if (answer.source === 'ai-suggested' && !answer.confirmed) {
        addUnique(elementSignals.suggestedAnswerIds, answer.questionId);
        addUnique(elementSignals.suggestedTexts, text);
      } else if (answer.confirmed && isDeferredClarificationAnswer(answer.answer)) {
        addUnique(elementSignals.deferredAnswerIds, answer.questionId);
        addUnique(elementSignals.deferredTexts, text);
      } else if (answer.confirmed && hasResolvedClarificationAnswer(answer.answer)) {
        addUnique(elementSignals.confirmedAnswerIds, answer.questionId);
        addUnique(elementSignals.confirmedTexts, text);
      }
    }
  }

  return ELEMENT_DEFINITIONS.map(definition => {
    const elementSignals = signals.get(definition.id) ?? emptySignals();
    const qualityNotes = buildQualityNotes(definition, elementSignals);
    const status = primaryStatus(definition, elementSignals, qualityNotes);

    return {
      ...definition,
      status,
      questionIds: elementSignals.questionIds,
      confirmedAnswerIds: elementSignals.confirmedAnswerIds,
      suggestedAnswerIds: elementSignals.suggestedAnswerIds,
      deferredAnswerIds: elementSignals.deferredAnswerIds,
      summary: buildSummary(definition, status, elementSignals),
      nextPrompt: nextPromptFor(definition, status),
      qualityNotes
    };
  });
};

export const getPlanBlockingCoreElements = (
  elements: readonly StoryCoreElementAssessment[]
): StoryCoreElementAssessment[] =>
  elements.filter(element =>
    element.planCritical
    && element.status !== 'confirmed'
  );

export const summarizeCoreElementGaps = (
  elements: readonly StoryCoreElementAssessment[],
  limit = 3
): string[] =>
  getPlanBlockingCoreElements(elements)
    .map(element => element.nextPrompt ?? `继续确认${element.label}。`)
    .slice(0, limit);
