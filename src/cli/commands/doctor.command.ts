import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import { execFile } from 'node:child_process';
import net from 'node:net';
import { promisify } from 'node:util';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';

const execFileAsync = promisify(execFile);

export type StartupDoctorStatus = 'pass' | 'warn' | 'fail';

export interface StartupDoctorCheck {
  id: string;
  status: StartupDoctorStatus;
  message: string;
  suggestedAction?: string;
}

export interface StartupDoctorResult {
  command: 'doctor';
  valid: boolean;
  mutatesSystem: false;
  checks: StartupDoctorCheck[];
}

export interface StartupDoctorInput {
  cwd: string;
  nodeVersion?: string;
  commandExists?(command: string): Promise<boolean>;
  isStorySpecProject?(cwd: string): Promise<boolean>;
  canListen?(port: number, host: string): Promise<boolean>;
  canOpenBrowser?(): Promise<boolean>;
}

const parseMajorVersion = (version: string): number => {
  const match = version.match(/v?(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
};

const defaultCommandExists = async (command: string): Promise<boolean> => {
  try {
    await execFileAsync(command, ['--version']);
    return true;
  } catch {
    return false;
  }
};

const defaultIsStorySpecProject = async (cwd: string): Promise<boolean> =>
  nodeFileSystem.pathExists(`${cwd}/.specify/config.json`);

const defaultCanListen = async (port: number, host: string): Promise<boolean> =>
  new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.listen(port, host, () => {
      server.close(() => resolve(true));
    });
  });

const defaultCanOpenBrowser = async (): Promise<boolean> =>
  process.platform === 'darwin' || process.platform === 'win32' || process.platform === 'linux';

export const runStartupDoctor = async (
  input: StartupDoctorInput
): Promise<StartupDoctorResult> => {
  const commandExists = input.commandExists ?? defaultCommandExists;
  const isStorySpecProject = input.isStorySpecProject ?? defaultIsStorySpecProject;
  const canListen = input.canListen ?? defaultCanListen;
  const canOpenBrowser = input.canOpenBrowser ?? defaultCanOpenBrowser;
  const nodeVersion = input.nodeVersion ?? process.version;
  const checks: StartupDoctorCheck[] = [];

  if (parseMajorVersion(nodeVersion) >= 18) {
    checks.push({
      id: 'node',
      status: 'pass',
      message: `Node.js ${nodeVersion} 可用。`
    });
  } else {
    checks.push({
      id: 'node',
      status: 'fail',
      message: `Node.js ${nodeVersion} 低于 StorySpec 要求的 >=18。`,
      suggestedAction: '升级 Node.js 到 18 或更高版本。'
    });
  }

  checks.push(await commandExists('git')
    ? {
        id: 'git',
        status: 'pass',
        message: 'Git 可用。'
      }
    : {
        id: 'git',
        status: 'warn',
        message: '未检测到 Git；部分初始化、提交或状态检查能力可能受限。',
        suggestedAction: '安装 Git，或确认当前任务不需要 Git。'
      });

  checks.push(await isStorySpecProject(input.cwd)
    ? {
        id: 'project-root',
        status: 'pass',
        message: '当前目录是 StorySpec 项目。'
      }
    : {
        id: 'project-root',
        status: 'warn',
        message: '当前目录不是 StorySpec 项目根目录。',
        suggestedAction: '切换到项目根目录，或运行 storyspec init 创建项目。'
      });

  checks.push(await canListen(43127, '127.0.0.1')
    ? {
        id: 'app-port',
        status: 'pass',
        message: '默认 App 端口 43127 可监听。'
      }
    : {
        id: 'app-port',
        status: 'warn',
        message: '默认 App 端口 43127 当前不可用。',
        suggestedAction: '运行 storyspec app 时会尝试备用端口，或使用 --port 指定端口。'
      });

  checks.push(await canOpenBrowser()
    ? {
        id: 'browser',
        status: 'pass',
        message: '当前平台支持尝试打开浏览器。'
      }
    : {
        id: 'browser',
        status: 'warn',
        message: '当前环境可能无法自动打开浏览器。',
        suggestedAction: '使用 storyspec app --no-open，并手动打开输出的 URL。'
      });

  return {
    command: 'doctor',
    valid: checks.every(check => check.status !== 'fail'),
    mutatesSystem: false,
    checks
  };
};

export const createDoctorJson = (result: StartupDoctorResult): StartupDoctorResult => result;

const statusLabel = (status: StartupDoctorStatus): string => {
  if (status === 'pass') {
    return chalk.green('PASS');
  }

  if (status === 'warn') {
    return chalk.yellow('WARN');
  }

  return chalk.red('FAIL');
};

export const renderDoctorResult = (result: StartupDoctorResult): string => {
  const lines = [
    chalk.cyan('Startup doctor'),
    '',
    `结果：${result.valid ? chalk.green('可继续') : chalk.red('需要处理失败项')}`,
    '说明：doctor 只读检查，不会修改系统或项目文件。',
    ''
  ];

  for (const check of result.checks) {
    lines.push(`[${statusLabel(check.status)}] ${check.id}: ${check.message}`);
    if (check.suggestedAction) {
      lines.push(`  建议：${check.suggestedAction}`);
    }
  }

  return lines.join('\n');
};

export const registerDoctorCommand = (program: Command): void => {
  program
    .command('doctor')
    .description('检查 StorySpec 启动环境和本机 App 常见问题')
    .option('--json', '输出 JSON，便于自动化读取')
    .action(async options => {
      const result = await runStartupDoctor({
        cwd: process.cwd()
      });

      if (options.json) {
        console.log(JSON.stringify(createDoctorJson(result), null, 2));
      } else {
        console.log(renderDoctorResult(result));
      }

      if (!result.valid) {
        process.exitCode = 1;
      }
    });
};
