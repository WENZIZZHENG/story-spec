import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import ora from 'ora';
import path from 'path';
import { PluginManager } from '../../plugins/manager.js';
import { getVersion } from '../../version.js';
import {
  AI_PLATFORM_OPTIONS,
  AI_PLATFORMS,
  formatAICommand,
  formatDisplayNames,
  getAIInitDirs,
  getAIPlatform,
  getTargetAIPlatforms
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

// 辅助函数：生成 TOML 格式命令
function generateTomlCommand(template: string, scriptPath: string): string {
  // 提取 description
  const descMatch = template.match(/description:\s*(.+)/);
  const description = descMatch ? descMatch[1].trim() : '命令说明';

  // 移除 YAML frontmatter
  const content = template.replace(/^---[\s\S]*?---\n/, '');

  // 替换 {SCRIPT}
  const processedContent = content.replace(/{SCRIPT}/g, scriptPath);

  // 规范化换行符，避免 Windows CRLF 导致 TOML 解析失败
  const normalizedContent = processedContent.replace(/\r\n/g, '\n');
  const promptValue = JSON.stringify(normalizedContent);
  const escapedDescription = description
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');

  return `description = "${escapedDescription}"

prompt = ${promptValue}
`;
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
    .option('--method <type>', '选择写作方法: three-act | hero-journey | story-circle | seven-point | pixar | snowflake')
    .option('--no-git', '跳过 Git 初始化')
    .option('--with-experts', '包含专家模式')
    .option('--plugins <names>', '预装插件，逗号分隔')
    .description('初始化一个新的小说项目')
    .action(async (name, options) => {
      // 如果是交互式终端且没有明确指定参数，显示交互选择
      const shouldShowInteractive = isInteractive() && !options.all;
      const needsAISelection = shouldShowInteractive && !options.ai;
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
      if (!options.ai) options.ai = 'claude';
      if (!options.method) options.method = 'three-act';
  
      const selectedPlatform = getAIPlatform(options.ai);
      if (!selectedPlatform && !options.all) {
        console.log(chalk.red(`❌ 不支持的 AI 助手: ${options.ai}`));
        console.log(chalk.gray(`   可选值: ${AI_PLATFORM_OPTIONS}`));
        process.exit(1);
      }
  
      const spinner = ora('正在初始化小说项目...').start();
  
      try {
        // 确定项目路径
        let projectPath: string;
        if (options.here) {
          projectPath = process.cwd();
          name = path.basename(projectPath);
        } else {
          if (!name) {
            spinner.fail('请提供项目名称或使用 --here 参数');
            process.exit(1);
          }
          projectPath = path.join(process.cwd(), name);
          if (await fs.pathExists(projectPath)) {
            spinner.fail(`项目目录 "${name}" 已存在`);
            process.exit(1);
          }
          await fs.ensureDir(projectPath);
        }
  
        // 创建基础项目结构
        const baseDirs = [
          '.specify',
          '.specify/memory',
          '.specify/scripts',
          '.specify/scripts/bash',
          '.specify/scripts/powershell',
          '.specify/templates',
          'stories',
          'spec',
          'spec/tracking',
          'spec/knowledge'
        ];
  
        for (const dir of baseDirs) {
          await fs.ensureDir(path.join(projectPath, dir));
        }
  
        const targetPlatforms = getTargetAIPlatforms(!!options.all, options.ai as string);
        const aiDirs = getAIInitDirs(targetPlatforms);
  
        for (const dir of aiDirs) {
          await fs.ensureDir(path.join(projectPath, dir));
        }
  
        // 创建基础配置文件
        const config = {
          name,
          type: 'novel',
          ai: options.ai,
          method: options.method || 'three-act',
          created: new Date().toISOString(),
          version: getVersion()
        };
  
        await fs.writeJson(path.join(projectPath, '.specify', 'config.json'), config, { spaces: 2 });
  
        // 从构建产物复制 AI 配置和命令文件
        const scriptsDir = path.join(packageRoot, 'scripts');
  
        // 复制 AI 配置目录（包含命令文件和 .specify 目录）
        for (const platform of targetPlatforms) {
          const sourceDir = path.join(packageRoot, platform.distDir);
          if (await fs.pathExists(sourceDir)) {
            // 复制整个构建产物目录到项目
            await fs.copy(sourceDir, projectPath, { overwrite: false });
            spinner.text = `已安装 ${platform.name} 配置...`;
          } else {
            console.log(chalk.yellow(`\n警告: ${platform.name} 构建产物未找到，请运行 npm run build:commands`));
          }
        }
  
        // 复制脚本文件到用户项目的 .specify/scripts 目录（构建产物已包含）
        // 注意：.specify 目录已由上面的 fs.copy 复制，此处仅作为备份逻辑
        if (await fs.pathExists(scriptsDir) && !await fs.pathExists(path.join(projectPath, '.specify', 'scripts'))) {
          const userScriptsDir = path.join(projectPath, '.specify', 'scripts');
          await fs.copy(scriptsDir, userScriptsDir);
  
          // 设置 bash 脚本执行权限
          const bashDir = path.join(userScriptsDir, 'bash');
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
  
        // 复制模板文件到 .specify/templates 目录
        const fullTemplatesDir = path.join(packageRoot, 'templates');
        if (await fs.pathExists(fullTemplatesDir)) {
          const userTemplatesDir = path.join(projectPath, '.specify', 'templates');
          await fs.copy(fullTemplatesDir, userTemplatesDir);
        }
  
        // 为 Codex 项目生成轻量 AGENTS.md，便于接手时直接识别流程和边界
        if (targetPlatforms.some(platform => platform.name === 'codex')) {
          const codexAgentsSource = path.join(fullTemplatesDir, 'AGENTS.codex.md');
          const codexAgentsDest = path.join(projectPath, 'AGENTS.md');
          if (await fs.pathExists(codexAgentsSource) && !await fs.pathExists(codexAgentsDest)) {
            let content = await fs.readFile(codexAgentsSource, 'utf-8');
            content = content.replace(/\{\{PROJECT_NAME\}\}/g, String(name || path.basename(projectPath)));
            await fs.writeFile(codexAgentsDest, content);
          }
        }
  
        // 复制 memory 文件到 .specify/memory 目录
        const memoryDir = path.join(packageRoot, 'memory');
        if (await fs.pathExists(memoryDir)) {
          const userMemoryDir = path.join(projectPath, '.specify', 'memory');
          await fs.copy(memoryDir, userMemoryDir);
        }
  
        // 复制追踪文件模板到 spec/tracking 目录
        const trackingTemplatesDir = path.join(packageRoot, 'templates', 'tracking');
        if (await fs.pathExists(trackingTemplatesDir)) {
          const userTrackingDir = path.join(projectPath, 'spec', 'tracking');
          await fs.copy(trackingTemplatesDir, userTrackingDir);
        }
  
        // 复制知识库模板到 spec/knowledge 目录
        const knowledgeTemplatesDir = path.join(packageRoot, 'templates', 'knowledge');
        if (await fs.pathExists(knowledgeTemplatesDir)) {
          const userKnowledgeDir = path.join(projectPath, 'spec', 'knowledge');
          await fs.copy(knowledgeTemplatesDir, userKnowledgeDir);
  
          // 更新模板中的日期
          const knowledgeFiles = await fs.readdir(userKnowledgeDir);
          const currentDate = new Date().toISOString().split('T')[0];
          for (const file of knowledgeFiles) {
            if (file.endsWith('.md')) {
              const filePath = path.join(userKnowledgeDir, file);
              let content = await fs.readFile(filePath, 'utf-8');
              content = content.replace(/\[日期\]/g, currentDate);
              await fs.writeFile(filePath, content);
            }
          }
        }
  
        // 复制 spec 目录结构（包括预设和反AI检测规范）
        // 注意：构建产物已包含 spec/presets 等，此处作为后备确保完整性
        const specDir = path.join(packageRoot, 'spec');
        if (await fs.pathExists(specDir)) {
          const userSpecDir = path.join(projectPath, 'spec');
  
          // 遍历并复制所有 spec 子目录
          const specItems = await fs.readdir(specDir);
          for (const item of specItems) {
            const sourcePath = path.join(specDir, item);
            const targetPath = path.join(userSpecDir, item);
  
            // presets、checklists、config.json 等直接复制（不覆盖已存在的）
            // tracking 和 knowledge 已在前面从 templates 复制，跳过
            if (item !== 'tracking' && item !== 'knowledge') {
              await fs.copy(sourcePath, targetPath, { overwrite: false });
            }
          }
        }
  
        // 为 Gemini 复制额外的配置文件
        if (targetPlatforms.some(platform => platform.name === 'gemini')) {
          // 复制 settings.json
          const geminiSettingsSource = path.join(packageRoot, 'templates', 'gemini-settings.json');
          const geminiSettingsDest = path.join(projectPath, '.gemini', 'settings.json');
          if (await fs.pathExists(geminiSettingsSource)) {
            await fs.copy(geminiSettingsSource, geminiSettingsDest);
            console.log('  ✓ 已复制 Gemini settings.json');
          }
  
          // 复制 GEMINI.md
          const geminiMdSource = path.join(packageRoot, 'templates', 'GEMINI.md');
          const geminiMdDest = path.join(projectPath, '.gemini', 'GEMINI.md');
          if (await fs.pathExists(geminiMdSource)) {
            await fs.copy(geminiMdSource, geminiMdDest);
            console.log('  ✓ 已复制 GEMINI.md');
          }
        }
  
        // 为 GitHub Copilot 复制 VS Code settings
        if (targetPlatforms.some(platform => platform.name === 'copilot')) {
          const vscodeSettingsSource = path.join(packageRoot, 'templates', 'vscode-settings.json');
          const vscodeSettingsDest = path.join(projectPath, '.vscode', 'settings.json');
          if (await fs.pathExists(vscodeSettingsSource)) {
            await fs.copy(vscodeSettingsSource, vscodeSettingsDest);
            console.log('  ✓ 已复制 GitHub Copilot settings.json');
          }
        }
  
        // 如果指定了 --with-experts，复制专家文件和 expert 命令
        if (options.withExperts) {
          spinner.text = '安装专家模式...';
  
          // 复制专家目录
          const expertsSourceDir = path.join(packageRoot, 'experts');
          if (await fs.pathExists(expertsSourceDir)) {
            const userExpertsDir = path.join(projectPath, 'experts');
            await fs.copy(expertsSourceDir, userExpertsDir);
          }
  
          // 复制 expert 命令到各个 AI 目录
          const expertCommandSource = path.join(packageRoot, 'templates', 'commands', 'expert.md');
          if (await fs.pathExists(expertCommandSource)) {
            const expertContent = await fs.readFile(expertCommandSource, 'utf-8');
  
            for (const aiDir of aiDirs) {
              if (aiDir.includes('claude') || aiDir.includes('cursor')) {
                const expertPath = path.join(projectPath, aiDir, 'expert.md');
                await fs.writeFile(expertPath, expertContent);
              }
              // Windsurf 使用 workflows 目录
              if (aiDir.includes('windsurf')) {
                const expertPath = path.join(projectPath, aiDir, 'expert.md');
                await fs.writeFile(expertPath, expertContent);
              }
              // Roo Code 使用 Markdown 命令目录
              if (aiDir.includes('.roo')) {
                const expertPath = path.join(projectPath, aiDir, 'expert.md');
                await fs.writeFile(expertPath, expertContent);
              }
              // Gemini 格式处理
              if (aiDir.includes('gemini')) {
                const expertPath = path.join(projectPath, aiDir, 'expert.toml');
                const expertToml = generateTomlCommand(expertContent, '');
                await fs.writeFile(expertPath, expertToml);
              }
            }
          }
        }
  
        // 如果指定了 --plugins，安装插件
        if (options.plugins) {
          spinner.text = '安装插件...';
  
          const pluginNames = options.plugins.split(',').map((p: string) => p.trim());
          const pluginManager = new PluginManager(projectPath);
  
          for (const pluginName of pluginNames) {
            // 检查内置插件
            const builtinPluginPath = path.join(packageRoot, 'plugins', pluginName);
            if (await fs.pathExists(builtinPluginPath)) {
              await pluginManager.installPlugin(pluginName, builtinPluginPath);
            } else {
              console.log(chalk.yellow(`\n警告: 插件 "${pluginName}" 未找到`));
            }
          }
        }
  
        // Git 初始化
        if (options.git !== false) {
          try {
            execSync('git init', { cwd: projectPath, stdio: 'ignore' });
  
            // 创建 .gitignore
            const gitignore = `# 临时文件
  *.tmp
  *.swp
  .DS_Store
  
  # 编辑器配置
  .vscode/
  .idea/
  
  # AI 缓存
  .ai-cache/
  
  # 节点模块
  node_modules/
  `;
            await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);
  
            execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
            execSync('git commit -m "初始化小说项目"', { cwd: projectPath, stdio: 'ignore' });
          } catch {
            console.log(chalk.yellow('\n提示: Git 初始化失败，但项目已创建成功'));
          }
        }
  
        spinner.succeed(chalk.green(`小说项目 "${name}" 创建成功！`));
  
        // 显示后续步骤
        console.log('\n' + chalk.cyan('接下来:'));
        console.log(chalk.gray('─────────────────────────────'));
  
        if (!options.here) {
          console.log(`  1. ${chalk.white(`cd ${name}`)} - 进入项目目录`);
        }
  
        if (options.all) {
          console.log(`  2. ${chalk.white(`在任意 AI 助手中打开项目（${formatDisplayNames(AI_PLATFORMS)}）`)}`);
        } else {
          console.log(`  2. ${chalk.white(`在 ${selectedPlatform?.displayName ?? 'AI 助手'} 中打开项目`)}`);
        }
        console.log(`  3. 使用以下斜杠命令开始创作:`);
  
        const formatCommand = (commandName: string): string => {
          return formatAICommand(selectedPlatform, commandName, !!options.all);
        };
  
        console.log('\n' + chalk.yellow('     📝 七步方法论:'));
        console.log(`     ${chalk.cyan(formatCommand('constitution'))} - 创建创作宪法，定义核心原则`);
        console.log(`     ${chalk.cyan(formatCommand('specify'))}      - 定义故事规格，明确要创造什么`);
        console.log(`     ${chalk.cyan(formatCommand('clarify'))}      - 澄清关键决策点，明确模糊之处`);
        console.log(`     ${chalk.cyan(formatCommand('plan'))}         - 制定技术方案，决定如何创作`);
        console.log(`     ${chalk.cyan(formatCommand('tasks'))}        - 分解执行任务，生成可执行清单`);
        console.log(`     ${chalk.cyan(formatCommand('write'))}        - AI 辅助写作章节内容`);
        console.log(`     ${chalk.cyan(formatCommand('analyze'))}      - 综合验证分析，确保质量一致`);
  
        console.log('\n' + chalk.yellow('     📊 追踪管理命令:'));
        console.log(`     ${chalk.cyan(formatCommand('plot-check'))}  - 检查情节一致性`);
        console.log(`     ${chalk.cyan(formatCommand('timeline'))}    - 管理故事时间线`);
        console.log(`     ${chalk.cyan(formatCommand('relations'))}   - 追踪角色关系`);
        console.log(`     ${chalk.cyan(formatCommand('world-check'))} - 验证世界观设定`);
        console.log(`     ${chalk.cyan(formatCommand('track'))}       - 综合追踪与智能分析`);
  
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
  
        console.log('\n' + chalk.gray('推荐流程: constitution → specify → clarify → plan → tasks → write → analyze'));
        console.log(chalk.dim('提示: 斜杠命令在 AI 助手内部使用，不是在终端中'));
  
      } catch (error) {
        spinner.fail(chalk.red('项目初始化失败'));
        console.error(error);
        process.exit(1);
      }
    });
}
