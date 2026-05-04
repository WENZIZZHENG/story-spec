import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import ora from 'ora';
import { initProject } from '../../application/init-project.js';
import {
  AGENT_INTEGRATION_OPTIONS,
  AGENT_INTEGRATIONS,
  formatAgentCommand,
  formatAgentDisplayNames,
  getAgentIntegration
} from '../../agent/registry.js';
import { commandGitAdapter } from '../../infrastructure/command-git-adapter.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { pluginManagerInstaller } from '../../infrastructure/plugin-manager-installer.js';
import {
  AI_PLATFORM_OPTIONS,
  AI_PLATFORMS,
  formatAICommand,
  formatDisplayNames,
  getAIPlatform
} from '../../utils/ai-platforms.js';
import {
  confirmExpertMode,
  displayProjectBanner,
  displayStep,
  isInteractive,
  selectAIAssistant,
  selectScriptType,
  selectWritingMethod
} from '../../utils/interactive.js';

interface InitCommandContext {
  packageRoot: string;
}

export function registerInitCommand(program: Command, context: InitCommandContext): void {
  const { packageRoot } = context;

  // init 命令 - 初始化小说项目（类似 specify init）
  program
    .command('init')
    .argument('[name]', '小说项目名称')
    .option('--here', '在当前目录初始化')
    .option('--ai <type>', `选择 AI 助手: ${AI_PLATFORM_OPTIONS}`)
    .option('--all', '为所有支持的 AI 助手生成配置')
    .option('--agent <id>', `选择 agent integration: ${AGENT_INTEGRATION_OPTIONS}`)
    .option('--all-agents', '为所有支持的 agent integrations 生成配置')
    .option('--method <type>', '选择写作方法: three-act | hero-journey | story-circle | seven-point | pixar | snowflake')
    .option('--no-git', '跳过 Git 初始化')
    .option('--with-experts', '包含专家模式')
    .option('--plugins <names>', '预装插件，逗号分隔')
    .option('--agents-profile <profiles>', '配置 AGENTS.md 写作边界画像，逗号分隔：adult,slow-burn,adventure,romance,multi-thread')
    .description('初始化一个新的小说项目')
    .action(async (name, options) => {
      // 如果是交互式终端且没有明确指定参数，显示交互选择
      const shouldShowInteractive = isInteractive() && !options.all && !options.allAgents;
      const needsAISelection = shouldShowInteractive && !options.ai && !options.agent;
      const needsMethodSelection = shouldShowInteractive && !options.method;
      const needsExpertConfirm = shouldShowInteractive && !options.withExperts;

      if (needsAISelection || needsMethodSelection || needsExpertConfirm) {
        // 显示项目横幅
        displayProjectBanner();

        let stepCount = 0;
        const totalSteps = 4;

        // 交互式选择 AI 助手
        if (needsAISelection) {
          stepCount++;
          displayStep(stepCount, totalSteps, '选择 AI 助手');
          options.ai = await selectAIAssistant(AI_PLATFORMS);
          console.log('');
        }

        // 交互式选择写作方法
        if (needsMethodSelection) {
          stepCount++;
          displayStep(stepCount, totalSteps, '选择写作方法');
          options.method = await selectWritingMethod();
          console.log('');
        }

        // 交互式选择脚本类型
        stepCount++;
        displayStep(stepCount, totalSteps, '选择脚本类型');
        const selectedScriptType = await selectScriptType();
        console.log('');

        // 交互式确认专家模式
        if (needsExpertConfirm) {
          stepCount++;
          displayStep(stepCount, totalSteps, '专家模式');
          const enableExperts = await confirmExpertMode();
          if (enableExperts) {
            options.withExperts = true;
          }
          console.log('');
        }
      }

      // 设置默认值（如果没有通过交互或参数指定）
      if (!options.ai && !options.agent) {
        if (options.all) {
          options.ai = 'claude';
        } else if (!options.allAgents) {
          options.agent = 'claude';
        }
      }
      if (!options.method) options.method = 'three-act';

      const selectedPlatform = getAIPlatform(options.ai);
      const selectedAgent = getAgentIntegration(options.agent ?? options.ai);
      if (options.agent && options.ai) {
        console.log(chalk.red('❌ --agent 与 --ai 不能同时使用'));
        process.exit(1);
      }

      if (options.allAgents && options.all) {
        console.log(chalk.red('❌ --all-agents 与 --all 不能同时使用'));
        process.exit(1);
      }

      if (options.agent && !selectedAgent && !options.allAgents) {
        console.log(chalk.red(`❌ 不支持的 agent integration: ${options.agent}`));
        console.log(chalk.gray(`   可选值: ${AGENT_INTEGRATION_OPTIONS}`));
        process.exit(1);
      }

      if (options.ai && !selectedPlatform && !options.all) {
        console.log(chalk.red(`❌ 不支持的 AI 助手: ${options.ai}`));
        console.log(chalk.gray(`   可选值: ${AI_PLATFORM_OPTIONS}`));
        process.exit(1);
      }

      const compatibilityHint = options.all
        ? '提示: --all 已进入兼容期，后续请使用 --all-agents'
        : options.ai
          ? `提示: --ai 已进入兼容期，后续请使用 --agent ${options.ai}`
          : undefined;

      const spinner = ora('正在初始化小说项目...').start();

      try {
        const result = await initProject({
          name,
          cwd: process.cwd(),
          packageRoot,
          here: !!options.here,
          ai: options.ai as string | undefined,
          all: !!options.all,
          agent: options.agent as string | undefined,
          allAgents: !!options.allAgents,
          method: options.method as string,
          git: options.git !== false,
          withExperts: !!options.withExperts,
          plugins: options.plugins,
          agentsProfile: options.agentsProfile,
          fileSystem: nodeFileSystem,
          gitAdapter: commandGitAdapter,
          pluginInstaller: pluginManagerInstaller,
          onEvent: event => {
            if (event.type === 'progress') {
              spinner.text = event.message;
            } else if (event.type === 'warning') {
              console.log(chalk.yellow(event.message));
            } else {
              console.log(event.message);
            }
          }
        });
        const { projectName, targetAgents } = result;

        spinner.succeed(chalk.green(`小说项目 "${projectName}" 创建成功！`));

        // 显示后续步骤
        console.log('\n' + chalk.cyan('接下来:'));
        console.log(chalk.gray('─────────────────────────────'));

        if (!options.here) {
          console.log(`  1. ${chalk.white(`cd ${projectName}`)} - 进入项目目录`);
        }

        if (options.allAgents) {
          console.log(`  2. ${chalk.white(`在任意 agent 中打开项目（${formatAgentDisplayNames(AGENT_INTEGRATIONS)}）`)}`);
        } else if (options.all) {
          console.log(`  2. ${chalk.white(`在任意 AI 助手中打开项目（${formatDisplayNames(AI_PLATFORMS)}）`)}`);
        } else {
          console.log(`  2. ${chalk.white(`在 ${selectedAgent?.displayName ?? selectedPlatform?.displayName ?? 'agent'} 中打开项目`)}`);
        }
        const usesMarkdownCommands = targetAgents.some(agent => agent.commandSurface === 'markdown-command' && !agent.slashPrefix);
        console.log(`  3. ${chalk.white('先保存一句灵感，不急着生成完整大纲:')}`);
        console.log(`     ${chalk.cyan('storyspec story:new 故事名 --idea "一句话创意"')}`);
        console.log(`  4. ${chalk.white('选择今天的创作入口:')}`);
        console.log(`     ${chalk.cyan('storyspec next 故事名')}`);
        console.log(`  5. ${chalk.white('完成一轮低负担访谈，再预览规格:')}`);
        console.log(`     ${chalk.cyan('storyspec interview 故事名 --focus protagonist --premise "一句话创意"')}`);
        console.log(`     ${chalk.cyan('storyspec creative:report 故事名')}`);
        console.log(`     ${chalk.cyan('storyspec preview specify 故事名')}`);
        console.log(`     ${chalk.cyan('storyspec apply <preview-id> --yes')}`);

        const formatCommand = (commandName: string): string => {
          if (usesMarkdownCommands) {
            return `.specify/commands/${commandName}.md`;
          }

          if (selectedAgent) {
            return formatAgentCommand(selectedAgent, commandName, !!options.allAgents || !!options.all);
          }

          return formatAICommand(selectedPlatform, commandName, !!options.all);
        };

        console.log('\n' + chalk.yellow(`     ${usesMarkdownCommands ? '后续 agent 命令文档' : '后续 agent 斜杠命令'}:`));
        console.log(`     ${chalk.cyan(formatCommand('plan'))}  - 基于已确认 specification 规划章节结构`);
        console.log(`     ${chalk.cyan(formatCommand('tasks'))} - 拆成可执行写作任务`);
        console.log(`     ${chalk.cyan(formatCommand('write'))} - 在任务和 Scene Card 明确后写正文`);

        // 如果安装了专家模式，显示提示
        if (options.withExperts) {
          console.log('\n' + chalk.yellow('     🎓 专家模式:'));
          console.log(`     ${chalk.cyan(formatCommand('expert'))}       - 列出可用专家`);
          console.log(`     ${chalk.cyan(`${formatCommand('expert')} plot`)} - 剧情结构专家`);
          console.log(`     ${chalk.cyan(`${formatCommand('expert')} character`)} - 人物塑造专家`);
        }

        // 如果安装了插件，显示插件命令
        if (options.plugins) {
          const installedPlugins = options.plugins.split(',').map((p: string) => p.trim());
          if (installedPlugins.includes('translate')) {
            console.log('\n' + chalk.yellow('     🌍 翻译插件:'));
            console.log(`     ${chalk.cyan('/translate')}   - 中英文翻译`);
            console.log(`     ${chalk.cyan('/polish')}      - 英文润色`);
          }
        }

        console.log('\n' + chalk.gray('推荐流程: story:new → next → interview → creative:report → preview specify → apply → plan/tasks/write'));
        console.log(chalk.dim(usesMarkdownCommands
          ? '提示: 命令文档在 agent 内部使用；终端里先用 storyspec story:new / next / interview。'
          : '提示: 斜杠命令在 AI 助手内部使用；终端里先用 storyspec story:new / next / interview。'));
        if (compatibilityHint) {
          console.log(chalk.gray(compatibilityHint));
        }

      } catch (error) {
        spinner.fail(chalk.red('项目初始化失败'));
        console.error(error);
        process.exit(1);
      }
    });
}
