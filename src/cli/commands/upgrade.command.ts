import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import fs from 'fs-extra';
import ora from 'ora';
import path from 'path';
import { getVersion } from '../../version.js';
import {
  AI_PLATFORM_OPTIONS,
  AI_PLATFORMS,
  getAIPlatform,
  type AIPlatformConfig
} from '../../utils/ai-platforms.js';

export function registerUpgradeCommand(program: Command, context: { packageRoot: string }): void {
  const { packageRoot } = context;

  interface UpdateContent {
    commands: boolean;
    scripts: boolean;
    templates: boolean;
    memory: boolean;
    spec: boolean;
    experts: boolean;
  }

  interface UpgradeStats {
    commands: number;
    scripts: number;
    templates: number;
    memory: number;
    spec: number;
    experts: number;
    platforms: string[];
  }

  /**
   * 交互式选择要更新的内容
   */
  async function selectUpdateContentInteractive(): Promise<UpdateContent> {
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

    return {
      commands: answers.content.includes('commands'),
      scripts: answers.content.includes('scripts'),
      templates: answers.content.includes('templates'),
      memory: answers.content.includes('memory'),
      spec: answers.content.includes('spec'),
      experts: answers.content.includes('experts')
    };
  }

  /**
   * 更新命令文件
   */
  async function updateCommands(
    targetAI: AIPlatformConfig[],
    projectPath: string,
    packageRoot: string,
    dryRun: boolean
  ): Promise<number> {
    let count = 0;

    for (const aiConfig of targetAI) {
      const sourceDir = path.join(packageRoot, aiConfig.distDir);
      if (await fs.pathExists(sourceDir)) {
        const targetDir = path.join(projectPath, aiConfig.dir);

        // 复制命令文件目录
        const sourceCommandsDir = path.join(sourceDir, aiConfig.dir, aiConfig.commandsDir);
        const targetCommandsDir = path.join(targetDir, aiConfig.commandsDir);

        if (await fs.pathExists(sourceCommandsDir)) {
          if (!dryRun) {
            await fs.copy(sourceCommandsDir, targetCommandsDir, { overwrite: true });
          }

          // 统计命令文件数
          const commandFiles = await fs.readdir(sourceCommandsDir);
          const cmdCount = commandFiles.filter(f =>
            f.endsWith('.md') || f.endsWith('.toml')
          ).length;

          count += cmdCount;
          console.log(chalk.gray(`  ✓ ${aiConfig.displayName}: ${cmdCount} 个文件`));
        }

        // 处理额外目录 (如 GitHub Copilot 的 .vscode)
        if (aiConfig.extraDirs) {
          for (const extraDir of aiConfig.extraDirs) {
            const sourceExtraDir = path.join(sourceDir, extraDir);
            const targetExtraDir = path.join(projectPath, extraDir);

            if (await fs.pathExists(sourceExtraDir)) {
              if (!dryRun) {
                await fs.copy(sourceExtraDir, targetExtraDir, { overwrite: true });
              }
              console.log(chalk.gray(`  ✓ ${aiConfig.displayName}: 已更新 ${extraDir}`));
            }
          }
        }
      } else {
        console.log(chalk.yellow(`  ⚠ ${aiConfig.displayName}: 构建产物未找到`));
      }
    }

    return count;
  }

  /**
   * 更新脚本文件
   */
  async function updateScripts(
    projectPath: string,
    packageRoot: string,
    dryRun: boolean
  ): Promise<number> {
    const scriptsSource = path.join(packageRoot, 'scripts');
    const scriptsDest = path.join(projectPath, '.specify', 'scripts');

    if (!await fs.pathExists(scriptsSource)) {
      console.log(chalk.yellow('  ⚠ 脚本源文件未找到'));
      return 0;
    }

    if (!dryRun) {
      await fs.copy(scriptsSource, scriptsDest, { overwrite: true });

      // 设置 bash 脚本执行权限
      const bashDir = path.join(scriptsDest, 'bash');
      if (await fs.pathExists(bashDir)) {
        const bashFiles = await fs.readdir(bashDir);
        for (const file of bashFiles) {
          if (file.endsWith('.sh')) {
            const filePath = path.join(bashDir, file);
            await fs.chmod(filePath, 0o755);
          }
        }
      }
    }

    // 统计脚本数量
    const bashScripts = await fs.readdir(path.join(scriptsSource, 'bash'));
    const psScripts = await fs.readdir(path.join(scriptsSource, 'powershell'));
    const totalScripts = bashScripts.length + psScripts.length;

    console.log(chalk.gray(`  ✓ 更新 ${bashScripts.length} 个 bash 脚本`));
    console.log(chalk.gray(`  ✓ 更新 ${psScripts.length} 个 powershell 脚本`));

    return totalScripts;
  }

  /**
   * 更新模板文件
   */
  async function updateTemplates(
    projectPath: string,
    packageRoot: string,
    dryRun: boolean
  ): Promise<number> {
    const templatesSource = path.join(packageRoot, 'templates');
    const templatesDest = path.join(projectPath, '.specify', 'templates');

    if (!await fs.pathExists(templatesSource)) {
      console.log(chalk.yellow('  ⚠ 模板源文件未找到'));
      return 0;
    }

    if (!dryRun) {
      await fs.copy(templatesSource, templatesDest, { overwrite: true });
    }

    // 统计模板文件
    const files = await fs.readdir(templatesSource);
    const templateCount = files.filter(f => f.endsWith('.md') || f.endsWith('.yaml')).length;

    console.log(chalk.gray(`  ✓ 更新 ${templateCount} 个模板文件`));

    return templateCount;
  }

  /**
   * 更新记忆文件
   */
  async function updateMemory(
    projectPath: string,
    packageRoot: string,
    dryRun: boolean
  ): Promise<number> {
    const memorySource = path.join(packageRoot, 'memory');
    const memoryDest = path.join(projectPath, '.specify', 'memory');

    if (!await fs.pathExists(memorySource)) {
      console.log(chalk.yellow('  ⚠ 记忆源文件未找到'));
      return 0;
    }

    if (!dryRun) {
      await fs.copy(memorySource, memoryDest, { overwrite: true });
    }

    // 统计记忆文件
    const files = await fs.readdir(memorySource);
    const memoryCount = files.filter(f => f.endsWith('.md')).length;

    console.log(chalk.gray(`  ✓ 更新 ${memoryCount} 个记忆文件`));

    return memoryCount;
  }

  /**
   * 更新 spec 目录（包括 presets、反AI检测规范等）
   */
  async function updateSpec(
    projectPath: string,
    packageRoot: string,
    dryRun: boolean
  ): Promise<number> {
    const specSource = path.join(packageRoot, 'spec');
    const specDest = path.join(projectPath, 'spec');

    if (!await fs.pathExists(specSource)) {
      console.log(chalk.yellow('  ⚠ Spec 源文件未找到'));
      return 0;
    }

    let count = 0;

    if (!dryRun) {
      // 遍历 spec 目录，只更新 presets、checklists、config.json 等
      // 不覆盖 tracking 和 knowledge（用户数据）
      const specItems = await fs.readdir(specSource);
      for (const item of specItems) {
        if (item !== 'tracking' && item !== 'knowledge') {
          const sourcePath = path.join(specSource, item);
          const targetPath = path.join(specDest, item);
          await fs.copy(sourcePath, targetPath, { overwrite: true });

          // 统计文件数
          if (await fs.stat(sourcePath).then(s => s.isDirectory())) {
            const files = await fs.readdir(sourcePath);
            count += files.filter(f => f.endsWith('.md') || f.endsWith('.json')).length;
          } else {
            count += 1;
          }
        }
      }
    } else {
      // dry run - 只统计
      const specItems = await fs.readdir(specSource);
      for (const item of specItems) {
        if (item !== 'tracking' && item !== 'knowledge') {
          const sourcePath = path.join(specSource, item);
          if (await fs.stat(sourcePath).then(s => s.isDirectory())) {
            const files = await fs.readdir(sourcePath);
            count += files.filter(f => f.endsWith('.md') || f.endsWith('.json')).length;
          } else {
            count += 1;
          }
        }
      }
    }

    console.log(chalk.gray(`  ✓ 更新 spec/ (presets 等 ${count} 个文件)`));

    return count;
  }

  /**
   * 更新专家模式文件
   */
  async function updateExperts(
    projectPath: string,
    packageRoot: string,
    dryRun: boolean
  ): Promise<number> {
    const expertsSource = path.join(packageRoot, 'experts');
    const expertsDest = path.join(projectPath, '.specify', 'experts');

    // 检查项目是否安装了专家模式
    if (!await fs.pathExists(expertsDest)) {
      console.log(chalk.gray('  ⓘ 项目未安装专家模式，跳过'));
      return 0;
    }

    if (!await fs.pathExists(expertsSource)) {
      console.log(chalk.yellow('  ⚠ 专家源文件未找到'));
      return 0;
    }

    if (!dryRun) {
      await fs.copy(expertsSource, expertsDest, { overwrite: true });
    }

    // 统计专家文件
    const countFiles = async (dir: string): Promise<number> => {
      let count = 0;
      const items = await fs.readdir(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory()) {
          count += await countFiles(itemPath);
        } else if (item.endsWith('.md')) {
          count += 1;
        }
      }
      return count;
    };

    const expertsCount = await countFiles(expertsSource);

    console.log(chalk.gray(`  ✓ 更新 ${expertsCount} 个专家文件`));

    return expertsCount;
  }

  /**
   * 创建选择性备份
   */
  async function createBackup(
    projectPath: string,
    updateContent: UpdateContent,
    targetAI: AIPlatformConfig[],
    projectVersion: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupPath = path.join(projectPath, 'backup', timestamp);
    await fs.ensureDir(backupPath);

    console.log(chalk.cyan('📦 创建备份...'));

    // 备份命令文件
    if (updateContent.commands) {
      for (const aiConfig of targetAI) {
        const source = path.join(projectPath, aiConfig.dir);
        const dest = path.join(backupPath, aiConfig.dir);

        if (await fs.pathExists(source)) {
          await fs.copy(source, dest);
          console.log(chalk.gray(`  ✓ 备份 ${aiConfig.dir}/`));
        }
      }
    }

    // 备份脚本
    if (updateContent.scripts) {
      const scriptsSource = path.join(projectPath, '.specify', 'scripts');
      if (await fs.pathExists(scriptsSource)) {
        await fs.copy(scriptsSource, path.join(backupPath, '.specify', 'scripts'));
        console.log(chalk.gray('  ✓ 备份 .specify/scripts/'));
      }
    }

    // 备份模板
    if (updateContent.templates) {
      const templatesSource = path.join(projectPath, '.specify', 'templates');
      if (await fs.pathExists(templatesSource)) {
        await fs.copy(templatesSource, path.join(backupPath, '.specify', 'templates'));
        console.log(chalk.gray('  ✓ 备份 .specify/templates/'));
      }
    }

    // 备份记忆
    if (updateContent.memory) {
      const memorySource = path.join(projectPath, '.specify', 'memory');
      if (await fs.pathExists(memorySource)) {
        await fs.copy(memorySource, path.join(backupPath, '.specify', 'memory'));
        console.log(chalk.gray('  ✓ 备份 .specify/memory/'));
      }
    }

    // 保存备份信息
    const backupInfo = {
      timestamp,
      fromVersion: projectVersion,
      toVersion: getVersion(),
      upgradedAI: targetAI.map(platform => platform.name),
      updateContent,
      backupPath
    };
    await fs.writeJson(path.join(backupPath, 'BACKUP_INFO.json'), backupInfo, { spaces: 2 });

    console.log(chalk.green(`✓ 备份完成: ${backupPath}\n`));

    return backupPath;
  }

  /**
   * 显示升级报告
   */
  function displayUpgradeReport(
    stats: UpgradeStats,
    projectVersion: string,
    backupPath: string,
    updateContent: UpdateContent
  ): void {
    console.log(chalk.cyan('\n📊 升级报告\n'));
    console.log(chalk.green('✅ 升级完成！\n'));

    console.log(chalk.yellow('升级统计:'));
    console.log(`  • 版本: ${projectVersion} → ${getVersion()}`);
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
  }

  // upgrade 命令 - 升级现有项目
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
    .action(async (options) => {
      const projectPath = process.cwd();

      try {
        // 1. 检测项目
        const configPath = path.join(projectPath, '.specify', 'config.json');
        if (!await fs.pathExists(configPath)) {
          console.log(chalk.red('❌ 当前目录不是 novel-writer 项目'));
          console.log(chalk.gray('   请在项目根目录运行此命令，或使用 novel init 创建新项目'));
          process.exit(1);
        }

        // 读取项目配置
        const config = await fs.readJson(configPath);
        const projectVersion = config.version || '未知';

        console.log(chalk.cyan('\n📦 Novel Writer 项目升级\n'));
        console.log(chalk.gray(`当前版本: ${projectVersion}`));
        console.log(chalk.gray(`目标版本: ${getVersion()}\n`));

        // 2. 检测已安装的 AI 配置
        const installedAI: AIPlatformConfig[] = [];
        for (const aiConfig of AI_PLATFORMS) {
          if (await fs.pathExists(path.join(projectPath, aiConfig.dir))) {
            installedAI.push(aiConfig);
          }
        }

        if (installedAI.length === 0) {
          console.log(chalk.yellow('⚠️  未检测到任何 AI 配置目录'));
          process.exit(1);
        }

        console.log(chalk.green('✓') + ' 检测到 AI 配置: ' + installedAI.map(platform => platform.displayName).join(', '));

        // 3. 确定要升级的 AI 配置
        let targetAI = installedAI;
        if (options.ai) {
          const requestedPlatform = getAIPlatform(options.ai);
          if (!requestedPlatform || !installedAI.some(platform => platform.name === requestedPlatform.name)) {
            console.log(chalk.red(`❌ AI 配置 "${options.ai}" 未安装`));
            process.exit(1);
          }
          targetAI = [requestedPlatform];
        } else if (!options.all) {
          // 默认升级所有已安装的 AI 配置
          targetAI = installedAI;
        }

        const targetDisplayNames = targetAI.map(platform => platform.displayName);

        console.log(chalk.cyan(`\n升级目标: ${targetDisplayNames.join(', ')}\n`));

        // 4. 确定要更新的内容
        let updateContent: UpdateContent;

        if (options.interactive) {
          // 交互式选择
          updateContent = await selectUpdateContentInteractive();
        } else {
          // 根据选项确定更新内容
          const hasSpecificOption = options.commands || options.scripts || options.spec || options.experts || options.templates || options.memory;

          updateContent = {
            commands: hasSpecificOption ? !!options.commands : true,
            scripts: hasSpecificOption ? !!options.scripts : true,
            spec: hasSpecificOption ? !!options.spec : true,
            experts: hasSpecificOption ? !!options.experts : false,
            templates: hasSpecificOption ? !!options.templates : false,
            memory: hasSpecificOption ? !!options.memory : false
          };
        }

        // 显示将要更新的内容
        const updateList: string[] = [];
        if (updateContent.commands) updateList.push('命令文件');
        if (updateContent.scripts) updateList.push('脚本文件');
        if (updateContent.spec) updateList.push('写作规范和预设');
        if (updateContent.experts) updateList.push('专家模式');
        if (updateContent.templates) updateList.push('模板文件');
        if (updateContent.memory) updateList.push('记忆文件');

        console.log(chalk.cyan(`更新内容: ${updateList.join(', ')}\n`));

        if (options.dryRun) {
          console.log(chalk.yellow('🔍 预览模式（不会实际修改文件）\n'));
        }

        // 5. 确认执行
        if (!options.yes && !options.dryRun && !options.interactive) {
          const inquirer = (await import('inquirer')).default;
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'proceed',
              message: '确认执行升级?',
              default: true
            }
          ]);

          if (!answers.proceed) {
            console.log(chalk.yellow('\n升级已取消'));
            process.exit(0);
          }
        }

        // 6. 创建备份
        let backupPath = '';
        if (options.backup !== false && !options.dryRun) {
          backupPath = await createBackup(projectPath, updateContent, targetAI, projectVersion);
        }

        // 7. 执行更新
        const stats: UpgradeStats = {
          commands: 0,
          scripts: 0,
          templates: 0,
          memory: 0,
          spec: 0,
          experts: 0,
          platforms: targetDisplayNames
        };

        const dryRun = !!options.dryRun;

        if (updateContent.commands) {
          console.log(chalk.cyan('📝 更新命令文件...'));
          stats.commands = await updateCommands(targetAI, projectPath, packageRoot, dryRun);
        }

        if (updateContent.scripts) {
          console.log(chalk.cyan('\n🔧 更新脚本文件...'));
          stats.scripts = await updateScripts(projectPath, packageRoot, dryRun);
        }

        if (updateContent.spec) {
          console.log(chalk.cyan('\n📋 更新写作规范和预设...'));
          stats.spec = await updateSpec(projectPath, packageRoot, dryRun);
        }

        if (updateContent.experts) {
          console.log(chalk.cyan('\n🎓 更新专家模式文件...'));
          stats.experts = await updateExperts(projectPath, packageRoot, dryRun);
        }

        if (updateContent.templates) {
          console.log(chalk.cyan('\n📄 更新模板文件...'));
          stats.templates = await updateTemplates(projectPath, packageRoot, dryRun);
        }

        if (updateContent.memory) {
          console.log(chalk.cyan('\n🧠 更新记忆文件...'));
          stats.memory = await updateMemory(projectPath, packageRoot, dryRun);
        }

        // 8. 显示升级报告
        displayUpgradeReport(stats, projectVersion, backupPath, updateContent);

        // 9. 更新项目版本号
        if (!options.dryRun) {
          config.version = getVersion();
          await fs.writeJson(configPath, config, { spaces: 2 });
        }

      } catch (error) {
        console.error(chalk.red('\n❌ 升级失败:'), error);
        process.exit(1);
      }
    });
}
