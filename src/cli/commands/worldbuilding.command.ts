import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  inspectCanon,
  inspectWorld,
  renderCanonInspection,
  renderWorldInspection
} from '../../application/inspect-worldbuilding.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

export const registerWorldbuildingCommand = (program: Command): void => {
  program
    .command('world:list')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('列出 World Bible 中的 WorldFact')
    .action(async (options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await inspectWorld({ projectRoot, fileSystem: nodeFileSystem });

        console.log(options.json ? JSON.stringify(result, null, 2) : renderWorldInspection(result));
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 novel-writer 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 novel init 创建新项目\n'));
          process.exit(1);
        }

        console.error(chalk.red('World Bible 读取失败'), error);
        process.exit(1);
      }
    });

  program
    .command('world:check')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('检查 World Bible 的最小 schema')
    .action(async (options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await inspectWorld({ projectRoot, fileSystem: nodeFileSystem });

        console.log(options.json ? JSON.stringify(result, null, 2) : renderWorldInspection(result));
        if (result.issues.some(issue => issue.severity === 'error')) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 novel-writer 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 novel init 创建新项目\n'));
          process.exit(1);
        }

        console.error(chalk.red('World Bible 检查失败'), error);
        process.exit(1);
      }
    });

  program
    .command('canon:list')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('列出 Canon Ledger 中的 CanonFact')
    .action(async (options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await inspectCanon({ projectRoot, fileSystem: nodeFileSystem });

        console.log(options.json ? JSON.stringify(result, null, 2) : renderCanonInspection(result));
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 novel-writer 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 novel init 创建新项目\n'));
          process.exit(1);
        }

        console.error(chalk.red('Canon Ledger 读取失败'), error);
        process.exit(1);
      }
    });

  program
    .command('canon:check')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('检查 Canon Ledger 的最小 schema')
    .action(async (options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await inspectCanon({ projectRoot, fileSystem: nodeFileSystem });

        console.log(options.json ? JSON.stringify(result, null, 2) : renderCanonInspection(result));
        if (result.issues.some(issue => issue.severity === 'error')) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 novel-writer 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 novel init 创建新项目\n'));
          process.exit(1);
        }

        console.error(chalk.red('Canon Ledger 检查失败'), error);
        process.exit(1);
      }
    });
};
