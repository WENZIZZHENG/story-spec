import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  loadAgentContract
} from '../../agent/contract.js';
import {
  syncAgentContract,
  type SyncAgentContractResult,
  type SyncAgentContractTarget
} from '../../application/sync-agent-contract.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot, findProjectRoot } from '../../utils/project.js';

export interface RegisterContractCommandOptions {
  packageRoot: string;
}

const renderTargetAction = (target: SyncAgentContractTarget): string => {
  const label = {
    source: chalk.gray('源文件'),
    write: chalk.green('写入'),
    unchanged: chalk.gray('未变化')
  }[target.action];

  return `  [${label}] ${target.relativePath}`;
};

const renderSyncResult = (result: SyncAgentContractResult): string => {
  const lines = [
    '',
    chalk.cyan('Agent contract 同步'),
    '',
    `来源：${result.source === 'project' ? '.specify/agent-contract.md' : 'templates/agent/agent-contract.md'}`,
    result.dryRun ? chalk.yellow('预览模式：不会写入任何文件') : undefined,
    '',
    ...result.targets.map(renderTargetAction),
    ''
  ];

  return lines.filter(line => line !== undefined).join('\n');
};

export const registerContractCommand = (
  program: Command,
  options: RegisterContractCommandOptions
): void => {
  program
    .command('contract:print')
    .description('输出当前 agent contract')
    .option('--project-name <name>', '未在项目内运行时使用的项目名')
    .option('--profile <profiles>', '逗号分隔的 agent profile')
    .action(async (commandOptions) => {
      const projectRoot = await findProjectRoot();
      const result = await loadAgentContract({
        packageRoot: options.packageRoot,
        projectRoot: projectRoot ?? undefined,
        projectName: commandOptions.projectName,
        agentsProfile: commandOptions.profile,
        fileSystem: nodeFileSystem
      });

      console.log(result.content);
    });

  program
    .command('contract:sync')
    .description('同步 agent contract 到项目入口文件')
    .option('--dry-run', '预览同步结果，不写入文件')
    .option('--from-template', '忽略项目内 contract，从包模板重建')
    .option('--project-name <name>', '从模板重建时使用的项目名')
    .option('--profile <profiles>', '从模板重建时使用的逗号分隔 agent profile')
    .option('--json', '输出 JSON，便于自动化读取')
    .action(async (commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await syncAgentContract({
          projectRoot,
          packageRoot: options.packageRoot,
          projectName: commandOptions.projectName,
          agentsProfile: commandOptions.profile,
          fromTemplate: commandOptions.fromTemplate,
          dryRun: commandOptions.dryRun,
          fileSystem: nodeFileSystem
        });

        if (commandOptions.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        console.log(renderSyncResult(result));
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 novel-writer 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 novel init 创建新项目\n'));
          process.exit(1);
        }

        console.error(chalk.red('同步 agent contract 失败'), error);
        process.exit(1);
      }
    });
};
