import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  exportTaskBoard,
  renderTaskBoardExportSummary,
  TaskBoardExportError
} from '../../application/export-task-board.js';
import {
  finishWritingTask,
  renderFinishWritingTaskSummary
} from '../../application/finish-writing-task.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

export const registerTasksBoardCommand = (program: Command): void => {
  program
    .command('tasks:board')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('-o, --output <path>', '输出 JSON 路径，默认写入故事目录 task-board.json')
    .option('--json', '输出 JSON 到 stdout，不写入文件')
    .description('把 stories/*/tasks.md 转为本地 JSON 看板和 GitHub issue 草稿')
    .action(async (story, options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await exportTaskBoard({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          output: options.output,
          write: !options.json
        });

        if (options.json) {
          console.log(JSON.stringify(result.board, null, 2));
          return;
        }

        console.log(renderTaskBoardExportSummary(result));
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 story-spec 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
          process.exit(1);
        }

        if (error instanceof TaskBoardExportError) {
          console.log(chalk.red(error.message));
          process.exit(1);
        }

        console.error(chalk.red('任务看板导出失败'), error);
        process.exit(1);
      }
    });

  program
    .command('task:finish')
    .argument('<taskId>', '要完成的任务 ID，例如 T001')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--apply', '应用状态更新并刷新 task-board.json；默认只预览')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('预览或应用单个写作任务的收尾状态更新')
    .action(async (taskId, story, options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await finishWritingTask({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          taskId: taskId.toUpperCase(),
          apply: Boolean(options.apply)
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderFinishWritingTaskSummary(result));
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 story-spec 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
          process.exit(1);
        }

        console.error(chalk.red('任务收尾失败'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
};
