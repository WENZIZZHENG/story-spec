import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import fs from 'fs-extra';
import ora from 'ora';
import path from 'path';
import { PluginManager } from '../../plugins/manager.js';
import { ensureProjectRoot, getProjectInfo } from '../../utils/project.js';

export function registerPluginsCommand(program: Command, context: { packageRoot: string }): void {
  const { packageRoot } = context;

  // plugins 命令 - 插件管理
  program
    .command('plugins')
    .description('插件管理')
    .action(() => {
      // 显示插件子命令帮助
      console.log(chalk.cyan('\n📦 插件管理命令:\n'));
      console.log('  novel plugins list              - 列出已安装的插件');
      console.log('  novel plugins add <name>        - 安装插件');
      console.log('  novel plugins remove <name>     - 移除插件');
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
          console.log(chalk.gray('\n使用 "novel plugins:add <name>" 安装插件'));
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
          console.log(chalk.red('\n❌ 当前目录不是 novel-writer 项目'));
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
    .action(async (name) => {
      try {
        // 1. 检测项目
        const projectPath = await ensureProjectRoot();
        const projectInfo = await getProjectInfo(projectPath);

        if (!projectInfo) {
          console.log(chalk.red('❌ 无法读取项目信息'));
          process.exit(1);
        }

        console.log(chalk.cyan('\n📦 Novel Writer 插件安装\n'));
        console.log(chalk.gray(`项目版本: ${projectInfo.version}`));
        console.log(chalk.gray(`AI 配置: ${projectInfo.installedAI.join(', ') || '无'}\n`));

        // 2. 查找插件
              const builtinPluginPath = path.join(packageRoot, 'plugins', name);

        if (!await fs.pathExists(builtinPluginPath)) {
          console.log(chalk.red(`❌ 插件 ${name} 未找到\n`));
          console.log(chalk.gray('可用插件:'));
          console.log(chalk.gray('  - translate (翻译出海插件)'));
          console.log(chalk.gray('  - authentic-voice (真实人声插件)'));
          console.log(chalk.gray('  - book-analysis (拆书分析插件)'));
          console.log(chalk.gray('  - genre-knowledge (类型知识库插件)'));
          process.exit(1);
        }

        // 3. 读取插件配置
        const pluginConfigPath = path.join(builtinPluginPath, 'config.yaml');
        const yaml = await import('js-yaml');
        const pluginConfigContent = await fs.readFile(pluginConfigPath, 'utf-8');
        const pluginConfig = yaml.load(pluginConfigContent) as any;

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

        // 5. 安装插件
        const spinner = ora('正在安装插件...').start();
        const pluginManager = new PluginManager(projectPath);

        await pluginManager.installPlugin(name, builtinPluginPath);
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
          console.log(chalk.red('\n❌ 当前目录不是 novel-writer 项目'));
          console.log(chalk.gray('   请在项目根目录运行此命令，或使用 novel init 创建新项目\n'));
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

        console.log(chalk.cyan('\n📦 Novel Writer 插件移除\n'));
        console.log(chalk.gray(`准备移除插件: ${name}`));
        console.log(chalk.gray(`AI 配置: ${projectInfo.installedAI.join(', ') || '无'}\n`));

        const spinner = ora('正在移除插件...').start();
        await pluginManager.removePlugin(name);
        spinner.succeed(chalk.green('插件移除成功！\n'));
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n❌ 当前目录不是 novel-writer 项目'));
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
