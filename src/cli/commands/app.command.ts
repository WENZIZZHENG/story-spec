import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import crypto from 'node:crypto';
import type { LocalAppProject, RecentProjectStore } from '../../application/local-app-projects.js';
import { getProjectStatus } from '../../application/get-project-status.js';
import { createJsonRecentProjectStore } from '../../application/local-app-projects.js';
import { createStoryIdea } from '../../application/story-onboarding.js';
import { ingestStoryInput } from '../../application/ingest-story-input.js';
import { createStoryCoreSummary } from '../../application/story-core-summary.js';
import {
  compareOutlineCandidates,
  createOutlineCandidate,
  listOutlineCandidates,
  promoteOutlineCandidate
} from '../../application/manage-outline-candidates.js';
import { exportTaskBoard } from '../../application/export-task-board.js';
import {
  createDraft,
  listDrafts,
  promoteDraft
} from '../../application/manage-drafts.js';
import { createInitialSceneCard } from '../../application/create-scene-card.js';
import { reviewProject } from '../../application/review-project.js';
import type { LocalAppServerResponse } from '../../app-server/local-app-server.js';
import { createLocalAppServerCore } from '../../app-server/local-app-server.js';
import type { LocalAppHttpServer, StartLocalAppHttpServerInput } from '../../app-server/local-app-http-server.js';
import { startLocalAppHttpServer } from '../../app-server/local-app-http-server.js';
import { commandGitAdapter } from '../../infrastructure/command-git-adapter.js';
import { getLocalAppRecentProjectsPath } from '../../infrastructure/local-app-config.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import type { ProjectFileSystem } from '../../application/project-ports.js';

interface AppCommandContext {
  packageRoot: string;
}

export interface LocalAppStartPreviewInput {
  host: string;
  port: number;
  tokenRequired: boolean;
}

export interface LocalAppStartedInput {
  url: string;
  tokenRequired: boolean;
  openedProject?: LocalAppProject;
  openProjectBlockedReasons?: string[];
}

export interface LocalAppWorkbenchServer extends LocalAppHttpServer {
  core?: ReturnType<typeof createLocalAppServerCore>;
}

export interface StartLocalAppWorkbenchInput<TProjectStatus = unknown> {
  host: string;
  port: number;
  token: string;
  packageRoot?: string;
  project?: string;
  fileSystem: ProjectFileSystem;
  recentProjects: RecentProjectStore;
  projectStatus(input: { projectRoot: string }): Promise<TProjectStatus>;
  createStoryIdea?: Parameters<typeof createLocalAppServerCore<TProjectStatus>>[0]['createStoryIdea'];
  ingestStoryInput?: Parameters<typeof createLocalAppServerCore<TProjectStatus>>[0]['ingestStoryInput'];
  storyCoreSummary?: Parameters<typeof createLocalAppServerCore<TProjectStatus>>[0]['storyCoreSummary'];
  listOutlineCandidates?: Parameters<typeof createLocalAppServerCore<TProjectStatus>>[0]['listOutlineCandidates'];
  createOutlineCandidate?: Parameters<typeof createLocalAppServerCore<TProjectStatus>>[0]['createOutlineCandidate'];
  compareOutlineCandidates?: Parameters<typeof createLocalAppServerCore<TProjectStatus>>[0]['compareOutlineCandidates'];
  promoteOutlineCandidate?: Parameters<typeof createLocalAppServerCore<TProjectStatus>>[0]['promoteOutlineCandidate'];
  taskBoard?: Parameters<typeof createLocalAppServerCore<TProjectStatus>>[0]['taskBoard'];
  createChapterDraft?: Parameters<typeof createLocalAppServerCore<TProjectStatus>>[0]['createChapterDraft'];
  listChapterDrafts?: Parameters<typeof createLocalAppServerCore<TProjectStatus>>[0]['listChapterDrafts'];
  promoteChapterDraft?: Parameters<typeof createLocalAppServerCore<TProjectStatus>>[0]['promoteChapterDraft'];
  createChapterSceneCard?: Parameters<typeof createLocalAppServerCore<TProjectStatus>>[0]['createChapterSceneCard'];
  reviewChapter?: Parameters<typeof createLocalAppServerCore<TProjectStatus>>[0]['reviewChapter'];
  startServer?: (input: StartLocalAppHttpServerInput) => Promise<LocalAppWorkbenchServer>;
}

export interface StartLocalAppWorkbenchResult<TProjectStatus = unknown> {
  server: LocalAppWorkbenchServer;
  core: ReturnType<typeof createLocalAppServerCore<TProjectStatus>>;
  openedProject?: LocalAppProject;
  openProjectBlockedReasons?: string[];
}

export const renderLocalAppStartPreview = (input: LocalAppStartPreviewInput): string => {
  const lines = [
    chalk.green('StorySpec 本机 Web 工作台准备启动'),
    '',
    `地址：${chalk.cyan(`http://${input.host}:${input.port}`)}`,
    `访问控制：${input.tokenRequired ? '需要本机 session token' : '未启用 token'}`,
    '',
    chalk.gray('第一版将支持打开/创建本地 StorySpec 项目、最近项目和工作台状态 API。')
  ];

  return lines.join('\n');
};

export const renderLocalAppStarted = (input: LocalAppStartedInput): string => {
  const lines = [
    chalk.green('StorySpec 本机 Web 工作台已启动'),
    '',
    `地址：${chalk.cyan(input.url)}`,
    `访问控制：${input.tokenRequired ? '需要本机 session token' : '未启用 token'}`,
    input.openedProject
      ? `已打开项目：${chalk.cyan(input.openedProject.name)}`
      : undefined,
    input.openProjectBlockedReasons?.length
      ? chalk.yellow(`启动项目未打开：${input.openProjectBlockedReasons.join('；')}`)
      : undefined,
    '',
    chalk.gray('按 Ctrl+C 停止本机服务。')
  ].filter((line): line is string => line !== undefined);

  return lines.join('\n');
};

export const startLocalAppWorkbench = async <TProjectStatus>(
  input: StartLocalAppWorkbenchInput<TProjectStatus>
): Promise<StartLocalAppWorkbenchResult<TProjectStatus>> => {
  const core = createLocalAppServerCore({
    token: input.token,
    packageRoot: input.packageRoot,
    fileSystem: input.fileSystem,
    recentProjects: input.recentProjects,
    projectStatus: input.projectStatus,
    createStoryIdea: input.createStoryIdea,
    ingestStoryInput: input.ingestStoryInput,
    storyCoreSummary: input.storyCoreSummary,
    listOutlineCandidates: input.listOutlineCandidates,
    createOutlineCandidate: input.createOutlineCandidate,
    compareOutlineCandidates: input.compareOutlineCandidates,
    promoteOutlineCandidate: input.promoteOutlineCandidate,
    taskBoard: input.taskBoard,
    createChapterDraft: input.createChapterDraft,
    listChapterDrafts: input.listChapterDrafts,
    promoteChapterDraft: input.promoteChapterDraft,
    createChapterSceneCard: input.createChapterSceneCard,
    reviewChapter: input.reviewChapter
  });
  const startServer = input.startServer ?? startLocalAppHttpServer;
  const server = await startServer({
    host: input.host,
    port: input.port,
    core,
    token: input.token
  });
  let openedProject: LocalAppProject | undefined;
  let openProjectBlockedReasons: string[] | undefined;

  if (input.project?.trim()) {
    const result = await core.openProject({
      token: input.token,
      projectRoot: input.project
    }) as LocalAppServerResponse<{
      blocked?: boolean;
      blockedReasons?: string[];
      project?: LocalAppProject;
    }>;

    if (result.status === 200 && result.body.project) {
      openedProject = result.body.project;
    } else {
      openProjectBlockedReasons = result.body.blockedReasons ?? ['启动项目未能打开'];
    }
  }

  return {
    server,
    core,
    openedProject,
    openProjectBlockedReasons
  };
};

export function registerAppCommand(program: Command, context: AppCommandContext): void {
  program
    .command('app')
    .description('启动本机 Web 工作台')
    .option('--host <host>', '监听地址，默认只绑定本机回环地址', '127.0.0.1')
    .option('--port <port>', '监听端口', '43127')
    .option('--project <path>', '启动后打开指定 StorySpec 项目根目录')
    .option('--no-open', '不自动打开浏览器')
    .option('--json', '以 JSON 输出启动预览')
    .action(async options => {
      const port = Number.parseInt(String(options.port), 10);
      const host = String(options.host);
      const tokenRequired = true;

      if (options.json && options.open === false) {
        console.log(JSON.stringify({
          command: 'app',
          host,
          port,
          url: `http://${host}:${port}`,
          project: options.project,
          openBrowser: options.open !== false,
          tokenRequired,
          status: 'preview'
        }, null, 2));
        return;
      }

      const token = crypto.randomBytes(24).toString('hex');
      const result = await startLocalAppWorkbench({
        host,
        port,
        packageRoot: context.packageRoot,
        project: options.project,
        token,
        fileSystem: nodeFileSystem,
        recentProjects: createJsonRecentProjectStore({
          fileSystem: nodeFileSystem,
          storePath: getLocalAppRecentProjectsPath()
        }),
        projectStatus: input => getProjectStatus({
          projectRoot: input.projectRoot,
          fileSystem: nodeFileSystem,
          git: commandGitAdapter
        }),
        createStoryIdea: input => createStoryIdea(input),
        ingestStoryInput: input => ingestStoryInput(input),
        storyCoreSummary: input => createStoryCoreSummary(input),
        listOutlineCandidates: input => listOutlineCandidates(input),
        createOutlineCandidate: input => createOutlineCandidate(input),
        compareOutlineCandidates: input => compareOutlineCandidates(input),
        promoteOutlineCandidate: input => promoteOutlineCandidate(input),
        taskBoard: input => exportTaskBoard(input),
        createChapterDraft: input => createDraft(input),
        listChapterDrafts: input => listDrafts(input),
        promoteChapterDraft: input => promoteDraft(input),
        createChapterSceneCard: input => createInitialSceneCard(input),
        reviewChapter: input => reviewProject(input)
      });
      const server = result.server;

      if (options.json) {
        console.log(JSON.stringify({
          command: 'app',
          host,
          port,
          url: server.url,
          project: options.project,
          openBrowser: options.open !== false,
          tokenRequired,
          status: 'started',
          openedProject: result.openedProject,
          openProjectBlockedReasons: result.openProjectBlockedReasons
        }, null, 2));
      } else {
        console.log(renderLocalAppStarted({
          url: server.url,
          tokenRequired,
          openedProject: result.openedProject,
          openProjectBlockedReasons: result.openProjectBlockedReasons
        }));
      }

      await new Promise<void>(resolve => {
        const stop = async () => {
          await server.close();
          resolve();
        };
        process.once('SIGINT', stop);
        process.once('SIGTERM', stop);
      });
    });
}
