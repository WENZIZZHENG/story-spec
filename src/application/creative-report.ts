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

export interface CreativeReportInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
}

export interface CreativeReportAnswer {
  questionId: string;
  answer: string;
  source: ClarificationAnswer['source'];
}

export interface CreativeReportQuestion {
  questionId: string;
  question: string;
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
  funPrompts: CreativeReportFunPrompt[];
  activeBranches: ActiveBranchSummary[];
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

  if (!result.hasClarifications) {
    actions.push(`storyspec interview ${result.story}`);
    if (activeBranchAction) {
      actions.push(activeBranchAction);
    }
    actions.push(`storyspec next ${result.story}`);
    return actions;
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
  const created = coreElements
    .filter(element => element.status === 'confirmed' || element.status === 'partial')
    .map(element => `${skeletonLabelByElementId(element.id)}：${element.summary}`);
  const pendingSoul = coreElements
    .filter(element => element.status === 'missing' || element.status === 'partial' || element.status === 'deferred')
    .slice(0, 5)
    .map(element => `${element.label}：${element.nextPrompt ?? '仍待共创。'}`);
  const confirmedText = confirmed.map(item => item.answer).join('；');
  const summaryParts = [
    record?.premise.trim(),
    ...coreElements
      .filter(element => element.status === 'confirmed' || element.status === 'partial')
      .map(element => element.summary),
    confirmedText
  ]
    .filter((item): item is string => Boolean(item && item.trim()))
    .join('；');

  return {
    summary: summaryParts || '这部小说的灵魂仍待共创；目前只有项目框架或零散线索。',
    created: created.length > 0 ? created : ['项目框架已建立，但小说灵魂仍待共创。'],
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
      source: answer.source
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
      source: answer.source
    })) ?? [];
  const pendingQuestions = record?.questions
    .filter(question => question.required && !hasConfirmedAnswer(record.answers, question))
    .map(question => ({
      questionId: question.id,
      question: question.question
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
  const funPrompts = buildFunPrompts(story.name, coreElements);
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
    funPrompts,
    activeBranches,
    driftIssues: storyDriftIssues,
    cannotFinalize: summary.cannotFinalize
  };

  return {
    ...base,
    nextActions: buildNextActions(base)
  };
};

export const renderCreativeReport = (result: CreativeReportResult): string => [
  'StorySpec 创作控制权报告',
  '',
  `故事：${result.story}`,
  `路径：${relativePath(result.projectRoot, result.storyPath)}`,
  `澄清记录：${result.hasClarifications ? '已建立' : '缺失'}`,
  '',
  '用户已确认：',
  ...(result.confirmed.length > 0
    ? result.confirmed.map(item => `- ${item.questionId}：${item.answer}`)
    : ['- 暂无。']),
  '',
  '需要澄清：',
  ...(result.pendingQuestions.length > 0
    ? result.pendingQuestions.map(item => `- ${item.questionId}：${item.question}`)
    : ['- 暂无 required 待确认问题。']),
  '',
  'AI 建议待确认：',
  ...(result.aiSuggestions.length > 0
    ? result.aiSuggestions.map(item => `- ${item.questionId}：${item.answer}`)
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
  ...result.storySkeleton.created.map(item => `- ${item}`),
  '',
  '创作回声：',
  `- 当前风味：${result.creationEcho.flavor}`,
  '- 最有生命力：',
  ...result.creationEcho.strongestParts.map(item => `  - ${item}`),
  '- 还差的关键部件：',
  ...(result.creationEcho.missingPieces.length > 0
    ? result.creationEcho.missingPieces.map(item => `  - ${item}`)
    : ['  - 暂无明显缺口。']),
  `- 下一轮回声：${result.creationEcho.nextEcho}`,
  '',
  '仍可探索的乐趣点：',
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
      `- ${item.label}：${getStoryCoreElementStatusText(item.status)}。${item.summary}`,
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
