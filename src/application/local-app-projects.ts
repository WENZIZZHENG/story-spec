import path from 'node:path';
import {
  initProject as defaultInitProject,
  type InitProjectInput,
  type InitProjectResult
} from './init-project.js';
import type { GitAdapter, PluginInstaller, ProjectFileSystem } from './project-ports.js';

export interface LocalAppProject {
  name: string;
  path: string;
  lastOpenedAt: string;
}

export interface RecentProjectStore {
  list(): Promise<LocalAppProject[]>;
  record(project: LocalAppProject): Promise<void>;
}

export interface JsonRecentProjectStoreInput {
  fileSystem: ProjectFileSystem;
  storePath: string;
}

export interface LocalAppProjectResult {
  blocked: boolean;
  blockedReasons: string[];
  project?: LocalAppProject;
}

export interface OpenLocalAppProjectInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  recentProjects: RecentProjectStore;
  now?: () => string;
}

export interface CreateLocalAppProjectInput {
  name: string;
  workspacePath: string;
  cwd: string;
  packageRoot: string;
  method: string;
  git: boolean;
  withExperts: boolean;
  fileSystem: ProjectFileSystem;
  recentProjects: RecentProjectStore;
  agent?: string;
  allAgents?: boolean;
  plugins?: string;
  agentsProfile?: string;
  gitAdapter?: GitAdapter;
  pluginInstaller?: PluginInstaller;
  now?: () => string;
  initProject?: (input: InitProjectInput) => Promise<InitProjectResult>;
}

export const createMemoryRecentProjectStore = (): RecentProjectStore => {
  const projects = new Map<string, LocalAppProject>();

  return {
    async list() {
      return [...projects.values()]
        .sort((left, right) => right.lastOpenedAt.localeCompare(left.lastOpenedAt));
    },
    async record(project) {
      projects.set(project.path, project);
    }
  };
};

const sortRecentProjects = (projects: LocalAppProject[]): LocalAppProject[] =>
  [...projects].sort((left, right) => right.lastOpenedAt.localeCompare(left.lastOpenedAt));

export const createJsonRecentProjectStore = (
  input: JsonRecentProjectStoreInput
): RecentProjectStore => {
  const storePath = path.resolve(input.storePath);

  const readProjects = async (): Promise<LocalAppProject[]> => {
    if (!await input.fileSystem.pathExists(storePath)) {
      return [];
    }

    const raw = await input.fileSystem.readJson<unknown>(storePath);
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw
      .filter((item): item is LocalAppProject => {
        if (!item || typeof item !== 'object') {
          return false;
        }
        const candidate = item as Partial<LocalAppProject>;
        return typeof candidate.name === 'string'
          && typeof candidate.path === 'string'
          && typeof candidate.lastOpenedAt === 'string';
      })
      .map(project => ({
        name: project.name,
        path: path.resolve(project.path),
        lastOpenedAt: project.lastOpenedAt
      }));
  };

  return {
    async list() {
      return sortRecentProjects(await readProjects());
    },
    async record(project) {
      const projects = new Map<string, LocalAppProject>();
      for (const item of await readProjects()) {
        projects.set(item.path, item);
      }
      projects.set(project.path, {
        ...project,
        path: path.resolve(project.path)
      });
      await input.fileSystem.writeJson(storePath, sortRecentProjects([...projects.values()]), { spaces: 2 });
    }
  };
};

const currentTimestamp = (): string => new Date().toISOString();

const readProjectName = async (
  fs: ProjectFileSystem,
  projectRoot: string
): Promise<string> => {
  const configPath = path.join(projectRoot, '.specify', 'config.json');
  const config = await fs.readJson<{ name?: unknown }>(configPath);
  return typeof config.name === 'string' && config.name.trim()
    ? config.name.trim()
    : path.basename(projectRoot);
};

export const openLocalAppProject = async (
  input: OpenLocalAppProjectInput
): Promise<LocalAppProjectResult> => {
  const projectRoot = path.resolve(input.projectRoot);
  const configPath = path.join(projectRoot, '.specify', 'config.json');

  if (!await input.fileSystem.pathExists(configPath)) {
    return {
      blocked: true,
      blockedReasons: ['缺少 .specify/config.json，所选目录不是 StorySpec 项目根目录']
    };
  }

  let projectName: string;
  try {
    projectName = await readProjectName(input.fileSystem, projectRoot);
  } catch {
    return {
      blocked: true,
      blockedReasons: ['无法读取 .specify/config.json，请确认它是有效 JSON']
    };
  }

  const project = {
    name: projectName,
    path: projectRoot,
    lastOpenedAt: input.now?.() ?? currentTimestamp()
  };
  await input.recentProjects.record(project);

  return {
    blocked: false,
    blockedReasons: [],
    project
  };
};

export const createLocalAppProject = async (
  input: CreateLocalAppProjectInput
): Promise<LocalAppProjectResult> => {
  const runInitProject = input.initProject ?? defaultInitProject;
  const initResult = await runInitProject({
    name: input.name,
    workspacePath: input.workspacePath,
    cwd: input.cwd,
    packageRoot: input.packageRoot,
    here: false,
    agent: input.agent ?? 'codex',
    allAgents: input.allAgents,
    method: input.method,
    git: input.git,
    withExperts: input.withExperts,
    plugins: input.plugins,
    agentsProfile: input.agentsProfile,
    fileSystem: input.fileSystem,
    gitAdapter: input.gitAdapter,
    pluginInstaller: input.pluginInstaller
  });

  const project = {
    name: initResult.projectName,
    path: path.resolve(initResult.projectPath),
    lastOpenedAt: input.now?.() ?? currentTimestamp()
  };
  await input.recentProjects.record(project);

  return {
    blocked: false,
    blockedReasons: [],
    project
  };
};
