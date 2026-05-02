import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  generateContextPack,
  renderContextPackSummary,
  renderContextPackValidation,
  validateContextPack
} from '../../application/manage-context-packs.js';
import {
  createDraft,
  listDrafts,
  promoteDraft,
  renderDraftCreateSummary,
  renderDraftList,
  renderDraftPromoteSummary
} from '../../application/manage-drafts.js';
import {
  renderNarrativeTestReport,
  runNarrativeTests
} from '../../application/run-narrative-tests.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';
import { StorySelectionError } from '../../application/workbench-utils.js';
import type { ContextPackPurpose } from '../../domain/workbench.js';

const handleWorkbenchError = (error: any, fallbackMessage: string): never => {
  if (error.message === 'NOT_IN_PROJECT') {
    console.log(chalk.red('\n当前目录不是 novel-writer 项目'));
    console.log(chalk.gray('请在项目根目录运行此命令，或使用 novel init 创建新项目\n'));
    process.exit(1);
  }

  if (error instanceof StorySelectionError) {
    console.log(chalk.red(error.message));
    process.exit(1);
  }

  console.error(chalk.red(fallbackMessage), error);
  process.exit(1);
};

const parsePurpose = (value: string | undefined): ContextPackPurpose => {
  const purpose = value ?? 'write';
  if (['write', 'review', 'revise', 'handoff', 'branch'].includes(purpose)) {
    return purpose as ContextPackPurpose;
  }

  throw new Error(`不支持的 context pack purpose：${purpose}`);
};

export const registerWorkbenchCommand = (program: Command): void => {
  program
    .command('context:pack')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--task <id>', '目标任务 ID，例如 T001')
    .option('--chapter <id>', '目标章节，例如 003 或 chapter-003')
    .option('--scene <id>', '目标 Scene Card ID')
    .option('--purpose <purpose>', 'write、review、revise、handoff、branch', 'write')
    .option('-o, --output <path>', '输出路径基名，默认写入 .specify/context-packs/<id>.json/.md')
    .option('--json', '输出 JSON，且不写入文件')
    .description('生成写作上下文包，明确 mustRead reason 与 allowedWrites')
    .action(async (story, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await generateContextPack({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          task: commandOptions.task,
          chapter: commandOptions.chapter,
          scene: commandOptions.scene,
          purpose: parsePurpose(commandOptions.purpose),
          output: commandOptions.output,
          write: !commandOptions.json
        });

        console.log(commandOptions.json
          ? JSON.stringify(result.pack, null, 2)
          : renderContextPackSummary(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Context Pack 生成失败');
      }
    });

  program
    .command('context:validate')
    .argument('<pack>', 'Context Pack JSON 路径')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('校验 Context Pack 的路径、reason 和过期状态')
    .action(async (pack, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await validateContextPack({
          projectRoot,
          fileSystem: nodeFileSystem,
          packPath: pack
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderContextPackValidation(result));

        if (!result.valid) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handleWorkbenchError(error, 'Context Pack 校验失败');
      }
    });

  program
    .command('draft:new')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .requiredOption('--chapter <id>', '章节，例如 003 或 chapter-003')
    .option('--based-on <path>', '基于已有正文或草稿创建')
    .option('--context-pack <path>', '关联的 Context Pack')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('创建章节草稿，不覆盖正式 content')
    .action(async (story, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await createDraft({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          chapter: commandOptions.chapter,
          basedOn: commandOptions.basedOn,
          contextPack: commandOptions.contextPack
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderDraftCreateSummary(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Draft 创建失败');
      }
    });

  program
    .command('draft:list')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--chapter <id>', '仅列出指定章节')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('列出章节草稿记录')
    .action(async (story, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await listDrafts({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          chapter: commandOptions.chapter
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderDraftList(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Draft 列表读取失败');
      }
    });

  program
    .command('draft:promote')
    .argument('<draftId>', '草稿 ID，例如 chapter-003.v1')
    .option('--story <story>', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--yes', '确认发布到 content/<chapter>.md')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('预览或发布章节草稿到正式正文')
    .action(async (draftId, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await promoteDraft({
          projectRoot,
          fileSystem: nodeFileSystem,
          story: commandOptions.story,
          draftId,
          yes: commandOptions.yes
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderDraftPromoteSummary(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Draft 发布失败');
      }
    });

  program
    .command('narrative:test')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--chapter <id>', '限定章节，例如 003 或 chapter-003')
    .option('--scene <id>', '限定 Scene Card ID')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('运行叙事测试，检查场景闭环和章节级 fallback')
    .action(async (story, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await runNarrativeTests({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          chapter: commandOptions.chapter,
          scene: commandOptions.scene
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderNarrativeTestReport(result));

        if (result.summary.fail > 0) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handleWorkbenchError(error, 'Narrative Tests 执行失败');
      }
    });
};
