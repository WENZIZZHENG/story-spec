import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  renderCoCreateWorkbench,
  runCoCreateWorkbench,
  type CoCreatePreviewMode
} from '../../application/co-create-workbench.js';
import { IngestStoryInputError } from '../../application/ingest-story-input.js';
import { PreviewApplyError } from '../../application/preview-apply.js';
import { StorySelectionError } from '../../application/workbench-utils.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

type CoCreateCommandOptions = {
  text?: string;
  file?: string;
  applyConfirmed?: boolean;
  preview?: string;
  json?: boolean;
};

const parsePreviewMode = (value: string | undefined): CoCreatePreviewMode => {
  const mode = value ?? 'none';
  if (['none', 'specify', 'plan', 'both'].includes(mode)) {
    return mode as CoCreatePreviewMode;
  }

  throw new Error(`不支持的 preview 模式：${value}`);
};

export const registerCoCreateCommand = (program: Command): void => {
  program
    .command('co:create')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--text <text>', '直接吸收一段自然语言创作资料')
    .option('--file <path>', '从文件读取自然语言创作资料')
    .option('--apply-confirmed', '把识别到的作者明确字段写入澄清记录；默认只预览')
    .option('--preview <mode>', '生成写入前预览：none、specify、plan、both', 'none')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('连续共创入口：吸收长文、查看核心面板，并可选生成预览')
    .action(async (story, options: CoCreateCommandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await runCoCreateWorkbench({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          text: options.text,
          file: options.file,
          applyConfirmed: options.applyConfirmed,
          preview: parsePreviewMode(options.preview)
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderCoCreateWorkbench(result));
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 story-spec 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
          process.exit(1);
        }

        if (
          error instanceof IngestStoryInputError
          || error instanceof PreviewApplyError
          || error instanceof StorySelectionError
        ) {
          console.log(chalk.red(error.message));
          process.exit(1);
        }

        console.error(chalk.red('共创输入工作台执行失败'), error);
        process.exit(1);
      }
    });
};
