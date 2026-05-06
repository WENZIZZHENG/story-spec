import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  compareOutlineCandidates,
  createOutlineCandidate,
  forkOutlineCandidate,
  listOutlineCandidates,
  OutlineCandidateError,
  promoteOutlineCandidate,
  renderOutlineCompare,
  renderOutlineCreate,
  renderOutlineList,
  renderOutlinePromote
} from '../../application/manage-outline-candidates.js';
import { StorySelectionError } from '../../application/workbench-utils.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

type OutlineCommandOptions = {
  from?: string;
  title?: string;
  text?: string;
  file?: string;
  yes?: boolean;
  json?: boolean;
};

const handleOutlineError = (error: any, fallbackMessage: string): never => {
  if (error.message === 'NOT_IN_PROJECT') {
    console.log(chalk.red('\n当前目录不是 story-spec 项目'));
    console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
    process.exit(1);
  }

  if (error instanceof OutlineCandidateError || error instanceof StorySelectionError) {
    console.log(chalk.red(error.message));
    process.exit(1);
  }

  console.error(chalk.red(fallbackMessage), error);
  process.exit(1);
};

export const registerOutlineCommand = (program: Command): void => {
  program
    .command('outline:fork')
    .argument('<story>', '故事目录名或 stories/* 路径')
    .requiredOption('--title <title>', '候选大纲标题')
    .option('--from <source>', '来源，第一版仅支持 current', 'current')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('从当前正式 creative-plan.md fork 候选大纲，不覆盖正式大纲')
    .action(async (story, options: OutlineCommandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await forkOutlineCandidate({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          title: options.title!,
          from: options.from
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderOutlineCreate(result));
      } catch (error: any) {
        handleOutlineError(error, '大纲候选 fork 失败');
      }
    });

  program
    .command('outline:new')
    .argument('<story>', '故事目录名或 stories/* 路径')
    .requiredOption('--title <title>', '候选大纲标题')
    .option('--text <text>', '候选大纲正文或方向说明')
    .option('--file <path>', '从本地文件读取候选大纲正文')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('从作者输入创建候选大纲，不写入正式 creative-plan.md')
    .action(async (story, options: OutlineCommandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await createOutlineCandidate({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          title: options.title!,
          text: options.text,
          file: options.file
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderOutlineCreate(result));
      } catch (error: any) {
        handleOutlineError(error, '大纲候选创建失败');
      }
    });

  program
    .command('outline:list')
    .argument('<story>', '故事目录名或 stories/* 路径')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('列出故事的大纲候选')
    .action(async (story, options: OutlineCommandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await listOutlineCandidates({
          projectRoot,
          fileSystem: nodeFileSystem,
          story
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderOutlineList(result));
      } catch (error: any) {
        handleOutlineError(error, '大纲候选列表读取失败');
      }
    });

  program
    .command('outline:compare')
    .argument('<story>', '故事目录名或 stories/* 路径')
    .argument('<outlineA>', '左侧候选 ID')
    .argument('<outlineB>', '右侧候选 ID')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('比较两个候选大纲的主线目标、人物弧线、节奏、风险和读者承诺')
    .action(async (story, outlineA, outlineB, options: OutlineCommandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await compareOutlineCandidates({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          leftId: outlineA,
          rightId: outlineB
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderOutlineCompare(result));
      } catch (error: any) {
        handleOutlineError(error, '大纲候选比较失败');
      }
    });

  program
    .command('outline:promote')
    .argument('<story>', '故事目录名或 stories/* 路径')
    .argument('<outlineId>', '候选大纲 ID')
    .option('--yes', '确认覆盖正式 creative-plan.md；不传时只预览')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('预览或确认把候选大纲提升为正式 creative-plan.md')
    .action(async (story, outlineId, options: OutlineCommandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await promoteOutlineCandidate({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          outlineId,
          yes: options.yes
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderOutlinePromote(result));
      } catch (error: any) {
        handleOutlineError(error, '大纲候选提升失败');
      }
    });
};
