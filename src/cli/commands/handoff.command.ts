import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  generateHandoff,
  HandoffGenerationError,
  renderHandoffSummary
} from '../../application/generate-handoff.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

export const registerHandoffCommand = (program: Command): void => {
  program
    .command('handoff')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('-o, --output <path>', '输出 Markdown 路径，默认写入故事目录 handoff.md')
    .option('--target-agent <id>', '按目标 agent integration 的能力生成继续步骤')
    .option('--json', '输出结构化上下文到 stdout，不写入文件')
    .description('生成断点续写上下文包，帮助 AI 接手当前故事')
    .action(async (story, options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await generateHandoff({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          output: options.output,
          targetAgent: options.targetAgent,
          write: !options.json
        });

        if (options.json) {
          console.log(JSON.stringify(result.context, null, 2));
          return;
        }

        console.log(renderHandoffSummary(result));
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 story-spec 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
          process.exit(1);
        }

        if (error instanceof HandoffGenerationError) {
          console.log(chalk.red(error.message));
          process.exit(1);
        }

        console.error(chalk.red('断点续写上下文包生成失败'), error);
        process.exit(1);
      }
    });
};
