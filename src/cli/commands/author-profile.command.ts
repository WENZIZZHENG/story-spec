import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  initAuthorProfile,
  loadAuthorProfile,
  renderAuthorProfileMutation,
  renderAuthorProfileSummary,
  updateAuthorProfile
} from '../../application/manage-author-profile.js';
import type { AuthorProfileEntryCategory } from '../../domain/author-profile.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

type AuthorProfileOptions = {
  init?: boolean;
  answers?: string;
  confirm?: string;
  deprecate?: string;
  ignore?: string;
  clear?: boolean;
  json?: boolean;
  write?: boolean;
};

const parseList = (value: string | undefined): string[] =>
  value?.split(',')
    .map(item => item.trim())
    .filter(Boolean) ?? [];

const isCategory = (value: string): value is AuthorProfileEntryCategory =>
  value === 'genre'
  || value === 'pacing'
  || value === 'voice'
  || value === 'boundary'
  || value === 'pattern';

const parseAnswers = (value: string | undefined): Partial<Record<AuthorProfileEntryCategory, string>> => {
  if (!value?.trim()) {
    return {};
  }

  const answers: Partial<Record<AuthorProfileEntryCategory, string>> = {};

  for (const pair of value.split(';').map(item => item.trim()).filter(Boolean)) {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex === -1) {
      throw new Error(`答案格式应为 category=answer，多个答案用分号分隔：${pair}`);
    }

    const key = pair.slice(0, separatorIndex).trim();
    const answer = pair.slice(separatorIndex + 1).trim();
    if (!isCategory(key)) {
      throw new Error(`未知作者画像采样项：${key}。可用：genre, pacing, voice, boundary`);
    }

    if (answer) {
      answers[key] = answer;
    }
  }

  return answers;
};

export const registerAuthorProfileCommand = (program: Command): void => {
  program
    .command('author-profile')
    .option('--init', '创建/刷新轻量作者偏好采样文件')
    .option('--answers <pairs>', '预填采样答案，格式：genre=...;pacing=...;voice=...;boundary=...')
    .option('--confirm <ids>', '确认画像条目，多个 id 用逗号分隔，例如 pref.genre')
    .option('--deprecate <ids>', '废弃画像条目，多个 id 用逗号分隔')
    .option('--ignore <ids>', '忽略画像条目，多个 id 用逗号分隔')
    .option('--clear', '清空作者画像条目，保留文件结构')
    .option('--no-write', '只预览，不写入 author-profile.json')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('管理作者长期偏好画像；画像只影响推荐和示例，不进入故事正典')
    .action(async (options: AuthorProfileOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const mutationRequested = Boolean(
          options.init
          || options.answers
          || options.confirm
          || options.deprecate
          || options.ignore
          || options.clear
        );

        if (options.init || options.answers) {
          const result = await initAuthorProfile({
            projectRoot,
            fileSystem: nodeFileSystem,
            answers: parseAnswers(options.answers),
            write: options.write !== false
          });

          console.log(options.json
            ? JSON.stringify(result, null, 2)
            : renderAuthorProfileMutation(result));
          return;
        }

        if (mutationRequested) {
          const result = await updateAuthorProfile({
            projectRoot,
            fileSystem: nodeFileSystem,
            confirmIds: parseList(options.confirm),
            deprecateIds: parseList(options.deprecate),
            ignoreIds: parseList(options.ignore),
            clear: options.clear,
            write: options.write !== false
          });

          console.log(options.json
            ? JSON.stringify(result, null, 2)
            : renderAuthorProfileMutation(result));
          return;
        }

        const result = await loadAuthorProfile({
          projectRoot,
          fileSystem: nodeFileSystem
        });

        console.log(options.json
          ? JSON.stringify(result, null, 2)
          : renderAuthorProfileSummary(result));
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 story-spec 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
          process.exit(1);
        }

        console.error(chalk.red('作者画像管理失败'), error.message ?? error);
        process.exit(1);
      }
    });
};
