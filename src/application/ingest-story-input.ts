import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import {
  interviewStory,
  type InterviewStoryResult
} from './interview-story.js';
import { readIdeaPremise } from './story-idea.js';
import {
  relativePath,
  selectStoryProject
} from './workbench-utils.js';

export type IngestStoryInputErrorCode =
  | 'MISSING_INPUT_TEXT'
  | 'NO_RECOGNIZED_ITEMS';

export class IngestStoryInputError extends Error {
  constructor(
    public readonly code: IngestStoryInputErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'IngestStoryInputError';
  }
}

export interface IngestStoryInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  text?: string;
  file?: string;
  applyConfirmed?: boolean;
  now?: () => Date;
}

export interface IngestedStoryInputItem {
  questionId: string;
  label: string;
  sourceLabel: string;
  answer: string;
  confidence: number;
  reason: string;
}

export interface IngestStoryInputResult {
  projectRoot: string;
  story: string;
  storyPath: string;
  sourceFile?: string;
  ingestedTextLength: number;
  confirmedItems: IngestedStoryInputItem[];
  candidateItems: IngestedStoryInputItem[];
  pendingQuestions: string[];
  jsonPath: string;
  markdownPath: string;
  written: boolean;
  updatedAnswerIds: string[];
  reusedAnswerIds: string[];
  record: InterviewStoryResult['record'];
}

interface IngestFieldDefinition {
  questionId: string;
  label: string;
  aliases: string[];
  candidateKeywords: string[];
  pending: boolean;
}

const FIELD_DEFINITIONS: readonly IngestFieldDefinition[] = [
  {
    questionId: 'core.premise',
    label: '核心创意',
    aliases: ['核心创意', '故事核心', '一句话创意', '创意'],
    candidateKeywords: ['穿越', '故事', '开局', '第一卷', '冒险', '世界'],
    pending: true
  },
  {
    questionId: 'core.protagonist',
    label: '主角',
    aliases: ['主角', '主人公', '晏无'],
    candidateKeywords: ['晏无', '开朗务实', '主要矛盾', '行动力', '感情迟钝', '价值观'],
    pending: true
  },
  {
    questionId: 'core.partner',
    label: '核心伙伴',
    aliases: ['核心伙伴', '伙伴', '同伴', '团队'],
    candidateKeywords: ['伙伴', '团队', '莉莉丝', '瑟琳娜', '塞拉斯蒂娅', '同伴'],
    pending: true
  },
  {
    questionId: 'core.stage',
    label: '第一舞台',
    aliases: ['第一舞台', '主要舞台', '舞台', '地点'],
    candidateKeywords: ['魔导边境学院', '学院', '学府', '知识解释权', '贵族系统', '底层工作人员'],
    pending: true
  },
  {
    questionId: 'magic.rule-hardness',
    label: '能力体系',
    aliases: ['能力体系', '魔法体系', '法术体系', '能力', '金手指'],
    candidateKeywords: ['法术程序', '符文', '魔力流向', '术式断点', '精神力', '材料'],
    pending: true
  },
  {
    questionId: 'core.faction-conflict',
    label: '势力与冲突',
    aliases: ['势力与冲突', '势力冲突', '第一卷冲突', '势力', '冲突'],
    candidateKeywords: ['制度', '垄断', '审查', '资源', '许可', '贵族'],
    pending: true
  },
  {
    questionId: 'threat.first-symptom',
    label: '长线威胁',
    aliases: ['长线威胁', '文明威胁', '早期异常', '威胁'],
    candidateKeywords: ['长线', '文明', '威胁', '异常', '真相', '逐步揭示'],
    pending: false
  },
  {
    questionId: 'core.scope',
    label: '创作边界',
    aliases: ['创作边界', '边界', '不能定稿', '不可定稿'],
    candidateKeywords: ['不想提前定稿', '不能提前定稿', '最终反派', '感情线归属', '完整阴谋', '只能作为候选'],
    pending: true
  }
];

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeText = (value: string): string =>
  value.replace(/\r\n/g, '\n').trim();

const cleanAnswer = (value: string): string =>
  value
    .replace(/^[\s:：,，。；;、-]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

const aliasLookup = (): Map<string, IngestFieldDefinition> => {
  const lookup = new Map<string, IngestFieldDefinition>();
  for (const definition of FIELD_DEFINITIONS) {
    for (const alias of definition.aliases) {
      lookup.set(alias, definition);
    }
  }

  return lookup;
};

const buildLabelRegex = (): RegExp => {
  const aliases = FIELD_DEFINITIONS
    .flatMap(definition => definition.aliases)
    .sort((left, right) => right.length - left.length)
    .map(escapeRegExp)
    .join('|');

  return new RegExp(`(^|[\\n。；;])\\s*(?:[-*]\\s*)?(${aliases})\\s*[:：]`, 'g');
};

const mergeRecognizedItem = (
  itemsByQuestionId: Map<string, IngestedStoryInputItem>,
  item: IngestedStoryInputItem
): void => {
  const existing = itemsByQuestionId.get(item.questionId);
  if (!existing) {
    itemsByQuestionId.set(item.questionId, item);
    return;
  }

  itemsByQuestionId.set(item.questionId, {
    ...existing,
    sourceLabel: existing.sourceLabel === item.sourceLabel
      ? existing.sourceLabel
      : `${existing.sourceLabel} / ${item.sourceLabel}`,
    answer: [existing.answer, item.answer].filter(Boolean).join('\n\n')
  });
};

const recognizeConfirmedItems = (text: string): IngestedStoryInputItem[] => {
  const normalized = normalizeText(text);
  const regex = buildLabelRegex();
  const lookup = aliasLookup();
  const matches = [...normalized.matchAll(regex)];
  const itemsByQuestionId = new Map<string, IngestedStoryInputItem>();

  matches.forEach((match, index) => {
    const sourceLabel = match[2];
    const definition = lookup.get(sourceLabel);
    if (!definition || match.index === undefined) {
      return;
    }

    const contentStart = match.index + match[0].length;
    const contentEnd = matches[index + 1]?.index ?? normalized.length;
    const answer = cleanAnswer(normalized.slice(contentStart, contentEnd));
    if (!answer) {
      return;
    }

    mergeRecognizedItem(itemsByQuestionId, {
      questionId: definition.questionId,
      label: definition.label,
      sourceLabel,
      answer,
      confidence: 0.9,
      reason: '识别到作者使用了明确的中文字段标签。'
    });
  });

  return [...itemsByQuestionId.values()];
};

const splitCandidateChunks = (text: string): string[] =>
  normalizeText(text)
    .split(/\n\s*\n|(?<=[。！？!?])\s+/)
    .map(cleanAnswer)
    .filter(chunk => chunk.length >= 12);

const keywordHits = (chunk: string, definition: IngestFieldDefinition): number =>
  definition.candidateKeywords.filter(keyword => chunk.includes(keyword)).length;

const recognizeCandidateItems = (
  text: string,
  confirmedItems: readonly IngestedStoryInputItem[]
): IngestedStoryInputItem[] => {
  const confirmedIds = new Set(confirmedItems.map(item => item.questionId));
  const chunks = splitCandidateChunks(text);
  const itemsByQuestionId = new Map<string, IngestedStoryInputItem>();

  for (const definition of FIELD_DEFINITIONS) {
    if (confirmedIds.has(definition.questionId)) {
      continue;
    }

    const matches = chunks
      .map(chunk => ({ chunk, hits: keywordHits(chunk, definition) }))
      .filter(match => match.hits > 0)
      .sort((left, right) => right.hits - left.hits || right.chunk.length - left.chunk.length);
    const best = matches[0];
    if (!best) {
      continue;
    }

    itemsByQuestionId.set(definition.questionId, {
      questionId: definition.questionId,
      label: definition.label,
      sourceLabel: `候选：${definition.label}`,
      answer: best.chunk,
      confidence: 0.55,
      reason: '未发现明确字段标签，仅按关键词归类；需要作者确认后才能写入。'
    });
  }

  return [...itemsByQuestionId.values()];
};

const buildAnswers = (items: readonly IngestedStoryInputItem[]): Record<string, unknown> =>
  Object.fromEntries(items.map(item => [item.questionId, item.answer]));

const buildPendingQuestions = (confirmedItems: readonly IngestedStoryInputItem[]): string[] => {
  const confirmedIds = new Set(confirmedItems.map(item => item.questionId));

  return FIELD_DEFINITIONS
    .filter(definition => definition.pending && !confirmedIds.has(definition.questionId))
    .map(definition => `${definition.label}：未从长文中识别到明确段落。`);
};

const resolveInputText = async (input: IngestStoryInput): Promise<{ text: string; sourceFile?: string }> => {
  const textParts: string[] = [];
  let sourceFile: string | undefined;

  if (input.file?.trim()) {
    sourceFile = path.isAbsolute(input.file)
      ? input.file
      : path.join(input.projectRoot, input.file);
    textParts.push(await input.fileSystem.readFile(sourceFile));
  }

  if (input.text?.trim()) {
    textParts.push(input.text);
  }

  const text = normalizeText(textParts.join('\n\n'));
  if (!text) {
    throw new IngestStoryInputError('MISSING_INPUT_TEXT', '请通过 --text 或 --file 提供要吸收的创作资料。');
  }

  return { text, sourceFile };
};

const resolvePremise = async (
  input: IngestStoryInput,
  storyPath: string,
  confirmedItems: readonly IngestedStoryInputItem[]
): Promise<string> => {
  const premise = confirmedItems.find(item => item.questionId === 'core.premise')?.answer
    || await readIdeaPremise(input.fileSystem, storyPath);

  if (!premise.trim()) {
    throw new IngestStoryInputError('NO_RECOGNIZED_ITEMS', '未识别到核心创意，也没有可复用的 idea.md 原始灵感。');
  }

  return premise;
};

export const ingestStoryInput = async (
  input: IngestStoryInput
): Promise<IngestStoryInputResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const { text, sourceFile } = await resolveInputText(input);
  const confirmedItems = recognizeConfirmedItems(text);
  const candidateItems = recognizeCandidateItems(text, confirmedItems);
  const premise = await resolvePremise(input, story.path, confirmedItems);
  const write = Boolean(input.applyConfirmed && confirmedItems.length > 0);
  const interview = await interviewStory({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem,
    story: story.name,
    premise,
    answers: buildAnswers(confirmedItems),
    maxQuestions: 12,
    write,
    now: input.now
  });

  return {
    projectRoot: input.projectRoot,
    story: story.name,
    storyPath: story.path,
    sourceFile,
    ingestedTextLength: text.length,
    confirmedItems,
    candidateItems,
    pendingQuestions: buildPendingQuestions(confirmedItems),
    jsonPath: interview.jsonPath,
    markdownPath: interview.markdownPath,
    written: interview.written,
    updatedAnswerIds: interview.updatedAnswerIds,
    reusedAnswerIds: interview.reusedAnswerIds,
    record: interview.record
  };
};

const renderItem = (item: IngestedStoryInputItem): string =>
  `- ${item.questionId}（${item.sourceLabel}）：${item.answer}`;

export const renderIngestStoryInputResult = (result: IngestStoryInputResult): string => [
  'StorySpec 长文吸收预览',
  '',
  `故事：${result.story}`,
  ...(result.sourceFile ? [`来源文件：${relativePath(result.projectRoot, result.sourceFile)}`] : []),
  `输入长度：${result.ingestedTextLength}`,
  `写入状态：${result.written ? '已写入 clarifications.json/md' : '预览未写入'}`,
  '',
  '建议写入（作者明确表达）',
  '',
  ...(result.confirmedItems.length > 0
    ? result.confirmedItems.map(renderItem)
    : ['- 暂无。']),
  '',
  '保留候选',
  '',
  ...(result.candidateItems.length > 0
    ? result.candidateItems.map(renderItem)
    : ['- 暂无。']),
  '',
  '仍需确认',
  '',
  ...(result.pendingQuestions.length > 0
    ? result.pendingQuestions.map(item => `- ${item}`)
    : ['- 暂未发现核心缺口。']),
  '',
  `JSON：${relativePath(result.projectRoot, result.jsonPath)}`,
  `Markdown：${relativePath(result.projectRoot, result.markdownPath)}`
].join('\n');
