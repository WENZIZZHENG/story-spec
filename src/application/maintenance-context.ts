import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';

export type MaintenanceContextTopic = 'todo' | 'chapter' | 'release';

export interface MaintenanceRouteSummary {
  title: string;
  path?: string;
  status: string;
  priority: string;
  nextStep: string;
}

export interface MaintenanceContextInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  topic?: string;
  brief?: boolean;
}

export interface MaintenanceContextResult {
  projectRoot: string;
  topic: MaintenanceContextTopic;
  brief: boolean;
  files: string[];
  activeRoutes: MaintenanceRouteSummary[];
  rules: string[];
  commands: string[];
}

const TOPICS: MaintenanceContextTopic[] = ['todo', 'chapter', 'release'];

const TODO_INDEX_PATH = 'docs/tech/todo-index.md';

const topicFiles: Record<MaintenanceContextTopic, string[]> = {
  todo: [TODO_INDEX_PATH],
  chapter: [
    'docs/tech/todo-index.md',
    'docs/tech/archive/completed-roadmaps/chapter-production-workflow-roadmap.md'
  ],
  release: [
    'changes/',
    'docs/tech/todo-index.md'
  ]
};

const topicRules: Record<MaintenanceContextTopic, string[]> = {
  todo: [
    '先读 docs/tech/todo-index.md，再按路线读取对应 roadmap。',
    '长期增强写入 docs/tech/*-roadmap.md 并登记到 todo-index。',
    '完成后更新路线状态或 todo-archive，避免多入口待办漂移。',
    'CLI、模板或用户可见行为变更需要新增 changes/*.md。',
    '默认预览；只有显式 --apply 或 --commit 才写入。'
  ],
  chapter: [
    '先确认当前 story、任务 ID、Scene Card 和正文路径。',
    'Scene Card 内项目路径应相对 story root。',
    '写作收尾先预览验证计划，再显式 --apply 同步任务状态。',
    '章节验证关注当前任务范围，未开始章节不要制造噪音。'
  ],
  release: [
    '发布前运行构建、单元测试、smoke、changes 和命令 manifest 检查。',
    '新增 CLI 命令后运行 build:commands 与 check:command-manifest。',
    'changeset 只记录已发生的用户可见变化，不作为待办入口。',
    '不主动 push；本地提交后由作者决定发布动作。'
  ]
};

const topicCommands: Record<MaintenanceContextTopic, string[]> = {
  todo: [
    'git diff --check',
    "Select-String -Path docs\\tech\\*.md -Pattern 'TBD|TODO|待定' -CaseSensitive",
    'git status --short --branch'
  ],
  chapter: [
    'storyspec scene:check <story>',
    'storyspec task:finish <taskId>',
    'storyspec validate',
    'storyspec style:lint <story>',
    'storyspec narrative:test <story>'
  ],
  release: [
    'npm run build',
    'npm test',
    'npm run test:smoke',
    'npm run check:changes',
    'npm run check:command-manifest'
  ]
};

const normalizeTopic = (topic?: string): MaintenanceContextTopic => {
  const normalized = (topic ?? 'todo').toLowerCase();
  if (!TOPICS.includes(normalized as MaintenanceContextTopic)) {
    throw new Error(`未知维护主题：${topic}`);
  }
  return normalized as MaintenanceContextTopic;
};

const readOptionalFile = async (
  projectRoot: string,
  fileSystem: ProjectFileSystem,
  relativePath: string
): Promise<string | undefined> => {
  const fullPath = path.join(projectRoot, relativePath);
  if (!await fileSystem.pathExists(fullPath)) {
    return undefined;
  }
  return fileSystem.readFile(fullPath);
};

const extractRouteLink = (routeCell: string): { title: string; path?: string } => {
  const markdownLink = routeCell.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (!markdownLink) {
    return { title: routeCell.trim() };
  }

  return {
    title: markdownLink[1].trim(),
    path: path.posix.join('docs/tech', markdownLink[2].trim())
  };
};

const parseTodoRoutes = (markdown?: string): MaintenanceRouteSummary[] => {
  if (!markdown) {
    return [];
  }

  return markdown
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('|') && !line.includes('---') && !line.includes('路线 | 状态'))
    .map((line) => {
      const cells = line
        .slice(1, -1)
        .split('|')
        .map(cell => cell.trim());
      if (cells.length < 4) {
        return undefined;
      }

      const route = extractRouteLink(cells[0]);
      return {
        ...route,
        status: cells[1],
        priority: cells[2],
        nextStep: cells.slice(3).join('|').trim()
      };
    })
    .filter((route): route is MaintenanceRouteSummary => Boolean(route));
};

export const getMaintenanceContext = async (
  input: MaintenanceContextInput
): Promise<MaintenanceContextResult> => {
  const topic = normalizeTopic(input.topic);
  const todoIndex = await readOptionalFile(input.projectRoot, input.fileSystem, TODO_INDEX_PATH);

  return {
    projectRoot: input.projectRoot,
    topic,
    brief: Boolean(input.brief),
    files: topicFiles[topic],
    activeRoutes: parseTodoRoutes(todoIndex),
    rules: topicRules[topic],
    commands: topicCommands[topic]
  };
};

export const renderMaintenanceContext = (result: MaintenanceContextResult): string => {
  const routeLines = result.activeRoutes.length
    ? result.activeRoutes.map(route => `- ${route.title} [${route.priority}/${route.status}]：${route.nextStep}`)
    : ['- 当前未登记活跃路线'];

  return [
    'StorySpec 维护上下文',
    '',
    `主题：${result.topic}`,
    `模式：${result.brief ? '简短' : '完整摘要'}`,
    '',
    '入口文件：',
    ...result.files.map(file => `- ${file}`),
    '',
    '当前路线：',
    ...routeLines,
    '',
    '执行规则：',
    ...result.rules.map(rule => `- ${rule}`),
    '',
    '推荐验证：',
    ...result.commands.map(command => `- ${command}`)
  ].join('\n');
};
