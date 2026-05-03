import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  createCreativeReport,
  renderCreativeReport
} from '../../application/creative-report.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';
import { StorySelectionError } from '../../application/workbench-utils.js';

export const registerCreativeReportCommand = (program: Command): void => {
  program
    .command('creative:report')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('查看用户确认、待澄清、AI 候选和创作偏离风险')
    .action(async (story, options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await createCreativeReport({
          projectRoot,
          fileSystem: nodeFileSystem,
          story
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderCreativeReport(result));
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

        console.error(chalk.red('创作控制权报告失败'), error);
        process.exit(1);
      }
    });
};
