import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { PluginManager, type PluginInstallPlan } from '../../plugins/manager.js';
import { ensureProjectRoot, getProjectInfo } from '../../utils/project.js';

const formatProjectRelativePath = (projectPath: string, targetPath: string): string =>
  path.relative(projectPath, targetPath).replace(/\\/g, '/');

const renderInstallPlan = (projectPath: string, plan: PluginInstallPlan): void => {
  console.log(chalk.yellow('\n预览模式：不会写入任何文件\n'));
  console.log(chalk.cyan('将写入:'));

  for (const operation of plan.operations.filter(operation =>
    operation.kind !== 'install-command' && operation.kind !== 'install-gemini-command'
  )) {
    const label = operation.conflict ? chalk.red('冲突') : chalk.green('写入');
    console.log(`  [${label}] ${formatProjectRelativePath(projectPath, operation.targetPath)}`);
  }

  console.log(chalk.cyan('\nAgent integration 影响:'));
  for (const impact of plan.agentImpacts) {
    const installedLabel = impact.installed ? chalk.green('已安装') : chalk.gray('未安装，跳过');
    console.log(`  ${impact.displayName} (${impact.agent}) - ${installedLabel}`);

    if (!impact.installed) {
      console.log(chalk.gray(`    命令目录: ${formatProjectRelativePath(projectPath, impact.commandsDir)}`));
      continue;
    }

    for (const commandImpact of impact.commandImpacts) {
      const label = commandImpact.status === 'conflict'
        ? chalk.red('冲突')
        : commandImpact.status === 'write'
          ? chalk.green('写入')
          : chalk.gray('跳过');
      console.log(`    [${label}] ${commandImpact.commandId} -> ${formatProjectRelativePath(projectPath, commandImpact.targetPath)}`);
    }
  }

  if (plan.conflicts.length > 0) {
    console.log(chalk.red(`\n发现 ${plan.conflicts.length} 个冲突；安装时默认会阻止覆盖，可使用 --force 覆盖。`));
  } else {
    console.log(chalk.green('\n未发现冲突。'));
  }
};

export function registerPluginsCommand(program: Command, context: { packageRoot: string }): void {
  const { packageRoot } = context;

  // plugins 命令 - 插件管理
  program
    .command('plugins')
    .description('插件管理')
    .action(() => {
      // 显示插件子命令帮助
      console.log(chalk.cyan('\n📦 插件管理命令:\n'));
      console.log('  storyspec plugins list              - 列出已安装的插件');
      console.log('  storyspec plugins add <name>        - 安装插件');
      console.log('  storyspec plugins remove <name>     - 移除插件');
      console.log('\n' + chalk.gray('可用插件:'));
      console.log('  translate         - 中英文翻译插件');
      console.log('  authentic-voice   - 真实人声写作插件');
    });

  program
    .command('plugins:list')
    .description('列出已安装的插件')
    .action(async () => {
      try {
        // 检测项目
        const projectPath = await ensureProjectRoot();
        const projectInfo = await getProjectInfo(projectPath);

        if (!projectInfo) {
          console.log(chalk.red('❌ 无法读取项目信息'));
          process.exit(1);
        }

        const pluginManager = new PluginManager(projectPath);
        const plugins = await pluginManager.listPlugins();

        console.log(chalk.cyan('\n📦 已安装的插件\n'));
        console.log(chalk.gray(`项目: ${path.basename(projectPath)}`));
        console.log(chalk.gray(`AI 配置: ${projectInfo.installedAI.join(', ') || '无'}\n`));

        if (plugins.length === 0) {
          console.log(chalk.yellow('暂无插件'));
          console.log(chalk.gray('\n使用 "storyspec plugins:add <name>" 安装插件'));
          console.log(chalk.gray('可用插件: translate, authentic-voice, book-analysis, genre-knowledge\n'));
          return;
        }

        for (const plugin of plugins) {
          console.log(chalk.yellow(`  ${plugin.name}`) + ` (v${plugin.version})`);
          console.log(chalk.gray(`    ${plugin.description}`));

          if (plugin.commands && plugin.commands.length > 0) {
            console.log(chalk.gray(`    命令: ${plugin.commands.map(c => `/${c.id}`).join(', ')}`));
          }

          if (plugin.experts && plugin.experts.length > 0) {
            console.log(chalk.gray(`    专家: ${plugin.experts.map(e => e.title).join(', ')}`));
          }
          console.log('');
        }
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n❌ 当前目录不是 story-spec 项目'));
          console.log(chalk.gray('   请在项目根目录运行此命令\n'));
          process.exit(1);
        }

        console.error(chalk.red('❌ 列出插件失败:'), error);
        process.exit(1);
      }
    });

  program
    .command('plugins:add <name>')
    .description('安装插件')
    .option('--dry-run', '预览将写入的文件，不实际安装')
    .option('--force', '允许覆盖冲突文件')
    .action(async (name, options) => {
      try {
        // 1. 检测项目
        const projectPath = await ensureProjectRoot();
        const projectInfo = await getProjectInfo(projectPath);

        if (!projectInfo) {
          console.log(chalk.red('❌ 无法读取项目信息'));
          process.exit(1);
        }

        console.log(chalk.cyan('\n📦 StorySpec 插件安装\n'));
        console.log(chalk.gray(`项目版本: ${projectInfo.version}`));
        console.log(chalk.gray(`AI 配置: ${projectInfo.installedAI.join(', ') || '无'}\n`));

        const pluginManager = new PluginManager(projectPath);
        const pluginSourcePath = await pluginManager.resolvePluginSource(name, packageRoot);
        const installPlan = await pluginManager.planInstallPlugin(path.basename(pluginSourcePath), pluginSourcePath);
        const pluginConfig = installPlan.manifest;

        // 4. 显示插件信息
        console.log(chalk.cyan(`准备安装: ${pluginConfig.description || name}`));
        console.log(chalk.gray(`版本: ${pluginConfig.version}`));

        if (pluginConfig.commands && pluginConfig.commands.length > 0) {
          console.log(chalk.gray(`命令数量: ${pluginConfig.commands.length}`));
        }

        if (pluginConfig.experts && pluginConfig.experts.length > 0) {
          console.log(chalk.gray(`专家模式: ${pluginConfig.experts.length} 个`));
        }

        if (projectInfo.installedAI.length > 0) {
          console.log(chalk.gray(`目标 AI: ${projectInfo.installedAI.join(', ')}\n`));
        } else {
          console.log(chalk.yellow('\n⚠️  未检测到 AI 配置目录'));
          console.log(chalk.gray('   插件将被复制，但命令不会被注入到任何 AI 平台\n'));
        }

        if (options.dryRun) {
          renderInstallPlan(projectPath, installPlan);
          console.log('');
          return;
        }

        // 5. 安装插件
        const spinner = ora('正在安装插件...').start();

        await pluginManager.applyInstallPlan(installPlan, { force: options.force });
        spinner.succeed(chalk.green('插件安装成功！\n'));

        // 6. 显示后续步骤
        if (pluginConfig.commands && pluginConfig.commands.length > 0) {
          console.log(chalk.cyan('可用命令:'));
          for (const cmd of pluginConfig.commands) {
            console.log(chalk.gray(`  /${cmd.id} - ${cmd.description || ''}`));
          }
        }

        if (pluginConfig.experts && pluginConfig.experts.length > 0) {
          console.log(chalk.cyan('\n专家模式:'));
          for (const expert of pluginConfig.experts) {
            console.log(chalk.gray(`  /expert ${expert.id} - ${expert.title || ''}`));
          }
        }

        console.log('');
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n❌ 当前目录不是 story-spec 项目'));
          console.log(chalk.gray('   请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
          process.exit(1);
        }

        console.log(chalk.red('\n❌ 安装插件失败'));
        console.error(chalk.gray(error.message || error));
        console.log('');
        process.exit(1);
      }
    });

  program
    .command('plugins:remove <name>')
    .description('移除插件')
    .action(async (name) => {
      try {
        // 检测项目
        const projectPath = await ensureProjectRoot();
        const projectInfo = await getProjectInfo(projectPath);

        if (!projectInfo) {
          console.log(chalk.red('❌ 无法读取项目信息'));
          process.exit(1);
        }

        const pluginManager = new PluginManager(projectPath);

        console.log(chalk.cyan('\n📦 StorySpec 插件移除\n'));
        console.log(chalk.gray(`准备移除插件: ${name}`));
        console.log(chalk.gray(`AI 配置: ${projectInfo.installedAI.join(', ') || '无'}\n`));

        const spinner = ora('正在移除插件...').start();
        await pluginManager.removePlugin(name);
        spinner.succeed(chalk.green('插件移除成功！\n'));
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n❌ 当前目录不是 story-spec 项目'));
          console.log(chalk.gray('   请在项目根目录运行此命令\n'));
          process.exit(1);
        }

        console.log(chalk.red('\n❌ 移除插件失败'));
        console.error(chalk.gray(error.message || error));
        console.log('');
        process.exit(1);
      }
    });

  // ============================================================================
  // Upgrade 辅助函数
}
