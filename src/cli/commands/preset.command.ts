import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  addPreset,
  inspectPreset,
  listPresets,
  renderPresetDoctor,
  renderPresetList
} from '../../application/manage-presets.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

export interface RegisterPresetCommandOptions {
  packageRoot: string;
}

const handlePresetError = (error: any, fallbackMessage: string): never => {
  if (error.message === 'NOT_IN_PROJECT') {
    console.log(chalk.red('\n当前目录不是 story-spec 项目'));
    console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
    process.exit(1);
  }

  if (typeof error.message === 'string' && error.message.startsWith('PRESET_NOT_FOUND:')) {
    console.log(chalk.red(`未找到 preset：${error.message.replace('PRESET_NOT_FOUND:', '')}`));
    process.exit(1);
  }

  console.error(chalk.red(fallbackMessage), error);
  process.exit(1);
};

export const registerPresetCommand = (
  program: Command,
  options: RegisterPresetCommandOptions
): void => {
  program
    .command('preset:list')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('列出内置 genre presets')
    .action(async (commandOptions) => {
      try {
        const result = await listPresets({
          projectRoot: process.cwd(),
          packageRoot: options.packageRoot,
          fileSystem: nodeFileSystem
        });

        console.log(commandOptions.json ? JSON.stringify(result, null, 2) : renderPresetList(result));
      } catch (error: any) {
        handlePresetError(error, 'Preset 列表读取失败');
      }
    });

  program
    .command('preset:add')
    .argument('<id>', 'preset id，例如 xuanhuan-cultivation')
    .option('--dry-run', '只预览写入，不修改项目')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('安装 genre preset 到当前项目')
    .action(async (presetId, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await addPreset({
          projectRoot,
          packageRoot: options.packageRoot,
          fileSystem: nodeFileSystem,
          presetId,
          dryRun: commandOptions.dryRun
        });

        if (commandOptions.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        console.log([
          'Genre Preset 安装',
          '',
          `Preset：${result.preset.id} ${result.preset.name}`,
          `模式：${result.dryRun ? '预览' : '已写入'}`,
          `模板层：${result.targetDir}`,
          `当前记录：${result.currentPresetPath}`,
          '',
          ...result.writtenPaths.map(file => `- ${file}`)
        ].join('\n'));
      } catch (error: any) {
        handlePresetError(error, 'Preset 安装失败');
      }
    });

  program
    .command('preset:doctor')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('检查当前项目启用的 genre preset')
    .action(async (commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await inspectPreset({
          projectRoot,
          fileSystem: nodeFileSystem
        });

        console.log(commandOptions.json ? JSON.stringify(result, null, 2) : renderPresetDoctor(result));
        if (result.issues.some(issue => issue.severity === 'error')) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handlePresetError(error, 'Preset 检查失败');
      }
    });
};
