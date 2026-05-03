import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import { validateProject, renderProjectValidation } from '../../application/validate-project.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';
import {
  filterIssuesBySeverity,
  isValidationSeverity
} from '../../validation/severity.js';

export interface RegisterValidateCommandOptions {
  packageRoot: string;
}

export const registerValidateCommand = (
  program: Command,
  options: RegisterValidateCommandOptions
): void => {
  program
    .command('validate')
    .option('--json', '输出 JSON，便于自动化读取')
    .option('--severity <level>', '最小输出级别：error、warning、info', 'info')
    .description('校验 story-spec 项目结构、tracking、任务和模板')
    .action(async (commandOptions) => {
      try {
        if (!isValidationSeverity(commandOptions.severity)) {
          console.log(chalk.red(`不支持的 severity：${commandOptions.severity}`));
          console.log(chalk.gray('可用值：error、warning、info'));
          process.exit(1);
        }

        const projectRoot = await ensureProjectRoot();
        const result = await validateProject({
          projectRoot,
          packageRoot: options.packageRoot,
          fileSystem: nodeFileSystem
        });

        if (commandOptions.json) {
          console.log(JSON.stringify({
            ...result,
            minSeverity: commandOptions.severity,
            issues: filterIssuesBySeverity(result.issues, commandOptions.severity)
          }, null, 2));
        } else {
          console.log(renderProjectValidation(result, { minSeverity: commandOptions.severity }));
        }

        if (!result.valid) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 story-spec 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
          process.exit(1);
        }

        console.error(chalk.red('项目校验失败'), error);
        process.exit(1);
      }
    });
};
