import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import {
  parseClarificationQuestionSet,
  type ClarificationIssue
} from '../domain/clarification-schema.js';
import type { ClarificationQuestion } from '../domain/clarification.js';
import {
  parseExampleBranchSet,
  type ExampleBranch,
  type ExampleBranchIssue
} from '../domain/example-branch.js';

export type ClarificationSelectionMode = 'default' | 'fewer' | 'examples-only';

export interface ClarificationQuestionPack {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  questions: ClarificationQuestion[];
}

export interface ExampleBranchPack {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  branches: ExampleBranch[];
}

export interface SelectedClarificationQuestion {
  packId: string;
  packName: string;
  question: ClarificationQuestion;
}

export interface SelectedExampleBranch {
  packId: string;
  packName: string;
  branch: ExampleBranch;
}

export type InterviewStageId =
  | 'seed'
  | 'core-cast'
  | 'stage'
  | 'power'
  | 'conflict'
  | 'promise'
  | 'growth-route'
  | 'voice';

export type InterviewStageStatus = 'done' | 'active' | 'pending';

export interface InterviewStagePlan {
  id: InterviewStageId;
  label: string;
  goal: string;
  status: InterviewStageStatus;
  questionIds: string[];
}

export interface ClarificationNextAction {
  id: 'continue-interview' | 'generate-candidates' | 'preview-specify' | 'pause-draft';
  label: string;
  description: string;
}

export interface ClarificationSelectionOptions {
  mode?: ClarificationSelectionMode;
  maxQuestions?: number;
  maxExamples?: number;
  exampleBranchPacks?: ExampleBranchPack[];
}

export interface ClarificationSelectionResult {
  mode: ClarificationSelectionMode;
  matchedPacks: string[];
  selectedQuestions: SelectedClarificationQuestion[];
  exampleBranches: SelectedExampleBranch[];
  copyableExamples: string[];
  interviewStages: InterviewStagePlan[];
  nextActions: ClarificationNextAction[];
  issues: ClarificationIssue[];
}

export interface LoadClarificationQuestionPacksResult {
  packs: ClarificationQuestionPack[];
  issues: ClarificationIssue[];
}

export interface LoadClarificationExampleBranchPacksResult {
  packs: ExampleBranchPack[];
  issues: ExampleBranchIssue[];
}

const dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(dirname, '..', '..');
const defaultClarificationTemplateDir = path.join(packageRoot, 'templates', 'clarification');
const defaultClarificationExampleBranchDir = path.join(defaultClarificationTemplateDir, 'examples');

const PACK_FILE_ORDER = [
  'core.yaml',
  'portal-fantasy.yaml',
  'magic-system.yaml',
  'slow-burn-romance.yaml',
  'civilization-threat.yaml',
  'cozy-adventure.yaml',
  'kingdom-building-support.yaml'
];

const EXAMPLE_BRANCH_FILE_ORDER = [
  'core.yaml',
  'portal-fantasy.yaml',
  'magic-system.yaml',
  'slow-burn-romance.yaml',
  'civilization-threat.yaml',
  'cozy-adventure.yaml',
  'kingdom-building-support.yaml'
];

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readPackHeader = (
  content: string,
  filePath: string
): Omit<ClarificationQuestionPack, 'questions'> & { issues: ClarificationIssue[] } => {
  const header = parseClarificationQuestionSet(content, filePath);
  // Reuse js-yaml through the question parser result by reading simple metadata with regex-free YAML parsing
  // would duplicate parser concerns, so keep metadata best-effort and validate questions strictly.
  const yaml = content.split(/\r?\nquestions:\r?\n/)[0];
  const metadata = Object.fromEntries(
    yaml.split(/\r?\n/)
      .map(line => line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map(match => [match[1], match[2].trim()])
  );

  return {
    id: metadata.id || path.basename(filePath, path.extname(filePath)),
    name: metadata.name || metadata.id || path.basename(filePath, path.extname(filePath)),
    description: metadata.description || '',
    keywords: [],
    issues: header.issues
  };
};

const readKeywordBlock = (content: string): string[] => {
  const lines = content.split(/\r?\n/);
  const keywords: string[] = [];
  const start = lines.findIndex(line => line.trim() === 'keywords:');
  if (start === -1) {
    return keywords;
  }

  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) {
      break;
    }

    const match = line.match(/^\s*-\s*(.+?)\s*$/);
    if (match && match[1].trim()) {
      keywords.push(match[1].trim());
    }
  }

  return keywords;
};

const parseExampleBranchPack = (
  content: string,
  filePath: string
): ExampleBranchPack & { issues: ExampleBranchIssue[] } => {
  const branchSet = parseExampleBranchSet(content, filePath);
  const document = yaml.load(content);
  const metadata = isRecord(document) ? document : {};

  return {
    id: isNonEmptyString(metadata.id) ? metadata.id.trim() : path.basename(filePath, path.extname(filePath)),
    name: isNonEmptyString(metadata.name)
      ? metadata.name.trim()
      : (isNonEmptyString(metadata.id) ? metadata.id.trim() : path.basename(filePath, path.extname(filePath))),
    description: isNonEmptyString(metadata.description) ? metadata.description.trim() : '',
    keywords: readKeywordBlock(content),
    branches: branchSet.branches,
    issues: branchSet.issues
  };
};

const parsePack = (content: string, filePath: string): ClarificationQuestionPack & { issues: ClarificationIssue[] } => {
  const header = readPackHeader(content, filePath);
  const questions = parseClarificationQuestionSet(content, filePath);
  const exampleIssues = questions.questions
    .filter(question => question.exampleAnswers.length < 2)
    .map(question => ({
      severity: 'warning' as const,
      code: 'MISSING_CLARIFICATION_QUESTION_FIELD' as const,
      path: `${filePath}#questions[${question.id}].exampleAnswers`,
      message: `澄清问题至少需要 2 个示例答案：${question.id}`
    }));

  return {
    id: header.id,
    name: header.name,
    description: header.description,
    keywords: readKeywordBlock(content),
    questions: questions.questions,
    issues: [...header.issues, ...questions.issues, ...exampleIssues]
  };
};

export const loadClarificationQuestionPacks = async (
  templateDir = defaultClarificationTemplateDir
): Promise<LoadClarificationQuestionPacksResult> => {
  const fileNames = (await readdir(templateDir))
    .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
    .filter(file => file !== 'question-set.example.yaml')
    .sort((left, right) => {
      const leftIndex = PACK_FILE_ORDER.indexOf(left);
      const rightIndex = PACK_FILE_ORDER.indexOf(right);
      if (leftIndex !== -1 || rightIndex !== -1) {
        return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex)
          - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
      }
      return left.localeCompare(right);
    });

  const packs: ClarificationQuestionPack[] = [];
  const issues: ClarificationIssue[] = [];

  for (const fileName of fileNames) {
    const filePath = path.join(templateDir, fileName);
    const pack = parsePack(await readFile(filePath, 'utf-8'), filePath);
    packs.push({
      id: pack.id,
      name: pack.name,
      description: pack.description,
      keywords: pack.keywords,
      questions: pack.questions
    });
    issues.push(...pack.issues);
  }

  return { packs, issues };
};

export const loadClarificationExampleBranches = async (
  templateDir = defaultClarificationExampleBranchDir
): Promise<LoadClarificationExampleBranchPacksResult> => {
  let fileNames: string[];
  try {
    fileNames = (await readdir(templateDir))
      .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
      .sort((left, right) => {
        const leftIndex = EXAMPLE_BRANCH_FILE_ORDER.indexOf(left);
        const rightIndex = EXAMPLE_BRANCH_FILE_ORDER.indexOf(right);
        if (leftIndex !== -1 || rightIndex !== -1) {
          return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex)
            - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
        }
        return left.localeCompare(right);
      });
  } catch {
    return { packs: [], issues: [] };
  }

  const packs: ExampleBranchPack[] = [];
  const issues: ExampleBranchIssue[] = [];

  for (const fileName of fileNames) {
    const filePath = path.join(templateDir, fileName);
    const pack = parseExampleBranchPack(await readFile(filePath, 'utf-8'), filePath);
    packs.push({
      id: pack.id,
      name: pack.name,
      description: pack.description,
      keywords: pack.keywords,
      branches: pack.branches
    });
    issues.push(...pack.issues);
  }

  return { packs, issues };
};

const normalizeInput = (input: string): string => input.trim().toLowerCase();

const scorePack = (input: string, pack: ClarificationQuestionPack): number => {
  if (pack.id === 'core') {
    return 1;
  }

  return pack.keywords.reduce((score, keyword) =>
    input.includes(keyword.toLowerCase()) ? score + 2 : score,
  0);
};

const questionWeight = (question: ClarificationQuestion): number =>
  question.required ? 2 : 1;

const INTERVIEW_STAGE_DEFINITIONS: readonly Omit<InterviewStagePlan, 'status' | 'questionIds'>[] = [
  {
    id: 'seed',
    label: '保留灵感',
    goal: '保留作者原始一句话灵感，不替作者扩写定稿。'
  },
  {
    id: 'core-cast',
    label: '主角与伙伴',
    goal: '确认主角、核心伙伴和关系张力。'
  },
  {
    id: 'stage',
    label: '第一舞台',
    goal: '确认第一舞台、社会结构和普通人压力。'
  },
  {
    id: 'power',
    label: '能力体系',
    goal: '确认能力用途、限制、代价和爽点来源。'
  },
  {
    id: 'conflict',
    label: '势力与冲突',
    goal: '确认第一卷阻力、势力逻辑和阶段性胜利。'
  },
  {
    id: 'promise',
    label: '阅读承诺',
    goal: '确认类型体验、前三章钩子和长线威胁露出节奏。'
  },
  {
    id: 'growth-route',
    label: '成功路线',
    goal: '确认主角如何一步步获得资源、能力、信任和影响力。'
  },
  {
    id: 'voice',
    label: '独特声音',
    goal: '确认叙述声音、价值判断和明确不想写成的样子。'
  }
];

const STAGE_TOPIC_PRIORITY: Record<InterviewStageId, readonly string[]> = {
  seed: ['premise'],
  'core-cast': ['protagonist', 'partner', 'relationship'],
  stage: ['setting', 'stage', 'world'],
  power: ['magic-system', 'power', 'ability'],
  conflict: ['faction', 'conflict'],
  promise: ['threat', 'tone', 'romance', 'adventure', 'building'],
  'growth-route': ['growth', 'success', 'route'],
  voice: ['voice', 'style']
};

const CORE_FIRST_QUESTION_IDS = [
  'core.protagonist',
  'core.stage',
  'magic.rule-hardness',
  'threat.first-symptom',
  'core.partner',
  'core.faction-conflict'
];

const stageForQuestion = (question: ClarificationQuestion): InterviewStageId => {
  for (const [stage, topics] of Object.entries(STAGE_TOPIC_PRIORITY) as [InterviewStageId, readonly string[]][]) {
    if (topics.includes(question.topic) || topics.some(topic => question.id.includes(topic))) {
      return stage;
    }
  }

  return 'promise';
};

const buildInterviewStages = (
  selected: SelectedClarificationQuestion[]
): InterviewStagePlan[] => {
  const selectedIdsByStage = new Map<InterviewStageId, string[]>(
    INTERVIEW_STAGE_DEFINITIONS.map(stage => [stage.id, []])
  );

  for (const item of selected) {
    selectedIdsByStage.get(stageForQuestion(item.question))?.push(item.question.id);
  }

  return INTERVIEW_STAGE_DEFINITIONS.map(definition => {
    const questionIds = selectedIdsByStage.get(definition.id) ?? [];
    return {
      ...definition,
      status: definition.id === 'seed'
        ? 'done'
        : (questionIds.length > 0 ? 'active' : 'pending'),
      questionIds
    };
  });
};

const sortByInterviewPriority = (
  selected: SelectedClarificationQuestion[]
): SelectedClarificationQuestion[] => selected.sort((left, right) => {
  const leftCoreIndex = CORE_FIRST_QUESTION_IDS.indexOf(left.question.id);
  const rightCoreIndex = CORE_FIRST_QUESTION_IDS.indexOf(right.question.id);
  if (leftCoreIndex !== -1 || rightCoreIndex !== -1) {
    return (leftCoreIndex === -1 ? Number.MAX_SAFE_INTEGER : leftCoreIndex)
      - (rightCoreIndex === -1 ? Number.MAX_SAFE_INTEGER : rightCoreIndex);
  }

  return questionWeight(right.question) - questionWeight(left.question)
    || left.packId.localeCompare(right.packId)
    || left.question.id.localeCompare(right.question.id);
});

const selectFromPacks = (
  packs: ClarificationQuestionPack[],
  maxQuestions: number
): SelectedClarificationQuestion[] => {
  const selected: SelectedClarificationQuestion[] = [];
  const selectedIds = new Set<string>();
  const allCandidates = packs.flatMap(pack =>
    pack.questions.map(question => ({
      packId: pack.id,
      packName: pack.name,
      question
    }))
  );

  for (const questionId of CORE_FIRST_QUESTION_IDS) {
    if (selected.length >= maxQuestions) {
      break;
    }

    const candidate = allCandidates.find(item => item.question.id === questionId);
    if (!candidate) {
      continue;
    }

    selected.push(candidate);
    selectedIds.add(candidate.question.id);
  }

  const packQueue = packs.map(pack => ({ pack, index: 0 }));

  while (selected.length < maxQuestions && packQueue.some(item => item.index < item.pack.questions.length)) {
    for (const item of packQueue) {
      if (selected.length >= maxQuestions) {
        break;
      }

      const question = item.pack.questions[item.index];
      item.index += 1;
      if (!question) {
        continue;
      }

      if (selectedIds.has(question.id)) {
        continue;
      }

      selected.push({
        packId: item.pack.id,
        packName: item.pack.name,
        question
      });
      selectedIds.add(question.id);
    }
  }

  return sortByInterviewPriority(selected);
};

const buildExamples = (
  packs: ClarificationQuestionPack[],
  maxExamples: number
): string[] => {
  const examples: string[] = [];
  for (const pack of packs) {
    for (const question of pack.questions) {
      for (const example of question.exampleAnswers) {
        if (examples.length >= maxExamples) {
          return examples;
        }
        examples.push(example);
      }
    }
  }

  return examples;
};

const buildExampleBranches = (
  packs: ExampleBranchPack[],
  maxExamples: number
): SelectedExampleBranch[] => {
  const branches: SelectedExampleBranch[] = [];
  const queue = packs.map(pack => ({ pack, index: 0 }));

  while (branches.length < maxExamples && queue.some(item => item.index < item.pack.branches.length)) {
    for (const item of queue) {
      if (branches.length >= maxExamples) {
        break;
      }

      const branch = item.pack.branches[item.index];
      item.index += 1;
      if (!branch) {
        continue;
      }

      branches.push({
        packId: item.pack.id,
        packName: item.pack.name,
        branch
      });
    }
  }

  return branches;
};

const scoreExampleBranchPack = (input: string, pack: ExampleBranchPack): number => {
  if (pack.id === 'core') {
    return 1;
  }

  return pack.keywords.reduce((score, keyword) =>
    input.includes(keyword.toLowerCase()) ? score + 2 : score,
  0);
};

const defaultNextActions = (): ClarificationNextAction[] => [
  {
    id: 'continue-interview',
    label: '继续访谈',
    description: '继续围绕当前最薄弱的故事骨架提问。'
  },
  {
    id: 'generate-candidates',
    label: '生成候选',
    description: '基于当前答案生成可改写候选，不直接定稿。'
  },
  {
    id: 'preview-specify',
    label: '预览规格',
    description: '先看将写入的 specification 预览，再决定是否 apply。'
  },
  {
    id: 'pause-draft',
    label: '暂存',
    description: '暂停后续小说编写，只保留当前澄清记录。'
  }
];

export const selectClarificationQuestions = (
  input: string,
  packs: ClarificationQuestionPack[],
  options: ClarificationSelectionOptions = {}
): ClarificationSelectionResult => {
  const mode = options.mode ?? 'default';
  const normalizedInput = normalizeInput(input);
  const scoredPacks = packs
    .map(pack => ({ pack, score: scorePack(normalizedInput, pack) }))
    .filter(item => item.score > 0)
    .sort((left, right) =>
      right.score - left.score
      || PACK_FILE_ORDER.indexOf(`${left.pack.id}.yaml`) - PACK_FILE_ORDER.indexOf(`${right.pack.id}.yaml`)
      || left.pack.id.localeCompare(right.pack.id)
    );

  const matchedPacks = scoredPacks.map(item => item.pack);
  const maxQuestions = options.maxQuestions ?? (mode === 'fewer' ? 6 : 10);
  const scoredExampleBranchPacks = options.exampleBranchPacks?.length
    ? options.exampleBranchPacks
      .map(pack => ({ pack, score: scoreExampleBranchPack(normalizedInput, pack) }))
      .filter(item => item.score > 0)
      .sort((left, right) =>
        right.score - left.score
        || EXAMPLE_BRANCH_FILE_ORDER.indexOf(`${left.pack.id}.yaml`) - EXAMPLE_BRANCH_FILE_ORDER.indexOf(`${right.pack.id}.yaml`)
        || left.pack.id.localeCompare(right.pack.id)
      )
    : [];
  const matchedExampleBranchPacks = scoredExampleBranchPacks.length > 0
    ? scoredExampleBranchPacks.map(item => item.pack)
    : (options.exampleBranchPacks ?? []);

  if (mode === 'examples-only') {
    return {
      mode,
      matchedPacks: matchedPacks.map(pack => pack.id),
      selectedQuestions: [],
      exampleBranches: buildExampleBranches(matchedExampleBranchPacks, options.maxExamples ?? 3),
      copyableExamples: buildExamples(matchedPacks, options.maxExamples ?? 6),
      interviewStages: buildInterviewStages([]),
      nextActions: defaultNextActions(),
      issues: []
    };
  }

  const selectedQuestions = selectFromPacks(matchedPacks, maxQuestions);

  return {
    mode,
    matchedPacks: matchedPacks.map(pack => pack.id),
    selectedQuestions,
    exampleBranches: buildExampleBranches(matchedExampleBranchPacks, options.maxExamples ?? 3),
    copyableExamples: buildExamples(matchedPacks, options.maxExamples ?? 3),
    interviewStages: buildInterviewStages(selectedQuestions),
    nextActions: defaultNextActions(),
    issues: []
  };
};
