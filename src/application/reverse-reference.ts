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

export interface ReferenceReaderPromise {
  label: string;
  promise: string;
  sourceReason: string;
}

export interface ReferenceRepairDirection {
  label: string;
  direction: string;
  avoid: string;
  sourceReason: string;
}

export interface ReferenceOriginalizationGuide {
  sourceStructure: string;
  originalMove: string;
  boundary: string;
}

export interface ReferenceReverseResult {
  projectRoot: string;
  story: string;
  storyPath: string;
  source: ReferenceReverseSource;
  mode: ReferenceReverseMode;
  written: false;
  originalDependencies: ReferenceDependency[];
  appealSignals: ReferenceReverseFinding[];
  highRiskSimilarities: ReferenceReverseFinding[];
  translatableStructures: ReferenceReverseFinding[];
  readerPromises: ReferenceReaderPromise[];
  repairDirections: ReferenceRepairDirection[];
  originalizationGuides: ReferenceOriginalizationGuide[];
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

const appealDefinitions: readonly { label: string; pattern: RegExp; reason: string }[] = [
  {
    label: '底层进入规则核心',
    pattern: /底层|矿村|平民|边缘|解释权|贵族学院|规则核心/,
    reason: '作者喜欢底层角色从被压迫位置逐步理解规则、取得解释权的成长快感。'
  },
  {
    label: '规则化神秘系统',
    pattern: /符文|调试|规则|可调试|拆成|魔法/,
    reason: '作者喜欢把神秘或魔法系统拆成可观察、可验证、可修复规则的阅读爽点。'
  },
  {
    label: '慢热信任关系',
    pattern: /师徒|信任|慢热|伙伴|女主|关系/,
    reason: '作者喜欢关系从防备、合作到互相选择的渐进张力。'
  },
  {
    label: '世界危机承诺',
    pattern: /魔力枯竭|危机|公共|设施|资源|枯竭/,
    reason: '作者喜欢个人成长与世界系统失灵互相扣合，而不是只停留在升级。'
  }
];

const extractAppealSignals = (sentences: readonly string[]): ReferenceReverseFinding[] => {
  const findings = appealDefinitions.flatMap(definition => {
    const evidence = findSentence(sentences, definition.pattern);
    return buildFinding(definition.label, evidence, definition.reason);
  });

  return uniqueByKey(findings, item => item.label);
};

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

const buildReaderPromises = (text: string): ReferenceReaderPromise[] => {
  const promises: ReferenceReaderPromise[] = [
    {
      label: '解释权成长',
      promise: '让底层角色用原创方法逐步理解世界规则、获得解释权，并付出与身份处境相称的代价。',
      sourceReason: '来自底层矿村、贵族学院压迫、知识垄断和解释权吸引力。'
    },
    {
      label: '规则可验证',
      promise: '让能力体系有清晰边界、失败后果和调试过程，读者能跟着主角理解问题怎样被拆开。',
      sourceReason: '来自符文调试和把神秘魔法拆成可调试规则的爽点。'
    },
    {
      label: '关系慢热兑现',
      promise: '让重要关系通过选择、边界和共同承担逐步升温，避免用突兀牺牲替代情感推进。',
      sourceReason: '来自师徒信任慢热和对强行献祭的不适。'
    },
    {
      label: '公共危机兑现',
      promise: '让魔力枯竭或等价公共危机持续影响日常生活、权力结构和章节任务，而不是只做背景装饰。',
      sourceReason: '来自魔力枯竭危机和边境公共设施新故事愿望。'
    }
  ];

  if (!/师徒|信任|慢热|献祭|关系/.test(text)) {
    return promises.filter(item => item.label !== '关系慢热兑现');
  }

  return promises;
};

const buildRepairDirections = (text: string): ReferenceRepairDirection[] => {
  const directions: ReferenceRepairDirection[] = [];

  if (/献祭|强行|关系变成|女主/.test(text)) {
    directions.push({
      label: '拒绝强行献祭',
      direction: '把关系冲突改成双方有选择权、有边界确认、有共同代价的原创推进。',
      avoid: '不要把原作关系线、角色身份或牺牲桥段搬进新故事。',
      sourceReason: '来自作者对后期关系强行献祭的不适。'
    });
  }

  if (/太监|续写|原作结局|后续|想修复|修复/.test(text)) {
    directions.push({
      label: '断更或原作结局转译',
      direction: '把未完成或想修复的遗憾转成原创问题意识，例如“承诺必须兑现”“危机必须影响制度”。',
      avoid: '不要续写原作结局，不接续原作时间线，不复用原作关键反转。',
      sourceReason: '来自作者不想续写原作、而想做新故事的表达。'
    });
  }

  if (/继承|王座|血脉|突然/.test(text)) {
    directions.push({
      label: '拒绝突兀身份奖励',
      direction: '把主角的阶段胜利绑定到技能、选择和关系后果，而不是突然继承原作权位或血脉。',
      avoid: '不要保留参考作品的王座、血脉、组织名或继承桥段。',
      sourceReason: '来自作者对突然继承灰塔王座的不适。'
    });
  }

  return directions.length > 0
    ? directions
    : [{
      label: '不适点转成边界',
      direction: '把作者不想要的情节处理方式写成新故事的创作边界，再用原创设定兑现相反承诺。',
      avoid: '不要为了修复参考作品而复制参考作品的角色、设定或剧情线。',
      sourceReason: '来自作者提供的喜欢点和不适点。'
    }];
};

const buildOriginalizationGuides = (text: string): ReferenceOriginalizationGuide[] => {
  const guides: ReferenceOriginalizationGuide[] = [
    {
      sourceStructure: '符文调试爽点',
      originalMove: '保留“观察异常 -> 建立假设 -> 小规模验证 -> 付出代价修复”的问题解决节奏，并重新命名能力、材料、限制和失败后果。',
      boundary: '不沿用第七符文、灰塔术语、原作魔法规则或原句表达。'
    },
    {
      sourceStructure: '知识垄断与解释权',
      originalMove: '把“谁有资格解释世界规则”改写成原创制度，例如维修许可、审计权限、学院执照或公共设施维护权。',
      boundary: '不沿用原作学院、教团、贵族组织或具体剧情线。'
    },
    {
      sourceStructure: '师徒信任慢热',
      originalMove: '保留互相试探、共同解决问题、边界逐步打开的关系功能，重建原创身份、目标和冲突来源。',
      boundary: '不沿用原作角色、师徒桥段、献祭转折或关系结局。'
    }
  ];

  if (/公共|设施|魔力枯竭|资源|危机/.test(text)) {
    guides.push({
      sourceStructure: '公共危机压力',
      originalMove: '把危机落到普通人的生活成本、维护失败、权力租金和章节任务上，让世界压力持续推动剧情。',
      boundary: '不复刻参考作品的危机名词、解决仪式或最终反转。'
    });
  }

  return guides;
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
    appealSignals: extractAppealSignals(sentences),
    highRiskSimilarities: extractHighRiskSimilarities(sentences),
    translatableStructures: extractTranslatableStructures(sentences),
    readerPromises: buildReaderPromises(text),
    repairDirections: buildRepairDirections(text),
    originalizationGuides: buildOriginalizationGuides(text),
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

const renderPromise = (item: ReferenceReaderPromise): string =>
  `- ${item.label}：${item.promise}\n  来源：${item.sourceReason}`;

const renderRepairDirection = (item: ReferenceRepairDirection): string =>
  `- ${item.label}：${item.direction}\n  避免：${item.avoid}\n  来源：${item.sourceReason}`;

const renderOriginalizationGuide = (item: ReferenceOriginalizationGuide): string =>
  `- ${item.sourceStructure}：${item.originalMove}\n  边界：${item.boundary}`;

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
  '结构吸引力',
  '',
  ...(result.appealSignals.length > 0
    ? result.appealSignals.map(renderFinding)
    : ['- 暂未识别明确喜欢点；请补充“我喜欢/我想保留/吸引我的是”。']),
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
  '读者承诺',
  '',
  ...result.readerPromises.map(renderPromise),
  '',
  '修复方向',
  '',
  ...result.repairDirections.map(renderRepairDirection),
  '',
  '原创化指南',
  '',
  ...result.originalizationGuides.map(renderOriginalizationGuide),
  '',
  '新故事候选',
  '',
  ...result.newStoryCandidates.map(renderCandidate),
  '',
  '不得直接照搬',
  '',
  ...result.doNotCopy.map(item => `- ${item}`)
].join('\n');
