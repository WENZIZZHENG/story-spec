import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import type { ClarificationRecord } from './manage-clarifications.js';
import { summarizeCreativeControl } from './creative-control-summary.js';
import {
  relativePath,
  resolveProjectPath,
  selectStoryProject,
  slugifyPathPart
} from './workbench-utils.js';
import {
  getStoryStageNextQuestions
} from '../domain/story-stage.js';
import { hasResolvedClarificationAnswer } from '../domain/clarification-answer-utils.js';
import {
  evaluateStoryCoreElements,
  getPlanBlockingCoreElements,
  getStoryCoreElementStatusText,
  type StoryCoreElementAssessment
} from '../domain/story-core-elements.js';

export type PreviewApplyErrorCode =
  | 'UNSUPPORTED_PREVIEW_KIND'
  | 'PREVIEW_NOT_FOUND'
  | 'PREVIEW_EXPIRED'
  | 'PREVIEW_BLOCKED'
  | 'MISSING_CLARIFICATIONS';

export class PreviewApplyError extends Error {
  constructor(
    public readonly code: PreviewApplyErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'PreviewApplyError';
  }
}

export interface PreviewRisk {
  severity: 'blocking' | 'warning';
  message: string;
}

export interface PreviewRecord {
  schemaVersion: '1.0';
  id: string;
  kind: 'specify' | 'plan';
  story: string;
  storyPath: string;
  targetPath: string;
  sourcePaths: string[];
  summary: string;
  content: string;
  risks: PreviewRisk[];
  createdAt: string;
  expiresAt: string;
  appliedAt?: string;
}

export interface CreateSpecifyPreviewInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  now?: () => Date;
}

export interface CreateSpecifyPreviewResult {
  record: PreviewRecord;
  previewPath: string;
  contentPath: string;
  markdownPath: string;
}

export interface CreatePlanPreviewInput extends CreateSpecifyPreviewInput {}

export interface CreatePlanPreviewResult extends CreateSpecifyPreviewResult {}

export interface ApplyPreviewInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  previewId: string;
  yes?: boolean;
  draft?: boolean;
  now?: () => Date;
}

export interface ApplyPreviewResult {
  record: PreviewRecord;
  previewPath: string;
  targetPath: string;
  dryRun: boolean;
  applied: boolean;
}

const previewRoot = (projectRoot: string): string => path.join(projectRoot, '.specify', 'previews');
const previewJsonPath = (projectRoot: string, previewId: string): string =>
  path.join(previewRoot(projectRoot), `${previewId}.json`);
const previewContentPath = (projectRoot: string, previewId: string): string =>
  path.join(previewRoot(projectRoot), `${previewId}.md`);
const previewReportPath = (projectRoot: string, previewId: string): string =>
  path.join(previewRoot(projectRoot), `${previewId}.preview.md`);

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const readClarificationRecord = async (
  fs: ProjectFileSystem,
  storyPath: string
): Promise<ClarificationRecord> => {
  const recordPath = path.join(storyPath, 'clarifications.json');
  if (!await fs.pathExists(recordPath)) {
    throw new PreviewApplyError(
      'MISSING_CLARIFICATIONS',
      '缺少 clarifications.json。请先运行 storyspec interview，再生成规格预览。'
    );
  }

  return fs.readJson<ClarificationRecord>(recordPath);
};

const renderSpecifyContent = (
  story: string,
  record: ClarificationRecord
): string => {
  const confirmed = record.answers.filter(answer =>
    answer.confirmed && answer.source !== 'ai-suggested'
  );
  const pending = record.questions.filter(question =>
    question.required && !record.answers.some(answer =>
      answer.questionId === question.id
      && answer.confirmed
      && hasResolvedClarificationAnswer(answer.answer)
    )
  );

  return [
    `# ${story} 规格预览`,
    '',
    '## 原始创意',
    '',
    record.premise || '未记录。',
    '',
    '## 用户已确认',
    '',
    ...(confirmed.length > 0
      ? confirmed.map(answer => `- ${answer.questionId}：${Array.isArray(answer.answer) ? answer.answer.join('、') : String(answer.answer)}`)
      : ['- 暂无。']),
    '',
    '## 需要澄清',
    '',
    ...(pending.length > 0
      ? pending.map(question => `- [需要澄清] ${question.id}：${question.question}`)
      : ['- 暂无 required 待确认问题。']),
    '',
    '## 写作边界',
    '',
    '- 本文件由 preview 生成；只有 apply 后才进入正式 specification。',
    '- 未确认 AI 建议、示例答案和“稍后决定”不能视为正典。',
    ''
  ].join('\n');
};

const renderPlanContent = (
  story: string,
  record: ClarificationRecord,
  coreElements: StoryCoreElementAssessment[]
): string => {
  const confirmedElements = coreElements.filter(element => element.status === 'confirmed' || element.status === 'partial');
  const blockingElements = getPlanBlockingCoreElements(coreElements);
  const candidateBranches = record.questions
    .flatMap(question => question.exampleBranches ?? [])
    .slice(0, 6);

  return [
    `# ${story} 创作计划预览`,
    '',
    '## 来源',
    '',
    '- 来源：clarifications.json',
    '- 本文件由 preview plan 生成；只有 apply 后才进入 creative-plan.md。',
    '',
    '## 用户已确认核心要素',
    '',
    ...(confirmedElements.length > 0
      ? confirmedElements.map(element => `- ${element.label}：${getStoryCoreElementStatusText(element.status)}。${element.summary}`)
      : ['- 暂无。']),
    '',
    '## [需要澄清] 核心缺口',
    '',
    ...(blockingElements.length > 0
      ? blockingElements.map(element => `- [需要澄清] ${element.label}：${element.nextPrompt ?? '请继续共创确认。'}`)
      : ['- 暂无。']),
    '',
    '## AI 候选分叉',
    '',
    ...(candidateBranches.length > 0
      ? candidateBranches.map(branch => `- ${branch.label}：${branch.answer}（风味：${branch.flavor}；后续影响：${branch.downstreamImpact}；confirmed: false）`)
      : ['- 暂无。']),
    '',
    '## 拟写入范围',
    '',
    '- 阅读承诺：根据已确认类型体验和核心创意生成，缺口保留为 [需要澄清]。',
    '- 世界压力：只引用已确认舞台/势力/威胁；未确认内容保留候选标记。',
    '- 人物情感：只引用已确认伙伴和关系线；缺口不伪装成正典。',
    '- 成功路线：先写阶段性回报与代价占位，不直接生成完整章节安排。',
    '- 冲突回报：只规划第一卷可见阻力和阶段胜利，不提前定死终局。',
    '- 独特声音：未确认时保留 [需要澄清]，不替作者定文风。',
    '',
    '## 写作边界',
    '',
    '- 未确认候选角色、势力、章节安排不能伪装成已确认正典。',
    '- 草案模式必须保留 [需要澄清] 和来源标记。',
    ''
  ].join('\n');
};

const renderPreviewReport = (
  record: PreviewRecord,
  projectRoot: string
): string => [
  '# StorySpec Preview',
  '',
  `ID：${record.id}`,
  `类型：${record.kind}`,
  `故事：${record.story}`,
  `目标：${relativePath(projectRoot, record.targetPath)}`,
  `创建时间：${record.createdAt}`,
  `过期时间：${record.expiresAt}`,
  '',
  '## 来源',
  '',
  ...record.sourcePaths.map(item => `- ${relativePath(projectRoot, item)}`),
  '',
  '## 风险',
  '',
  ...(record.risks.length > 0
    ? record.risks.map(risk => `- [${risk.severity}] ${risk.message}`)
    : ['- 暂无。']),
  '',
  '## 应用命令',
  '',
  `- 预览：storyspec apply ${record.id}`,
  `- 确认写入：storyspec apply ${record.id} --yes`,
  ''
].join('\n');

const buildRisks = (summary: Awaited<ReturnType<typeof summarizeCreativeControl>>): PreviewRisk[] => [
  ...summary.pendingQuestions.map(question => ({
    severity: 'blocking' as const,
    message: `required 待确认：${question}`
  })),
  ...summary.cannotFinalize
    .filter(item => item.startsWith('AI 建议待确认'))
    .map(item => ({
      severity: 'blocking' as const,
      message: item
    }))
];

const buildCoreElementRisks = (record: ClarificationRecord): PreviewRisk[] =>
  getPlanBlockingCoreElements(evaluateStoryCoreElements({
    premise: record.premise,
    questions: record.questions,
    answers: record.answers
  }))
    .filter(element => element.status === 'deferred')
    .map(element => ({
      severity: 'blocking' as const,
      message: `核心要素稍后决定：${element.label}。${element.nextPrompt ?? '请先回到共创访谈确认。'}`
    }));

const buildPlanRisks = (coreElements: StoryCoreElementAssessment[]): PreviewRisk[] =>
  getPlanBlockingCoreElements(coreElements).map(element => ({
    severity: 'blocking',
    message: `核心要素未成熟：${element.label}（${getStoryCoreElementStatusText(element.status)}）。${element.nextPrompt ?? '请先回到共创访谈确认。'}`
  }));

export const createSpecifyPreview = async (
  input: CreateSpecifyPreviewInput
): Promise<CreateSpecifyPreviewResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const now = (input.now ?? (() => new Date()))();
  const record = await readClarificationRecord(input.fileSystem, story.path);
  const summary = await summarizeCreativeControl({
    projectRoot: input.projectRoot,
    storyPath: story.path,
    fileSystem: input.fileSystem,
    fallbackNextQuestions: getStoryStageNextQuestions(story.stage)
  });
  const id = `specify-${slugifyPathPart(story.name)}-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${String(now.getTime())}`;
  const targetPath = path.join(story.path, 'specification.md');
  const content = renderSpecifyContent(story.name, record);
  const previewRecord: PreviewRecord = {
    schemaVersion: '1.0',
    id,
    kind: 'specify',
    story: story.name,
    storyPath: story.path,
    targetPath,
    sourcePaths: [
      path.join(story.path, 'idea.md'),
      path.join(story.path, 'clarifications.json')
    ],
    summary: '根据用户已确认澄清答案生成 specification 预览；不会直接覆盖正式规格。',
    content,
    risks: [
      ...buildRisks(summary),
      ...buildCoreElementRisks(record)
    ],
    createdAt: now.toISOString(),
    expiresAt: addDays(now, 7).toISOString()
  };
  const jsonPath = previewJsonPath(input.projectRoot, id);
  const contentPath = previewContentPath(input.projectRoot, id);
  const markdownPath = previewReportPath(input.projectRoot, id);

  await input.fileSystem.ensureDir(previewRoot(input.projectRoot));
  await input.fileSystem.writeJson(jsonPath, previewRecord, { spaces: 2 });
  await input.fileSystem.writeFile(contentPath, content);
  await input.fileSystem.writeFile(markdownPath, renderPreviewReport(previewRecord, input.projectRoot));

  return {
    record: previewRecord,
    previewPath: jsonPath,
    contentPath,
    markdownPath
  };
};

export const createPlanPreview = async (
  input: CreatePlanPreviewInput
): Promise<CreatePlanPreviewResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const now = (input.now ?? (() => new Date()))();
  const record = await readClarificationRecord(input.fileSystem, story.path);
  const coreElements = evaluateStoryCoreElements({
    premise: record.premise,
    questions: record.questions,
    answers: record.answers
  });
  const id = `plan-${slugifyPathPart(story.name)}-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${String(now.getTime())}`;
  const targetPath = path.join(story.path, 'creative-plan.md');
  const content = renderPlanContent(story.name, record, coreElements);
  const previewRecord: PreviewRecord = {
    schemaVersion: '1.0',
    id,
    kind: 'plan',
    story: story.name,
    storyPath: story.path,
    targetPath,
    sourcePaths: [
      path.join(story.path, 'idea.md'),
      path.join(story.path, 'clarifications.json'),
      path.join(story.path, 'specification.md')
    ],
    summary: '根据用户已确认核心要素生成 creative-plan 预览；核心缺口会保留为 [需要澄清]。',
    content,
    risks: buildPlanRisks(coreElements),
    createdAt: now.toISOString(),
    expiresAt: addDays(now, 7).toISOString()
  };
  const jsonPath = previewJsonPath(input.projectRoot, id);
  const contentPath = previewContentPath(input.projectRoot, id);
  const markdownPath = previewReportPath(input.projectRoot, id);

  await input.fileSystem.ensureDir(previewRoot(input.projectRoot));
  await input.fileSystem.writeJson(jsonPath, previewRecord, { spaces: 2 });
  await input.fileSystem.writeFile(contentPath, content);
  await input.fileSystem.writeFile(markdownPath, renderPreviewReport(previewRecord, input.projectRoot));

  return {
    record: previewRecord,
    previewPath: jsonPath,
    contentPath,
    markdownPath
  };
};

const loadPreviewRecord = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  previewId: string
): Promise<{ record: PreviewRecord; previewPath: string }> => {
  const previewPath = previewJsonPath(projectRoot, previewId);
  if (!await fs.pathExists(previewPath)) {
    throw new PreviewApplyError('PREVIEW_NOT_FOUND', `未找到 preview：${previewId}`);
  }

  return {
    previewPath,
    record: await fs.readJson<PreviewRecord>(previewPath)
  };
};

export const applyPreview = async (
  input: ApplyPreviewInput
): Promise<ApplyPreviewResult> => {
  const { record, previewPath } = await loadPreviewRecord(
    input.fileSystem,
    input.projectRoot,
    input.previewId
  );
  const now = (input.now ?? (() => new Date()))();
  if (new Date(record.expiresAt).getTime() < now.getTime()) {
    throw new PreviewApplyError('PREVIEW_EXPIRED', `preview 已过期：${record.id}`);
  }

  if (!input.yes) {
    return {
      record,
      previewPath,
      targetPath: record.targetPath,
      dryRun: true,
      applied: false
    };
  }

  const blockingRisks = input.draft && record.kind === 'plan'
    ? []
    : record.risks.filter(risk => risk.severity === 'blocking');
  if (blockingRisks.length > 0) {
    throw new PreviewApplyError(
      'PREVIEW_BLOCKED',
      `preview 存在 blocking 风险，不能 apply：${blockingRisks.map(risk => risk.message).join('；')}`
    );
  }

  const targetPath = resolveProjectPath(input.projectRoot, relativePath(input.projectRoot, record.targetPath));
  await input.fileSystem.ensureDir(path.dirname(targetPath));
  await input.fileSystem.writeFile(targetPath, record.content);
  const updatedRecord: PreviewRecord = {
    ...record,
    appliedAt: now.toISOString()
  };
  await input.fileSystem.writeJson(previewPath, updatedRecord, { spaces: 2 });

  return {
    record: updatedRecord,
    previewPath,
    targetPath,
    dryRun: false,
    applied: true
  };
};

export const renderSpecifyPreview = (result: CreateSpecifyPreviewResult): string => [
  'StorySpec 规格预览',
  '',
  `Preview：${result.record.id}`,
  `故事：${result.record.story}`,
  `目标：${result.record.targetPath}`,
  `风险：${result.record.risks.length}`,
  `报告：${result.markdownPath}`,
  '',
  result.record.risks.length > 0
    ? '存在待确认风险，请先处理后再 apply。'
    : `确认后运行：storyspec apply ${result.record.id} --yes`
].join('\n');

export const renderPlanPreview = (result: CreatePlanPreviewResult): string => [
  'StorySpec 计划预览',
  '',
  `Preview：${result.record.id}`,
  `故事：${result.record.story}`,
  `目标：${result.record.targetPath}`,
  `风险：${result.record.risks.length}`,
  `报告：${result.markdownPath}`,
  '',
  result.record.risks.length > 0
    ? '存在核心缺口；可继续访谈，或用 apply --yes --draft 写入保留缺口的草案。'
    : `确认后运行：storyspec apply ${result.record.id} --yes`
].join('\n');

export const renderApplyPreview = (result: ApplyPreviewResult): string => [
  'StorySpec Preview Apply',
  '',
  `Preview：${result.record.id}`,
  `目标：${result.targetPath}`,
  `模式：${result.dryRun ? '预览' : '已写入'}`,
  `结果：${result.applied ? '已应用' : '未写入'}`
].join('\n');
