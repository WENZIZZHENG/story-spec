import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import {
  parseSceneCardDocument,
  parseStoryEdgesDocument,
  parseStoryEntitiesDocument,
  validateStoryGraph,
  type SceneCard,
  type StoryEdge,
  type StoryEntity,
  type StoryStructureIssue
} from '../domain/story-structure.js';

export interface StoryGraphInspectionResult {
  projectRoot: string;
  files: string[];
  entities: StoryEntity[];
  edges: StoryEdge[];
  issues: StoryStructureIssue[];
}

export interface SceneInspectionResult {
  projectRoot: string;
  storyPath?: string;
  files: string[];
  scenes: SceneCard[];
  sceneSources: Array<{ sceneId: string; path: string; chapter: string }>;
  issues: StoryStructureIssue[];
}

export interface ScenePathReplacement {
  file: string;
  from: string;
  to: string;
}

export interface FixSceneCardPathsInput extends InspectStoryStructureInput {
  write?: boolean;
}

export interface FixSceneCardPathsResult {
  projectRoot: string;
  storyPath?: string;
  write: boolean;
  checkedFiles: string[];
  changedFiles: string[];
  replacements: ScenePathReplacement[];
}

export interface StoryGraphIndexes {
  schemaVersion: '1.0';
  byType: Record<string, string[]>;
  byTag: Record<string, string[]>;
  bySourcePath: Record<string, string[]>;
  adjacency: Record<string, string[]>;
}

export interface InspectStoryStructureInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
}

const toPosixPath = (value: string): string => value.split(path.sep).join('/');

const relativePath = (projectRoot: string, filePath: string): string =>
  toPosixPath(path.relative(projectRoot, filePath));

const listFiles = async (
  fs: ProjectFileSystem,
  dirPath: string,
  predicate: (file: string) => boolean
): Promise<string[]> => {
  if (!await fs.pathExists(dirPath)) {
    return [];
  }

  return (await fs.readDir(dirPath))
    .filter(predicate)
    .sort()
    .map(file => path.join(dirPath, file));
};

const listStoryDirs = async (
  fs: ProjectFileSystem,
  projectRoot: string
): Promise<string[]> => {
  const storiesDir = path.join(projectRoot, 'stories');
  if (!await fs.pathExists(storiesDir)) {
    return [];
  }

  const dirs: string[] = [];
  for (const entry of await fs.readDir(storiesDir)) {
    const entryPath = path.join(storiesDir, entry);
    if ((await fs.stat(entryPath)).isDirectory()) {
      dirs.push(entryPath);
    }
  }

  return dirs.sort();
};

const resolveStoryDirs = async (
  input: InspectStoryStructureInput
): Promise<string[]> => {
  if (!input.story) {
    return listStoryDirs(input.fileSystem, input.projectRoot);
  }

  const storyPath = path.isAbsolute(input.story)
    ? input.story
    : path.join(input.projectRoot, 'stories', input.story);
  if (await input.fileSystem.pathExists(storyPath)) {
    return [storyPath];
  }

  const directPath = path.isAbsolute(input.story)
    ? input.story
    : path.join(input.projectRoot, input.story);
  return await input.fileSystem.pathExists(directPath) ? [directPath] : [];
};

export const inspectStoryGraph = async (
  input: InspectStoryStructureInput
): Promise<StoryGraphInspectionResult> => {
  const graphDir = path.join(input.projectRoot, 'spec', 'graph');
  const entitiesPath = path.join(graphDir, 'entities.json');
  const edgesPath = path.join(graphDir, 'edges.json');
  const files = (await Promise.all([entitiesPath, edgesPath].map(async file =>
    await input.fileSystem.pathExists(file) ? file : ''
  ))).filter(Boolean);
  const issues: StoryStructureIssue[] = [];
  let entities: StoryEntity[] = [];
  let edges: StoryEdge[] = [];

  if (await input.fileSystem.pathExists(entitiesPath)) {
    const result = parseStoryEntitiesDocument(await input.fileSystem.readFile(entitiesPath), entitiesPath);
    entities = result.entities;
    issues.push(...result.issues);
  }

  if (await input.fileSystem.pathExists(edgesPath)) {
    const result = parseStoryEdgesDocument(await input.fileSystem.readFile(edgesPath), edgesPath);
    edges = result.edges;
    issues.push(...result.issues);
  }

  issues.push(...validateStoryGraph({ entities, edges }, graphDir));

  return {
    projectRoot: input.projectRoot,
    files,
    entities,
    edges,
    issues
  };
};

const listSceneFiles = async (
  fs: ProjectFileSystem,
  storyPath: string
): Promise<string[]> => {
  const sceneDir = path.join(storyPath, 'scenes');
  return listFiles(fs, sceneDir, file =>
    file.endsWith('.yaml')
    || file.endsWith('.yml')
    || file.endsWith('.json')
  );
};

const storyPrefixForSceneFile = (filePath: string): string | undefined => {
  const parts = toPosixPath(filePath).split('/');
  const storiesIndex = parts.lastIndexOf('stories');
  const storyName = storiesIndex >= 0 ? parts[storiesIndex + 1] : undefined;

  return storyName ? `stories/${storyName}/` : undefined;
};

const collectScenePathReplacements = (
  filePath: string,
  content: string
): ScenePathReplacement[] => {
  const storyPrefix = storyPrefixForSceneFile(filePath);
  if (!storyPrefix) {
    return [];
  }

  const pattern = new RegExp(storyPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^\\s\\]}",]+', 'g');
  const values = [...new Set(content.match(pattern) ?? [])]
    .filter(value => value.length > storyPrefix.length)
    .sort();

  return values.map(value => ({
    file: filePath,
    from: value,
    to: value.slice(storyPrefix.length)
  }));
};

export const fixSceneCardPaths = async (
  input: FixSceneCardPathsInput
): Promise<FixSceneCardPathsResult> => {
  const storyDirs = await resolveStoryDirs(input);
  const checkedFiles: string[] = [];
  const changedFiles: string[] = [];
  const replacements: ScenePathReplacement[] = [];

  for (const storyPath of storyDirs) {
    for (const file of await listSceneFiles(input.fileSystem, storyPath)) {
      checkedFiles.push(file);
      const content = await input.fileSystem.readFile(file);
      const fileReplacements = collectScenePathReplacements(file, content);
      if (fileReplacements.length === 0) {
        continue;
      }

      replacements.push(...fileReplacements);
      changedFiles.push(file);

      if (input.write) {
        const nextContent = fileReplacements.reduce(
          (current, replacement) => current.split(replacement.from).join(replacement.to),
          content
        );
        await input.fileSystem.writeFile(file, nextContent);
      }
    }
  }

  return {
    projectRoot: input.projectRoot,
    storyPath: storyDirs.length === 1 ? storyDirs[0] : undefined,
    write: Boolean(input.write),
    checkedFiles: checkedFiles.sort(),
    changedFiles: [...new Set(changedFiles)].sort(),
    replacements
  };
};

const validateSceneReferences = (
  sourcePath: string,
  scene: SceneCard,
  entityIds: Set<string>
): StoryStructureIssue[] => scene.entities
    .filter(entityId => !entityIds.has(entityId))
    .map(entityId => ({
      severity: 'warning' as const,
      code: 'UNKNOWN_SCENE_ENTITY' as const,
      path: `${sourcePath}#${scene.id}.entities`,
      message: `SceneCard 引用不存在的 entity：${entityId}`
    }));

const validateSceneOrdering = (
  sceneSources: Array<{ scene: SceneCard; file: string }>
): StoryStructureIssue[] => {
  const seen = new Map<string, SceneCard>();
  const issues: StoryStructureIssue[] = [];

  for (const { scene, file } of sceneSources) {
    const key = `${scene.chapter}:${scene.order}`;
    const previous = seen.get(key);
    if (previous) {
      issues.push({
        severity: 'warning',
        code: 'DUPLICATE_SCENE_ORDER',
        path: `${file}#${scene.id}.order`,
        message: `SceneCard order 与 ${previous.id} 重复：${key}`
      });
      continue;
    }

    seen.set(key, scene);
  }

  return issues;
};

const hasWorldReveal = (scene: SceneCard): boolean =>
  Boolean(
    scene.worldReveal.factId
    || scene.worldReveal.actionImpact
    || scene.worldReveal.beneficiaries.length > 0
    || scene.worldReveal.costs.length > 0
    || scene.worldReveal.violationConsequence
  );

export const hasSceneWritingGateIntent = (scene: SceneCard): boolean =>
  Boolean(scene.plotThread.trim())
  && Boolean(scene.readerPromise.trim())
  && Boolean(scene.relationshipChange.trim())
  && hasWorldReveal(scene)
  && Boolean(scene.emotionalBeat.trim())
  && Boolean(scene.endingHook.trim())
  && scene.successCriteria.length > 0;

const validateSceneWritingGateIntent = (
  sourcePath: string,
  scene: SceneCard
): StoryStructureIssue[] => {
  const fields: Array<[string, boolean, string]> = [
    ['plotThread', Boolean(scene.plotThread.trim()), 'Scene Card 缺少推进的情节线 plotThread'],
    ['readerPromise', Boolean(scene.readerPromise.trim()), 'Scene Card 缺少建立或兑现的 readerPromise'],
    ['relationshipChange', Boolean(scene.relationshipChange.trim()), 'Scene Card 缺少关系变化 relationshipChange'],
    ['worldReveal', hasWorldReveal(scene), 'Scene Card 缺少世界观行动揭示 worldReveal'],
    ['emotionalBeat', Boolean(scene.emotionalBeat.trim()), 'Scene Card 缺少读者情绪/人物情绪节拍 emotionalBeat'],
    ['endingHook', Boolean(scene.endingHook.trim()), 'Scene Card 缺少结尾钩子 endingHook'],
    ['successCriteria', scene.successCriteria.length > 0, 'Scene Card 缺少写作成功标准 successCriteria']
  ];

  return fields
    .filter(([, ok]) => !ok)
    .map(([field, , message]) => ({
      severity: 'warning' as const,
      code: 'MISSING_SCENE_INTENT' as const,
      path: `${sourcePath}#${scene.id}.${field}`,
      message
    }));
};

export const inspectScenes = async (
  input: InspectStoryStructureInput
): Promise<SceneInspectionResult> => {
  const graph = await inspectStoryGraph(input);
  const entityIds = new Set(graph.entities.map(entity => entity.id));
  const storyDirs = await resolveStoryDirs(input);
  const files: string[] = [];
  const scenes: SceneCard[] = [];
  const sceneSources: Array<{ scene: SceneCard; file: string }> = [];
  const issues: StoryStructureIssue[] = [];

  for (const storyPath of storyDirs) {
    for (const file of await listSceneFiles(input.fileSystem, storyPath)) {
      files.push(file);
      const result = parseSceneCardDocument(await input.fileSystem.readFile(file), file);
      scenes.push(...result.scenes);
      sceneSources.push(...result.scenes.map(scene => ({ scene, file })));
      issues.push(...result.issues);
      issues.push(...result.scenes.flatMap(scene => validateSceneReferences(file, scene, entityIds)));
      issues.push(...result.scenes.flatMap(scene => validateSceneWritingGateIntent(file, scene)));
    }
  }

  issues.push(...validateSceneOrdering(sceneSources));

  return {
    projectRoot: input.projectRoot,
    storyPath: storyDirs.length === 1 ? storyDirs[0] : undefined,
    files: files.sort(),
    scenes: scenes.sort((left, right) =>
      left.chapter.localeCompare(right.chapter) || left.order - right.order || left.id.localeCompare(right.id)
    ),
    sceneSources: sceneSources
      .map(({ scene, file }) => ({ sceneId: scene.id, path: file, chapter: scene.chapter }))
      .sort((left, right) => left.sceneId.localeCompare(right.sceneId) || left.path.localeCompare(right.path)),
    issues
  };
};

export const renderStoryGraphInspection = (result: StoryGraphInspectionResult): string => [
  'Entity Graph',
  '',
  `文件：${result.files.length}`,
  `Entities：${result.entities.length}`,
  `Edges：${result.edges.length}`,
  `问题：${result.issues.length}`,
  '',
  ...(
    result.entities.length > 0
      ? result.entities.map(entity => `- ${entity.id}：${entity.name}（${entity.type}）`)
      : ['- 暂无 StoryEntity']
  ),
  '',
  ...(
    result.issues.length > 0
      ? [
        '问题列表：',
        ...result.issues.map(issue => `- [${issue.severity}] ${issue.code}: ${relativePath(result.projectRoot, issue.path)} - ${issue.message}`)
      ]
      : []
  )
].filter(line => line !== undefined).join('\n').trimEnd();

const addIndexValue = (
  target: Record<string, string[]>,
  key: string,
  value: string
): void => {
  target[key] = [...new Set([...(target[key] ?? []), value])].sort();
};

export const buildStoryGraphIndexes = (result: StoryGraphInspectionResult): StoryGraphIndexes => {
  const indexes: StoryGraphIndexes = {
    schemaVersion: '1.0',
    byType: {},
    byTag: {},
    bySourcePath: {},
    adjacency: {}
  };

  for (const entity of result.entities) {
    addIndexValue(indexes.byType, entity.type, entity.id);
    for (const tag of entity.tags) {
      addIndexValue(indexes.byTag, tag, entity.id);
    }
    for (const sourcePath of entity.sourcePaths) {
      addIndexValue(indexes.bySourcePath, sourcePath, entity.id);
    }
  }

  for (const edge of result.edges) {
    addIndexValue(indexes.adjacency, edge.from, edge.to);
    addIndexValue(indexes.adjacency, edge.to, edge.from);
    for (const evidencePath of edge.evidencePaths) {
      addIndexValue(indexes.bySourcePath, evidencePath, edge.id);
    }
  }

  return indexes;
};

export const renderSceneInspection = (result: SceneInspectionResult): string => [
  'Scene Cards',
  '',
  `文件：${result.files.length}`,
  `Scenes：${result.scenes.length}`,
  `问题：${result.issues.length}`,
  '',
  ...(
    result.scenes.length > 0
      ? result.scenes.map(scene => `- ${scene.id}：${scene.chapter} #${scene.order} ${scene.pov} @ ${scene.location}`)
      : ['- 暂无 SceneCard']
  ),
  '',
  ...(
    result.issues.length > 0
      ? [
        '问题列表：',
        ...result.issues.map(issue => `- [${issue.severity}] ${issue.code}: ${relativePath(result.projectRoot, issue.path)} - ${issue.message}`)
      ]
      : []
  )
].filter(line => line !== undefined).join('\n').trimEnd();
