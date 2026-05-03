import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import type {
  PromiseIssue,
  RhythmConfig,
  StoryPromise,
  StoryPromiseStatus,
  StoryPromiseType,
  TensionPoint
} from '../domain/workbench.js';
import {
  toPosixPath,
  unique
} from './workbench-utils.js';

export interface PromiseInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
}

export interface PromiseTaskDraft {
  task_title: string;
  description: string;
  severity: PromiseIssue['severity'];
  sourceFinding: string;
  suggestedAction: string;
}

export interface PromiseCheckResult {
  projectRoot: string;
  promisesPath: string;
  tensionPath: string;
  promises: StoryPromise[];
  tensionPoints: TensionPoint[];
  issues: PromiseIssue[];
  taskDrafts: PromiseTaskDraft[];
  summary: {
    open: number;
    reinforced: number;
    paidOff: number;
    stale: number;
    abandoned: number;
  };
}

export interface PromiseListResult {
  projectRoot: string;
  promisesPath: string;
  promises: StoryPromise[];
  issues: PromiseIssue[];
}

export interface TensionChartResult {
  projectRoot: string;
  tensionPath: string;
  rhythmConfigPath: string;
  rhythmConfig?: RhythmConfig;
  points: TensionPoint[];
  issues: PromiseIssue[];
  markdown: string;
}

export interface InitRhythmConfigInput extends PromiseInput {
  averageChapterLength?: number;
  hookFrequency?: number;
  payoffInterval?: number;
  infoRevealDensity?: number;
  noWrite?: boolean;
}

export interface InitRhythmConfigResult {
  projectRoot: string;
  outputPath: string;
  config: RhythmConfig;
  written: boolean;
}

const VALID_PROMISE_TYPES: StoryPromiseType[] = [
  'mystery',
  'revenge',
  'romance',
  'power-up',
  'world-secret',
  'character-goal'
];

const VALID_PROMISE_STATUSES: StoryPromiseStatus[] = [
  'open',
  'reinforced',
  'paid-off',
  'stale',
  'abandoned'
];

const promisesPath = (projectRoot: string): string =>
  path.join(projectRoot, 'spec', 'tracking', 'promises.json');

const tensionPath = (projectRoot: string): string =>
  path.join(projectRoot, 'spec', 'tracking', 'tension-curve.json');

const rhythmConfigPath = (projectRoot: string): string =>
  path.join(projectRoot, 'spec', 'tracking', 'rhythm-config.json');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(isNonEmptyString).map(item => item.trim())
    : [];

const readNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (isNonEmptyString(value)) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const readPositiveNumber = (value: unknown, fallback: number): number => {
  const number = readNumber(value, fallback);
  return number > 0 ? number : fallback;
};

const issue = (
  code: PromiseIssue['code'],
  filePath: string,
  message: string,
  suggestedAction: string,
  severity: PromiseIssue['severity'] = 'warning',
  evidence?: string
): PromiseIssue => ({
  severity,
  code,
  path: filePath,
  evidence,
  message,
  suggestedAction
});

const parseJsonDocument = (
  content: string,
  filePath: string,
  code: PromiseIssue['code']
): { document?: unknown; issues: PromiseIssue[] } => {
  try {
    return { document: JSON.parse(content), issues: [] };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      issues: [issue(
        code,
        filePath,
        `JSON 无法解析：${detail}`,
        '修正 tracking JSON 格式后重新运行 promise:check',
        'error',
        detail
      )]
    };
  }
};

const normalizePromiseType = (value: unknown): StoryPromiseType =>
  VALID_PROMISE_TYPES.includes(String(value) as StoryPromiseType)
    ? value as StoryPromiseType
    : 'mystery';

const normalizePromiseStatus = (value: unknown): StoryPromiseStatus =>
  VALID_PROMISE_STATUSES.includes(String(value) as StoryPromiseStatus)
    ? value as StoryPromiseStatus
    : 'open';

const parsePromises = (content: string, filePath: string): {
  promises: StoryPromise[];
  issues: PromiseIssue[];
} => {
  const parsed = parseJsonDocument(content, filePath, 'INVALID_PROMISE_DOCUMENT');
  if (!parsed.document) {
    return { promises: [], issues: parsed.issues };
  }

  if (!isRecord(parsed.document) || !Array.isArray(parsed.document.promises)) {
    return {
      promises: [],
      issues: [issue(
        'INVALID_PROMISE_DOCUMENT',
        filePath,
        'promises.json 顶层必须包含 promises 数组',
        '把读者承诺记录到 { "promises": [] } 中',
        'error'
      )]
    };
  }

  const promises: StoryPromise[] = [];
  const issues: PromiseIssue[] = [];
  parsed.document.promises.forEach((candidate, index) => {
    const itemPath = `${filePath}#promises[${index}]`;
    if (!isRecord(candidate)) {
      issues.push(issue(
        'INVALID_PROMISE_ITEM',
        itemPath,
        'StoryPromise 必须是对象',
        '删除无效项或改成 StoryPromise 对象',
        'error'
      ));
      return;
    }

    const required = ['id', 'promise', 'establishedAt', 'readerExpectation'];
    for (const field of required) {
      if (!isNonEmptyString(candidate[field])) {
        issues.push(issue(
          'MISSING_PROMISE_FIELD',
          `${itemPath}.${field}`,
          `StoryPromise 缺少 ${field}`,
          `补齐 ${field} 后再检查 promise 节奏`,
          'warning'
        ));
      }
    }

    if (required.some(field => !isNonEmptyString(candidate[field]))) {
      return;
    }

    promises.push({
      id: String(candidate.id).trim(),
      type: normalizePromiseType(candidate.type),
      promise: String(candidate.promise).trim(),
      establishedAt: String(candidate.establishedAt).trim(),
      reinforcedAt: toStringArray(candidate.reinforcedAt),
      paidOffAt: isNonEmptyString(candidate.paidOffAt) ? candidate.paidOffAt.trim() : undefined,
      invertedAt: isNonEmptyString(candidate.invertedAt) ? candidate.invertedAt.trim() : undefined,
      status: normalizePromiseStatus(candidate.status),
      readerExpectation: String(candidate.readerExpectation).trim()
    });
  });

  return { promises, issues };
};

const parseTension = (content: string, filePath: string): {
  points: TensionPoint[];
  issues: PromiseIssue[];
} => {
  const parsed = parseJsonDocument(content, filePath, 'INVALID_TENSION_DOCUMENT');
  if (!parsed.document) {
    return { points: [], issues: parsed.issues };
  }

  if (!isRecord(parsed.document) || !Array.isArray(parsed.document.tensionPoints)) {
    return {
      points: [],
      issues: [issue(
        'INVALID_TENSION_DOCUMENT',
        filePath,
        'tension-curve.json 顶层必须包含 tensionPoints 数组',
        '把章节张力记录到 { "tensionPoints": [] } 中',
        'error'
      )]
    };
  }

  const points: TensionPoint[] = [];
  const issues: PromiseIssue[] = [];
  parsed.document.tensionPoints.forEach((candidate, index) => {
    const itemPath = `${filePath}#tensionPoints[${index}]`;
    if (!isRecord(candidate) || !isNonEmptyString(candidate.chapter)) {
      issues.push(issue(
        'INVALID_TENSION_POINT',
        itemPath,
        'TensionPoint 必须声明 chapter',
        '补齐 chapter、tension、emotionalCharge、informationGain、payoff',
        'warning'
      ));
      return;
    }

    points.push({
      chapter: String(candidate.chapter).trim(),
      scene: isNonEmptyString(candidate.scene) ? candidate.scene.trim() : undefined,
      tension: readNumber(candidate.tension),
      emotionalCharge: readNumber(candidate.emotionalCharge),
      informationGain: readNumber(candidate.informationGain),
      payoff: readNumber(candidate.payoff)
    });
  });

  return {
    points: points.sort((left, right) => chapterNumber(left.chapter) - chapterNumber(right.chapter)),
    issues
  };
};

const createDefaultRhythmConfig = (
  input: InitRhythmConfigInput
): RhythmConfig => {
  const target = readPositiveNumber(input.averageChapterLength, 3000);
  const spread = Math.max(400, Math.round((target * 0.2) / 100) * 100);

  return {
    schemaVersion: '1.0',
    sourceMode: 'manual-abstract',
    safetyBoundary: '只记录节奏、结构和密度，不复制参考作品表达、角色、桥段或专有设定。',
    averageChapterLength: {
      min: target - spread,
      target,
      max: target + spread
    },
    hookFrequency: {
      everyChapters: readPositiveNumber(input.hookFrequency, 3)
    },
    payoffInterval: {
      everyChapters: readPositiveNumber(input.payoffInterval, 6)
    },
    dialogueActionDescriptionRatio: {
      dialogue: 40,
      action: 40,
      description: 20
    },
    tensionPattern: ['hook', 'build', 'payoff'],
    infoRevealDensity: {
      targetPerChapter: readPositiveNumber(input.infoRevealDensity, 2)
    },
    notes: [
      '本配置只来自作者手工输入的抽象节奏参数。',
      '不要粘贴、保存或解析参考作品原文。',
      '只借鉴章节长度、钩子频率、回报间隔、信息密度和情绪曲线。'
    ]
  };
};

const parseRhythmConfig = (content: string, filePath: string): {
  config?: RhythmConfig;
  issues: PromiseIssue[];
} => {
  const parsed = parseJsonDocument(content, filePath, 'INVALID_RHYTHM_CONFIG');
  if (!parsed.document) {
    return { issues: parsed.issues };
  }

  if (!isRecord(parsed.document)) {
    return {
      issues: [issue(
        'INVALID_RHYTHM_CONFIG',
        filePath,
        'rhythm-config.json 顶层必须是对象',
        '运行 rhythm:init 生成本地抽象节奏配置',
        'error'
      )]
    };
  }

  const document = parsed.document;
  if (document.sourceMode !== 'manual-abstract') {
    return {
      issues: [issue(
        'INVALID_RHYTHM_CONFIG',
        filePath,
        'rhythm-config 只支持 manual-abstract，不能保存或解析参考作品原文',
        '改为只填写抽象节奏参数，例如章节长度、钩子频率和信息密度',
        'error',
        String(document.sourceMode ?? 'missing')
      )]
    };
  }

  const average = isRecord(document.averageChapterLength) ? document.averageChapterLength : {};
  const hook = isRecord(document.hookFrequency) ? document.hookFrequency : {};
  const payoff = isRecord(document.payoffInterval) ? document.payoffInterval : {};
  const ratio = isRecord(document.dialogueActionDescriptionRatio) ? document.dialogueActionDescriptionRatio : {};
  const density = isRecord(document.infoRevealDensity) ? document.infoRevealDensity : {};

  return {
    config: {
      schemaVersion: '1.0',
      sourceMode: 'manual-abstract',
      safetyBoundary: isNonEmptyString(document.safetyBoundary)
        ? document.safetyBoundary.trim()
        : '只记录节奏、结构和密度，不复制参考作品表达、角色、桥段或专有设定。',
      averageChapterLength: {
        min: readPositiveNumber(average.min, 2400),
        target: readPositiveNumber(average.target, 3000),
        max: readPositiveNumber(average.max, 3600)
      },
      hookFrequency: {
        everyChapters: readPositiveNumber(hook.everyChapters, 3)
      },
      payoffInterval: {
        everyChapters: readPositiveNumber(payoff.everyChapters, 6)
      },
      dialogueActionDescriptionRatio: {
        dialogue: readNumber(ratio.dialogue, 40),
        action: readNumber(ratio.action, 40),
        description: readNumber(ratio.description, 20)
      },
      tensionPattern: toStringArray(document.tensionPattern),
      infoRevealDensity: {
        targetPerChapter: readPositiveNumber(density.targetPerChapter, 2)
      },
      notes: toStringArray(document.notes)
    },
    issues: []
  };
};

const readRhythmConfig = async (input: PromiseInput): Promise<{
  rhythmConfigPath: string;
  config?: RhythmConfig;
  issues: PromiseIssue[];
}> => {
  const filePath = rhythmConfigPath(input.projectRoot);
  if (!await input.fileSystem.pathExists(filePath)) {
    return { rhythmConfigPath: filePath, issues: [] };
  }

  const parsed = parseRhythmConfig(await input.fileSystem.readFile(filePath), filePath);
  return {
    rhythmConfigPath: filePath,
    config: parsed.config,
    issues: parsed.issues
  };
};

const readPromises = async (input: PromiseInput): Promise<{
  promisesPath: string;
  promises: StoryPromise[];
  issues: PromiseIssue[];
}> => {
  const filePath = promisesPath(input.projectRoot);
  if (!await input.fileSystem.pathExists(filePath)) {
    return {
      promisesPath: filePath,
      promises: [],
      issues: [issue(
        'INVALID_PROMISE_DOCUMENT',
        filePath,
        '缺少 spec/tracking/promises.json',
        '从模板创建 promises.json，记录 open/reinforced/paid-off 承诺',
        'warning'
      )]
    };
  }

  const parsed = parsePromises(await input.fileSystem.readFile(filePath), filePath);
  return {
    promisesPath: filePath,
    promises: parsed.promises,
    issues: parsed.issues
  };
};

const readTension = async (input: PromiseInput): Promise<{
  tensionPath: string;
  points: TensionPoint[];
  issues: PromiseIssue[];
}> => {
  const filePath = tensionPath(input.projectRoot);
  if (!await input.fileSystem.pathExists(filePath)) {
    return {
      tensionPath: filePath,
      points: [],
      issues: [issue(
        'INVALID_TENSION_DOCUMENT',
        filePath,
        '缺少 spec/tracking/tension-curve.json',
        '从模板创建 tension-curve.json，记录章节张力曲线',
        'info'
      )]
    };
  }

  const parsed = parseTension(await input.fileSystem.readFile(filePath), filePath);
  return {
    tensionPath: filePath,
    points: parsed.points,
    issues: parsed.issues
  };
};

const chapterNumber = (value: string): number => {
  const match = value.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

const collectCurrentChapter = (points: readonly TensionPoint[], promises: readonly StoryPromise[]): number => {
  const fromTension = points.map(point => chapterNumber(point.chapter));
  const fromPromises = promises.flatMap(promise => [
    chapterNumber(promise.establishedAt),
    chapterNumber(promise.paidOffAt ?? ''),
    ...promise.reinforcedAt.map(chapterNumber)
  ]);

  return Math.max(0, ...fromTension, ...fromPromises);
};

const checkPromiseIssues = (
  promises: readonly StoryPromise[],
  currentChapter: number,
  filePath: string
): PromiseIssue[] => {
  const issues: PromiseIssue[] = [];

  for (const promise of promises) {
    const itemPath = `${filePath}#${promise.id}`;
    const establishedChapter = chapterNumber(promise.establishedAt);
    const lastProgressChapter = Math.max(
      establishedChapter,
      ...promise.reinforcedAt.map(chapterNumber),
      chapterNumber(promise.paidOffAt ?? '')
    );
    const openTooLong = ['open', 'reinforced', 'stale'].includes(promise.status)
      && !promise.paidOffAt
      && establishedChapter > 0
      && currentChapter - lastProgressChapter >= 10;

    if (openTooLong) {
      issues.push(issue(
        'PROMISE_OPEN_TOO_LONG',
        itemPath,
        `读者承诺长期未推进：${promise.id}`,
        '安排推进、反转或兑现节点，并把它写入 tasks.md',
        'warning',
        `establishedAt=${promise.establishedAt}; currentChapter=${currentChapter}`
      ));
    }

    if (promise.status === 'paid-off' && !promise.paidOffAt) {
      issues.push(issue(
        'PROMISE_PAYOFF_MISSING_EVIDENCE',
        itemPath,
        `promise 标记为 paid-off 但缺少 paidOffAt：${promise.id}`,
        '补充兑现章节/场景 evidence，或把状态改回 open/reinforced',
        'error',
        `status=${promise.status}`
      ));
    }

    if (
      !promise.paidOffAt
      && promise.reinforcedAt.length >= 3
      && new Set(promise.reinforcedAt).size >= 3
    ) {
      issues.push(issue(
        'PROMISE_REPEATED_WITHOUT_PROGRESS',
        itemPath,
        `promise 多次重复建立但缺少推进或兑现：${promise.id}`,
        '把下一次重复露出改为实质推进、误导反转或阶段性兑现',
        'warning',
        `reinforcedAt=${promise.reinforcedAt.join(', ')}`
      ));
    }
  }

  return issues;
};

const checkTensionIssues = (
  points: readonly TensionPoint[],
  filePath: string
): PromiseIssue[] => {
  const issues: PromiseIssue[] = [];

  for (const point of points) {
    if (point.tension >= 7 && point.payoff <= 2) {
      issues.push(issue(
        'TENSION_PAYOFF_GAP',
        `${filePath}#${point.chapter}`,
        `高张力章节缺少兑现感：${point.chapter}`,
        '补充小回报、阶段胜利或信息收益，避免只吊胃口',
        'warning',
        `tension=${point.tension}; payoff=${point.payoff}`
      ));
    }
  }

  const flatline = points.filter(point =>
    point.tension <= 3
    && point.emotionalCharge <= 3
    && point.informationGain <= 3
    && point.payoff <= 3
  );
  if (flatline.length >= 3) {
    issues.push(issue(
      'TENSION_LONG_FLATLINE',
      filePath,
      `连续低张力点过多：${flatline.map(point => point.chapter).join(', ')}`,
      '插入冲突升级、信息揭示或阶段兑现，打破平线',
      'info',
      flatline.map(point => `${point.chapter}:${point.tension}`).join(', ')
    ));
  }

  return issues;
};

const highTensionOrHook = (point: TensionPoint): boolean =>
  point.tension >= 7 || point.emotionalCharge >= 7;

const hasPayoff = (point: TensionPoint): boolean =>
  point.payoff >= 4;

const checkRhythmIssues = (
  points: readonly TensionPoint[],
  rhythmConfig: RhythmConfig | undefined,
  filePath: string
): PromiseIssue[] => {
  if (!rhythmConfig || points.length === 0) {
    return [];
  }

  const issues: PromiseIssue[] = [];
  const hookInterval = rhythmConfig.hookFrequency.everyChapters;
  const payoffInterval = rhythmConfig.payoffInterval.everyChapters;
  const infoTarget = rhythmConfig.infoRevealDensity.targetPerChapter;

  const hookWindowWithoutHook = points.length >= hookInterval
    && points.slice(-hookInterval).every(point => !highTensionOrHook(point));
  if (hookWindowWithoutHook) {
    issues.push(issue(
      'RHYTHM_HOOK_INTERVAL_GAP',
      filePath,
      `最近 ${hookInterval} 个张力点缺少高强度钩子`,
      '根据 rhythm-config 安排一次冲突升级、强悬念、反转或情绪峰值',
      'warning',
      `hookFrequency=${hookInterval}`
    ));
  }

  const payoffWindowWithoutPayoff = points.length >= payoffInterval
    && points.slice(-payoffInterval).every(point => !hasPayoff(point));
  if (payoffWindowWithoutPayoff) {
    issues.push(issue(
      'RHYTHM_PAYOFF_INTERVAL_GAP',
      filePath,
      `最近 ${payoffInterval} 个张力点缺少阶段回报`,
      '安排小胜利、信息收益、关系推进或阶段兑现，避免只积累期待',
      'warning',
      `payoffInterval=${payoffInterval}`
    ));
  }

  const averageInfoGain = points.reduce((total, point) => total + point.informationGain, 0) / points.length;
  if (averageInfoGain < infoTarget) {
    issues.push(issue(
      'RHYTHM_INFO_REVEAL_DENSITY_GAP',
      filePath,
      `平均信息揭示密度偏低：${averageInfoGain.toFixed(1)}/${infoTarget}`,
      '增加读者可见的新信息、线索推进或世界规则行动后果，不要复述旧信息',
      'info',
      `infoRevealDensity=${infoTarget}`
    ));
  }

  return issues;
};

const summarizePromises = (promises: readonly StoryPromise[]): PromiseCheckResult['summary'] => ({
  open: promises.filter(promise => promise.status === 'open').length,
  reinforced: promises.filter(promise => promise.status === 'reinforced').length,
  paidOff: promises.filter(promise => promise.status === 'paid-off').length,
  stale: promises.filter(promise => promise.status === 'stale').length,
  abandoned: promises.filter(promise => promise.status === 'abandoned').length
});

export const createPromiseTaskDrafts = (
  issues: readonly PromiseIssue[]
): PromiseTaskDraft[] => issues
  .filter(issue => issue.code.startsWith('PROMISE_') || issue.code.startsWith('TENSION_'))
  .map(issue => ({
    task_title: `[${issue.severity}] 处理 ${issue.code}`,
    description: `${toPosixPath(issue.path)}：${issue.message}`,
    severity: issue.severity,
    sourceFinding: `reader:${issue.code}`,
    suggestedAction: issue.suggestedAction
  }));

export const checkPromises = async (input: PromiseInput): Promise<PromiseCheckResult> => {
  const [promiseResult, tensionResult] = await Promise.all([
    readPromises(input),
    readTension(input)
  ]);
  const currentChapter = collectCurrentChapter(tensionResult.points, promiseResult.promises);
  const issues = [
    ...promiseResult.issues,
    ...tensionResult.issues,
    ...checkPromiseIssues(promiseResult.promises, currentChapter, promiseResult.promisesPath),
    ...checkTensionIssues(tensionResult.points, tensionResult.tensionPath)
  ];

  return {
    projectRoot: input.projectRoot,
    promisesPath: promiseResult.promisesPath,
    tensionPath: tensionResult.tensionPath,
    promises: promiseResult.promises,
    tensionPoints: tensionResult.points,
    issues,
    taskDrafts: createPromiseTaskDrafts(issues),
    summary: summarizePromises(promiseResult.promises)
  };
};

export const listPromises = async (input: PromiseInput): Promise<PromiseListResult> => {
  const result = await readPromises(input);
  return {
    projectRoot: input.projectRoot,
    promisesPath: result.promisesPath,
    promises: result.promises,
    issues: result.issues
  };
};

const renderTensionMarkdown = (
  points: readonly TensionPoint[],
  rhythmConfig?: RhythmConfig
): string => [
  ...(rhythmConfig
    ? [
      `Rhythm Config：${rhythmConfig.sourceMode}`,
      `章节长度：${rhythmConfig.averageChapterLength.min}-${rhythmConfig.averageChapterLength.max}（target ${rhythmConfig.averageChapterLength.target}）`,
      `钩子频率：每 ${rhythmConfig.hookFrequency.everyChapters} 章；回报间隔：每 ${rhythmConfig.payoffInterval.everyChapters} 章；信息密度：${rhythmConfig.infoRevealDensity.targetPerChapter}/章`,
      ''
    ]
    : []),
  '| Chapter | Scene | Tension | Emotion | Info | Payoff |',
  '| --- | --- | ---: | ---: | ---: | ---: |',
  ...(points.length > 0
    ? points.map(point =>
      `| ${point.chapter} | ${point.scene ?? '-'} | ${point.tension} | ${point.emotionalCharge} | ${point.informationGain} | ${point.payoff} |`
    )
    : ['| - | - | 0 | 0 | 0 | 0 |'])
].join('\n');

export const chartTension = async (input: PromiseInput): Promise<TensionChartResult> => {
  const [result, rhythm] = await Promise.all([
    readTension(input),
    readRhythmConfig(input)
  ]);
  const issues = [
    ...result.issues,
    ...rhythm.issues,
    ...checkTensionIssues(result.points, result.tensionPath),
    ...checkRhythmIssues(result.points, rhythm.config, rhythm.rhythmConfigPath)
  ];

  return {
    projectRoot: input.projectRoot,
    tensionPath: result.tensionPath,
    rhythmConfigPath: rhythm.rhythmConfigPath,
    rhythmConfig: rhythm.config,
    points: result.points,
    issues,
    markdown: renderTensionMarkdown(result.points, rhythm.config)
  };
};

export const initRhythmConfig = async (
  input: InitRhythmConfigInput
): Promise<InitRhythmConfigResult> => {
  const outputPath = rhythmConfigPath(input.projectRoot);
  const config = createDefaultRhythmConfig(input);
  const written = input.noWrite !== true;

  if (written) {
    await input.fileSystem.ensureDir(path.dirname(outputPath));
    await input.fileSystem.writeJson(outputPath, config, { spaces: 2 });
  }

  return {
    projectRoot: input.projectRoot,
    outputPath,
    config,
    written
  };
};

export const renderPromiseList = (result: PromiseListResult): string => [
  'Promise List',
  '',
  `文件：${toPosixPath(result.promisesPath)}`,
  `Promises：${result.promises.length}`,
  '',
  ...(result.promises.length > 0
    ? result.promises.map(promise => `- ${promise.id}：${promise.status}，${promise.promise}`)
    : ['- 暂无 promise']),
  '',
  ...(result.issues.length > 0
    ? result.issues.map(item => `- [${item.severity}] ${item.code}: ${toPosixPath(item.path)} - ${item.message}`)
    : [])
].join('\n').trimEnd();

export const renderPromiseCheck = (result: PromiseCheckResult): string => [
  'Promise Check',
  '',
  `Promises：${result.promises.length}`,
  `Tension Points：${result.tensionPoints.length}`,
  `问题：${result.issues.length}`,
  `任务草稿：${result.taskDrafts.length}`,
  '',
  ...(result.issues.length > 0
    ? result.issues.map(item => `- [${item.severity}] ${item.code}: ${toPosixPath(item.path)} - ${item.message}；建议：${item.suggestedAction}`)
    : ['- 无'])
].join('\n').trimEnd();

export const renderTensionChart = (result: TensionChartResult): string => [
  'Tension Chart',
  '',
  `文件：${toPosixPath(result.tensionPath)}`,
  `Points：${result.points.length}`,
  `问题：${result.issues.length}`,
  '',
  result.markdown,
  '',
  ...(result.issues.length > 0
    ? result.issues.map(item => `- [${item.severity}] ${item.code}: ${toPosixPath(item.path)} - ${item.message}`)
    : [])
].join('\n').trimEnd();

export const renderRhythmInit = (result: InitRhythmConfigResult): string => [
  'Rhythm Config 初始化',
  '',
  `模式：${result.config.sourceMode}`,
  `输出：${toPosixPath(result.outputPath)}`,
  `写入：${result.written ? '是' : '否'}`,
  `章节长度：${result.config.averageChapterLength.min}-${result.config.averageChapterLength.max}（target ${result.config.averageChapterLength.target}）`,
  `钩子频率：每 ${result.config.hookFrequency.everyChapters} 章`,
  `回报间隔：每 ${result.config.payoffInterval.everyChapters} 章`,
  `安全边界：${result.config.safetyBoundary}`
].join('\n').trimEnd();

export const collectPromiseIds = (promises: readonly StoryPromise[]): string[] =>
  unique(promises.map(promise => promise.id));
