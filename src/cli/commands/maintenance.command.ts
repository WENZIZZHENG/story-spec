import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  createDocsFinishPreview,
  renderDocsFinishSummary
} from '../../application/finish-docs-change.js';
import {
  getMaintenanceContext,
  renderMaintenanceContext
} from '../../application/maintenance-context.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';

export const registerMaintenanceCommand = (program: Command): void => {
  program
    .command('maint:context')
    .option('--topic <topic>', '维护主题：todo、chapter 或 release', 'todo')
    .option('--brief', '输出一屏内的维护规则摘要')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('输出当前任务需要的维护入口、规则和推荐验证命令')
    .action(async (options) => {
      try {
        const projectRoot = process.cwd();
        const result = await getMaintenanceContext({
          projectRoot,
          fileSystem: nodeFileSystem,
          topic: options.topic,
          brief: Boolean(options.brief)
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderMaintenanceContext(result));
      } catch (error: any) {
        console.error(chalk.red('维护上下文生成失败'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  program
    .command('docs:finish')
    .option('--message <message>', '建议提交信息；命令只输出提交命令，不自动提交')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('为文档-only 变更生成收尾检查清单和可选提交建议')
    .action(async (options) => {
      try {
        const projectRoot = process.cwd();
        const result = createDocsFinishPreview({
          projectRoot,
          message: options.message
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderDocsFinishSummary(result));
      } catch (error: any) {
        console.error(chalk.red('文档收尾预览失败'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
};
