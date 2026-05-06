import path from 'node:path';
import {
  createLocalAppProject,
  openLocalAppProject,
  type LocalAppProjectResult,
  type RecentProjectStore
} from '../application/local-app-projects.js';
import type { InitProjectInput } from '../application/init-project.js';
import type { ProjectFileSystem } from '../application/project-ports.js';

export interface LocalAppServerResponse<TBody = unknown> {
  status: number;
  body: TBody;
}

export interface LocalAppBlockedBody {
  blocked: true;
  blockedReasons: string[];
}

export interface LocalAppProjectStatusInput {
  projectRoot: string;
}

export interface CreateLocalAppServerCoreInput<TProjectStatus> {
  token: string;
  fileSystem: ProjectFileSystem;
  recentProjects: RecentProjectStore;
  host?: string;
  projectStatus(input: LocalAppProjectStatusInput): Promise<TProjectStatus>;
  createProject?(request: LocalAppCreateProjectRequest): Promise<LocalAppProjectResult>;
}

export interface OpenProjectRequest {
  token: string;
  projectRoot: string;
  now?: () => string;
}

export interface ProjectStatusRequest {
  token: string;
  projectRoot: string;
}

export interface CurrentProjectStatusRequest {
  token: string;
}

export interface ListRecentProjectsRequest {
  token: string;
}

export interface LocalAppCreateProjectRequest {
  name: string;
  workspacePath: string;
  method: string;
  git: boolean;
  withExperts: boolean;
}

export interface CreateProjectRequest extends LocalAppCreateProjectRequest {
  token: string;
  cwd?: string;
  packageRoot?: string;
  initProject?: (input: InitProjectInput) => Promise<unknown>;
}

const unauthorized = (): LocalAppServerResponse<LocalAppBlockedBody> => ({
  status: 401,
  body: {
    blocked: true,
    blockedReasons: ['缺少或无效的本机 App session token']
  }
});

const forbiddenProject = (): LocalAppServerResponse<LocalAppBlockedBody> => ({
  status: 403,
  body: {
    blocked: true,
    blockedReasons: ['项目尚未在本次 App 会话中打开']
  }
});

export const createLocalAppServerCore = <TProjectStatus>(
  input: CreateLocalAppServerCoreInput<TProjectStatus>
) => {
  const host = input.host ?? '127.0.0.1';
  const allowedProjects = new Set<string>();
  let currentProjectRoot: string | undefined;

  const hasToken = (token: string): boolean => token === input.token;
  const allowProject = (projectRoot: string): string => {
    const resolved = path.resolve(projectRoot);
    allowedProjects.add(resolved);
    currentProjectRoot = resolved;
    return resolved;
  };
  const isAllowed = (projectRoot: string): boolean => allowedProjects.has(path.resolve(projectRoot));

  return {
    health() {
      return {
        ok: true,
        requiresToken: true,
        host
      };
    },

    async openProject(request: OpenProjectRequest) {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const result = await openLocalAppProject({
        projectRoot: request.projectRoot,
        fileSystem: input.fileSystem,
        recentProjects: input.recentProjects,
        now: request.now
      });

      if (result.blocked) {
        return {
          status: 400,
          body: result
        };
      }

      if (result.project) {
        allowProject(result.project.path);
      }

      return {
        status: 200,
        body: result
      };
    },

    async listRecentProjects(request: ListRecentProjectsRequest) {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      return {
        status: 200,
        body: await input.recentProjects.list()
      };
    },

    async createProject(request: CreateProjectRequest) {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const result = input.createProject
        ? await input.createProject(request)
        : await createLocalAppProject({
          name: request.name,
          workspacePath: request.workspacePath,
          cwd: request.cwd ?? process.cwd(),
          packageRoot: request.packageRoot ?? process.cwd(),
          method: request.method,
          git: request.git,
          withExperts: request.withExperts,
          fileSystem: input.fileSystem,
          recentProjects: input.recentProjects
        });

      if (result.blocked) {
        return {
          status: 400,
          body: result
        };
      }

      if (result.project) {
        allowProject(result.project.path);
      }

      return {
        status: 200,
        body: result
      };
    },

    async getProjectStatus(request: ProjectStatusRequest): Promise<LocalAppServerResponse<TProjectStatus | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = path.resolve(request.projectRoot);
      if (!isAllowed(projectRoot)) {
        return forbiddenProject();
      }

      return {
        status: 200,
        body: await input.projectStatus({ projectRoot })
      };
    },

    async getCurrentProjectStatus(request: CurrentProjectStatusRequest): Promise<LocalAppServerResponse<TProjectStatus | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      if (!currentProjectRoot || !isAllowed(currentProjectRoot)) {
        return forbiddenProject();
      }

      return {
        status: 200,
        body: await input.projectStatus({ projectRoot: currentProjectRoot })
      };
    }
  };
};
