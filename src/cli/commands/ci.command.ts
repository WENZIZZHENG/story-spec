import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  getCiQualityChecks,
  renderCiQualityCheckReport
} from '../../application/ci-quality-checks.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';

export const registerCiCommand = (program: Command): void => {
  program
    .command('ci:check')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('输出本地 CI 质量检查清单，不运行外部命令')
    .action(async (options) => {
      try {
        const result = await getCiQualityChecks({
          projectRoot: process.cwd(),
          fileSystem: nodeFileSystem
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderCiQualityCheckReport(result));

        if (!result.valid) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        console.error(chalk.red('CI 检查清单生成失败'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
};
