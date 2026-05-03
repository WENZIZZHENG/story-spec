import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  createStoryIdea,
  getStoryNext,
  renderCreateStoryIdea,
  renderStoryNext,
  StoryOnboardingError
} from '../../application/story-onboarding.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';
import { StorySelectionError } from '../../application/workbench-utils.js';

type StoryNewOptions = {
  idea?: string;
  json?: boolean;
};

type StoryNextOptions = {
  json?: boolean;
};

const handleStoryOnboardingError = (error: any, label: string): never => {
  if (error.message === 'NOT_IN_PROJECT') {
    console.log(chalk.red('\n当前目录不是 story-spec 项目'));
    console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
    process.exit(1);
  }

  if (error instanceof StoryOnboardingError || error instanceof StorySelectionError) {
    console.log(chalk.red(error.message));
    process.exit(1);
  }

  console.error(chalk.red(label), error);
  process.exit(1);
};

const runStoryNew = async (
  name: string,
  options: StoryNewOptions
): Promise<void> => {
  try {
    const projectRoot = await ensureProjectRoot();
    const result = await createStoryIdea({
      projectRoot,
      fileSystem: nodeFileSystem,
      name,
      idea: options.idea
    });

    console.log(options.json
      ? JSON.stringify(result, null, 2)
      : renderCreateStoryIdea(result));
  } catch (error: any) {
    handleStoryOnboardingError(error, '新故事创建失败');
  }
};

const runStoryNext = async (
  story: string | undefined,
  options: StoryNextOptions
): Promise<void> => {
  try {
    const projectRoot = await ensureProjectRoot();
    const result = await getStoryNext({
      projectRoot,
      fileSystem: nodeFileSystem,
      story
    });

    console.log(options.json
      ? JSON.stringify(result, null, 2)
      : renderStoryNext(result));
  } catch (error: any) {
    handleStoryOnboardingError(error, '下一步导航失败');
  }
};

export const registerStoryOnboardingCommand = (program: Command): void => {
  program
    .command('story:new')
    .argument('<name>', '故事名称，会创建 stories/<story>/idea.md')
    .option('--idea <text>', '一句话创意；只记录为用户原文，不自动扩写')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('创建新故事创意草稿，并提示进入澄清访谈')
    .action(async (name, options) => {
      await runStoryNew(name, options);
    });

  program
    .command('next')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('根据当前故事状态给出下一步创作导航')
    .action(async (storyName, options) => {
      await runStoryNext(storyName, options);
    });
};
