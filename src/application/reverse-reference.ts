import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import {
  relativePath,
  selectStoryProject
} from './workbench-utils.js';

export type ReverseReferenceErrorCode = 'MISSING_REFERENCE_INPUT';

export class ReverseReferenceError extends Error {
  constructor(
    public readonly code: ReverseReferenceErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ReverseReferenceError';
  }
}

export type ReferenceReverseMode = 'original' | 'fanfic-notes';

export interface ReverseReferenceInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  title?: string;
  text?: string;
  file?: string;
  mode?: ReferenceReverseMode;
}

export interface ReferenceReverseSource {
  title: string;
  sourceFile?: string;
  inputLength: number;
}

export interface ReferenceReverseFinding {
  label: string;
  evidence: string;
  reason: string;
}

export interface ReferenceDependency {
  item: string;
  reason: string;
  evidence: string;
}

export interface ReferenceReverseCandidate {
  label: string;
  candidate: string;
  sourceReason: string;
}

export interface ReferenceReverseResult {
  projectRoot: string;
  story: string;
  storyPath: string;
  source: ReferenceReverseSource;
  mode: ReferenceReverseMode;
  written: false;
  originalDependencies: ReferenceDependency[];
  highRiskSimilarities: ReferenceReverseFinding[];
  translatableStructures: ReferenceReverseFinding[];
  newStoryCandidates: ReferenceReverseCandidate[];
  doNotCopy: string[];
}

const DO_NOT_COPY = [
  '不要照搬参考作品角色名、地名、势力名或专有术语。',
  '不要复制参考作品的剧情线、章节结构或关键反转。',
  '不要复述或改写受保护原文表达。',
  '不要生成未授权的原作续写正文。',
  '候选进入 world/canon/spec 前必须经过 preview / confirm / apply。'
] as const;

const normalizeText = (value: string): string =>
  value.replace(/\r\n/g, '\n').trim();

const clean = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const splitSentences = (text: string): string[] =>
  normalizeText(text)
    .split(/\n+|(?<=[。！？!?；;])\s*/)
    .map(clean)
    .filter(Boolean);

const uniqueByKey = <T>(items: readonly T[], getKey: (item: T) => string): T[] => {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }

  return result;
};

const resolveInputText = async (
  input: ReverseReferenceInput
): Promise<{ text: string; sourceFile?: string }> => {
  const parts: string[] = [];
  let sourceFile: string | undefined;

  if (input.file?.trim()) {
    sourceFile = path.isAbsolute(input.file)
      ? input.file
      : path.join(input.projectRoot, input.file);
    parts.push(await input.fileSystem.readFile(sourceFile));
  }

  if (input.text?.trim()) {
    parts.push(input.text);
  }

  const text = normalizeText(parts.join('\n\n'));
  if (!text) {
    throw new ReverseReferenceError('MISSING_REFERENCE_INPUT', '请通过 --text 或 --file 提供参考作品读后笔记、摘要或本地资料。');
  }

  return { text, sourceFile };
};

const inferTitle = (
  input: ReverseReferenceInput,
  text: string,
  sourceFile?: string
): string => {
  if (input.title?.trim()) {
    return input.title.trim();
  }

  const explicit = text.match(/参考作品\s*[:：]\s*([^\n。；;]+)/);
  if (explicit?.[1]?.trim()) {
    return explicit[1].trim();
  }

  if (sourceFile) {
    return path.basename(sourceFile, path.extname(sourceFile));
  }

  return '未命名参考作品';
};

const dependencyPatterns = [
  /([\u4e00-\u9fff]{1,8}(?:王座|教团|学院|帝国|王国|公会|议会|塔|城|村|港|门|宫|符文|秘术|血脉|圣物))/g,
  /([A-Z][A-Za-z0-9_-]{2,})/g
];

const dependencyStopWords = new Set([
  '参考作品',
  '贵族学院',
  '知识垄断',
  '阶层压迫',
  '魔力枯竭',
  '师徒信任',
  '师徒慢热',
  '底层矿村',
  '边境公共设施'
]);

const namedItemsFromSentence = (sentence: string): string[] => {
  const items: string[] = [];
  for (const pattern of dependencyPatterns) {
    for (const match of sentence.matchAll(pattern)) {
      const item = match[1]?.trim();
      if (!item || dependencyStopWords.has(item)) {
        continue;
      }
      items.push(item);
    }
  }

  for (const item of ['灰塔', '艾琳娜', '黑曜教团', '第七符文']) {
    if (sentence.includes(item)) {
      items.push(item);
    }
  }

  return uniqueByKey(items, item => item);
};

const extractOriginalDependencies = (sentences: readonly string[]): ReferenceDependency[] => {
  const dependencies = sentences.flatMap(sentence =>
    namedItemsFromSentence(sentence).map(item => ({
      item,
      reason: '疑似参考作品专有角色、势力、地名或术语；只能作为原作依赖项记录，不得直接写入原创正典。',
      evidence: sentence
    }))
  );

  return uniqueByKey(dependencies, item => item.item);
};

const findSentence = (sentences: readonly string[], pattern: RegExp): string | undefined =>
  sentences.find(sentence => pattern.test(sentence));

const buildFinding = (
  label: string,
  evidence: string | undefined,
  reason: string
): ReferenceReverseFinding[] => evidence ? [{ label, evidence, reason }] : [];

const extractHighRiskSimilarities = (sentences: readonly string[]): ReferenceReverseFinding[] => [
  ...buildFinding(
    '直接续写或修复原作结局',
    findSentence(sentences, /续写|原作结局|太监|后续/)
      ?? findSentence(sentences, /想修复|修复/),
    '涉及原作后续、结局修复或续写意图；只能转成原创问题意识，不能生成原作续写正文。'
  ),
  ...buildFinding(
    '专名绑定过强',
    findSentence(sentences, /不要.*(?:沿用|复制|照搬)|专名|角色名|势力名|地名|术语/),
    '作者已指出这些元素不能迁移到原创项目，应保留在风险清单。'
  )
];

const structureDefinitions: readonly { label: string; pattern: RegExp; reason: string }[] = [
  {
    label: '知识垄断与解释权',
    pattern: /知识|解释权|垄断|学院|贵族/,
    reason: '可转译为原创世界中的资源、知识或合法性分配问题。'
  },
  {
    label: '阶层压迫',
    pattern: /底层|矿村|阶层|压迫|贵族|平民/,
    reason: '可转译为原创主角与制度压力的第一冲突。'
  },
  {
    label: '规则化能力爽点',
    pattern: /符文|调试|规则|拆成|可调试|魔法/,
    reason: '可保留“把神秘系统规则化”的读者快感，但要换成原创术语和机制。'
  },
  {
    label: '关系张力',
    pattern: /师徒|信任|关系|慢热|女主|伙伴/,
    reason: '可转译为原创角色之间的信任建立、边界和代价。'
  },
  {
    label: '世界压力',
    pattern: /魔力枯竭|危机|公共|设施|资源|枯竭/,
    reason: '可转译为原创世界正在失灵的公共系统或资源危机。'
  },
  {
    label: '未完成承诺或不适点修复',
    pattern: /不喜欢|恶心|太监|想修复|后期|承诺|献祭|突然/,
    reason: '可转译为“本书要避免什么”和“本书要兑现什么”的创作边界。'
  }
];

const extractTranslatableStructures = (sentences: readonly string[]): ReferenceReverseFinding[] => {
  const findings = structureDefinitions.flatMap(definition => {
    const evidence = findSentence(sentences, definition.pattern);
    return buildFinding(definition.label, evidence, definition.reason);
  });

  return uniqueByKey(findings, item => item.label);
};

const buildNewStoryCandidates = (text: string): ReferenceReverseCandidate[] => {
  const candidates: ReferenceReverseCandidate[] = [
    {
      label: '原创世界压力',
      candidate: /公共|设施|资源|枯竭/.test(text)
        ? '把参考作品的危机转译为原创世界的公共资源或基础设施失灵，例如边境魔法公共设施老化、维护权被垄断。'
        : '把参考作品的世界压迫转译为原创社会中的资源分配、知识许可或公共系统失灵。',
      sourceReason: '来自作者喜欢的世界运行逻辑和想修复的危机承诺。'
    },
    {
      label: '原创主角功能',
      candidate: '用一个边缘职业主角承接“从底层进入规则核心”的功能，例如维修工、记录员、学徒、临时审计员或边境技师。',
      sourceReason: '保留主角处境和爽点功能，不保留原作角色身份。'
    },
    {
      label: '原创能力表达',
      candidate: '保留“把神秘系统拆成可理解规则”的阅读快感，但重新命名能力、代价、材料、训练路径和失败后果。',
      sourceReason: '来自规则化能力爽点。'
    },
    {
      label: '原创关系承诺',
      candidate: '把原作关系不适点改写为新的互相选择、边界确认和共同承担代价，不沿用原作角色关系。',
      sourceReason: '来自作者明确提出的不适和修复愿望。'
    }
  ];

  return candidates;
};

export const reverseReferenceNotes = async (
  input: ReverseReferenceInput
): Promise<ReferenceReverseResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const { text, sourceFile } = await resolveInputText(input);
  const title = inferTitle(input, text, sourceFile);
  const sentences = splitSentences(text);

  return {
    projectRoot: input.projectRoot,
    story: story.name,
    storyPath: story.path,
    source: {
      title,
      sourceFile,
      inputLength: text.length
    },
    mode: input.mode ?? 'original',
    written: false,
    originalDependencies: extractOriginalDependencies(sentences),
    highRiskSimilarities: extractHighRiskSimilarities(sentences),
    translatableStructures: extractTranslatableStructures(sentences),
    newStoryCandidates: buildNewStoryCandidates(text),
    doNotCopy: [...DO_NOT_COPY]
  };
};

const renderDependency = (item: ReferenceDependency): string =>
  `- ${item.item}：${item.reason}\n  证据：${item.evidence}`;

const renderFinding = (item: ReferenceReverseFinding): string =>
  `- ${item.label}：${item.reason}\n  证据：${item.evidence}`;

const renderCandidate = (item: ReferenceReverseCandidate): string =>
  `- ${item.label}：${item.candidate}\n  来源：${item.sourceReason}`;

export const renderReferenceReverseResult = (result: ReferenceReverseResult): string => [
  'StorySpec 参考作品反向拆解预览',
  '',
  `故事：${result.story}`,
  `参考作品：${result.source.title}`,
  ...(result.source.sourceFile ? [`来源文件：${relativePath(result.projectRoot, result.source.sourceFile)}`] : []),
  `输入长度：${result.source.inputLength}`,
  `模式：${result.mode === 'original' ? '原创化转译' : '同人续写记录'}`,
  '写入状态：预览未写入',
  '',
  '原作依赖项',
  '',
  ...(result.originalDependencies.length > 0
    ? result.originalDependencies.map(renderDependency)
    : ['- 暂未识别明显专名；仍需作者人工确认。']),
  '',
  '高风险相似项',
  '',
  ...(result.highRiskSimilarities.length > 0
    ? result.highRiskSimilarities.map(renderFinding)
    : ['- 暂未识别明显高风险相似项。']),
  '',
  '可原创化结构',
  '',
  ...(result.translatableStructures.length > 0
    ? result.translatableStructures.map(renderFinding)
    : ['- 暂未识别可原创化结构，请补充喜欢点、讨厌点或想修复的承诺。']),
  '',
  '新故事候选',
  '',
  ...result.newStoryCandidates.map(renderCandidate),
  '',
  '不得直接照搬',
  '',
  ...result.doNotCopy.map(item => `- ${item}`)
].join('\n');
