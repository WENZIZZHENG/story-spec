import { Command } from '@commander-js/extra-typings';
import { registerInitCommand } from './commands/init.command.js';
import { registerCheckStatusCommand } from './commands/check-status.command.js';
import { registerInfoCommand } from './commands/info.command.js';
import { registerPluginsCommand } from './commands/plugins.command.js';
import { registerUpgradeCommand } from './commands/upgrade.command.js';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { getVersion, getVersionInfo } from '../version.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..', '..');

// 显示欢迎横幅
function displayBanner(): void {
  const banner = `
╔═══════════════════════════════════════╗
║     📚  Novel Writer  📝              ║
║     AI 驱动的中文小说创作工具        ║
╚═══════════════════════════════════════╝
`;
  console.log(chalk.cyan(banner));
  console.log(chalk.gray(`  ${getVersionInfo()}\n`));
}

export function runProgram(argv: string[]): void {
  const program = new Command();

  if (!argv.includes('--json')) {
    displayBanner();
  }

  program
    .name('novel')
    .description(chalk.cyan('Novel Writer - AI 驱动的中文小说创作工具初始化'))
    .version(getVersion(), '-v, --version', '显示版本号')
    .helpOption('-h, --help', '显示帮助信息');

  registerInitCommand(program, { packageRoot });
  registerCheckStatusCommand(program);
  registerPluginsCommand(program, { packageRoot });
  registerUpgradeCommand(program, { packageRoot });
  registerInfoCommand(program);

  program.on('--help', () => {
    console.log('');
    console.log(chalk.yellow('使用示例:'));
    console.log('');
    console.log('  $ novel init my-story           # 创建新项目');
    console.log('  $ novel init --here              # 在当前目录初始化');
    console.log('  $ novel check                    # 检查环境');
    console.log('  $ novel codex-status             # 查看 Codex 接手状态');
    console.log('  $ novel info                     # 查看写作方法');
    console.log('');
    console.log(chalk.cyan('核心创作命令:'));
    console.log('  /method      - 智能选择写作方法（推荐先执行）');
    console.log('  /style       - 设定创作风格和准则');
    console.log('  /story       - 创建故事大纲（使用选定方法）');
    console.log('  /outline     - 规划章节结构（基于方法模板）');
    console.log('  /track-init  - 初始化追踪系统');
    console.log('  /write       - AI 辅助章节创作（自动更新追踪）');
    console.log('');
    console.log(chalk.cyan('追踪管理命令:'));
    console.log('  /plot-check  - 智能检查情节发展一致性');
    console.log('  /timeline    - 管理和验证时间线');
    console.log('  /relations   - 追踪角色关系变化');
    console.log('  /track       - 综合追踪与智能分析');
    console.log('');
    console.log(chalk.gray('更多信息: https://github.com/wordflowlab/novel-writer'));
  });

  // 解析命令行参数
  program.parse(argv);

  // 如果没有提供任何命令，显示帮助信息
  if (!argv.slice(2).length) {
    program.outputHelp();
  }
}
