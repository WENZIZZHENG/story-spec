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
  inputWorkspacePath,
  isInteractive,
  selectAIAssistant,
  selectScriptType,
  selectWritingMethod
} from '../../utils/interactive.js';

interface InitCommandContext {
  packageRoot: string;
}

export interface RenderInitSuccessNextStepsInput {
  projectName: string;
  projectPath: string;
  targetAgents: Array<{
    displayName: string;
    commandSurface: string;
    slashPrefix?: string;
  }>;
  here: boolean;
  all: boolean;
  allAgents: boolean;
  selectedAgentDisplayName: string;
  compatibilityHint?: string;
  usesExplicitWorkspace?: boolean;
}

export const renderInitSuccessNextSteps = (input: RenderInitSuccessNextStepsInput): string => {
  const lines: string[] = [
    '',
    chalk.green(`工作区已就绪: ${input.projectPath}`),
    '',
    chalk.cyan('接下来:'),
    chalk.gray('─────────────────────────────')
  ];

  if (!input.here) {
    const cdTarget = input.usesExplicitWorkspace ? input.projectPath : input.projectName;
    lines.push(`  1. ${chalk.white(`cd ${cdTarget}`)} - 进入项目目录`);
  }

  lines.push(`  2. ${chalk.white(`在 ${input.selectedAgentDisplayName} 中打开项目`)}`);
  lines.push('');
  lines.push(chalk.cyan('素材分流入口:'));
  lines.push(`  3. ${chalk.white('保存一句灵感:')}`);
  lines.push(`     ${chalk.cyan('storyspec story:new 故事名 --idea "一句话创意"')}`);
  lines.push(`  4. ${chalk.white('查看今天最适合的下一步:')}`);
  lines.push(`     ${chalk.cyan('storyspec next 故事名')}`);
  lines.push(`  5. ${chalk.white('完成一轮访谈后预览规格:')}`);
  lines.push(`     ${chalk.cyan('storyspec creative:report 故事名')}`);
  lines.push(`     ${chalk.cyan('storyspec preview specify 故事名')}`);
  lines.push(`     ${chalk.cyan('storyspec apply <preview-id> --yes')}`);
  lines.push('');
  lines.push(chalk.gray('推荐流程: story:new → next → interview → creative:report → preview specify → apply → plan/tasks/write'));
  lines.push(chalk.dim('更多 agent 命令和专家/插件入口可运行 storyspec init --help 查看。'));
  lines.push(chalk.dim('提示: agent 命令在 AI 助手内部使用；终端里先用 storyspec story:new / next / interview。'));

  if (input.compatibilityHint) {
    lines.push(chalk.gray(input.compatibilityHint));
  }

  return lines.join('\n');
};

export function registerInitCommand(program: Command, context: InitCommandContext): void {
  const { packageRoot } = context;

  // init 命令 - 初始化小说项目（类似 specify init）
  program
    .command('init')
    .argument('[name]', '小说项目名称')
    .option('--here', '在当前目录初始化')
    .option('--workspace <path>', '显式指定 StorySpec 工作区路径')
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
      const needsWorkspacePath = shouldShowInteractive && !name && !options.here && !options.workspace;
      const needsAISelection = shouldShowInteractive && !options.ai && !options.agent;
      const needsMethodSelection = shouldShowInteractive && !options.method;
      const needsExpertConfirm = shouldShowInteractive && !options.withExperts;

      if (needsWorkspacePath || needsAISelection || needsMethodSelection || needsExpertConfirm) {
        // 显示项目横幅
        displayProjectBanner();

        let stepCount = 0;
        const totalSteps = [
          needsWorkspacePath,
          needsAISelection,
          needsMethodSelection,
          true,
          needsExpertConfirm
        ].filter(Boolean).length;

        if (needsWorkspacePath) {
          stepCount++;
          displayStep(stepCount, totalSteps, '设置工作区路径');
          options.workspace = await inputWorkspacePath();
          console.log('');
        }

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
      const deferredEvents: Array<{ type: 'info' | 'warning'; message: string }> = [];

      try {
        const result = await initProject({
          name,
          workspacePath: options.workspace as string | undefined,
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
            } else {
              deferredEvents.push(event);
            }
          }
        });
        const { projectName, projectPath, targetAgents } = result;

        spinner.succeed(chalk.green(`小说项目 "${projectName}" 创建成功！`));

        console.log(renderInitSuccessNextSteps({
          projectName,
          projectPath,
          targetAgents,
          here: !!options.here,
          all: !!options.all,
          allAgents: !!options.allAgents,
          selectedAgentDisplayName: options.allAgents
            ? `任意 agent（${formatAgentDisplayNames(AGENT_INTEGRATIONS)}）`
            : options.all
              ? `任意 AI 助手（${formatDisplayNames(AI_PLATFORMS)}）`
              : selectedAgent?.displayName ?? selectedPlatform?.displayName ?? 'agent',
          compatibilityHint,
          usesExplicitWorkspace: !!options.workspace
        }));

        for (const event of deferredEvents) {
          console.log(event.type === 'warning' ? chalk.yellow(event.message) : event.message);
        }

      } catch (error) {
        spinner.fail(chalk.red('项目初始化失败'));
        console.error(error);
        process.exit(1);
      }
    });
}
