import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  compileManuscript,
  renderCompileResult
} from '../../application/compile-manuscript.js';
import {
  feedbackToTasks,
  importFeedback,
  listFeedback,
  renderFeedbackImport,
  renderFeedbackList,
  renderFeedbackTasks,
  renderFeedbackTriage,
  triageFeedback
} from '../../application/manage-feedback.js';
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
import {
  checkDialogue,
  planDialogue,
  renderDialogueCheck,
  renderDialoguePlan
} from '../../application/manage-dialogue.js';
import {
  compareBranch,
  createBranch,
  listBranches,
  promoteBranch,
  renderBranchCompare,
  renderBranchCreate,
  renderBranchList,
  renderBranchPromote
} from '../../application/manage-branches.js';
import {
  chartTension,
  checkPromises,
  initRhythmConfig,
  listPromises,
  renderPromiseCheck,
  renderPromiseList,
  renderRhythmInit,
  renderTensionChart
} from '../../application/manage-promises.js';
import {
  addResearchSource,
  checkResearch,
  linkResearchCitation,
  listResearchSources,
  renderResearchAdd,
  renderResearchCheck,
  renderResearchLink,
  renderResearchList
} from '../../application/manage-research.js';
import {
  explainStyleRule,
  lintStyle,
  renderStyleExplain,
  renderStyleLint
} from '../../application/manage-style.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';
import { StorySelectionError } from '../../application/workbench-utils.js';
import type {
  ContextPackPurpose,
  ReaderFeedbackStatus,
  ReaderFeedbackType,
  ResearchSourceType
} from '../../domain/workbench.js';

const handleWorkbenchError = (error: any, fallbackMessage: string): never => {
  if (error.message === 'NOT_IN_PROJECT') {
    console.log(chalk.red('\n当前目录不是 story-spec 项目'));
    console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
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

const parseCsv = (value?: string): string[] =>
  value
    ?.split(',')
    .map(item => item.trim())
    .filter(Boolean) ?? [];

const parseResearchSourceType = (value?: string): ResearchSourceType => {
  const type = value ?? 'personal-note';
  if (['book', 'article', 'web', 'video', 'interview', 'personal-note'].includes(type)) {
    return type as ResearchSourceType;
  }

  throw new Error(`不支持的 research source type：${type}`);
};

const parseFeedbackType = (value?: string): ReaderFeedbackType => {
  const type = value ?? 'confusion';
  if (['confusion', 'boredom', 'excitement', 'continuity', 'style', 'character', 'world'].includes(type)) {
    return type as ReaderFeedbackType;
  }

  throw new Error(`不支持的 feedback type：${type}`);
};

const parseFeedbackStatus = (value?: string): ReaderFeedbackStatus => {
  const status = value ?? 'triaged';
  if (['new', 'triaged', 'accepted', 'rejected', 'done'].includes(status)) {
    return status as ReaderFeedbackStatus;
  }

  throw new Error(`不支持的 feedback status：${status}`);
};

const parseCompileFormat = (value?: string): 'markdown' => {
  if (!value || value === 'markdown') {
    return 'markdown';
  }

  throw new Error(`当前仅支持 markdown compile format：${value}`);
};

export const registerWorkbenchCommand = (program: Command): void => {
  program
    .command('compile')
    .option('--story <story>', '故事目录名；默认使用最近更新的 stories/*')
    .option('--format <format>', '输出格式，当前支持 markdown', 'markdown')
    .option('--with-frontmatter', '同时输出 build/manuscript.frontmatter.json')
    .option('--include <parts>', '可选附录；传入 appendix 时在 manuscript 末尾写入统计附录')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('编译 Markdown manuscript；只写 build/，不修改正文')
    .action(async (commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await compileManuscript({
          projectRoot,
          fileSystem: nodeFileSystem,
          story: commandOptions.story,
          format: parseCompileFormat(commandOptions.format),
          withFrontmatter: commandOptions.withFrontmatter,
          includeAppendix: commandOptions.include === 'appendix'
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderCompileResult(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Compile 执行失败');
      }
    });

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

  program
    .command('dialogue:plan')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .requiredOption('--scene <id>', 'Scene Card ID')
    .option('--chapter <id>', '章节，例如 003 或 chapter-003', '001')
    .option('--no-write', '只预览，不写入 dialogue YAML')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('为场景创建待确认 DialogueBeat YAML')
    .action(async (story, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await planDialogue({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          chapter: commandOptions.chapter,
          scene: commandOptions.scene,
          write: commandOptions.write
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderDialoguePlan(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Dialogue Plan 生成失败');
      }
    });

  program
    .command('dialogue:check')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--chapter <id>', '限定章节，例如 003 或 chapter-003')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('检查 DialogueBeat speaker、intent、关系变化和 VoiceFingerprint')
    .action(async (story, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await checkDialogue({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          chapter: commandOptions.chapter
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderDialogueCheck(result));

        if (result.issues.some(issue => issue.severity === 'error')) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handleWorkbenchError(error, 'Dialogue Check 执行失败');
      }
    });

  program
    .command('dialogue:extract')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .requiredOption('--scene <id>', 'Scene Card ID')
    .option('--chapter <id>', '章节，例如 003 或 chapter-003', '001')
    .option('--no-write', '只预览，不写入 dialogue YAML')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('从场景生成待确认 DialogueBeat YAML，不写入 canon')
    .action(async (story, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await planDialogue({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          chapter: commandOptions.chapter,
          scene: commandOptions.scene,
          write: commandOptions.write
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderDialoguePlan(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Dialogue Extract 生成失败');
      }
    });

  program
    .command('branch:create')
    .argument('<title>', '分支标题，例如：女主提前识破身份')
    .option('--story <story>', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--premise <text>', '分支前提说明，默认使用标题')
    .option('--base <id>', '基础分支，默认 main', 'main')
    .option('--changed-scenes <ids>', '受影响 Scene ID，逗号分隔')
    .option('--changed-canon <ids>', '受影响 CanonFact ID，逗号分隔')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('创建剧情 what-if 分支，只写入 stories/*/branches/')
    .action(async (title, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await createBranch({
          projectRoot,
          fileSystem: nodeFileSystem,
          story: commandOptions.story,
          title,
          premise: commandOptions.premise,
          base: commandOptions.base,
          changedScenes: parseCsv(commandOptions.changedScenes),
          changedCanonFacts: parseCsv(commandOptions.changedCanon)
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderBranchCreate(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Branch 创建失败');
      }
    });

  program
    .command('branch:list')
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('列出剧情 what-if 分支')
    .action(async (story, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await listBranches({
          projectRoot,
          fileSystem: nodeFileSystem,
          story
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderBranchList(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Branch 列表读取失败');
      }
    });

  program
    .command('branch:compare')
    .argument('<branchId>', '分支 ID')
    .option('--story <story>', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('输出分支对 scene、canon、promise、relationship 的影响报告')
    .action(async (branchId, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await compareBranch({
          projectRoot,
          fileSystem: nodeFileSystem,
          story: commandOptions.story,
          branchId
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderBranchCompare(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Branch 影响分析失败');
      }
    });

  program
    .command('branch:promote')
    .argument('<branchId>', '分支 ID')
    .option('--story <story>', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--yes', '显式确认分支可进入人工迁移；不会自动覆盖 main 正文或 canon')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('生成或确认分支 promote 清单，不静默覆盖 main')
    .action(async (branchId, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await promoteBranch({
          projectRoot,
          fileSystem: nodeFileSystem,
          story: commandOptions.story,
          branchId,
          yes: commandOptions.yes
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderBranchPromote(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Branch promote 失败');
      }
    });

  program
    .command('rhythm:init')
    .option('--average-chapter-length <number>', '抽象平均章节字数', value => Number(value), 3000)
    .option('--hook-frequency <number>', '每多少章至少出现一次钩子/高张力点', value => Number(value), 3)
    .option('--payoff-interval <number>', '每多少章至少出现一次阶段回报', value => Number(value), 6)
    .option('--info-reveal-density <number>', '每章目标信息揭示密度', value => Number(value), 2)
    .option('--no-write', '只预览 rhythm-config，不写入文件')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('初始化本地抽象 rhythm-config；只记录节奏参数，不导入参考作品正文')
    .action(async (commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await initRhythmConfig({
          projectRoot,
          fileSystem: nodeFileSystem,
          averageChapterLength: commandOptions.averageChapterLength,
          hookFrequency: commandOptions.hookFrequency,
          payoffInterval: commandOptions.payoffInterval,
          infoRevealDensity: commandOptions.infoRevealDensity,
          noWrite: !commandOptions.write
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderRhythmInit(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Rhythm Config 初始化失败');
      }
    });

  program
    .command('promise:list')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('列出 spec/tracking/promises.json 中的读者承诺')
    .action(async (commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await listPromises({
          projectRoot,
          fileSystem: nodeFileSystem
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderPromiseList(result));

        if (result.issues.some(issue => issue.severity === 'error')) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handleWorkbenchError(error, 'Promise 列表读取失败');
      }
    });

  program
    .command('promise:check')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('检查长期未兑现、payoff 缺 evidence、重复建立不推进的 promise')
    .action(async (commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await checkPromises({
          projectRoot,
          fileSystem: nodeFileSystem
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderPromiseCheck(result));

        if (result.issues.some(issue => issue.severity === 'error')) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handleWorkbenchError(error, 'Promise 检查失败');
      }
    });

  program
    .command('tension:chart')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('输出 spec/tracking/tension-curve.json 的张力曲线表格')
    .action(async (commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await chartTension({
          projectRoot,
          fileSystem: nodeFileSystem
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderTensionChart(result));

        if (result.issues.some(issue => issue.severity === 'error')) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handleWorkbenchError(error, 'Tension Chart 生成失败');
      }
    });

  program
    .command('research:add')
    .argument('<title>', '资料标题')
    .option('--type <type>', 'book、article、web、video、interview、personal-note', 'personal-note')
    .option('--path <path>', '本地资料路径；personal-note 未提供时会写入 research/notes/')
    .option('--url <url>', '外部来源 URL，仅记录，不联网抓取')
    .option('--note <text>', '资料摘要或灵感笔记')
    .option('--accessed-at <date>', '访问日期，格式建议 YYYY-MM-DD')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('添加本地 Research Source；默认离线管理，不抓取网络内容')
    .action(async (title, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await addResearchSource({
          projectRoot,
          fileSystem: nodeFileSystem,
          title,
          type: parseResearchSourceType(commandOptions.type),
          path: commandOptions.path,
          url: commandOptions.url,
          note: commandOptions.note,
          accessedAt: commandOptions.accessedAt
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderResearchAdd(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Research Source 添加失败');
      }
    });

  program
    .command('research:list')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('列出 Research Vault 中的资料来源')
    .action(async (commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await listResearchSources({
          projectRoot,
          fileSystem: nodeFileSystem
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderResearchList(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Research Source 列表读取失败');
      }
    });

  program
    .command('research:link')
    .argument('<sourceId>', 'Research Source ID')
    .argument('<targetPath>', '目标文件路径，例如 spec/world/rules.yaml')
    .option('--target-id <id>', '目标对象 ID，例如 world.government')
    .option('--reason <text>', '引用原因', '支撑设定或写作决策')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('把资料来源关联到 world/canon/spec/story 目标')
    .action(async (sourceId, targetPath, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await linkResearchCitation({
          projectRoot,
          fileSystem: nodeFileSystem,
          sourceId,
          targetPath,
          targetId: commandOptions.targetId,
          reason: commandOptions.reason
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderResearchLink(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Research Citation 关联失败');
      }
    });

  program
    .command('research:check')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('检查 Research Source 与 citation 的本地引用关系')
    .action(async (commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await checkResearch({
          projectRoot,
          fileSystem: nodeFileSystem
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderResearchCheck(result));

        if (!result.valid) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handleWorkbenchError(error, 'Research Check 执行失败');
      }
    });

  program
    .command('style:lint')
    .argument('[story]', '故事目录名；不提供时扫描所有 stories/*/content/*.md')
    .option('--chapter <id>', '限定章节，例如 003 或 chapter-003')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('按 spec/style 规则检查正文文风，不自动修改正文')
    .action(async (story, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await lintStyle({
          projectRoot,
          fileSystem: nodeFileSystem,
          story,
          chapter: commandOptions.chapter
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderStyleLint(result));

        if (result.summary.error > 0) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handleWorkbenchError(error, 'Style Lint 执行失败');
      }
    });

  program
    .command('style:explain')
    .argument('<ruleId>', 'Style rule ID')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('解释 style:lint 规则的 pattern、severity 与 suggestion')
    .action(async (ruleId, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await explainStyleRule({
          projectRoot,
          fileSystem: nodeFileSystem,
          ruleId
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderStyleExplain(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Style Rule 读取失败');
      }
    });

  program
    .command('feedback:import')
    .argument('<path>', '反馈 Markdown 文件路径')
    .option('--source <source>', '反馈来源，例如 beta-reader-001')
    .option('--target <path>', '反馈指向的正文或设定路径')
    .option('--type <type>', 'confusion、boredom、excitement、continuity、style、character、world', 'confusion')
    .option('--suggested-action <text>', '默认处理建议')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('导入读者反馈到 feedback/feedback.json，不修改正文')
    .action(async (filePath, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await importFeedback({
          projectRoot,
          fileSystem: nodeFileSystem,
          filePath,
          source: commandOptions.source,
          targetPath: commandOptions.target,
          type: parseFeedbackType(commandOptions.type),
          suggestedAction: commandOptions.suggestedAction
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderFeedbackImport(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Feedback 导入失败');
      }
    });

  program
    .command('feedback:list')
    .option('--status <status>', 'new、triaged、accepted、rejected、done')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('列出读者反馈')
    .action(async (commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await listFeedback({
          projectRoot,
          fileSystem: nodeFileSystem,
          status: commandOptions.status ? parseFeedbackStatus(commandOptions.status) : undefined
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderFeedbackList(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Feedback 列表读取失败');
      }
    });

  program
    .command('feedback:triage')
    .argument('<id>', 'Feedback ID')
    .requiredOption('--status <status>', 'triaged、accepted、rejected、done')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('更新反馈状态，不修改正文')
    .action(async (id, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await triageFeedback({
          projectRoot,
          fileSystem: nodeFileSystem,
          id,
          status: parseFeedbackStatus(commandOptions.status)
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderFeedbackTriage(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Feedback triage 失败');
      }
    });

  program
    .command('feedback:to-tasks')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('把 feedback 转为待确认任务草稿；不写入 tasks.md')
    .action(async (commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await feedbackToTasks({
          projectRoot,
          fileSystem: nodeFileSystem
        });

        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderFeedbackTasks(result));
      } catch (error: any) {
        handleWorkbenchError(error, 'Feedback 任务草稿生成失败');
      }
    });
};
