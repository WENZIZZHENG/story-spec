import path from 'node:path';
import yaml from 'js-yaml';
import type { ProjectFileSystem } from './project-ports.js';
import type {
  StoryBranch,
  StoryBranchStatus
} from '../domain/workbench.js';
import {
  selectStoryProject,
  slugifyPathPart,
  toPosixPath,
  unique
} from './workbench-utils.js';

export interface BranchInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
}

export interface CreateBranchInput extends BranchInput {
  title: string;
  premise?: string;
  base?: string;
  changedScenes?: string[];
  changedCanonFacts?: string[];
  now?: () => Date;
}

export interface BranchImpactTask {
  id: string;
  title: string;
  reason: string;
}

export interface BranchWhatIfCard {
  flavor: string;
  readerPromiseShift: string;
  tradeoffs: string[];
  relationshipShift: string;
  worldPressureShift: string;
}

export interface BranchRouteMapNode {
  label: string;
  status: 'baseline' | StoryBranchStatus;
  description: string;
  nextCommand?: string;
}

export interface BranchCreateResult {
  story: string;
  branch: StoryBranch;
  branchDir: string;
  branchPath: string;
  branchMarkdownPath: string;
  changedScenesPath: string;
  impactPath: string;
}

export interface BranchListResult {
  story: string;
  branchDir: string;
  branches: StoryBranch[];
}

export interface BranchCompareResult {
  story: string;
  branch: StoryBranch;
  branchPath: string;
  changedScenes: string[];
  changedCanonFacts: string[];
  impactedTasks: BranchImpactTask[];
  impactedPromises: string[];
  impactedRelationships: string[];
  whatIfCard: BranchWhatIfCard;
  routeMap: BranchRouteMapNode[];
  report: string;
  impactPath: string;
}

export interface ActiveBranchSummary {
  id: string;
  title: string;
  status: StoryBranchStatus;
  premise: string;
  impactSummary: string;
  flavor: string;
  compareCommand: string;
  promoteCommand: string;
}

export interface PromoteBranchInput extends BranchInput {
  branchId: string;
  yes?: boolean;
  now?: () => Date;
}

export interface BranchPromoteResult {
  story: string;
  branch: StoryBranch;
  branchPath: string;
  checklistPath: string;
  checklist: string[];
  dryRun: boolean;
}

const branchRoot = (storyPath: string): string => path.join(storyPath, 'branches');
const branchDir = (storyPath: string, branchId: string): string => path.join(branchRoot(storyPath), branchId);
const branchJsonPath = (storyPath: string, branchId: string): string => path.join(branchDir(storyPath, branchId), 'branch.json');
const branchMarkdownPath = (storyPath: string, branchId: string): string => path.join(branchDir(storyPath, branchId), 'branch.md');
const changedScenesPath = (storyPath: string, branchId: string): string => path.join(branchDir(storyPath, branchId), 'changed-scenes.yaml');
const impactPath = (storyPath: string, branchId: string): string => path.join(branchDir(storyPath, branchId), 'impact.md');
const promotionChecklistPath = (storyPath: string, branchId: string): string =>
  path.join(branchDir(storyPath, branchId), 'promotion-checklist.md');

const createUniqueBranchId = async (
  fs: ProjectFileSystem,
  storyPath: string,
  title: string
): Promise<string> => {
  const baseId = slugifyPathPart(title);
  let candidate = baseId;
  let suffix = 2;

  while (await fs.pathExists(branchDir(storyPath, candidate))) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const normalizeList = (values?: readonly string[]): string[] =>
  unique((values ?? []).map(value => value.trim()).filter(Boolean));

const summarizeImpact = (
  changedScenes: readonly string[],
  changedCanonFacts: readonly string[]
): string => {
  const parts = [
    changedScenes.length > 0 ? `${changedScenes.length} 个 scene` : '',
    changedCanonFacts.length > 0 ? `${changedCanonFacts.length} 个 canon fact` : ''
  ].filter(Boolean);

  return parts.length > 0
    ? `分支将影响 ${parts.join('、')}，promote 前必须人工确认影响清单。`
    : '分支尚未声明改动范围，promote 前必须补充 changedScenes 或 changedCanonFacts。';
};

const renderBranchMarkdown = (branch: StoryBranch): string => [
  '# Story Branch',
  '',
  `ID：${branch.id}`,
  `标题：${branch.title}`,
  `Base：${branch.base}`,
  `状态：${branch.status}`,
  `创建时间：${branch.createdAt}`,
  '',
  '## Premise',
  '',
  branch.premise || '待补充。',
  '',
  '## Changed Scenes',
  '',
  ...(branch.changedScenes.length > 0 ? branch.changedScenes.map(scene => `- ${scene}`) : ['- 无']),
  '',
  '## Changed Canon Facts',
  '',
  ...(branch.changedCanonFacts.length > 0 ? branch.changedCanonFacts.map(fact => `- ${fact}`) : ['- 无']),
  '',
  '## Impact Summary',
  '',
  branch.impactSummary
].join('\n');

const writeBranchFiles = async (
  fs: ProjectFileSystem,
  storyPath: string,
  branch: StoryBranch
): Promise<void> => {
  const dir = branchDir(storyPath, branch.id);
  await fs.ensureDir(dir);
  await fs.writeJson(branchJsonPath(storyPath, branch.id), branch, { spaces: 2 });
  await fs.writeFile(branchMarkdownPath(storyPath, branch.id), renderBranchMarkdown(branch));
  await fs.writeFile(changedScenesPath(storyPath, branch.id), yaml.dump({
    branchId: branch.id,
    changedScenes: branch.changedScenes,
    changedCanonFacts: branch.changedCanonFacts
  }, { lineWidth: 120 }));
};

export const createBranch = async (input: CreateBranchInput): Promise<BranchCreateResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const changedScenes = normalizeList(input.changedScenes);
  const changedCanonFacts = normalizeList(input.changedCanonFacts);
  const id = await createUniqueBranchId(input.fileSystem, story.path, input.title);
  const branch: StoryBranch = {
    id,
    base: input.base?.trim() || 'main',
    title: input.title.trim(),
    premise: input.premise?.trim() || input.title.trim(),
    changedScenes,
    changedCanonFacts,
    impactSummary: summarizeImpact(changedScenes, changedCanonFacts),
    status: 'exploring',
    createdAt: (input.now ?? (() => new Date()))().toISOString()
  };
  const compare = await compareBranch({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem,
    story: story.name,
    branchId: branch.id,
    candidate: branch
  });

  await writeBranchFiles(input.fileSystem, story.path, branch);
  await input.fileSystem.writeFile(impactPath(story.path, branch.id), compare.report);

  return {
    story: story.name,
    branch,
    branchDir: branchDir(story.path, branch.id),
    branchPath: branchJsonPath(story.path, branch.id),
    branchMarkdownPath: branchMarkdownPath(story.path, branch.id),
    changedScenesPath: changedScenesPath(story.path, branch.id),
    impactPath: impactPath(story.path, branch.id)
  };
};

const readBranch = async (
  fs: ProjectFileSystem,
  storyPath: string,
  branchId: string
): Promise<StoryBranch> => {
  const filePath = branchJsonPath(storyPath, branchId);
  if (!await fs.pathExists(filePath)) {
    throw new Error(`BRANCH_NOT_FOUND:${branchId}`);
  }

  const branch = await fs.readJson<StoryBranch>(filePath);
  return {
    ...branch,
    status: normalizeBranchStatus(branch.status),
    changedScenes: normalizeList(branch.changedScenes),
    changedCanonFacts: normalizeList(branch.changedCanonFacts)
  };
};

const normalizeBranchStatus = (status: unknown): StoryBranchStatus =>
  ['exploring', 'accepted', 'rejected', 'merged'].includes(String(status))
    ? status as StoryBranchStatus
    : 'exploring';

export const listBranches = async (input: BranchInput): Promise<BranchListResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const dir = branchRoot(story.path);
  if (!await input.fileSystem.pathExists(dir)) {
    return {
      story: story.name,
      branchDir: dir,
      branches: []
    };
  }

  const branches: StoryBranch[] = [];
  for (const entry of await input.fileSystem.readDir(dir)) {
    const entryPath = path.join(dir, entry);
    if (!(await input.fileSystem.stat(entryPath)).isDirectory()) {
      continue;
    }

    const filePath = branchJsonPath(story.path, entry);
    if (await input.fileSystem.pathExists(filePath)) {
      branches.push(await readBranch(input.fileSystem, story.path, entry));
    }
  }

  return {
    story: story.name,
    branchDir: dir,
    branches: branches.sort((left, right) => left.id.localeCompare(right.id))
  };
};

const collectImpactedTasks = (
  branch: StoryBranch,
  tasks: BranchImpactTask[],
): BranchImpactTask[] => tasks;

const matchTaskImpact = (
  branch: StoryBranch,
  task: {
    id: string;
    title: string;
    requiredReads: string[];
    allowedWrites: string[];
    outputs: string[];
  }
): BranchImpactTask | undefined => {
  const paths = [...task.requiredReads, ...task.allowedWrites, ...task.outputs].join('\n');
  const matchedScene = branch.changedScenes.find(scene => paths.includes(scene));
  if (matchedScene) {
    return {
      id: task.id,
      title: task.title,
      reason: `任务路径引用 changed scene：${matchedScene}`
    };
  }

  const matchedCanon = branch.changedCanonFacts.find(fact => paths.includes(fact));
  if (matchedCanon) {
    return {
      id: task.id,
      title: task.title,
      reason: `任务路径引用 changed canon：${matchedCanon}`
    };
  }

  return undefined;
};

const readPromisesForImpact = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  branch: StoryBranch
): Promise<string[]> => {
  const promisesPath = path.join(projectRoot, 'spec', 'tracking', 'promises.json');
  if (!await fs.pathExists(promisesPath)) {
    return [];
  }

  try {
    const document = await fs.readJson<{ promises?: Array<Record<string, unknown>> }>(promisesPath);
    return (document.promises ?? [])
      .filter(promise => {
        const joined = [
          promise.id,
          promise.establishedAt,
          promise.paidOffAt,
          ...(Array.isArray(promise.reinforcedAt) ? promise.reinforcedAt : [])
        ].map(String).join('\n');
        return [...branch.changedScenes, ...branch.changedCanonFacts].some(id => joined.includes(id));
      })
      .map(promise => String(promise.id))
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
};

const readPromiseLabelsForImpact = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  branch: StoryBranch
): Promise<string[]> => {
  const promisesPath = path.join(projectRoot, 'spec', 'tracking', 'promises.json');
  if (!await fs.pathExists(promisesPath)) {
    return [];
  }

  try {
    const document = await fs.readJson<{ promises?: Array<Record<string, unknown>> }>(promisesPath);
    return (document.promises ?? [])
      .filter(promise => {
        const joined = [
          promise.id,
          promise.establishedAt,
          promise.paidOffAt,
          ...(Array.isArray(promise.reinforcedAt) ? promise.reinforcedAt : [])
        ].map(String).join('\n');
        return [...branch.changedScenes, ...branch.changedCanonFacts].some(id => joined.includes(id));
      })
      .map(promise => [
        String(promise.id ?? '').trim(),
        String(promise.promise ?? promise.readerExpectation ?? '').trim()
      ].filter(Boolean).join('：'))
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
};

const readRelationshipsForImpact = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  branch: StoryBranch
): Promise<string[]> => {
  const edgesPath = path.join(projectRoot, 'spec', 'graph', 'edges.json');
  if (!await fs.pathExists(edgesPath)) {
    return [];
  }

  try {
    const document = await fs.readJson<{ edges?: Array<Record<string, unknown>> }>(edgesPath);
    return (document.edges ?? [])
      .filter(edge => Array.isArray(edge.evidencePaths)
        && edge.evidencePaths.some(evidence => branch.changedScenes.some(scene => String(evidence).includes(scene))))
      .map(edge => String(edge.id))
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
};

const describeBranchFlavor = (branch: StoryBranch): string => {
  const premise = branch.premise.trim() || branch.title;
  return `会长成“${branch.title}”方向：${premise}。它会把选择后果提前摆到台前，让主线风味从默认推进转向可比较的 what-if。`;
};

const buildReaderPromiseShift = (
  impactedPromiseLabels: string[]
): string => impactedPromiseLabels.length > 0
  ? `读者承诺会偏移：${impactedPromiseLabels.join('、')} 的建立、误导或兑现节奏需要重新安排。`
  : '暂未命中已登记 promise；需要人工判断这条分支是否改变读者期待、悬念或阶段回报。';

const buildTradeoffs = (branch: StoryBranch): string[] => [
  `收益：${branch.title} 可以更快展示选择后果，并让作者比较这条路线的爽点、张力或情绪回报。`,
  `代价：${branch.changedScenes.length + branch.changedCanonFacts.length > 0
    ? '受影响的 scene/canon 需要重排，可能牺牲原主线的铺垫、悬念或关系慢热。'
    : '尚未声明影响范围，容易变成空想分支，promote 前必须补 evidence。'}`
];

const buildRelationshipShift = (
  impactedRelationships: string[]
): string => impactedRelationships.length > 0
  ? `关系线会偏移：${impactedRelationships.join('、')} 需要重新判断信任、距离、冲突或修复节点。`
  : '暂未命中关系 evidence；如果分支改变角色选择，仍需人工检查关系线是否提前或延后。';

const buildWorldPressureShift = (
  branch: StoryBranch
): string => branch.changedScenes.length > 0 || branch.changedCanonFacts.length > 0
  ? `世界压力会在 ${[...branch.changedScenes, ...branch.changedCanonFacts].join('、')} 更早或更明显显露，需要检查读者是否过早知道规则真相。`
  : '尚未声明 changedScenes 或 changedCanonFacts，无法判断世界压力显露节奏。';

const buildWhatIfCard = (
  branch: StoryBranch,
  impactedPromiseLabels: string[],
  impactedRelationships: string[]
): BranchWhatIfCard => ({
  flavor: describeBranchFlavor(branch),
  readerPromiseShift: buildReaderPromiseShift(impactedPromiseLabels),
  tradeoffs: buildTradeoffs(branch),
  relationshipShift: buildRelationshipShift(impactedRelationships),
  worldPressureShift: buildWorldPressureShift(branch)
});

const buildRouteMap = (branch: StoryBranch): BranchRouteMapNode[] => [
  {
    label: '当前主线',
    status: 'baseline',
    description: `继续沿用 ${branch.base}，不接纳该 what-if。`
  },
  {
    label: `what-if：${branch.title}`,
    status: branch.status,
    description: branch.premise || branch.impactSummary,
    nextCommand: branch.status === 'exploring'
      ? `storyspec branch:promote ${branch.id}`
      : `storyspec branch:compare ${branch.id}`
  }
];

const renderCompareReport = (result: Omit<BranchCompareResult, 'report'>): string => [
  '# Branch Impact Report',
  '',
  `故事：${result.story}`,
  `Branch：${result.branch.id}`,
  `状态：${result.branch.status}`,
  `Base：${result.branch.base}`,
  '',
  '## What-if 对照卡',
  '',
  `- 会长成什么小说：${result.whatIfCard.flavor}`,
  `- 读者承诺变化：${result.whatIfCard.readerPromiseShift}`,
  `- 主要收益与代价：${result.whatIfCard.tradeoffs.join('；')}`,
  `- 关系线偏移：${result.whatIfCard.relationshipShift}`,
  `- 世界压力显露节奏：${result.whatIfCard.worldPressureShift}`,
  '',
  '## 路线图',
  '',
  ...result.routeMap.map(node =>
    `- ${node.label}（${node.status}）：${node.description}${node.nextCommand ? `；下一步 ${node.nextCommand}` : ''}`
  ),
  '',
  '## Changed Scenes',
  '',
  ...(result.changedScenes.length > 0 ? result.changedScenes.map(scene => `- ${scene}`) : ['- 无']),
  '',
  '## Changed Canon Facts',
  '',
  ...(result.changedCanonFacts.length > 0 ? result.changedCanonFacts.map(fact => `- ${fact}`) : ['- 无']),
  '',
  '## Impacted Tasks',
  '',
  ...(result.impactedTasks.length > 0
    ? result.impactedTasks.map(task => `- ${task.id} ${task.title}：${task.reason}`)
    : ['- 无']),
  '',
  '## Impacted Promises',
  '',
  ...(result.impactedPromises.length > 0 ? result.impactedPromises.map(item => `- ${item}`) : ['- 无']),
  '',
  '## Impacted Relationships',
  '',
  ...(result.impactedRelationships.length > 0 ? result.impactedRelationships.map(item => `- ${item}`) : ['- 无']),
  '',
  '## Promote Checklist',
  '',
  '- [ ] 确认 changed scenes 对正文连续性的影响。',
  '- [ ] 确认 changed canon facts 不会造成 Canon Ledger 冲突。',
  '- [ ] 确认 promise / relationship 影响已有处理任务。',
  '- [ ] 使用 `branch:promote --yes` 后再手动迁移正文或 canon。'
].join('\n');

export const compareBranch = async (
  input: BranchInput & { branchId: string; candidate?: StoryBranch }
): Promise<BranchCompareResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const branch = input.candidate ?? await readBranch(input.fileSystem, story.path, input.branchId);
  const impactedTasks = collectImpactedTasks(branch, story.tasks.map(task => matchTaskImpact(branch, task)).filter(Boolean) as BranchImpactTask[]);
  const impactedPromises = await readPromisesForImpact(input.fileSystem, input.projectRoot, branch);
  const impactedPromiseLabels = await readPromiseLabelsForImpact(input.fileSystem, input.projectRoot, branch);
  const impactedRelationships = await readRelationshipsForImpact(input.fileSystem, input.projectRoot, branch);
  const whatIfCard = buildWhatIfCard(branch, impactedPromiseLabels, impactedRelationships);
  const routeMap = buildRouteMap(branch);
  const baseResult = {
    story: story.name,
    branch,
    branchPath: branchJsonPath(story.path, branch.id),
    changedScenes: branch.changedScenes,
    changedCanonFacts: branch.changedCanonFacts,
    impactedTasks,
    impactedPromises,
    impactedRelationships,
    whatIfCard,
    routeMap,
    impactPath: impactPath(story.path, branch.id)
  };
  const report = renderCompareReport(baseResult);

  if (!input.candidate) {
    await input.fileSystem.writeFile(impactPath(story.path, branch.id), report);
  }

  return {
    ...baseResult,
    report
  };
};

export const summarizeActiveBranches = async (
  input: BranchInput
): Promise<ActiveBranchSummary[]> => {
  const result = await listBranches(input);

  return result.branches
    .filter(branch => branch.status === 'exploring')
    .map(branch => ({
      id: branch.id,
      title: branch.title,
      status: branch.status,
      premise: branch.premise,
      impactSummary: branch.impactSummary,
      flavor: describeBranchFlavor(branch),
      compareCommand: `storyspec branch:compare ${branch.id}`,
      promoteCommand: `storyspec branch:promote ${branch.id}`
    }));
};

const createPromotionChecklist = (branch: StoryBranch): string[] => [
  `确认分支 ${branch.id} 已完成人工审阅。`,
  '确认 branch:compare 的 impactedTasks / impactedPromises / impactedRelationships 已处理。',
  '确认不会静默覆盖 main content 或 canon；需要迁移时另建明确任务。',
  `确认 changedScenes：${branch.changedScenes.join(', ') || '无'}`,
  `确认 changedCanonFacts：${branch.changedCanonFacts.join(', ') || '无'}`
];

const renderPromotionChecklist = (result: BranchPromoteResult): string => [
  '# Branch Promote Checklist',
  '',
  `Branch：${result.branch.id}`,
  `状态：${result.branch.status}`,
  `模式：${result.dryRun ? '预览' : '已确认'}`,
  '',
  ...result.checklist.map(item => `- [ ] ${item}`)
].join('\n');

export const promoteBranch = async (input: PromoteBranchInput): Promise<BranchPromoteResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const branch = await readBranch(input.fileSystem, story.path, input.branchId);
  const checklist = createPromotionChecklist(branch);

  if (!input.yes) {
    return {
      story: story.name,
      branch,
      branchPath: branchJsonPath(story.path, branch.id),
      checklistPath: promotionChecklistPath(story.path, branch.id),
      checklist,
      dryRun: true
    };
  }

  const promotedBranch: StoryBranch = {
    ...branch,
    status: 'accepted',
    impactSummary: `${branch.impactSummary} 已确认可进入人工迁移。`
  };
  const result: BranchPromoteResult = {
    story: story.name,
    branch: promotedBranch,
    branchPath: branchJsonPath(story.path, branch.id),
    checklistPath: promotionChecklistPath(story.path, branch.id),
    checklist,
    dryRun: false
  };
  await writeBranchFiles(input.fileSystem, story.path, promotedBranch);
  await input.fileSystem.writeFile(result.checklistPath, renderPromotionChecklist(result));

  return result;
};

export const renderBranchCreate = (result: BranchCreateResult): string => [
  'Story Branch',
  '',
  `故事：${result.story}`,
  `Branch：${result.branch.id}`,
  `状态：${result.branch.status}`,
  `目录：${toPosixPath(result.branchDir)}`,
  `影响报告：${toPosixPath(result.impactPath)}`
].join('\n');

export const renderBranchList = (result: BranchListResult): string => [
  'Story Branches',
  '',
  `故事：${result.story}`,
  `目录：${toPosixPath(result.branchDir)}`,
  `Branches：${result.branches.length}`,
  '',
  ...(result.branches.length > 0
    ? result.branches.map(branch => `- ${branch.id}：${branch.status}，${branch.title}`)
    : ['- 暂无 branch'])
].join('\n').trimEnd();

export const renderBranchCompare = (result: BranchCompareResult): string => [
  result.report,
  '',
  `报告路径：${toPosixPath(result.impactPath)}`
].join('\n').trimEnd();

export const renderBranchPromote = (result: BranchPromoteResult): string => [
  'Branch Promote',
  '',
  `故事：${result.story}`,
  `Branch：${result.branch.id}`,
  `状态：${result.branch.status}`,
  `模式：${result.dryRun ? '预览' : '已确认'}`,
  `清单：${toPosixPath(result.checklistPath)}`,
  '',
  ...result.checklist.map(item => `- ${item}`)
].join('\n').trimEnd();
