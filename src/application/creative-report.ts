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
  getStoryCoreElementSourceLabel,
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
import { loadAuthorProfile } from './manage-author-profile.js';
import type { AuthorProfileSummary } from '../domain/author-profile.js';
import {
  summarizeActiveBranches,
  type ActiveBranchSummary
} from './manage-branches.js';
import {
  summarizeCreationEcho,
  type CreationEchoSummary
} from './creation-echo.js';
import {
  renderDeferredDecisionItems,
  summarizeDecisionLog,
  type DecisionLogSummary
} from './decision-log.js';

export interface CreativeReportInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
}

export interface CreativeReportAnswer {
  questionId: string;
  answer: string;
  source: ClarificationAnswer['source'];
  sourceLabel: string;
}

export interface CreativeReportQuestion {
  questionId: string;
  question: string;
  sourceLabel: string;
}

export interface CreativeReportStorySkeleton {
  summary: string;
  created: string[];
  pendingSoul: string[];
}

export interface CreativeReportFunPrompt {
  label: string;
  prompt: string;
  command: string;
}

export type CreativeReportDigestStatus =
  | 'confirmed'
  | 'candidate'
  | 'missing'
  | 'needs-confirmation';

export interface CreativeReportDigestText {
  status: CreativeReportDigestStatus;
  text: string;
  evidence: string[];
}

export interface CreativeReportDigestAct {
  act: 'setup' | 'confrontation' | 'resolution';
  label: string;
  chapters: string;
  status: CreativeReportDigestStatus;
  summary: string;
  evidence: string[];
}

export interface CreativeReportChapterRhythm {
  chapter: number;
  status: CreativeReportDigestStatus;
  rhythm: string;
  function: string;
  emotionalBeat: string;
  plotTurn: string;
  evidence: string[];
}

export interface CreativeReportCharacterArc {
  character: string;
  status: CreativeReportDigestStatus;
  start: string;
  turn: string;
  end: string;
  evidence: string[];
  nextConfirmation?: string;
}

export interface CreativeReportPlotCurve {
  chapterRange: string;
  status: CreativeReportDigestStatus;
  tension: string;
  payoff: string;
  evidence: string[];
}

export interface CreativeReportRelationshipOverview {
  participants: string[];
  status: CreativeReportDigestStatus;
  dynamic: string;
  conflict: string;
  evidence: string[];
  nextConfirmation?: string;
}

export interface CreativeReportVolumePlanDigest {
  available: boolean;
  sourcePath?: string;
  volume: number;
  oneSentenceGoal: CreativeReportDigestText;
  threeActSummary: CreativeReportDigestAct[];
  chapterRhythm: CreativeReportChapterRhythm[];
  characterArcs: CreativeReportCharacterArc[];
  plotCurve: CreativeReportPlotCurve[];
  relationships: CreativeReportRelationshipOverview[];
  nextActions: string[];
}

export interface CreativeReportResult {
  projectRoot: string;
  story: string;
  storyPath: string;
  hasClarifications: boolean;
  authorProfile: AuthorProfileSummary;
  confirmed: CreativeReportAnswer[];
  pendingQuestions: CreativeReportQuestion[];
  aiSuggestions: CreativeReportAnswer[];
  coreElements: StoryCoreElementAssessment[];
  storySkeleton: CreativeReportStorySkeleton;
  creationEcho: CreationEchoSummary;
  decisionLog: DecisionLogSummary;
  funPrompts: CreativeReportFunPrompt[];
  activeBranches: ActiveBranchSummary[];
  volumePlanDigest: CreativeReportVolumePlanDigest;
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

const compact = (value: string): string => value.replace(/\s+/g, ' ').trim();

const uniqueTexts = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const text = compact(value);
    if (!text) {
      continue;
    }

    const key = text.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(text);
  }

  return result;
};

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
  const activeBranchAction = result.activeBranches.length > 0
    ? `比较 what-if：${result.activeBranches[0].compareCommand}`
    : undefined;
  const deferredAction = result.decisionLog.deferredItems[0]?.resumeCommand;

  if (!result.hasClarifications) {
    actions.push(`storyspec interview ${result.story}`);
    if (activeBranchAction) {
      actions.push(activeBranchAction);
    }
    actions.push(`storyspec next ${result.story}`);
    return actions;
  }

  if (deferredAction) {
    actions.push(deferredAction);
  }

  if (result.pendingQuestions.length > 0 || result.aiSuggestions.length > 0) {
    actions.push(`storyspec interview ${result.story}`);
  }

  actions.push(...result.funPrompts.slice(0, 2).map(item =>
    `先确认${item.label}：运行 ${item.command}，或直接回答“${item.prompt}”`
  ));

  if (result.activeBranches.length > 0) {
    actions.push(activeBranchAction!);
  }

  if (result.driftIssues.length > 0) {
    actions.push('storyspec review --panel continuity');
  }

  actions.push(`storyspec preview specify ${result.story}`);
  actions.push('storyspec validate');

  return [...new Set(actions)].slice(0, 4);
};

const skeletonLabelByElementId = (id: StoryCoreElementAssessment['id']): string => {
  switch (id) {
    case 'protagonist':
      return '主角/价值观';
    case 'partner':
      return '核心伙伴';
    case 'stage':
      return '世界问题';
    case 'power':
      return '能力风味';
    case 'factionConflict':
      return '势力冲突';
    case 'longThreat':
      return '长线威胁';
    case 'genrePromise':
      return '阅读承诺';
    case 'growthRoute':
      return '成功路线';
    case 'voice':
      return '作品声音';
  }
};

const buildStorySkeleton = (
  record: ClarificationRecord | undefined,
  coreElements: StoryCoreElementAssessment[],
  confirmed: CreativeReportAnswer[]
): CreativeReportStorySkeleton => {
  const created = uniqueTexts(coreElements
    .filter(element => element.status === 'confirmed' || element.status === 'partial')
    .map(element => `${skeletonLabelByElementId(element.id)}：${element.summary}`));
  const pendingSoul = uniqueTexts(coreElements
    .filter(element => element.status === 'missing' || element.status === 'partial' || element.status === 'deferred')
    .slice(0, 5)
    .map(element => `${element.label}：${element.nextPrompt ?? '仍待共创。'}`));
  const summaryParts = uniqueTexts([
    record?.premise ?? '',
    ...coreElements
      .filter(element => element.status === 'confirmed' || element.status === 'partial')
      .map(element => element.summary),
    ...confirmed.map(item => item.answer)
  ]).join('；');
  const planCriticalConfirmedCount = coreElements.filter(element =>
    element.planCritical && (element.status === 'confirmed' || element.status === 'partial')
  ).length;
  const planCriticalTotal = coreElements.filter(element => element.planCritical).length;
  const maturityNote = planCriticalConfirmedCount === 0
    ? '目前还在聚拢灵感，先补主角、舞台和第一轮冲突最划算。'
    : planCriticalConfirmedCount >= planCriticalTotal
      ? '核心骨架已经成形，可以进入规格、计划和写作。'
      : '核心骨架已经长出大半，只差几块关键部件。';

  return {
    summary: summaryParts || '这部小说的灵魂仍待共创；目前只有项目框架或零散线索。',
    created: created.length > 0 ? created : [maturityNote],
    pendingSoul
  };
};

const buildFunPrompts = (
  story: string,
  coreElements: StoryCoreElementAssessment[]
): CreativeReportFunPrompt[] => {
  const command = `storyspec interview ${story}`;
  const promptsById: Partial<Record<StoryCoreElementAssessment['id'], string>> = {
    partner: '伙伴会怎样挑战主角？',
    stage: '第一舞台会怎样压迫或诱惑主角？',
    power: '能力限制会制造什么爽点？',
    longThreat: '第三次寂静第一卷只露出哪一角？',
    growthRoute: '主角每一步成功要付出什么代价？',
    voice: '这本书应避免变成哪种俗套作品？',
    factionConflict: '第一卷的势力冲突为什么合理？'
  };

  return coreElements
    .filter(element => element.status !== 'confirmed')
    .filter((element, index, list) =>
      list.findIndex(item => item.id === element.id) === index
    )
    .flatMap(element => {
      const prompt = promptsById[element.id];
      if (!prompt) {
        return [];
      }

      return [{
        label: element.label,
        prompt,
        command
      }];
    })
    .slice(0, 6);
};

const digestStatuses = new Set<CreativeReportDigestStatus>([
  'confirmed',
  'candidate',
  'missing',
  'needs-confirmation'
]);

const defaultActs: CreativeReportDigestAct[] = [
  {
    act: 'setup',
    label: '第一幕',
    chapters: '1-3',
    status: 'missing',
    summary: '资料不足',
    evidence: []
  },
  {
    act: 'confrontation',
    label: '第二幕',
    chapters: '4-9',
    status: 'missing',
    summary: '资料不足',
    evidence: []
  },
  {
    act: 'resolution',
    label: '第三幕',
    chapters: '10-12',
    status: 'missing',
    summary: '资料不足',
    evidence: []
  }
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const textValue = (value: unknown): string =>
  typeof value === 'string' ? compact(value) : '';

const statusValue = (
  value: unknown,
  fallback: CreativeReportDigestStatus
): CreativeReportDigestStatus =>
  typeof value === 'string' && digestStatuses.has(value as CreativeReportDigestStatus)
    ? value as CreativeReportDigestStatus
    : fallback;

const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? uniqueTexts(value.map(item => typeof item === 'string' ? item : ''))
    : [];

const slotStatus = (
  source: Record<string, unknown>,
  fallback: CreativeReportDigestStatus
): CreativeReportDigestStatus => {
  const explicit = statusValue(source.status, fallback);
  const hasText = Object.entries(source)
    .some(([key, value]) => key !== 'status' && key !== 'evidence' && textValue(value));

  return hasText ? explicit : 'missing';
};

const normalizeDigestText = (value: unknown): CreativeReportDigestText => {
  const source = isRecord(value) ? value : {};
  const text = textValue(source.text);

  return {
    status: text ? statusValue(source.status, 'needs-confirmation') : 'missing',
    text: text || '待确认',
    evidence: stringList(source.evidence)
  };
};

const normalizeDigestAct = (
  value: unknown,
  fallback: CreativeReportDigestAct
): CreativeReportDigestAct => {
  const source = isRecord(value) ? value : {};
  const summary = textValue(source.summary);

  return {
    act: fallback.act,
    label: textValue(source.label) || fallback.label,
    chapters: textValue(source.chapters) || fallback.chapters,
    status: summary ? statusValue(source.status, 'needs-confirmation') : 'missing',
    summary: summary || '资料不足',
    evidence: stringList(source.evidence)
  };
};

const normalizeChapterRhythm = (
  value: unknown,
  chapter: number
): CreativeReportChapterRhythm => {
  const source = isRecord(value) ? value : {};

  return {
    chapter,
    status: slotStatus(source, 'needs-confirmation'),
    rhythm: textValue(source.rhythm) || '待确认',
    function: textValue(source.function) || '待确认',
    emotionalBeat: textValue(source.emotionalBeat) || '待确认',
    plotTurn: textValue(source.plotTurn) || '待确认',
    evidence: stringList(source.evidence)
  };
};

const normalizeCharacterArc = (value: unknown): CreativeReportCharacterArc | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const character = textValue(value.character);
  if (!character) {
    return undefined;
  }

  return {
    character,
    status: slotStatus(value, 'needs-confirmation'),
    start: textValue(value.start) || '资料不足',
    turn: textValue(value.turn) || '资料不足',
    end: textValue(value.end) || '资料不足',
    evidence: stringList(value.evidence),
    nextConfirmation: textValue(value.nextConfirmation) || undefined
  };
};

const normalizePlotCurve = (value: unknown): CreativeReportPlotCurve | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const chapterRange = textValue(value.chapterRange);
  if (!chapterRange) {
    return undefined;
  }

  return {
    chapterRange,
    status: slotStatus(value, 'needs-confirmation'),
    tension: textValue(value.tension) || '资料不足',
    payoff: textValue(value.payoff) || '资料不足',
    evidence: stringList(value.evidence)
  };
};

const normalizeRelationship = (value: unknown): CreativeReportRelationshipOverview | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const participants = stringList(value.participants);
  const dynamic = textValue(value.dynamic);
  if (participants.length === 0 && !dynamic) {
    return undefined;
  }

  return {
    participants,
    status: slotStatus(value, 'needs-confirmation'),
    dynamic: dynamic || '资料不足',
    conflict: textValue(value.conflict) || '资料不足',
    evidence: stringList(value.evidence),
    nextConfirmation: textValue(value.nextConfirmation) || undefined
  };
};

const findRawAct = (
  values: unknown[],
  fallback: CreativeReportDigestAct,
  index: number
): unknown =>
  values.find(value =>
    isRecord(value)
    && (value.act === fallback.act || value.label === fallback.label)
  ) ?? values[index];

const buildDigestNextActions = (
  digest: Omit<CreativeReportVolumePlanDigest, 'nextActions'>
): string[] => {
  const actions: string[] = [];

  if (!digest.available) {
    actions.push('补齐 volume-plan-digest.json，或先运行 storyspec preview plan 生成保留缺口的计划草案。');
  }

  if (digest.oneSentenceGoal.status !== 'confirmed') {
    actions.push('确认第一卷一句话目标，避免计划摘要替作者定案。');
  }

  digest.threeActSummary
    .filter(item => item.status === 'missing' || item.status === 'needs-confirmation')
    .forEach(item => actions.push(`确认${item.label}结构摘要。`));
  digest.chapterRhythm
    .filter(item => item.status === 'missing' || item.status === 'needs-confirmation')
    .slice(0, 3)
    .forEach(item => actions.push(`补齐第${item.chapter}章节奏或章节功能。`));
  digest.characterArcs
    .filter(item => item.status !== 'confirmed' || item.evidence.length === 0)
    .forEach(item => actions.push(item.nextConfirmation ?? `确认角色弧线：${item.character}。`));
  digest.relationships
    .filter(item => item.status !== 'confirmed' || item.evidence.length === 0)
    .forEach(item => {
      const label = item.participants.length > 0 ? item.participants.join(' / ') : '人物关系';
      actions.push(item.nextConfirmation
        ? `确认人物关系：${label}。${item.nextConfirmation}`
        : `确认人物关系：${label}。`);
    });

  return uniqueTexts(actions).slice(0, 8);
};

const buildMissingVolumePlanDigest = (
  sourcePath?: string
): CreativeReportVolumePlanDigest => {
  const base: Omit<CreativeReportVolumePlanDigest, 'nextActions'> = {
    available: false,
    sourcePath,
    volume: 1,
    oneSentenceGoal: {
      status: 'missing',
      text: '待确认',
      evidence: []
    },
    threeActSummary: defaultActs.map(item => ({ ...item })),
    chapterRhythm: Array.from({ length: 12 }, (_, index) => ({
      chapter: index + 1,
      status: 'missing' as const,
      rhythm: '待确认',
      function: '待确认',
      emotionalBeat: '待确认',
      plotTurn: '待确认',
      evidence: []
    })),
    characterArcs: [{
      character: '核心角色',
      status: 'missing',
      start: '资料不足',
      turn: '资料不足',
      end: '资料不足',
      evidence: []
    }],
    plotCurve: [{
      chapterRange: '1-12',
      status: 'missing',
      tension: '资料不足',
      payoff: '资料不足',
      evidence: []
    }],
    relationships: [{
      participants: [],
      status: 'missing',
      dynamic: '资料不足',
      conflict: '资料不足',
      evidence: []
    }]
  };

  return {
    ...base,
    nextActions: buildDigestNextActions(base)
  };
};

const readVolumePlanDigest = async (
  fs: ProjectFileSystem,
  storyPath: string
): Promise<CreativeReportVolumePlanDigest> => {
  const sourcePath = path.join(storyPath, 'volume-plan-digest.json');
  if (!await fs.pathExists(sourcePath)) {
    return buildMissingVolumePlanDigest();
  }

  let raw: unknown;
  try {
    raw = await fs.readJson<unknown>(sourcePath);
  } catch {
    return buildMissingVolumePlanDigest(sourcePath);
  }

  if (!isRecord(raw)) {
    return buildMissingVolumePlanDigest(sourcePath);
  }

  const rawActs = Array.isArray(raw.threeActSummary) ? raw.threeActSummary : [];
  const rawChapters = Array.isArray(raw.chapterRhythm) ? raw.chapterRhythm : [];
  const findRawChapter = (chapter: number): unknown =>
    rawChapters.find(value =>
      isRecord(value)
      && typeof value.chapter === 'number'
      && value.chapter === chapter
    ) ?? rawChapters[chapter - 1];
  const characterArcs = Array.isArray(raw.characterArcs)
    ? raw.characterArcs.flatMap(item => {
      const normalized = normalizeCharacterArc(item);
      return normalized ? [normalized] : [];
    })
    : [];
  const plotCurve = Array.isArray(raw.plotCurve)
    ? raw.plotCurve.flatMap(item => {
      const normalized = normalizePlotCurve(item);
      return normalized ? [normalized] : [];
    })
    : [];
  const relationships = Array.isArray(raw.relationships)
    ? raw.relationships.flatMap(item => {
      const normalized = normalizeRelationship(item);
      return normalized ? [normalized] : [];
    })
    : [];
  const base: Omit<CreativeReportVolumePlanDigest, 'nextActions'> = {
    available: true,
    sourcePath,
    volume: typeof raw.volume === 'number' && Number.isFinite(raw.volume) ? raw.volume : 1,
    oneSentenceGoal: normalizeDigestText(raw.oneSentenceGoal),
    threeActSummary: defaultActs.map((act, index) =>
      normalizeDigestAct(findRawAct(rawActs, act, index), act)
    ),
    chapterRhythm: Array.from({ length: 12 }, (_, index) =>
      normalizeChapterRhythm(findRawChapter(index + 1), index + 1)
    ),
    characterArcs: characterArcs.length > 0
      ? characterArcs
      : buildMissingVolumePlanDigest(sourcePath).characterArcs,
    plotCurve: plotCurve.length > 0
      ? plotCurve
      : buildMissingVolumePlanDigest(sourcePath).plotCurve,
    relationships: relationships.length > 0
      ? relationships
      : buildMissingVolumePlanDigest(sourcePath).relationships
  };

  return {
    ...base,
    nextActions: buildDigestNextActions(base)
  };
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
  const authorProfile = await loadAuthorProfile({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem
  });
  const activeBranches = await summarizeActiveBranches({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem,
    story: story.name
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
      source: answer.source,
      sourceLabel: getStoryCoreElementSourceLabel('confirmed')
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
      source: answer.source,
      sourceLabel: getStoryCoreElementSourceLabel('suggested')
    })) ?? [];
  const pendingQuestions = record?.questions
    .filter(question => question.required && !hasConfirmedAnswer(record.answers, question))
    .map(question => ({
      questionId: question.id,
      question: question.question,
      sourceLabel: getStoryCoreElementSourceLabel('missing')
    })) ?? [];
  const coreElements = record
    ? evaluateStoryCoreElements({
      premise: record.premise,
      questions: record.questions,
      answers: record.answers
    })
    : [];
  const storySkeleton = buildStorySkeleton(record, coreElements, confirmed);
  const creationEcho = summarizeCreationEcho(story.name, record?.premise, coreElements);
  const decisionLog = summarizeDecisionLog(record, story.name, story.stage);
  const funPrompts = buildFunPrompts(story.name, coreElements);
  const volumePlanDigest = await readVolumePlanDigest(input.fileSystem, story.path);
  const base = {
    projectRoot: input.projectRoot,
    story: story.name,
    storyPath: story.path,
    hasClarifications: summary.hasClarifications,
    authorProfile: authorProfile.summary,
    confirmed,
    pendingQuestions,
    aiSuggestions,
    coreElements,
    storySkeleton,
    creationEcho,
    decisionLog,
    funPrompts,
    activeBranches,
    volumePlanDigest,
    driftIssues: storyDriftIssues,
    cannotFinalize: summary.cannotFinalize
  };

  return {
    ...base,
    nextActions: buildNextActions(base)
  };
};

const renderVolumePlanDigest = (
  result: CreativeReportResult
): string[] => [
  '第一卷一屏摘要：',
  `- 来源：${result.volumePlanDigest.sourcePath
    ? relativePath(result.projectRoot, result.volumePlanDigest.sourcePath)
    : '待确认'}`,
  `- 第一卷一句话目标 [${result.volumePlanDigest.oneSentenceGoal.status}]：${result.volumePlanDigest.oneSentenceGoal.text}`,
  '- 三幕结构摘要：',
  ...result.volumePlanDigest.threeActSummary.map(item =>
    `  - ${item.label}（第${item.chapters}章）[${item.status}]：${item.summary}`
  ),
  '- 12 章节奏/章节功能表：',
  ...result.volumePlanDigest.chapterRhythm.map(item =>
    `  - 第${item.chapter}章 [${item.status}]：${item.rhythm}｜${item.function}｜${item.emotionalBeat}｜${item.plotTurn}`
  ),
  '- 核心角色弧线：',
  ...result.volumePlanDigest.characterArcs.map(item =>
    `  - ${item.character} [${item.status}]：${item.start} -> ${item.turn} -> ${item.end}；证据：${item.evidence.length > 0 ? item.evidence.join('；') : '资料不足'}`
  ),
  '- 剧情起伏：',
  ...result.volumePlanDigest.plotCurve.map(item =>
    `  - ${item.chapterRange} [${item.status}]：${item.tension}；回报/释放：${item.payoff}`
  ),
  '- 人物关系概况：',
  ...result.volumePlanDigest.relationships.map(item => {
    const participants = item.participants.length > 0 ? item.participants.join(' / ') : '待确认';
    return `  - ${participants} [${item.status}]：${item.dynamic}；冲突：${item.conflict}`;
  }),
  '- 补齐建议：',
  ...(result.volumePlanDigest.nextActions.length > 0
    ? result.volumePlanDigest.nextActions.map(item => `  - ${item}`)
    : ['  - 暂无。'])
];

export const renderCreativeReport = (result: CreativeReportResult): string => [
  'StorySpec 创作控制权报告',
  '',
  `故事：${result.story}`,
  `路径：${relativePath(result.projectRoot, result.storyPath)}`,
  `澄清记录：${result.hasClarifications ? '已建立' : '缺失'}`,
  '',
  '用户已确认：',
  ...(result.confirmed.length > 0
    ? result.confirmed.map(item => `- ${item.questionId} [${item.sourceLabel}]：${item.answer}`)
    : ['- 暂无。']),
  '',
  '需要澄清：',
  ...(result.pendingQuestions.length > 0
    ? result.pendingQuestions.map(item => `- ${item.questionId} [${item.sourceLabel}]：${item.question}`)
    : ['- 暂无 required 待确认问题。']),
  '',
  'AI 建议待确认：',
  ...(result.aiSuggestions.length > 0
    ? result.aiSuggestions.map(item => `- ${item.questionId} [${item.sourceLabel}]：${item.answer}`)
    : ['- 暂无。']),
  '',
  '作者画像回填：',
  `- 状态：${result.authorProfile.exists ? '已建立' : '未建立'}；只影响推荐和示例，不进入故事正典。`,
  ...(result.authorProfile.activeHints.length > 0
    ? result.authorProfile.activeHints.map(item => `- ${item}`)
    : ['- 暂无可回填偏好；首次使用可运行 `storyspec author-profile --init` 做可跳过采样。']),
  '',
  '你已经创建的小说骨架：',
  `- 摘要：${result.storySkeleton.summary}`,
  `- 成熟度：${result.creationEcho.maturityNote}`,
  ...result.storySkeleton.created.map(item => `- ${item}`),
  '',
  ...renderVolumePlanDigest(result),
  '',
  '卷计划视图：',
  '```mermaid',
  'flowchart LR',
  '  A["第一幕 1-3"] --> B["第二幕 4-9"] --> C["第三幕 10-12"]',
  '  A --> D["角色弧线"]',
  '  B --> E["剧情起伏"]',
  '  C --> F["人物关系"]',
  '```',
  '',
  '创作回声：',
  `- 当前风味：${result.creationEcho.flavor}`,
  '- 已长出的关键部件：',
  ...result.creationEcho.strongestParts.map(item => `  - ${item}`),
  '- 还差的关键部件：',
  ...(result.creationEcho.missingPieces.length > 0
    ? result.creationEcho.missingPieces.map(item => `  - ${item}`)
    : ['  - 暂无明显缺口。']),
  `- 下一轮回声：${result.creationEcho.nextEcho}`,
  '',
  '未决项回流与决策日志：',
  ...renderDeferredDecisionItems(result.decisionLog.deferredItems),
  '',
  '可继续探索的乐趣点：',
  ...(result.funPrompts.length > 0
    ? result.funPrompts.map(item => `- ${item.label}：${item.prompt}（${item.command}）`)
    : ['- 暂无明显乐趣缺口；可以进入预览或审稿。']),
  '',
  '活跃 what-if 分支：',
  ...(result.activeBranches.length > 0
    ? result.activeBranches.map(branch =>
      `- ${branch.id}：会长成 ${branch.flavor}（${branch.compareCommand}）`
    )
    : ['- 暂无。']),
  '',
  '核心要素面板：',
  ...(result.coreElements.length > 0
    ? result.coreElements.map(item => [
      `- ${item.label}：${getStoryCoreElementStatusText(item.status)} [${item.sourceLabel}]。${item.summary}`,
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
