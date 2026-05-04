import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  IngestStoryInputError,
  ingestStoryInput,
  renderIngestStoryInputResult
} from '../../application/ingest-story-input.js';
import { StorySelectionError } from '../../application/workbench-utils.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

type IngestCommandOptions = {
  text?: string;
  file?: string;
  applyConfirmed?: boolean;
  json?: boolean;
};

export const registerIngestCommand = (program: Command): void => {
  program
    .command('ingest')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--text <text>', '直接吸收一段自然语言创作资料')
    .option('--file <path>', '从文件读取自然语言创作资料')
    .option('--apply-confirmed', '写入识别为作者明确表达的确认项；默认只预览')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('吸收长文创作资料，拆成核心澄清项预览')
    .action(async (story, options: IngestCommandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await ingestStoryInput({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          text: options.text,
          file: options.file,
          applyConfirmed: options.applyConfirmed
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderIngestStoryInputResult(result));
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 story-spec 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
          process.exit(1);
        }

        if (error instanceof IngestStoryInputError || error instanceof StorySelectionError) {
          console.log(chalk.red(error.message));
          process.exit(1);
        }

        console.error(chalk.red('长文吸收失败'), error);
        process.exit(1);
      }
    });
};
