import path from 'node:path';
import yaml from 'js-yaml';
import type { ProjectFileSystem } from './project-ports.js';
import type { ClarificationRecord } from './manage-clarifications.js';
import { relativePath, selectStoryProject } from './workbench-utils.js';

export interface CreateInitialSceneCardInput {
  projectRoot: string;
  packageRoot: string;
  fileSystem: ProjectFileSystem;
  story: string;
  id?: string;
}

export interface CreateInitialSceneCardResult {
  projectRoot: string;
  story: string;
  storyPath: string;
  sceneId: string;
  outputPath: string;
  contextItems: string[];
}

const TEMPLATE_PATH = path.join('templates', 'scenes', 'scene-001.yaml');

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

const confirmedContextItems = (record: ClarificationRecord | undefined): string[] =>
  record?.answers
    .filter(answer => answer.confirmed)
    .filter(answer => answer.source === 'user-explicit' || answer.source === 'imported')
    .map(answer => Array.isArray(answer.answer) ? answer.answer.join('、') : String(answer.answer))
    .map(answer => answer.trim())
    .filter(Boolean)
    .slice(0, 6) ?? [];

const addStoryContext = (
  template: string,
  story: string,
  contextItems: string[]
): string => {
  const document = yaml.load(template);
  const scene = typeof document === 'object' && document !== null && !Array.isArray(document)
    ? document as Record<string, unknown>
    : {};

  scene.id = scene.id === 'scene-001' ? 'scene-001' : scene.id;
  scene.location = contextItems.find(item => /舞台|地点|驿站|城市|边境|大厅/.test(item)) ?? scene.location;
  scene.pov = contextItems.find(item => /主角|视角|是谁/.test(item)) ?? scene.pov;
  scene.storyContext = {
    story,
    confirmed: contextItems.length > 0 ? contextItems : ['暂无已确认 Scene Card 上下文；请先补访谈或手动改写本卡。'],
    canonBoundary: '以上内容来自已确认澄清或正式规格，只作为本 Scene Card 的候选写作上下文；新增事实仍需确认。'
  };
  scene.worldElements = [];
  scene.canonFacts = [];
  scene.worldReveal = {
    ...(typeof scene.worldReveal === 'object' && scene.worldReveal !== null && !Array.isArray(scene.worldReveal)
      ? scene.worldReveal as Record<string, unknown>
      : {}),
    factId: 'world.pending.first-scene',
    actionImpact: contextItems.find(item => /规则|世界|舞台|驿站|边境|大厅/.test(item))
      ?? '本场需要明确当前世界压力如何改变角色选择。',
    beneficiaries: ['待确认'],
    costs: ['待确认'],
    violationConsequence: '待确认'
  };
  scene.reveals = contextItems.length > 0
    ? contextItems.map(item => `候选呈现：${item}`)
    : ['候选呈现：本场需要补齐当前故事的第一幕世界压力。'];

  return yaml.dump(scene, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  });
};

export const createInitialSceneCard = async (
  input: CreateInitialSceneCardInput
): Promise<CreateInitialSceneCardResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const sceneId = input.id ?? 'scene-001';
  const outputPath = path.join(story.path, 'scenes', `${sceneId}.yaml`);

  if (await input.fileSystem.pathExists(outputPath)) {
    throw new Error(`SCENE_CARD_EXISTS:${outputPath}`);
  }

  const templatePath = path.join(input.packageRoot, TEMPLATE_PATH);
  const template = await input.fileSystem.readFile(templatePath);
  const record = await readClarificationRecord(input.fileSystem, story.path);
  const contextItems = confirmedContextItems(record);
  const withStoryId = template.replace(/^id: scene-001$/m, `id: ${sceneId}`);
  const content = addStoryContext(withStoryId, story.name, contextItems)
    .replace(/stories\/\*\//g, '');

  await input.fileSystem.ensureDir(path.dirname(outputPath));
  await input.fileSystem.writeFile(outputPath, content);

  return {
    projectRoot: input.projectRoot,
    story: story.name,
    storyPath: story.path,
    sceneId,
    outputPath,
    contextItems
  };
};

export const renderSceneCardCreateSummary = (result: CreateInitialSceneCardResult): string => [
  'Scene Card 初始化',
  '',
  `故事：${result.storyPath}`,
  `场景：${result.sceneId}`,
  `输出：${result.outputPath}`,
  `候选上下文：${result.contextItems.length}`,
  '',
  '下一步：',
  `- 检查 \`${relativePath(result.projectRoot, result.outputPath)}\`，确认 storyContext 是否符合当前故事。`,
  `- 继续运行 \`storyspec scene:check ${result.story}\`。`
].join('\n');
