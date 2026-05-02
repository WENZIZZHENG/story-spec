import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  createUpgradeProjectPlan,
  upgradeProject,
  UpgradeProjectError,
  type UpdateContent,
  type UpgradeProjectEvent,
  type UpgradeStats
} from '../../application/upgrade-project.js';
import { AI_PLATFORM_OPTIONS } from '../../utils/ai-platforms.js';

type UpgradeCommandOptions = {
  ai?: string;
  all?: boolean;
  interactive?: boolean;
  commands?: boolean;
  scripts?: boolean;
  spec?: boolean;
  experts?: boolean;
  templates?: boolean;
  memory?: boolean;
  yes?: boolean;
  backup?: boolean;
  dryRun?: boolean;
};

const selectUpdateContentInteractive = async (): Promise<UpdateContent> => {
  const inquirer = (await import('inquirer')).default;

  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'content',
      message: '选择要更新的内容:',
      choices: [
        { name: '命令文件 (Commands)', value: 'commands', checked: true },
        { name: '脚本文件 (Scripts)', value: 'scripts', checked: true },
        { name: '写作规范和预设 (Spec/Presets)', value: 'spec', checked: true },
        { name: '专家模式文件 (Experts)', value: 'experts', checked: false },
        { name: '模板文件 (Templates)', value: 'templates', checked: false },
        { name: '记忆文件 (Memory)', value: 'memory', checked: false }
      ]
    }
  ]);

  const selectedContent = answers.content as string[];

  return {
    commands: selectedContent.includes('commands'),
    scripts: selectedContent.includes('scripts'),
    templates: selectedContent.includes('templates'),
    memory: selectedContent.includes('memory'),
    spec: selectedContent.includes('spec'),
    experts: selectedContent.includes('experts')
  };
};

const getUpdateContentFromOptions = async (
  options: UpgradeCommandOptions
): Promise<UpdateContent> => {
  if (options.interactive) {
    return selectUpdateContentInteractive();
  }

  const hasSpecificOption = !!(
    options.commands ||
    options.scripts ||
    options.spec ||
    options.experts ||
    options.templates ||
    options.memory
  );

  return {
    commands: hasSpecificOption ? !!options.commands : true,
    scripts: hasSpecificOption ? !!options.scripts : true,
    spec: hasSpecificOption ? !!options.spec : true,
    experts: hasSpecificOption ? !!options.experts : false,
    templates: hasSpecificOption ? !!options.templates : false,
    memory: hasSpecificOption ? !!options.memory : false
  };
};

const formatUpdateContent = (updateContent: UpdateContent): string[] => {
  const updateList: string[] = [];

  if (updateContent.commands) updateList.push('命令文件');
  if (updateContent.scripts) updateList.push('脚本文件');
  if (updateContent.spec) updateList.push('写作规范和预设');
  if (updateContent.experts) updateList.push('专家模式');
  if (updateContent.templates) updateList.push('模板文件');
  if (updateContent.memory) updateList.push('记忆文件');

  return updateList;
};

const confirmUpgrade = async (
  options: UpgradeCommandOptions
): Promise<boolean> => {
  if (options.yes || options.dryRun || options.interactive) {
    return true;
  }

  const inquirer = (await import('inquirer')).default;
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: '确认执行升级?',
      default: true
    }
  ]);

  return !!answers.proceed;
};

const displayUpgradeEvent = (event: UpgradeProjectEvent): void => {
  if (event.type === 'progress') {
    console.log(chalk.cyan(`\n${event.message}`));
    return;
  }

  if (event.type === 'warning') {
    console.log(chalk.yellow(`  ⚠ ${event.message}`));
    return;
  }

  console.log(chalk.gray(`  ✓ ${event.message}`));
};

const displayUpgradeReport = (
  stats: UpgradeStats,
  projectVersion: string,
  targetVersion: string,
  backupPath: string,
  updateContent: UpdateContent
): void => {
  console.log(chalk.cyan('\n📊 升级报告\n'));
  console.log(chalk.green('✅ 升级完成！\n'));

  console.log(chalk.yellow('升级统计:'));
  console.log(`  • 版本: ${projectVersion} → ${targetVersion}`);
  console.log(`  • AI 平台: ${stats.platforms.join(', ')}`);

  if (updateContent.commands && stats.commands > 0) {
    console.log(`  • 命令文件: ${stats.commands} 个`);
  }
  if (updateContent.scripts && stats.scripts > 0) {
    console.log(`  • 脚本文件: ${stats.scripts} 个`);
  }
  if (updateContent.spec && stats.spec > 0) {
    console.log(`  • 写作规范和预设: ${stats.spec} 个`);
  }
  if (updateContent.experts && stats.experts > 0) {
    console.log(`  • 专家模式文件: ${stats.experts} 个`);
  }
  if (updateContent.templates && stats.templates > 0) {
    console.log(`  • 模板文件: ${stats.templates} 个`);
  }
  if (updateContent.memory && stats.memory > 0) {
    console.log(`  • 记忆文件: ${stats.memory} 个`);
  }

  if (backupPath) {
    console.log(chalk.gray(`\n📦 备份位置: ${backupPath}`));
    console.log(chalk.gray('   如需回滚，删除当前文件并从备份恢复'));
  }

  console.log(chalk.cyan('\n✨ 本次升级包含:'));
  console.log('  • 反AI检测规范: 基于朱雀实测的0% AI浓度写作指南');
  console.log('  • 专家模式增强: 核心专家系统（角色、剧情、风格、世界观）');
  console.log('  • AI 温度控制: write 命令新增创作强化指令');
  console.log('  • 多平台支持: 所有 13 个 AI 平台的命令已更新');

  console.log(chalk.gray('\n📚 查看详细升级指南: docs/upgrade-guide.md'));
  console.log(chalk.gray('   或访问: https://github.com/wordflowlab/novel-writer/blob/main/docs/upgrade-guide.md'));
};

const displayUpgradeError = (error: unknown): void => {
  if (error instanceof UpgradeProjectError) {
    if (error.code === 'NOT_PROJECT') {
      console.log(chalk.red('✗ 当前目录不是 novel-writer 项目'));
      console.log(chalk.gray('   请在项目根目录运行此命令，或使用 novel init 创建新项目'));
      return;
    }

    console.log(chalk.red(`✗ ${error.message}`));
    return;
  }

  console.error(chalk.red('\n✗ 升级失败:'), error);
};

export function registerUpgradeCommand(program: Command, context: { packageRoot: string }): void {
  const { packageRoot } = context;

  program
    .command('upgrade')
    .option('--ai <type>', `指定要升级的 AI 配置: ${AI_PLATFORM_OPTIONS}`)
    .option('--all', '升级所有 AI 配置')
    .option('-i, --interactive', '交互式选择要更新的内容')
    .option('--commands', '仅更新命令文件')
    .option('--scripts', '仅更新脚本文件')
    .option('--spec', '仅更新写作规范和预设')
    .option('--experts', '仅更新专家模式文件')
    .option('--templates', '仅更新模板文件')
    .option('--memory', '仅更新记忆文件')
    .option('-y, --yes', '跳过确认提示')
    .option('--no-backup', '跳过备份')
    .option('--dry-run', '预览升级内容，不实际修改')
    .description('升级现有项目到最新版本')
    .action(async (options: UpgradeCommandOptions) => {
      const projectPath = process.cwd();

      try {
        const updateContent = await getUpdateContentFromOptions(options);
        const plan = await createUpgradeProjectPlan({
          projectPath,
          ai: options.ai,
          all: options.all,
          updateContent
        });

        console.log(chalk.cyan('\n📦 Novel Writer 项目升级\n'));
        console.log(chalk.gray(`当前版本: ${plan.projectVersion}`));
        console.log(chalk.gray(`目标版本: ${plan.targetVersion}\n`));
        console.log(chalk.green('✓') + ' 检测到 AI 配置: ' + plan.installedAI.map(platform => platform.displayName).join(', '));
        console.log(chalk.cyan(`\n升级目标: ${plan.targetDisplayNames.join(', ')}\n`));
        console.log(chalk.cyan(`更新内容: ${formatUpdateContent(updateContent).join(', ')}\n`));

        if (options.dryRun) {
          console.log(chalk.yellow('🔍 预览模式（不会实际修改文件）\n'));
        }

        if (!await confirmUpgrade(options)) {
          console.log(chalk.yellow('\n升级已取消'));
          process.exit(0);
        }

        const result = await upgradeProject({
          projectPath,
          packageRoot,
          ai: options.ai,
          all: options.all,
          updateContent,
          backup: options.backup,
          dryRun: options.dryRun,
          onEvent: displayUpgradeEvent
        });

        displayUpgradeReport(
          result.stats,
          result.projectVersion,
          result.targetVersion,
          result.backupPath,
          updateContent
        );
      } catch (error) {
        displayUpgradeError(error);
        process.exit(1);
      }
    });
}
