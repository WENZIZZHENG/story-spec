import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import { inspectCanon, inspectWorld } from './inspect-worldbuilding.js';
import { inspectScenes, inspectStoryGraph } from './inspect-story-structure.js';
import { inspectVoice } from './inspect-voice.js';
import type {
  ContextPack,
  ContextPackItem,
  ContextPackPurpose
} from '../domain/workbench.js';
import type { WritingTask } from '../domain/story-artifact.js';
import {
  findStoryArtifactPath,
  normalizeProjectRelativePath,
  relativePath,
  requireTasksPath,
  resolveProjectPath,
  selectStoryProject,
  slugifyPathPart,
  toPosixPath,
  unique
} from './workbench-utils.js';
import { summarizeCreativeControl } from './creative-control-summary.js';
import { getStoryStageNextQuestions } from '../domain/story-stage.js';

export interface GenerateContextPackInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  task?: string;
  chapter?: string;
  scene?: string;
  purpose?: ContextPackPurpose;
  write?: boolean;
  output?: string;
  now?: () => Date;
}

export interface GenerateContextPackResult {
  pack: ContextPack;
  markdown: string;
  outputJsonPath?: string;
  outputMarkdownPath?: string;
}

export interface ContextPackValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code:
    | 'CONTEXT_PACK_MISSING_FILE'
    | 'CONTEXT_PACK_EMPTY_REASON'
    | 'CONTEXT_PACK_TASK_WRITE_GAP'
    | 'CONTEXT_PACK_STALE';
  path: string;
  message: string;
}

export interface ValidateContextPackResult {
  projectRoot: string;
  packPath: string;
  pack: ContextPack;
  valid: boolean;
  issues: ContextPackValidationIssue[];
}

const DEFAULT_CONTEXT_PACK_TTL_DAYS = 14;

const findTargetTask = (
  tasks: WritingTask[],
  taskId?: string
): WritingTask | undefined => {
  if (taskId) {
    return tasks.find(task => task.id.toUpperCase() === taskId.toUpperCase());
  }

  return tasks.find(task => task.status === 'todo');
};

const addMustRead = (
  items: Map<string, ContextPackItem>,
  filePath: string | undefined,
  reason: string,
  required = true
): void => {
  if (!filePath) {
    return;
  }

  const existing = items.get(filePath);
  if (existing) {
    items.set(filePath, {
      ...existing,
      required: existing.required || required,
      reason: unique([existing.reason, reason]).join('；')
    });
    return;
  }

  items.set(filePath, { path: filePath, reason, required });
};

const renderList = (items: string[]): string =>
  items.length > 0 ? items.map(item => `- \`${item}\``).join('\n') : '- 无';

const renderMustRead = (items: ContextPackItem[]): string =>
  items.length > 0
    ? items.map(item => `- [ ] \`${item.path}\`：${item.reason}${item.required ? '' : '（可选）'}`).join('\n')
    : '- 无';

const normalizeChapter = (chapter?: string): string | undefined => {
  if (!chapter) {
    return undefined;
  }

  const trimmed = chapter.trim();
  return /^\d+$/.test(trimmed) ? `chapter-${trimmed.padStart(3, '0')}` : trimmed;
};

const createPackId = (
  storyName: string,
  purpose: ContextPackPurpose,
  task?: WritingTask,
  chapter?: string,
  scene?: string
): string => [
  slugifyPathPart(storyName),
  task?.id.toLowerCase() ?? chapter ?? scene ?? 'current',
  `${purpose}-pack`
].filter(Boolean).join('.');

const readRecentSummary = async (
  projectRoot: string,
  fs: ProjectFileSystem,
  storyPath: string,
  chapter?: string
): Promise<string> => {
  const contentDir = path.join(storyPath, 'content');
  if (!await fs.pathExists(contentDir)) {
    return '暂无正文内容。';
  }

  const files = (await fs.readDir(contentDir))
    .filter(file => file.endsWith('.md'))
    .sort();
  const selected = chapter
    ? files.find(file => file.includes(chapter))
    : files.at(-1);
  if (!selected) {
    return '暂无正文内容。';
  }

  const filePath = path.join(contentDir, selected);
  const content = await fs.readFile(filePath);
  const preview = content.replace(/\s+/g, ' ').trim().slice(0, 220);
  return `${relativePath(projectRoot, filePath)}：${preview || '空正文'}`;
};

export const generateContextPack = async (
  input: GenerateContextPackInput
): Promise<GenerateContextPackResult> => {
  const { projectRoot, fileSystem: fs } = input;
  const story = await selectStoryProject(projectRoot, fs, input.story);
  const tasksPath = requireTasksPath(story);
  const targetTask = findTargetTask(story.tasks, input.task);
  const purpose = input.purpose ?? 'write';
  const targetChapter = normalizeChapter(input.chapter);
  const [world, canon, graph, scenes, voice] = await Promise.all([
    inspectWorld({ projectRoot, fileSystem: fs }),
    inspectCanon({ projectRoot, fileSystem: fs }),
    inspectStoryGraph({ projectRoot, fileSystem: fs }),
    inspectScenes({ projectRoot, fileSystem: fs, story: story.name }),
    inspectVoice({ projectRoot, fileSystem: fs })
  ]);
  const creativeControl = await summarizeCreativeControl({
    projectRoot,
    storyPath: story.path,
    fileSystem: fs,
    fallbackNextQuestions: getStoryStageNextQuestions(story.stage)
  });
  const mustRead = new Map<string, ContextPackItem>();

  addMustRead(mustRead, 'AGENTS.md', '项目级 agent 工作边界');
  addMustRead(mustRead, '.specify/memory/constitution.md', '创作宪法与最高原则');
  addMustRead(mustRead, findStoryArtifactPath(story, 'specification') ? relativePath(projectRoot, findStoryArtifactPath(story, 'specification')!) : undefined, '故事规格');
  addMustRead(mustRead, findStoryArtifactPath(story, 'creative-plan') ? relativePath(projectRoot, findStoryArtifactPath(story, 'creative-plan')!) : undefined, '创作计划');
  addMustRead(mustRead, creativeControl.recordPath ? relativePath(projectRoot, creativeControl.recordPath) : undefined, '澄清记录与创作控制摘要');
  addMustRead(mustRead, creativeControl.markdownPath ? relativePath(projectRoot, creativeControl.markdownPath) : undefined, '面向作者审阅的澄清记录');
  addMustRead(mustRead, relativePath(projectRoot, tasksPath), '当前任务清单');

  for (const file of [
    ...world.files,
    ...canon.files,
    ...graph.files,
    ...scenes.files,
    ...voice.files
  ]) {
    addMustRead(mustRead, relativePath(projectRoot, file), '结构化创作上下文', false);
  }

  if (targetTask) {
    for (const file of targetTask.requiredReads) {
      addMustRead(
        mustRead,
        normalizeProjectRelativePath(projectRoot, story.path, file),
        `任务 ${targetTask.id} 必须读取`
      );
    }
  }

  const allowedWrites = unique([
    ...(targetTask?.allowedWrites ?? []),
    ...(targetTask?.outputs ?? [])
  ].map(file => normalizeProjectRelativePath(projectRoot, story.path, file)));
  const constraints = unique([
    ...(targetTask?.planOnly ? ['当前任务是 PLAN-ONLY，不应直接写正文。'] : []),
    ...(targetTask && !targetTask.writeReady ? ['当前任务未标记 WRITE-READY，写正文前应补齐边界。'] : []),
    ...creativeControl.cannotFinalize.map(item => `不得擅自定稿：${item}`),
    '只修改 ContextPack 中列出的 allowedWrites，除非用户明确扩大范围。',
    'WorldFact、CanonFact、Scene Card 与 VoiceFingerprint 的结构化事实优先于临场发挥。'
  ]);
  const pack: ContextPack = {
    schemaVersion: '1.0',
    id: createPackId(story.name, purpose, targetTask, targetChapter, input.scene),
    purpose,
    story: story.name,
    targetTask: targetTask?.id,
    targetChapter,
    targetScene: input.scene,
    generatedAt: (input.now ?? (() => new Date()))().toISOString(),
    mustRead: [...mustRead.values()],
    allowedWrites,
    worldFacts: world.facts.map(fact => fact.id),
    canonFacts: canon.facts.map(fact => fact.id),
    sceneCards: scenes.scenes.map(scene => scene.id),
    voiceFingerprints: voice.fingerprints.map(fingerprint => fingerprint.characterId),
    recentSummary: await readRecentSummary(projectRoot, fs, story.path, targetChapter),
    constraints,
    validationChecklist: [
      '必须读取项都有明确 reason。',
      '输出路径只落在 allowedWrites 中。',
      '正文写作后运行 narrative:test 或 review 产生结构化 findings。',
      '如写出新事实，生成待确认 CanonFact 或 propagation debt。'
    ]
  };
  const markdown = renderContextPackMarkdown(pack);

  if (input.write === false) {
    return { pack, markdown };
  }

  const outputBase = input.output
    ? path.resolve(projectRoot, input.output).replace(/\.json$|\.md$/, '')
    : path.join(projectRoot, '.specify', 'context-packs', pack.id);
  const outputJsonPath = `${outputBase}.json`;
  const outputMarkdownPath = `${outputBase}.md`;
  await fs.ensureDir(path.dirname(outputJsonPath));
  await fs.writeJson(outputJsonPath, pack, { spaces: 2 });
  await fs.writeFile(outputMarkdownPath, markdown);

  return {
    pack,
    markdown,
    outputJsonPath,
    outputMarkdownPath
  };
};

export const renderContextPackMarkdown = (pack: ContextPack): string => [
  '# Context Pack',
  '',
  `ID：${pack.id}`,
  `用途：${pack.purpose}`,
  `故事：${pack.story}`,
  `任务：${pack.targetTask ?? '无'}`,
  `章节：${pack.targetChapter ?? '无'}`,
  `场景：${pack.targetScene ?? '无'}`,
  `生成时间：${pack.generatedAt}`,
  '',
  '## 必须读取',
  '',
  renderMustRead(pack.mustRead),
  '',
  '## 允许修改',
  '',
  renderList(pack.allowedWrites),
  '',
  '## 结构索引',
  '',
  `WorldFacts：${pack.worldFacts.join(', ') || '无'}`,
  `CanonFacts：${pack.canonFacts.join(', ') || '无'}`,
  `Scene Cards：${pack.sceneCards.join(', ') || '无'}`,
  `VoiceFingerprints：${pack.voiceFingerprints.join(', ') || '无'}`,
  '',
  '## 最近上下文',
  '',
  pack.recentSummary,
  '',
  '## 约束',
  '',
  pack.constraints.map(item => `- ${item}`).join('\n'),
  '',
  '## 验证清单',
  '',
  pack.validationChecklist.map(item => `- [ ] ${item}`).join('\n')
].join('\n');

export const validateContextPack = async (
  input: {
    projectRoot: string;
    fileSystem: ProjectFileSystem;
    packPath: string;
    now?: () => Date;
  }
): Promise<ValidateContextPackResult> => {
  const packPath = path.isAbsolute(input.packPath)
    ? input.packPath
    : path.join(input.projectRoot, ...input.packPath.split('/'));
  const pack = await input.fileSystem.readJson<ContextPack>(packPath);
  const issues: ContextPackValidationIssue[] = [];

  for (const item of pack.mustRead) {
    if (!item.reason.trim()) {
      issues.push({
        severity: 'warning',
        code: 'CONTEXT_PACK_EMPTY_REASON',
        path: `${packPath}#mustRead.${item.path}`,
        message: `mustRead 缺少 reason：${item.path}`
      });
    }

    if (item.required && !await input.fileSystem.pathExists(resolveProjectPath(input.projectRoot, item.path))) {
      issues.push({
        severity: 'error',
        code: 'CONTEXT_PACK_MISSING_FILE',
        path: resolveProjectPath(input.projectRoot, item.path),
        message: `ContextPack 必须读取文件不存在：${item.path}`
      });
    }
  }

  if (pack.targetTask && pack.allowedWrites.length === 0) {
    issues.push({
      severity: 'warning',
      code: 'CONTEXT_PACK_TASK_WRITE_GAP',
      path: packPath,
      message: `ContextPack ${pack.id} 指定了任务 ${pack.targetTask}，但没有 allowedWrites`
    });
  }

  const now = input.now ?? (() => new Date());
  const ageMs = now().getTime() - new Date(pack.generatedAt).getTime();
  if (Number.isFinite(ageMs) && ageMs > DEFAULT_CONTEXT_PACK_TTL_DAYS * 24 * 60 * 60 * 1000) {
    issues.push({
      severity: 'info',
      code: 'CONTEXT_PACK_STALE',
      path: packPath,
      message: `ContextPack 已超过 ${DEFAULT_CONTEXT_PACK_TTL_DAYS} 天，建议重新生成`
    });
  }

  return {
    projectRoot: input.projectRoot,
    packPath,
    pack,
    valid: !issues.some(issue => issue.severity === 'error'),
    issues
  };
};

export const renderContextPackSummary = (result: GenerateContextPackResult): string => [
  'Novel Writer Context Pack',
  '',
  `ID：${result.pack.id}`,
  `故事：${result.pack.story}`,
  `任务：${result.pack.targetTask ?? '无'}`,
  `必须读取：${result.pack.mustRead.length}`,
  `允许修改：${result.pack.allowedWrites.length}`,
  ...(result.outputJsonPath ? [`JSON：${result.outputJsonPath}`] : []),
  ...(result.outputMarkdownPath ? [`Markdown：${result.outputMarkdownPath}`] : [])
].join('\n');

export const renderContextPackValidation = (result: ValidateContextPackResult): string => [
  'Context Pack 校验',
  '',
  `Pack：${result.pack.id}`,
  `结果：${result.valid ? '通过' : '失败'}`,
  `问题：${result.issues.length}`,
  '',
  ...(result.issues.length > 0
    ? result.issues.map(issue => `- [${issue.severity}] ${issue.code}: ${toPosixPath(issue.path)} - ${issue.message}`)
    : ['- 无'])
].join('\n').trimEnd();
