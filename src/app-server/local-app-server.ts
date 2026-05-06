import path from 'node:path';
import {
  createLocalAppProject,
  openLocalAppProject,
  type LocalAppProjectResult,
  type RecentProjectStore
} from '../application/local-app-projects.js';
import type { InitProjectInput } from '../application/init-project.js';
import type { ProjectFileSystem } from '../application/project-ports.js';
import {
  createStoryIdea as createStoryIdeaApplication,
  type CreateStoryIdeaInput
} from '../application/story-onboarding.js';
import {
  ingestStoryInput as ingestStoryInputApplication,
  type IngestStoryInput
} from '../application/ingest-story-input.js';
import {
  createStoryCoreSummary,
  type StoryCoreSummaryInput
} from '../application/story-core-summary.js';

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
  createStoryIdea?(request: LocalAppCreateStoryIdeaRequest): Promise<unknown>;
  ingestStoryInput?(request: LocalAppIngestStoryInputRequest): Promise<unknown>;
  storyCoreSummary?(request: LocalAppStoryCoreSummaryRequest): Promise<unknown>;
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

export interface LocalAppCreateStoryIdeaRequest {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  name: string;
  idea?: string;
}

export interface CreateStoryIdeaRequest {
  token: string;
  name: string;
  idea?: string;
}

export interface LocalAppIngestStoryInputRequest {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  text?: string;
  applyConfirmed?: boolean;
}

export interface IngestStoryInputRequest {
  token: string;
  story?: string;
  text?: string;
  applyConfirmed?: boolean;
}

export interface LocalAppStoryCoreSummaryRequest {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  missingOnly: boolean;
}

export interface StoryCoreMissingRequest {
  token: string;
  story?: string;
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

const badRequest = (error: unknown): LocalAppServerResponse<LocalAppBlockedBody> => ({
  status: 400,
  body: {
    blocked: true,
    blockedReasons: [error instanceof Error ? error.message : String(error)]
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
  const currentAllowedProject = (): string | undefined =>
    currentProjectRoot && isAllowed(currentProjectRoot)
      ? currentProjectRoot
      : undefined;

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

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      return {
        status: 200,
        body: await input.projectStatus({ projectRoot })
      };
    },

    async createStoryIdea(request: CreateStoryIdeaRequest): Promise<LocalAppServerResponse<unknown | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      try {
        const body = input.createStoryIdea
          ? await input.createStoryIdea({
            projectRoot,
            fileSystem: input.fileSystem,
            name: request.name,
            idea: request.idea
          })
          : await createStoryIdeaApplication({
            projectRoot,
            fileSystem: input.fileSystem,
            name: request.name,
            idea: request.idea
          } satisfies CreateStoryIdeaInput);

        return {
          status: 200,
          body
        };
      } catch (error) {
        return badRequest(error);
      }
    },

    async ingestStoryInput(request: IngestStoryInputRequest): Promise<LocalAppServerResponse<unknown | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      try {
        const body = input.ingestStoryInput
          ? await input.ingestStoryInput({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            text: request.text,
            applyConfirmed: request.applyConfirmed === true
          })
          : await ingestStoryInputApplication({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            text: request.text,
            applyConfirmed: request.applyConfirmed === true
          } satisfies IngestStoryInput);

        return {
          status: 200,
          body
        };
      } catch (error) {
        return badRequest(error);
      }
    },

    async getStoryCoreMissing(request: StoryCoreMissingRequest): Promise<LocalAppServerResponse<unknown | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      try {
        const body = input.storyCoreSummary
          ? await input.storyCoreSummary({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            missingOnly: true
          })
          : await createStoryCoreSummary({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            missingOnly: true
          } satisfies StoryCoreSummaryInput);

        return {
          status: 200,
          body
        };
      } catch (error) {
        return badRequest(error);
      }
    }
  };
};
