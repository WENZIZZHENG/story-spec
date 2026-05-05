import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';

export interface CaptureTodoInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  topic: string;
  from?: string;
  notes?: string;
  apply?: boolean;
}

export interface CaptureTodoResult {
  projectRoot: string;
  topic: string;
  slug: string;
  mode: 'preview' | 'apply';
  blocked: boolean;
  blockedReasons: string[];
  nextActions: string[];
  roadmapPath: string;
  indexPath: string;
  wouldWrite: string[];
  updatedFiles: string[];
  draftRoadmap: string;
  indexPatchPreview: string;
}

const TODO_INDEX_PATH = 'docs/tech/todo-index.md';

const normalizeToPosix = (value: string): string => value.replace(/\\/g, '/').replace(/\/+/g, '/');

const toSlug = (topic: string): string => {
  const normalized = topic
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'topic';
};

const relativePath = (...parts: string[]): string => normalizeToPosix(path.join(...parts));

const absolutePath = (projectRoot: string, relative: string): string => path.join(projectRoot, ...relative.split('/'));

const markdownListFromNotes = (notes: string): string[] => {
  const lines = notes
    .split(/\r?\n/)
    .map(line => line.trim().replace(/^[-*]\s+/, ''))
    .filter(Boolean);

  return lines.length > 0 ? lines : ['待人工确认：补充待办来源摘要'];
};

const roadmapTitle = (topic: string): string => /[a-z0-9]$/i.test(topic.trim())
  ? `${topic} 路线图`
  : `${topic}路线图`;

const buildRoadmapDraft = (topic: string, notes: string): string => {
  const noteLines = markdownListFromNotes(notes);

  return [
    `# ${roadmapTitle(topic)}`,
    '',
    '## 状态',
    '',
    'Active。本文由 `todo:capture` 根据讨论 notes 生成草案，后续开发前仍需把具体任务转为 OpenSpec change。',
    '',
    '## 背景和目标',
    '',
    '- 目标：待人工确认。',
    '- 来源摘要：',
    ...noteLines.map(line => `  - ${line}`),
    '',
    '## 非目标',
    '',
    '- 不自动判断复杂方案可行性。',
    '- 不替代 OpenSpec-first 开发流程。',
    '- 不把草案内容写成已实现能力。',
    '',
    '## P1 捕获任务',
    '',
    '### P1-0 待人工确认的首个任务',
    '',
    '- [ ] 状态：Active',
    '- 类型：待人工确认',
    '- 背景/问题：来自本次 notes，需人工校准后再开发。',
    '- 已有基础：待人工确认。',
    '- 缺口：待人工确认。',
    '- 建议方案：先整理需求和验收标准，再转为 OpenSpec change。',
    '- 涉及文件/模块：待人工确认。',
    '- 参考资料：本路线的来源 notes。',
    '- OpenSpec 输入：开发前新建 change，并把本任务拆成 proposal、design、tasks 和 spec delta。',
    '- 验收标准：任务已被人工校准，且具备可执行的验收命令。',
    '- 不做/边界：不在本草案阶段承诺实现。',
    '',
    '## 风险与边界',
    '',
    '- 草案可能遗漏上下文，需要人工复核。',
    '- 若任务影响 CLI、模板或公共接口，必须新增 changeset。',
    '',
    '## 完成同步',
    '',
    '- 完成任一任务后更新本文状态。',
    '- 涉及用户可见行为时新增 `changes/*.md`。',
    '- 路线完成后同步 `docs/tech/todo-index.md` 和 `docs/tech/todo-archive.md`。'
  ].join('\n');
};

const buildIndexRow = (topic: string, roadmapPath: string): string => {
  const roadmapFile = path.posix.basename(roadmapPath);
  return `| P1 | [${roadmapTitle(topic)}](${roadmapFile}) | Active | 待人工确认；来自 \`todo:capture\` 草案 | 先人工校准草案，再将首个任务转为 OpenSpec |`;
};

const insertIndexRow = (indexMarkdown: string, row: string): string => {
  const lines = indexMarkdown.split(/\r?\n/);
  const tableStart = lines.findIndex(line => line.trim() === '| 优先级 | 路线 | 状态 | 覆盖范围 | 下一步 |');
  if (tableStart === -1) {
    return `${indexMarkdown.trimEnd()}\n\n${row}\n`;
  }

  let insertAt = tableStart + 1;
  while (insertAt < lines.length && lines[insertAt].trim().startsWith('|')) {
    insertAt += 1;
  }

  lines.splice(insertAt, 0, row);
  return lines.join('\n');
};

const readNotes = async (input: CaptureTodoInput): Promise<{ notes: string; blockedReasons: string[] }> => {
  const hasInlineNotes = Boolean(input.notes?.trim());
  const hasFileNotes = Boolean(input.from?.trim());

  if (hasInlineNotes && hasFileNotes) {
    return {
      notes: '',
      blockedReasons: ['只能提供一个 notes 来源：--from 或 --notes 二选一']
    };
  }

  if (!hasInlineNotes && !hasFileNotes) {
    return {
      notes: '',
      blockedReasons: ['缺少 notes：请使用 --from <path> 或 --notes <text> 提供待办来源']
    };
  }

  if (hasInlineNotes) {
    return {
      notes: input.notes!.trim(),
      blockedReasons: []
    };
  }

  const sourcePath = path.isAbsolute(input.from!)
    ? input.from!
    : path.join(input.projectRoot, input.from!);
  if (!await input.fileSystem.pathExists(sourcePath)) {
    return {
      notes: '',
      blockedReasons: [`notes 文件不存在：${input.from}`]
    };
  }

  return {
    notes: (await input.fileSystem.readFile(sourcePath)).trim(),
    blockedReasons: []
  };
};

const blockedResult = (
  input: CaptureTodoInput,
  slug: string,
  roadmapPath: string,
  indexPath: string,
  reasons: string[],
  draftRoadmap = '',
  indexPatchPreview = ''
): CaptureTodoResult => ({
  projectRoot: input.projectRoot,
  topic: input.topic,
  slug,
  mode: input.apply ? 'apply' : 'preview',
  blocked: true,
  blockedReasons: reasons,
  nextActions: ['修复阻断原因后重新运行 todo:capture'],
  roadmapPath,
  indexPath,
  wouldWrite: [],
  updatedFiles: [],
  draftRoadmap,
  indexPatchPreview
});

export const captureTodo = async (input: CaptureTodoInput): Promise<CaptureTodoResult> => {
  const topic = input.topic.trim();
  const slug = toSlug(topic);
  const roadmapPath = relativePath('docs', 'tech', `${slug}-roadmap.md`);
  const indexPath = TODO_INDEX_PATH;
  const mode = input.apply ? 'apply' : 'preview';

  if (!topic) {
    return blockedResult(input, slug, roadmapPath, indexPath, ['缺少 topic：请使用 --topic <name>']);
  }

  const { notes, blockedReasons: notesBlockedReasons } = await readNotes(input);
  if (notesBlockedReasons.length > 0) {
    return blockedResult(input, slug, roadmapPath, indexPath, notesBlockedReasons);
  }

  const draftRoadmap = buildRoadmapDraft(topic, notes);
  const indexPatchPreview = buildIndexRow(topic, roadmapPath);
  const roadmapFullPath = absolutePath(input.projectRoot, roadmapPath);
  const indexFullPath = absolutePath(input.projectRoot, indexPath);

  if (!await input.fileSystem.pathExists(indexFullPath)) {
    return blockedResult(input, slug, roadmapPath, indexPath, ['缺少 todo-index.md：docs/tech/todo-index.md'], draftRoadmap, indexPatchPreview);
  }

  if (await input.fileSystem.pathExists(roadmapFullPath)) {
    return blockedResult(input, slug, roadmapPath, indexPath, [`目标路线已存在：${roadmapPath}`], draftRoadmap, indexPatchPreview);
  }

  const wouldWrite = [roadmapPath, indexPath];
  if (!input.apply) {
    return {
      projectRoot: input.projectRoot,
      topic,
      slug,
      mode,
      blocked: false,
      blockedReasons: [],
      nextActions: ['确认草案后运行 todo:capture --apply 写入路线'],
      roadmapPath,
      indexPath,
      wouldWrite,
      updatedFiles: [],
      draftRoadmap,
      indexPatchPreview
    };
  }

  const indexMarkdown = await input.fileSystem.readFile(indexFullPath);
  await input.fileSystem.writeFile(roadmapFullPath, draftRoadmap);
  await input.fileSystem.writeFile(indexFullPath, insertIndexRow(indexMarkdown, indexPatchPreview));

  return {
    projectRoot: input.projectRoot,
    topic,
    slug,
    mode,
    blocked: false,
    blockedReasons: [],
    nextActions: ['人工校准 roadmap 草案，并把首个任务转为 OpenSpec change'],
    roadmapPath,
    indexPath,
    wouldWrite,
    updatedFiles: [roadmapFullPath, indexFullPath],
    draftRoadmap,
    indexPatchPreview
  };
};

export const renderTodoCaptureSummary = (result: CaptureTodoResult): string => [
  '待办捕获',
  '',
  `主题：${result.topic}`,
  `模式：${result.mode === 'apply' ? '应用模式' : '预览模式'}`,
  `状态：${result.blocked ? '阻断' : '通过'}`,
  `路线：${result.roadmapPath}`,
  '',
  ...(result.blockedReasons.length > 0 ? [
    '阻断原因：',
    ...result.blockedReasons.map(reason => `- ${reason}`),
    ''
  ] : []),
  'Index 预览：',
  result.indexPatchPreview || '- 无',
  '',
  '写入文件：',
  ...(result.updatedFiles.length > 0
    ? result.updatedFiles.map(file => `- ${file}`)
    : result.wouldWrite.map(file => `- ${file}（预览）`)),
  '',
  '下一步：',
  ...result.nextActions.map(action => `- ${action}`)
].join('\n');
