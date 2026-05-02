export type StoryArtifactKind =
  | 'specification'
  | 'creative-plan'
  | 'tasks'
  | 'chapter'
  | 'tracking'
  | 'knowledge';

export type WritingTaskStatus = 'todo' | 'done';
export type WritingTaskPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'PX';

export interface StoryArtifact {
  kind: StoryArtifactKind;
  path: string;
  exists: boolean;
}

export interface StoryProject {
  name: string;
  path: string;
  artifacts: StoryArtifact[];
  tasks: WritingTask[];
}

export interface WritingTask {
  id: string;
  title: string;
  status: WritingTaskStatus;
  priority: WritingTaskPriority;
  storyPath: string;
  tasksPath: string;
  writeReady: boolean;
  planOnly: boolean;
  taskType?: string;
  coreTask?: string;
  dependencies: string[];
  outputs: string[];
  requiredReads: string[];
  allowedWrites: string[];
  clues: string[];
  acceptanceCriteria: string[];
}

export interface ParseWritingTasksOptions {
  storyPath: string;
  tasksPath: string;
}

interface TaskBlock {
  heading: string;
  lines: string[];
}

const TASK_HEADING_PATTERN = /^\s*-\s*\[(?<checked>[ xX])\]\s*(?<tags>(?:\[[^\]]+\]\s*)*)(?:\*\*)?(?<id>T\d+)(?:\*\*)?\s*-\s*(?<title>.+)$/;
const FIELD_PATTERN = /^\s*-\s+\*\*(?<name>[^*]+)\*\*[：:]\s*(?<value>.*)$/;
const CODE_PATH_PATTERN = /`([^`]+)`/g;
const TASK_ID_PATTERN = /\bT\d+\b/gi;
const CLUE_ID_PATTERN = /\bPL-\d+\b/gi;

const normalizeFieldName = (name: string): string => name
  .replace(/\s+/g, '')
  .trim();

const extractCodePaths = (line: string): string[] => [...line.matchAll(CODE_PATH_PATTERN)]
  .map(match => match[1].trim())
  .filter(Boolean);

const unique = (values: string[]): string[] => [...new Set(values)];

const parseTags = (tagsText: string): {
  priority: WritingTaskPriority;
  writeReady: boolean;
  planOnly: boolean;
} => {
  const tags = [...tagsText.matchAll(/\[([^\]]+)\]/g)].map(match => match[1].trim().toUpperCase());
  const priorityTag = tags.find(tag => /^P\d+$/.test(tag));

  return {
    priority: (priorityTag ?? 'PX') as WritingTaskPriority,
    writeReady: tags.includes('WRITE-READY'),
    planOnly: tags.includes('PLAN-ONLY')
  };
};

const splitTaskBlocks = (content: string): TaskBlock[] => {
  const blocks: TaskBlock[] = [];
  let current: TaskBlock | null = null;

  for (const line of content.split(/\r?\n/)) {
    if (TASK_HEADING_PATTERN.test(line)) {
      if (current) {
        blocks.push(current);
      }
      current = { heading: line, lines: [] };
      continue;
    }

    current?.lines.push(line);
  }

  if (current) {
    blocks.push(current);
  }

  return blocks;
};

const readListAfterField = (lines: string[], startIndex: number): string[] => {
  const values: string[] = [];

  for (const line of lines.slice(startIndex + 1)) {
    if (FIELD_PATTERN.test(line) || TASK_HEADING_PATTERN.test(line)) {
      break;
    }

    const trimmed = line.trim();
    if (/^-\s+/.test(trimmed)) {
      values.push(trimmed.replace(/^-\s+/, '').trim());
    }
  }

  return values;
};

const parseDependencies = (value: string): string[] => {
  if (!value || value.trim() === '无') {
    return [];
  }

  return unique([...value.matchAll(TASK_ID_PATTERN)].map(match => match[0].toUpperCase()));
};

const parseTaskBlock = (block: TaskBlock, options: ParseWritingTasksOptions): WritingTask => {
  const match = block.heading.match(TASK_HEADING_PATTERN);
  if (!match?.groups) {
    throw new Error(`Invalid task heading: ${block.heading}`);
  }

  const tags = parseTags(match.groups.tags);
  const task: WritingTask = {
    id: match.groups.id.toUpperCase(),
    title: match.groups.title.trim(),
    status: match.groups.checked.trim().toLowerCase() === 'x' ? 'done' : 'todo',
    priority: tags.priority,
    storyPath: options.storyPath,
    tasksPath: options.tasksPath,
    writeReady: tags.writeReady,
    planOnly: tags.planOnly,
    dependencies: [],
    outputs: [],
    requiredReads: [],
    allowedWrites: [],
    clues: [],
    acceptanceCriteria: []
  };

  block.lines.forEach((line, index) => {
    const fieldMatch = line.match(FIELD_PATTERN);
    if (!fieldMatch?.groups) {
      return;
    }

    const field = normalizeFieldName(fieldMatch.groups.name);
    const value = fieldMatch.groups.value.trim();
    const listValues = readListAfterField(block.lines, index);

    switch (field) {
      case '任务类型':
        task.taskType = value;
        break;
      case '核心任务':
        task.coreTask = value;
        break;
      case '必须读取':
        task.requiredReads = unique([...extractCodePaths(value), ...listValues.flatMap(extractCodePaths)]);
        break;
      case '允许修改':
        task.allowedWrites = unique([...extractCodePaths(value), ...listValues.flatMap(extractCodePaths)]);
        break;
      case '涉及线索':
        task.clues = unique([value, ...listValues]
          .flatMap(item => [...item.matchAll(CLUE_ID_PATTERN)].map(match => match[0].toUpperCase())));
        break;
      case '依赖':
        task.dependencies = parseDependencies(value);
        break;
      case '输出':
        task.outputs = unique([...extractCodePaths(value), ...listValues.flatMap(extractCodePaths)]);
        break;
      case '验收标准':
        task.acceptanceCriteria = listValues.map(item => item.replace(/^\[[ xX]\]\s*/, '').trim());
        break;
      default:
        break;
    }
  });

  return task;
};

export const parseWritingTasksFromMarkdown = (
  content: string,
  options: ParseWritingTasksOptions
): WritingTask[] => splitTaskBlocks(content).map(block => parseTaskBlock(block, options));
