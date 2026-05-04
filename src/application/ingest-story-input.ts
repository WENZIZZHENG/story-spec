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

export type StoryInputProfileId =
  | 'short-idea'
  | 'longform-material'
  | 'table-material';

export interface StoryInputProfile {
  id: StoryInputProfileId;
  label: string;
  recommendedRange: string;
  guidance: string;
  corePointChecklist: string[];
}

export interface MarkdownTableCandidateMapping {
  column: string;
  questionId: string;
  label: string;
  status: 'candidate';
  reason: string;
}

export interface MarkdownTableAnalysis {
  detected: boolean;
  recognizedColumns: string[];
  unrecognizedColumns: string[];
  candidateMappings: MarkdownTableCandidateMapping[];
}

export interface IngestStoryInputResult {
  projectRoot: string;
  story: string;
  storyPath: string;
  sourceFile?: string;
  ingestedTextLength: number;
  inputProfile: StoryInputProfile;
  tableAnalysis?: MarkdownTableAnalysis;
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

const splitMarkdownTableRow = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cell => cleanAnswer(cell));

const isMarkdownTableSeparator = (line: string): boolean =>
  /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);

const columnMapping = (column: string): Omit<MarkdownTableCandidateMapping, 'column'> | undefined => {
  if (/角色|主角|人物|姓名/.test(column)) {
    return {
      questionId: 'core.protagonist',
      label: '主角',
      status: 'candidate',
      reason: '表格列名像人物或主角信息，需要作者确认后才能写入。'
    };
  }

  if (/伙伴|同伴|关系|互动/.test(column)) {
    return {
      questionId: 'core.partner',
      label: '核心伙伴',
      status: 'candidate',
      reason: '表格列名像伙伴或关系信息，需要作者确认后才能写入。'
    };
  }

  if (/舞台|地点|场景|位置/.test(column)) {
    return {
      questionId: 'core.stage',
      label: '第一舞台',
      status: 'candidate',
      reason: '表格列名像舞台或地点信息，需要作者确认后才能写入。'
    };
  }

  if (/能力|魔法|法术|体系|金手指/.test(column)) {
    return {
      questionId: 'magic.rule-hardness',
      label: '能力体系',
      status: 'candidate',
      reason: '表格列名像能力体系信息，需要作者确认后才能写入。'
    };
  }

  if (/势力|冲突|阵营|组织/.test(column)) {
    return {
      questionId: 'core.faction-conflict',
      label: '势力与冲突',
      status: 'candidate',
      reason: '表格列名像势力或冲突信息，需要作者确认后才能写入。'
    };
  }

  if (/定位|职责|功能/.test(column)) {
    return {
      questionId: 'core.protagonist',
      label: '主角',
      status: 'candidate',
      reason: '定位类表格列可辅助人物理解，需要作者确认映射目标。'
    };
  }

  return undefined;
};

const analyzeMarkdownTable = (text: string): MarkdownTableAnalysis | undefined => {
  const lines = normalizeText(text).split('\n');
  const headerIndex = lines.findIndex((line, index) =>
    line.includes('|')
    && index + 1 < lines.length
    && isMarkdownTableSeparator(lines[index + 1])
  );

  if (headerIndex === -1) {
    return undefined;
  }

  const headers = splitMarkdownTableRow(lines[headerIndex]).filter(Boolean);
  const candidateMappings = headers.flatMap(column => {
    const mapping = columnMapping(column);
    return mapping ? [{ column, ...mapping }] : [];
  });
  const recognizedColumns = candidateMappings.map(mapping => mapping.column);

  return {
    detected: true,
    recognizedColumns,
    unrecognizedColumns: headers.filter(column => !recognizedColumns.includes(column)),
    candidateMappings
  };
};

const buildInputProfile = (
  text: string,
  tableAnalysis?: MarkdownTableAnalysis
): StoryInputProfile => {
  if (tableAnalysis?.detected) {
    return {
      id: 'table-material',
      label: 'Markdown 表格资料',
      recommendedRange: '1-5 张小表优先',
      guidance: '表格会先作为字段映射候选；未确认前不会写入正典、specification 或 confirmed clarifications。',
      corePointChecklist: [
        '表格列名对应什么故事字段',
        '哪些列只是备注或临时想法',
        '哪些行可以作为候选事实'
      ]
    };
  }

  if (text.length < 500) {
    return {
      id: 'short-idea',
      label: '一句灵感',
      recommendedRange: '20-200 字',
      guidance: '短灵感缺少也没关系；系统会保留你的原话，再用低负担问题补齐可写方向。',
      corePointChecklist: [
        '主角是谁或正在面对什么',
        '第一眼舞台或冲突',
        '能力、关系或爽点钩子'
      ]
    };
  }

  return {
    id: 'longform-material',
    label: '长文资料',
    recommendedRange: '500-3000 字',
    guidance: text.length > 3000
      ? '首轮材料偏长，建议分段输入；待澄清不是导入失败，而是把不确定内容留给作者确认。'
      : '长文会拆成已识别、保留候选和仍需确认；待澄清不是导入失败。',
    corePointChecklist: [
      '一句话核心创意',
      '主角、伙伴与第一舞台',
      '能力体系或主要冲突',
      '不能提前定稿或必须保留候选的边界'
    ]
  };
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
  const tableAnalysis = analyzeMarkdownTable(text);
  const inputProfile = buildInputProfile(text, tableAnalysis);
  const confirmedItems = recognizeConfirmedItems(text);
  const candidateItems = recognizeCandidateItems(text, confirmedItems);
  const premise = await resolvePremise(input, story.path, confirmedItems);
  const write = Boolean(input.applyConfirmed && confirmedItems.length > 0 && !tableAnalysis?.detected);
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
    inputProfile,
    tableAnalysis,
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
  `素材类型：${result.inputProfile.label}`,
  `推荐范围：${result.inputProfile.recommendedRange}`,
  `输入建议：${result.inputProfile.guidance}`,
  `写入状态：${result.written ? '已写入 clarifications.json/md' : '预览未写入'}`,
  '',
  '核心要点清单',
  '',
  ...result.inputProfile.corePointChecklist.map(item => `- ${item}`),
  '',
  ...(result.tableAnalysis?.detected
    ? [
      'Markdown 表格识别',
      '',
      `已识别列：${result.tableAnalysis.recognizedColumns.length > 0 ? result.tableAnalysis.recognizedColumns.join('、') : '无'}`,
      `未识别列：${result.tableAnalysis.unrecognizedColumns.length > 0 ? result.tableAnalysis.unrecognizedColumns.join('、') : '无'}`,
      '字段映射候选：',
      ...(result.tableAnalysis.candidateMappings.length > 0
        ? result.tableAnalysis.candidateMappings.map(mapping =>
          `- ${mapping.column} -> ${mapping.questionId}（${mapping.label}）：${mapping.reason}`
        )
        : ['- 暂无。']),
      '提示：表格内容未确认前不会写入正典。',
      ''
    ]
    : []),
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
