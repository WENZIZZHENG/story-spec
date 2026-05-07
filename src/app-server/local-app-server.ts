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
import {
  compareOutlineCandidates as compareOutlineCandidatesApplication,
  createOutlineCandidate as createOutlineCandidateApplication,
  listOutlineCandidates as listOutlineCandidatesApplication,
  promoteOutlineCandidate as promoteOutlineCandidateApplication,
  type CompareOutlineCandidatesInput,
  type CreateOutlineCandidateInput,
  type ListOutlineCandidatesInput,
  type PromoteOutlineCandidateInput
} from '../application/manage-outline-candidates.js';
import {
  exportTaskBoard,
  type ExportTaskBoardInput
} from '../application/export-task-board.js';
import {
  createDraft as createDraftApplication,
  listDrafts as listDraftsApplication,
  promoteDraft as promoteDraftApplication,
  type CreateDraftInput,
  type ListDraftsInput,
  type PromoteDraftInput
} from '../application/manage-drafts.js';
import {
  createInitialSceneCard,
  type CreateInitialSceneCardInput
} from '../application/create-scene-card.js';
import {
  reviewProject,
  type ReviewProjectInput
} from '../application/review-project.js';
import {
  getChapterWritingLane as getChapterWritingLaneApplication,
  type GetChapterWritingLaneInput
} from '../application/chapter-writing-lane.js';

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
  packageRoot?: string;
  fileSystem: ProjectFileSystem;
  recentProjects: RecentProjectStore;
  host?: string;
  projectStatus(input: LocalAppProjectStatusInput): Promise<TProjectStatus>;
  createProject?(request: LocalAppCreateProjectRequest): Promise<LocalAppProjectResult>;
  createStoryIdea?(request: LocalAppCreateStoryIdeaRequest): Promise<unknown>;
  ingestStoryInput?(request: LocalAppIngestStoryInputRequest): Promise<unknown>;
  storyCoreSummary?(request: LocalAppStoryCoreSummaryRequest): Promise<unknown>;
  listOutlineCandidates?(request: LocalAppListOutlineCandidatesRequest): Promise<unknown>;
  createOutlineCandidate?(request: LocalAppCreateOutlineCandidateRequest): Promise<unknown>;
  compareOutlineCandidates?(request: LocalAppCompareOutlineCandidatesRequest): Promise<unknown>;
  promoteOutlineCandidate?(request: LocalAppPromoteOutlineCandidateRequest): Promise<unknown>;
  taskBoard?(request: LocalAppTaskBoardRequest): Promise<unknown>;
  createChapterDraft?(request: LocalAppCreateChapterDraftRequest): Promise<unknown>;
  listChapterDrafts?(request: LocalAppListChapterDraftsRequest): Promise<unknown>;
  promoteChapterDraft?(request: LocalAppPromoteChapterDraftRequest): Promise<unknown>;
  createChapterSceneCard?(request: LocalAppCreateChapterSceneCardRequest): Promise<unknown>;
  reviewChapter?(request: LocalAppReviewChapterRequest): Promise<unknown>;
  chapterWritingLane?(request: LocalAppChapterWritingLaneRequest): Promise<unknown>;
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

export interface CurrentProjectResumeRequest {
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

export interface LocalAppListOutlineCandidatesRequest {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
}

export interface ListOutlineCandidatesRequest {
  token: string;
  story?: string;
}

export interface LocalAppCreateOutlineCandidateRequest {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  title: string;
  text?: string;
}

export interface CreateOutlineCandidateRequest {
  token: string;
  story?: string;
  title: string;
  text?: string;
}

export interface LocalAppCompareOutlineCandidatesRequest {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  leftId: string;
  rightId: string;
}

export interface CompareOutlineCandidatesRequest {
  token: string;
  story?: string;
  leftId: string;
  rightId: string;
}

export interface LocalAppPromoteOutlineCandidateRequest {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  outlineId: string;
  yes?: boolean;
}

export interface PromoteOutlineCandidateRequest {
  token: string;
  story?: string;
  outlineId: string;
  yes?: boolean;
}

export interface LocalAppTaskBoardRequest {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  write: boolean;
}

export interface TaskBoardRequest {
  token: string;
  story?: string;
}

export interface LocalAppCreateChapterDraftRequest {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  chapter: string;
  basedOn?: string;
  contextPack?: string;
}

export interface CreateChapterDraftRequest {
  token: string;
  story?: string;
  chapter: string;
  basedOn?: string;
  contextPack?: string;
}

export interface LocalAppListChapterDraftsRequest {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  chapter?: string;
}

export interface ListChapterDraftsRequest {
  token: string;
  story?: string;
  chapter?: string;
}

export interface LocalAppPromoteChapterDraftRequest {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  draftId: string;
  yes?: boolean;
}

export interface PromoteChapterDraftRequest {
  token: string;
  story?: string;
  draftId: string;
  yes?: boolean;
}

export interface LocalAppCreateChapterSceneCardRequest {
  projectRoot: string;
  packageRoot: string;
  fileSystem: ProjectFileSystem;
  story: string;
  sceneId?: string;
}

export interface CreateChapterSceneCardRequest {
  token: string;
  story: string;
  sceneId?: string;
}

export interface LocalAppReviewChapterRequest {
  projectRoot: string;
  packageRoot?: string;
  fileSystem: ProjectFileSystem;
  chapter?: string;
  panel?: string[];
}

export interface ReviewChapterRequest {
  token: string;
  chapter?: string;
  panel?: string[];
}

export interface LocalAppChapterWritingLaneRequest {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  chapter?: string;
}

export interface ChapterWritingLaneRequest {
  token: string;
  story?: string;
  chapter?: string;
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

    async getCurrentProjectResume(request: CurrentProjectResumeRequest): Promise<LocalAppServerResponse<unknown | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      const status = await input.projectStatus({ projectRoot });
      const resume = (status as { resume?: unknown }).resume;

      return {
        status: 200,
        body: resume ?? {}
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
    },

    async listOutlineCandidates(request: ListOutlineCandidatesRequest): Promise<LocalAppServerResponse<unknown | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      try {
        const body = input.listOutlineCandidates
          ? await input.listOutlineCandidates({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story
          })
          : await listOutlineCandidatesApplication({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story
          } satisfies ListOutlineCandidatesInput);

        return { status: 200, body };
      } catch (error) {
        return badRequest(error);
      }
    },

    async createOutlineCandidate(request: CreateOutlineCandidateRequest): Promise<LocalAppServerResponse<unknown | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      try {
        const body = input.createOutlineCandidate
          ? await input.createOutlineCandidate({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            title: request.title,
            text: request.text
          })
          : await createOutlineCandidateApplication({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            title: request.title,
            text: request.text
          } satisfies CreateOutlineCandidateInput);

        return { status: 200, body };
      } catch (error) {
        return badRequest(error);
      }
    },

    async compareOutlineCandidates(request: CompareOutlineCandidatesRequest): Promise<LocalAppServerResponse<unknown | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      try {
        const body = input.compareOutlineCandidates
          ? await input.compareOutlineCandidates({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            leftId: request.leftId,
            rightId: request.rightId
          })
          : await compareOutlineCandidatesApplication({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            leftId: request.leftId,
            rightId: request.rightId
          } satisfies CompareOutlineCandidatesInput);

        return { status: 200, body };
      } catch (error) {
        return badRequest(error);
      }
    },

    async promoteOutlineCandidate(request: PromoteOutlineCandidateRequest): Promise<LocalAppServerResponse<unknown | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      try {
        const body = input.promoteOutlineCandidate
          ? await input.promoteOutlineCandidate({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            outlineId: request.outlineId,
            yes: request.yes === true
          })
          : await promoteOutlineCandidateApplication({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            outlineId: request.outlineId,
            yes: request.yes === true
          } satisfies PromoteOutlineCandidateInput);

        return { status: 200, body };
      } catch (error) {
        return badRequest(error);
      }
    },

    async getTaskBoard(request: TaskBoardRequest): Promise<LocalAppServerResponse<unknown | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      try {
        const body = input.taskBoard
          ? await input.taskBoard({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            write: false
          })
          : await exportTaskBoard({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            write: false
          } satisfies ExportTaskBoardInput);

        return { status: 200, body };
      } catch (error) {
        return badRequest(error);
      }
    },

    async createChapterDraft(request: CreateChapterDraftRequest): Promise<LocalAppServerResponse<unknown | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      try {
        const body = input.createChapterDraft
          ? await input.createChapterDraft({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            chapter: request.chapter,
            basedOn: request.basedOn,
            contextPack: request.contextPack
          })
          : await createDraftApplication({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            chapter: request.chapter,
            basedOn: request.basedOn,
            contextPack: request.contextPack
          } satisfies CreateDraftInput);

        return { status: 200, body };
      } catch (error) {
        return badRequest(error);
      }
    },

    async listChapterDrafts(request: ListChapterDraftsRequest): Promise<LocalAppServerResponse<unknown | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      try {
        const body = input.listChapterDrafts
          ? await input.listChapterDrafts({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            chapter: request.chapter
          })
          : await listDraftsApplication({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            chapter: request.chapter
          } satisfies ListDraftsInput);

        return { status: 200, body };
      } catch (error) {
        return badRequest(error);
      }
    },

    async promoteChapterDraft(request: PromoteChapterDraftRequest): Promise<LocalAppServerResponse<unknown | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      try {
        const body = input.promoteChapterDraft
          ? await input.promoteChapterDraft({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            draftId: request.draftId,
            yes: request.yes === true
          })
          : await promoteDraftApplication({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            draftId: request.draftId,
            yes: request.yes === true
          } satisfies PromoteDraftInput);

        return { status: 200, body };
      } catch (error) {
        return badRequest(error);
      }
    },

    async createChapterSceneCard(request: CreateChapterSceneCardRequest): Promise<LocalAppServerResponse<unknown | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      try {
        const packageRoot = input.packageRoot ?? process.cwd();
        const body = input.createChapterSceneCard
          ? await input.createChapterSceneCard({
            projectRoot,
            packageRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            sceneId: request.sceneId
          })
          : await createInitialSceneCard({
            projectRoot,
            packageRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            id: request.sceneId
          } satisfies CreateInitialSceneCardInput);

        return { status: 200, body };
      } catch (error) {
        return badRequest(error);
      }
    },

    async reviewChapter(request: ReviewChapterRequest): Promise<LocalAppServerResponse<unknown | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      try {
        const body = input.reviewChapter
          ? await input.reviewChapter({
            projectRoot,
            packageRoot: input.packageRoot,
            fileSystem: input.fileSystem,
            chapter: request.chapter,
            panel: request.panel
          })
          : await reviewProject({
            projectRoot,
            packageRoot: input.packageRoot,
            fileSystem: input.fileSystem,
            chapter: request.chapter,
            panel: request.panel
          } satisfies ReviewProjectInput);

        return { status: 200, body };
      } catch (error) {
        return badRequest(error);
      }
    },

    async getChapterWritingLane(request: ChapterWritingLaneRequest): Promise<LocalAppServerResponse<unknown | LocalAppBlockedBody>> {
      if (!hasToken(request.token)) {
        return unauthorized();
      }

      const projectRoot = currentAllowedProject();
      if (!projectRoot) {
        return forbiddenProject();
      }

      try {
        const body = input.chapterWritingLane
          ? await input.chapterWritingLane({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            chapter: request.chapter
          })
          : await getChapterWritingLaneApplication({
            projectRoot,
            fileSystem: input.fileSystem,
            story: request.story,
            chapter: request.chapter,
            taskBoard: input.taskBoard,
            listChapterDrafts: input.listChapterDrafts
          } satisfies GetChapterWritingLaneInput);

        return { status: 200, body };
      } catch (error) {
        return badRequest(error);
      }
    }
  };
};
