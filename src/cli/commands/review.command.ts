import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  renderReviewReport,
  reviewProject
} from '../../application/review-project.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

const parsePanel = (value?: string): string[] | undefined =>
  value
    ?.split(',')
    .map(item => item.trim())
    .filter(Boolean);

const handleReviewError = (error: any): never => {
  if (error.message === 'NOT_IN_PROJECT') {
    console.log(chalk.red('\n当前目录不是 story-spec 项目'));
    console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
    process.exit(1);
  }

  console.error(chalk.red('审稿面板执行失败'), error);
  process.exit(1);
};

export interface RegisterReviewCommandOptions {
  packageRoot: string;
}

export const registerReviewCommand = (
  program: Command,
  options: RegisterReviewCommandOptions
): void => {
  program
    .command('review')
    .option('--panel <ids>', '审稿人集合：worldbuilding,voice,continuity,editor,reader')
    .option('--chapter <id>', '预留参数：限定章节审稿范围')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('运行 reviewer loop，输出结构化 findings 和任务草稿')
    .action(async (commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await reviewProject({
          projectRoot,
          packageRoot: options.packageRoot,
          fileSystem: nodeFileSystem,
          panel: parsePanel(commandOptions.panel),
          chapter: commandOptions.chapter
        });

        console.log(commandOptions.json
          ? JSON.stringify({
            ...result,
            chapter: commandOptions.chapter ?? null
          }, null, 2)
          : renderReviewReport(result));

        if (result.findings.some(finding => finding.severity === 'error')) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handleReviewError(error);
      }
    });
};
