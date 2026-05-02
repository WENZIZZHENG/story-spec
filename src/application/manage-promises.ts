import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import type {
  PromiseIssue,
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
  points: TensionPoint[];
  issues: PromiseIssue[];
  markdown: string;
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

const renderTensionMarkdown = (points: readonly TensionPoint[]): string => [
  '| Chapter | Scene | Tension | Emotion | Info | Payoff |',
  '| --- | --- | ---: | ---: | ---: | ---: |',
  ...(points.length > 0
    ? points.map(point =>
      `| ${point.chapter} | ${point.scene ?? '-'} | ${point.tension} | ${point.emotionalCharge} | ${point.informationGain} | ${point.payoff} |`
    )
    : ['| - | - | 0 | 0 | 0 | 0 |'])
].join('\n');

export const chartTension = async (input: PromiseInput): Promise<TensionChartResult> => {
  const result = await readTension(input);
  const issues = [
    ...result.issues,
    ...checkTensionIssues(result.points, result.tensionPath)
  ];

  return {
    projectRoot: input.projectRoot,
    tensionPath: result.tensionPath,
    points: result.points,
    issues,
    markdown: renderTensionMarkdown(result.points)
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

export const collectPromiseIds = (promises: readonly StoryPromise[]): string[] =>
  unique(promises.map(promise => promise.id));
