import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  inspectVoice,
  inspectVoiceSample,
  renderVoiceInspection
} from '../../application/inspect-voice.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

const handleVoiceError = (error: any, fallbackMessage: string): never => {
  if (error.message === 'NOT_IN_PROJECT') {
    console.log(chalk.red('\n当前目录不是 novel-writer 项目'));
    console.log(chalk.gray('请在项目根目录运行此命令，或使用 novel init 创建新项目\n'));
    process.exit(1);
  }

  console.error(chalk.red(fallbackMessage), error);
  process.exit(1);
};

export const registerVoiceCommand = (program: Command): void => {
  program
    .command('voice:list')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('列出 VoiceFingerprint')
    .action(async (options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await inspectVoice({ projectRoot, fileSystem: nodeFileSystem });

        console.log(options.json ? JSON.stringify(result, null, 2) : renderVoiceInspection(result));
      } catch (error: any) {
        handleVoiceError(error, 'VoiceFingerprint 读取失败');
      }
    });

  program
    .command('voice:check')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('检查 VoiceFingerprint 必填字段和样本路径')
    .action(async (options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await inspectVoice({ projectRoot, fileSystem: nodeFileSystem });

        console.log(options.json ? JSON.stringify(result, null, 2) : renderVoiceInspection(result));
        if (result.issues.some(issue => issue.severity === 'error')) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handleVoiceError(error, 'VoiceFingerprint 检查失败');
      }
    });

  program
    .command('voice:sample')
    .argument('<characterId>', '角色 entity id 或 voice characterId')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('读取指定角色的声音样本')
    .action(async (characterId, options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await inspectVoiceSample({
          projectRoot,
          fileSystem: nodeFileSystem,
          characterId
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        console.log([
          'Voice Sample',
          '',
          `角色：${characterId}`,
          `Fingerprint：${result.fingerprint ? '已找到' : '未找到'}`,
          `Samples：${result.samples.length}`,
          '',
          ...(result.samples.length > 0
            ? result.samples.map(sample => `- ${sample.path}`)
            : ['- 暂无样本'])
        ].join('\n'));

        if (!result.fingerprint) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handleVoiceError(error, 'VoiceFingerprint 样本读取失败');
      }
    });
};

