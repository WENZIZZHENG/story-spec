import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import {
  hasSceneWritingGateIntent,
  inspectScenes
} from './inspect-story-structure.js';
import { parseWritingTasksFromMarkdown } from '../domain/story-artifact.js';

export interface WritingStateDocuments {
  constitution: boolean;
  specification: boolean;
  creativePlan: boolean;
  tasks: boolean;
}

export interface WritingStateTasks {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  completionRate: number;
  nextTask: string | null;
}

export interface WritingStateChapter {
  file: string;
  path: string;
  chars: number;
  withinRange: boolean;
}

export interface WritingStateContent {
  chapterCount: number;
  totalChars: number;
  badChapterCount: number;
  chapters: WritingStateChapter[];
}

export interface WritingStateTracking {
  total: number;
  valid: number;
  invalid: number;
  invalidFiles: string[];
}

export interface WritingStateSceneGate {
  total: number;
  ready: number;
  missingIntent: number;
  missingSceneCard: boolean;
  issueCount: number;
  sceneIds: string[];
}

export interface WritingStateStory {
  name: string;
  path: string;
}

export interface WritingStateResult {
  projectRoot: string;
  story: WritingStateStory | null;
  documents: WritingStateDocuments;
  tasks: WritingStateTasks;
  content: WritingStateContent;
  tracking: WritingStateTracking;
  sceneGate: WritingStateSceneGate;
  canWrite: boolean;
}

export interface CheckWritingStateInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  storyName?: string;
  wordRange?: {
    min: number;
    max: number;
  };
}

const DEFAULT_WORD_RANGE = {
  min: 2000,
  max: 4000
};

export const countNarrativeChars = (content: string): number => content
  .replace(/```[\s\S]*?```/g, '')
  .replace(/`[^`]*`/g, '')
  .replace(/[#>*_\-[\]()]/g, '')
  .replace(/\s+/g, '')
  .length;

const emptyDocuments = (): WritingStateDocuments => ({
  constitution: false,
  specification: false,
  creativePlan: false,
  tasks: false
});

const emptyTasks = (): WritingStateTasks => ({
  total: 0,
  pending: 0,
  inProgress: 0,
  completed: 0,
  completionRate: 0,
  nextTask: null
});

const emptyContent = (): WritingStateContent => ({
  chapterCount: 0,
  totalChars: 0,
  badChapterCount: 0,
  chapters: []
});

const listDirectories = async (
  fs: ProjectFileSystem,
  dirPath: string
): Promise<Array<{ name: string; path: string; mtimeMs: number }>> => {
  if (!await fs.pathExists(dirPath)) {
    return [];
  }

  const directories: Array<{ name: string; path: string; mtimeMs: number }> = [];
  for (const entry of await fs.readDir(dirPath)) {
    const entryPath = path.join(dirPath, entry);
    const stat = await fs.stat(entryPath);
    if (stat.isDirectory()) {
      directories.push({ name: entry, path: entryPath, mtimeMs: stat.mtimeMs });
    }
  }

  return directories.sort((left, right) => right.mtimeMs - left.mtimeMs);
};

const resolveStory = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  storyName?: string
): Promise<WritingStateStory | null> => {
  if (storyName) {
    const storyPath = path.join(projectRoot, 'stories', storyName);
    return await fs.pathExists(storyPath) ? { name: storyName, path: storyPath } : null;
  }

  const [latest] = await listDirectories(fs, path.join(projectRoot, 'stories'));
  return latest ? { name: latest.name, path: latest.path } : null;
};

const checkDocuments = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  story: WritingStateStory | null
): Promise<WritingStateDocuments> => {
  if (!story) {
    return emptyDocuments();
  }

  return {
    constitution: await fs.pathExists(path.join(projectRoot, '.specify', 'memory', 'writing-constitution.md'))
      || await fs.pathExists(path.join(projectRoot, 'memory', 'constitution.md')),
    specification: await fs.pathExists(path.join(story.path, 'specification.md')),
    creativePlan: await fs.pathExists(path.join(story.path, 'creative-plan.md')),
    tasks: await fs.pathExists(path.join(story.path, 'tasks.md'))
  };
};

const summarizeTasks = async (
  fs: ProjectFileSystem,
  story: WritingStateStory | null
): Promise<WritingStateTasks> => {
  if (!story) {
    return emptyTasks();
  }

  const tasksPath = path.join(story.path, 'tasks.md');
  if (!await fs.pathExists(tasksPath)) {
    return emptyTasks();
  }

  const content = await fs.readFile(tasksPath);
  const parsedTasks = parseWritingTasksFromMarkdown(content, {
    storyPath: story.path,
    tasksPath
  });
  const inProgress = content.split(/\r?\n/).filter(line => /^\s*-\s*\[~\]/.test(line)).length;
  const pendingTasks = parsedTasks.filter(task => task.status === 'todo');
  const completed = parsedTasks.filter(task => task.status === 'done').length;
  const total = parsedTasks.length + inProgress;
  const completionRate = total > 0 ? Math.floor((completed * 100) / total) : 0;
  const nextTask = pendingTasks[0] ? `${pendingTasks[0].id} - ${pendingTasks[0].title}` : null;

  return {
    total,
    pending: pendingTasks.length,
    inProgress,
    completed,
    completionRate,
    nextTask
  };
};

const listMarkdownFiles = async (
  fs: ProjectFileSystem,
  dirPath: string
): Promise<string[]> => {
  if (!await fs.pathExists(dirPath)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of await fs.readDir(dirPath)) {
    const entryPath = path.join(dirPath, entry);
    const stat = await fs.stat(entryPath);
    if (stat.isDirectory()) {
      files.push(...await listMarkdownFiles(fs, entryPath));
    } else if (stat.isFile() && entry.endsWith('.md')) {
      files.push(entryPath);
    }
  }

  return files.sort();
};

const summarizeContent = async (
  fs: ProjectFileSystem,
  story: WritingStateStory | null,
  wordRange: CheckWritingStateInput['wordRange']
): Promise<WritingStateContent> => {
  if (!story) {
    return emptyContent();
  }

  const range = wordRange ?? DEFAULT_WORD_RANGE;
  const files = await listMarkdownFiles(fs, path.join(story.path, 'content'));
  const chapters: WritingStateChapter[] = [];

  for (const filePath of files) {
    const chars = countNarrativeChars(await fs.readFile(filePath));
    chapters.push({
      file: path.basename(filePath),
      path: filePath,
      chars,
      withinRange: chars >= range.min && chars <= range.max
    });
  }

  return {
    chapterCount: chapters.length,
    totalChars: chapters.reduce((total, chapter) => total + chapter.chars, 0),
    badChapterCount: chapters.filter(chapter => !chapter.withinRange).length,
    chapters
  };
};

const summarizeTracking = async (
  fs: ProjectFileSystem,
  projectRoot: string
): Promise<WritingStateTracking> => {
  const trackingDir = path.join(projectRoot, 'spec', 'tracking');
  if (!await fs.pathExists(trackingDir)) {
    return { total: 0, valid: 0, invalid: 0, invalidFiles: [] };
  }

  const files = (await fs.readDir(trackingDir)).filter(file => file.endsWith('.json')).sort();
  const invalidFiles: string[] = [];

  for (const file of files) {
    try {
      JSON.parse(await fs.readFile(path.join(trackingDir, file)));
    } catch {
      invalidFiles.push(file);
    }
  }

  return {
    total: files.length,
    valid: files.length - invalidFiles.length,
    invalid: invalidFiles.length,
    invalidFiles
  };
};

const emptySceneGate = (): WritingStateSceneGate => ({
  total: 0,
  ready: 0,
  missingIntent: 0,
  missingSceneCard: true,
  issueCount: 0,
  sceneIds: []
});

const summarizeSceneGate = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  story: WritingStateStory | null
): Promise<WritingStateSceneGate> => {
  if (!story) {
    return emptySceneGate();
  }

  const scenes = await inspectScenes({
    projectRoot,
    fileSystem: fs,
    story: story.name
  });
  const ready = scenes.scenes.filter(hasSceneWritingGateIntent).length;

  return {
    total: scenes.scenes.length,
    ready,
    missingIntent: scenes.scenes.length - ready,
    missingSceneCard: scenes.scenes.length === 0,
    issueCount: scenes.issues.length,
    sceneIds: scenes.scenes.map(scene => scene.id)
  };
};

export const checkWritingState = async (
  input: CheckWritingStateInput
): Promise<WritingStateResult> => {
  const story = await resolveStory(input.fileSystem, input.projectRoot, input.storyName);
  const documents = await checkDocuments(input.fileSystem, input.projectRoot, story);
  const tasks = await summarizeTasks(input.fileSystem, story);
  const content = await summarizeContent(input.fileSystem, story, input.wordRange);
  const tracking = await summarizeTracking(input.fileSystem, input.projectRoot);
  const sceneGate = await summarizeSceneGate(input.fileSystem, input.projectRoot, story);
  const canWrite = Boolean(story)
    && documents.constitution
    && documents.specification
    && documents.creativePlan
    && documents.tasks
    && tasks.total > 0
    && !sceneGate.missingSceneCard
    && sceneGate.missingIntent === 0;

  return {
    projectRoot: input.projectRoot,
    story,
    documents,
    tasks,
    content,
    tracking,
    sceneGate,
    canWrite
  };
};

const checkbox = (ok: boolean): string => ok ? 'x' : ' ';
const alertBox = (ok: boolean): string => ok ? 'x' : '!';

export const renderWritingStateChecklist = (state: WritingStateResult): string => {
  const lines = [
    '# 写作状态检查 Checklist',
    '',
    `**当前故事**: ${state.story?.name ?? '未发现'}`,
    '',
    '## 文档完整性',
    '',
    `- [${checkbox(state.documents.constitution)}] CHK001 writing-constitution.md 存在`,
    `- [${checkbox(state.documents.specification)}] CHK002 specification.md 存在`,
    `- [${checkbox(state.documents.creativePlan)}] CHK003 creative-plan.md 存在`,
    `- [${checkbox(state.documents.tasks)}] CHK004 tasks.md 存在`,
    '',
    '## 任务进度',
    '',
    `- [${checkbox(state.tasks.inProgress > 0)}] CHK005 有进行中的任务（${state.tasks.inProgress} 个）`,
    `- [x] CHK006 待开始任务数量（${state.tasks.pending} 个）`,
    `- [${checkbox(state.tasks.completed > 0)}] CHK007 已完成任务进度（${state.tasks.completed}/${state.tasks.total} = ${state.tasks.completionRate}%）`,
    '',
    '## 内容质量',
    '',
    `- [${checkbox(state.content.chapterCount > 0)}] CHK008 已完成章节数（${state.content.chapterCount} 章）`,
    `- [${alertBox(state.content.badChapterCount === 0)}] CHK009 字数符合标准（${state.content.badChapterCount === 0 ? '全部符合' : `${state.content.badChapterCount} 章不符合`}）`,
    `- [${alertBox(state.tracking.invalid === 0)}] CHK010 tracking JSON 有效（${state.tracking.invalid} 个错误）`,
    `- [${alertBox(!state.sceneGate.missingSceneCard && state.sceneGate.missingIntent === 0)}] CHK011 Scene Card 写作门禁（${state.sceneGate.ready}/${state.sceneGate.total} ready）`,
    '',
    '## 后续行动'
  ];

  if (state.sceneGate.missingSceneCard) {
    lines.push('', '- [ ] 先运行 storyspec scene:init 或补写 Scene Card preview，再进入正文写作');
  } else if (state.sceneGate.missingIntent > 0) {
    lines.push('', '- [ ] 补齐 Scene Card 的 plotThread、readerPromise、relationshipChange、worldReveal、emotionalBeat、endingHook 和 successCriteria');
  } else if (!state.canWrite) {
    lines.push('', '- [ ] 补齐写作前置文档与任务清单');
  } else if (state.tasks.pending > 0 || state.tasks.inProgress > 0) {
    lines.push('', `- [ ] 下一任务：${state.tasks.nextTask ?? '继续进行中的任务'}`);
  } else {
    lines.push('', '- [ ] 运行 /analyze 进行综合验证');
  }

  return lines.join('\n');
};
