import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  renderReferenceReverseResult,
  reverseReferenceNotes,
  ReverseReferenceError,
  type ReferenceReverseMode
} from '../../application/reverse-reference.js';
import { StorySelectionError } from '../../application/workbench-utils.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

type ReferenceReverseCommandOptions = {
  title?: string;
  text?: string;
  file?: string;
  mode?: string;
  json?: boolean;
};

const parseReferenceMode = (mode?: string): ReferenceReverseMode => {
  if (!mode || mode === 'original') {
    return 'original';
  }

  if (mode === 'fanfic-notes') {
    return 'fanfic-notes';
  }

  throw new ReverseReferenceError('MISSING_REFERENCE_INPUT', '--mode 只能是 original 或 fanfic-notes。');
};

export const registerReferenceCommand = (program: Command): void => {
  program
    .command('reference:reverse')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--title <title>', '参考作品标题，用于标注来源')
    .option('--text <text>', '作者提供的参考作品读后笔记、摘要或喜欢/不适点')
    .option('--file <path>', '从本地文件读取参考作品笔记')
    .option('--mode <mode>', 'original 或 fanfic-notes；默认 original', 'original')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('把参考作品笔记反向拆解为原创化候选预览，不写入正典')
    .action(async (story, options: ReferenceReverseCommandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await reverseReferenceNotes({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          title: options.title,
          text: options.text,
          file: options.file,
          mode: parseReferenceMode(options.mode)
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderReferenceReverseResult(result));
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 story-spec 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
          process.exit(1);
        }

        if (error instanceof ReverseReferenceError || error instanceof StorySelectionError) {
          console.log(chalk.red(error.message));
          process.exit(1);
        }

        console.error(chalk.red('参考作品反向拆解失败'), error);
        process.exit(1);
      }
    });
};
