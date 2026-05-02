import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import { validateProject, renderProjectValidation } from '../../application/validate-project.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

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
    .description('校验 novel-writer 项目结构、tracking、任务和模板')
    .action(async (commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await validateProject({
          projectRoot,
          packageRoot: options.packageRoot,
          fileSystem: nodeFileSystem
        });

        if (commandOptions.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(renderProjectValidation(result));
        }

        if (!result.valid) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 novel-writer 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 novel init 创建新项目\n'));
          process.exit(1);
        }

        console.error(chalk.red('项目校验失败'), error);
        process.exit(1);
      }
    });
};
