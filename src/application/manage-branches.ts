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
  report: string;
  impactPath: string;
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

const renderCompareReport = (result: Omit<BranchCompareResult, 'report'>): string => [
  '# Branch Impact Report',
  '',
  `故事：${result.story}`,
  `Branch：${result.branch.id}`,
  `状态：${result.branch.status}`,
  `Base：${result.branch.base}`,
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
  const impactedRelationships = await readRelationshipsForImpact(input.fileSystem, input.projectRoot, branch);
  const baseResult = {
    story: story.name,
    branch,
    branchPath: branchJsonPath(story.path, branch.id),
    changedScenes: branch.changedScenes,
    changedCanonFacts: branch.changedCanonFacts,
    impactedTasks,
    impactedPromises,
    impactedRelationships,
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
