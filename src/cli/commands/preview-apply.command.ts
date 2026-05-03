import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  applyPreview,
  createPlanPreview,
  createSpecifyPreview,
  PreviewApplyError,
  renderApplyPreview,
  renderPlanPreview,
  renderSpecifyPreview
} from '../../application/preview-apply.js';
import { StorySelectionError } from '../../application/workbench-utils.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

const handlePreviewError = (error: any, label: string): never => {
  if (error.message === 'NOT_IN_PROJECT') {
    console.log(chalk.red('\n当前目录不是 story-spec 项目'));
    console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
    process.exit(1);
  }

  if (error instanceof PreviewApplyError || error instanceof StorySelectionError) {
    console.log(chalk.red(error.message));
    process.exit(1);
  }

  console.error(chalk.red(label), error);
  process.exit(1);
};

export const registerPreviewApplyCommand = (program: Command): void => {
  const preview = program
    .command('preview')
    .description('生成写入前预览，不覆盖正式故事文件');

  preview
    .command('specify')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('生成 specification 写入前预览')
    .action(async (story, options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await createSpecifyPreview({
          projectRoot,
          fileSystem: nodeFileSystem,
          story
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderSpecifyPreview(result));
      } catch (error: any) {
        handlePreviewError(error, '规格预览生成失败');
      }
    });

  preview
    .command('plan')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('生成 creative-plan 写入前预览')
    .action(async (story, options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await createPlanPreview({
          projectRoot,
          fileSystem: nodeFileSystem,
          story
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderPlanPreview(result));
      } catch (error: any) {
        handlePreviewError(error, '计划预览生成失败');
      }
    });

  program
    .command('apply')
    .argument('<previewId>', 'preview ID，例如 specify-demo-20260503-...')
    .option('--yes', '确认写入目标文件；不传时只预览')
    .option('--draft', '仅对 plan preview 生效：允许写入保留 [需要澄清] 的草案')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('应用已生成的 preview；默认不写入，必须 --yes 才会覆盖目标文件')
    .action(async (previewId, options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await applyPreview({
          projectRoot,
          fileSystem: nodeFileSystem,
          previewId,
          yes: options.yes,
          draft: options.draft
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderApplyPreview(result));
      } catch (error: any) {
        handlePreviewError(error, 'Preview apply 失败');
      }
    });
};
