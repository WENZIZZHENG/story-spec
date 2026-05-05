import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  finishDocsChange,
  createDocsFinishPreview,
  renderDocsFinishSummary
} from '../../application/finish-docs-change.js';
import {
  captureTodo,
  renderTodoCaptureSummary
} from '../../application/capture-todo.js';
import {
  getMaintenanceContext,
  renderMaintenanceContext
} from '../../application/maintenance-context.js';
import { commandDocsFinishVerificationRunner } from '../../infrastructure/command-docs-finish-verification-runner.js';
import { commandGitAdapter } from '../../infrastructure/command-git-adapter.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

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
    .option('--commit', '执行文档收尾检查，通过后创建本地 commit')
    .option('--message <commit_message>', '提交信息；未使用 --commit 时只输出提交建议')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('为文档-only 变更生成收尾检查清单和可选提交建议')
    .action(async (options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = options.commit
          ? await finishDocsChange({
            projectRoot,
            gitAdapter: commandGitAdapter,
            verificationRunner: commandDocsFinishVerificationRunner,
            commit: true,
            message: options.message
          })
          : createDocsFinishPreview({
            projectRoot,
            message: options.message
          });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderDocsFinishSummary(result));
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 story-spec 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
          process.exit(1);
        }

        console.error(chalk.red('文档收尾预览失败'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  program
    .command('todo:capture')
    .requiredOption('--topic <name>', '待办路线主题')
    .option('--from <path>', '从本地 Markdown / 文本文件读取 notes')
    .option('--notes <text>', '直接传入 notes 文本')
    .option('--apply', '写入 roadmap 并更新 todo-index；默认只预览')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('把讨论 notes 转成符合治理规则的待办路线草案')
    .action(async (options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await captureTodo({
          projectRoot,
          fileSystem: nodeFileSystem,
          topic: options.topic,
          from: options.from,
          notes: options.notes,
          apply: Boolean(options.apply)
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderTodoCaptureSummary(result));
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 story-spec 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
          process.exit(1);
        }

        console.error(chalk.red('待办捕获失败'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
};
