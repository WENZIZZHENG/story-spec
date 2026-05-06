import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import crypto from 'node:crypto';
import { getProjectStatus } from '../../application/get-project-status.js';
import { createJsonRecentProjectStore } from '../../application/local-app-projects.js';
import { createLocalAppServerCore } from '../../app-server/local-app-server.js';
import { startLocalAppHttpServer } from '../../app-server/local-app-http-server.js';
import { commandGitAdapter } from '../../infrastructure/command-git-adapter.js';
import { getLocalAppRecentProjectsPath } from '../../infrastructure/local-app-config.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';

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
    '',
    chalk.gray('按 Ctrl+C 停止本机服务。')
  ];

  return lines.join('\n');
};

export function registerAppCommand(program: Command, _context: AppCommandContext): void {
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
      const recentProjects = createJsonRecentProjectStore({
        fileSystem: nodeFileSystem,
        storePath: getLocalAppRecentProjectsPath()
      });
      const core = createLocalAppServerCore({
        token,
        fileSystem: nodeFileSystem,
        recentProjects,
        projectStatus: input => getProjectStatus({
          projectRoot: input.projectRoot,
          fileSystem: nodeFileSystem,
          git: commandGitAdapter
        })
      });
      const server = await startLocalAppHttpServer({
        host,
        port,
        core
      });

      if (options.json) {
        console.log(JSON.stringify({
          command: 'app',
          host,
          port,
          url: server.url,
          project: options.project,
          openBrowser: options.open !== false,
          tokenRequired,
          status: 'started'
        }, null, 2));
      } else {
        console.log(renderLocalAppStarted({
          url: server.url,
          tokenRequired
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
