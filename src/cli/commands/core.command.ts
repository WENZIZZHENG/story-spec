import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  createStoryCoreSummary,
  renderStoryCoreSummary
} from '../../application/story-core-summary.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';
import { StorySelectionError } from '../../application/workbench-utils.js';

export const registerCoreCommand = (program: Command): void => {
  program
    .command('core')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--missing', '只显示缺失或未完成的核心信息')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('查看故事核心信息面板')
    .action(async (story, options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await createStoryCoreSummary({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          missingOnly: options.missing
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderStoryCoreSummary(result));
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 story-spec 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
          process.exit(1);
        }

        if (error instanceof StorySelectionError) {
          console.log(chalk.red(error.message));
          process.exit(1);
        }

        console.error(chalk.red('核心信息面板生成失败'), error);
        process.exit(1);
      }
    });
};
