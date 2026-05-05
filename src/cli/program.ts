import { Command } from '@commander-js/extra-typings';
import { registerAgentCommand } from './commands/agent.command.js';
import { registerInitCommand } from './commands/init.command.js';
import { registerCheckStatusCommand } from './commands/check-status.command.js';
import { registerContractCommand } from './commands/contract.command.js';
import { registerHandoffCommand } from './commands/handoff.command.js';
import { registerInfoCommand } from './commands/info.command.js';
import { registerInterviewCommand } from './commands/interview.command.js';
import { registerPluginsCommand } from './commands/plugins.command.js';
import { registerTasksBoardCommand } from './commands/tasks-board.command.js';
import { registerUpgradeCommand } from './commands/upgrade.command.js';
import { registerValidateCommand } from './commands/validate.command.js';
import { registerWorldbuildingCommand } from './commands/worldbuilding.command.js';
import { registerStoryStructureCommand } from './commands/story-structure.command.js';
import { registerVoiceCommand } from './commands/voice.command.js';
import { registerReviewCommand } from './commands/review.command.js';
import { registerPresetCommand } from './commands/preset.command.js';
import { registerWorkbenchCommand } from './commands/workbench.command.js';
import { registerStoryOnboardingCommand } from './commands/story-onboarding.command.js';
import { registerCoreCommand } from './commands/core.command.js';
import { registerIngestCommand } from './commands/ingest.command.js';
import { registerCoCreateCommand } from './commands/co-create.command.js';
import { registerCreativeReportCommand } from './commands/creative-report.command.js';
import { registerPreviewApplyCommand } from './commands/preview-apply.command.js';
import { registerAuthorProfileCommand } from './commands/author-profile.command.js';
import { registerMaintenanceCommand } from './commands/maintenance.command.js';
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
║     📚  StorySpec  📝              ║
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
    .name('storyspec')
    .description(chalk.cyan('StorySpec - AI 驱动的中文小说创作工具初始化'))
    .version(getVersion(), '-v, --version', '显示版本号')
    .helpOption('-h, --help', '显示帮助信息');

  registerInitCommand(program, { packageRoot });
  registerAgentCommand(program, { packageRoot });
  registerContractCommand(program, { packageRoot });
  registerInterviewCommand(program);
  registerCheckStatusCommand(program);
  registerHandoffCommand(program);
  registerTasksBoardCommand(program);
  registerPluginsCommand(program, { packageRoot });
  registerUpgradeCommand(program, { packageRoot });
  registerValidateCommand(program, { packageRoot });
  registerWorldbuildingCommand(program);
  registerStoryStructureCommand(program, { packageRoot });
  registerVoiceCommand(program);
  registerReviewCommand(program, { packageRoot });
  registerPresetCommand(program, { packageRoot });
  registerWorkbenchCommand(program);
  registerAuthorProfileCommand(program);
  registerStoryOnboardingCommand(program);
  registerCoreCommand(program);
  registerIngestCommand(program);
  registerCoCreateCommand(program);
  registerCreativeReportCommand(program);
  registerPreviewApplyCommand(program);
  registerMaintenanceCommand(program);
  registerInfoCommand(program);

  program.on('--help', () => {
    console.log('');
    console.log(chalk.yellow('使用示例:'));
    console.log('');
    console.log('  $ storyspec init D:/project/小说/我的故事 --agent codex');
    console.log('  $ storyspec story:new 法术编译纪元 --idea "异界穿越、编程施法"');
    console.log('  $ storyspec next 法术编译纪元');
    console.log('  $ storyspec interview 法术编译纪元 --focus protagonist --premise "异界穿越、编程施法"');
    console.log('  $ storyspec core 法术编译纪元 --missing');
    console.log('  $ storyspec ingest 法术编译纪元 --file notes.md');
    console.log('  $ storyspec co:create 法术编译纪元 --file notes.md --apply-confirmed --preview specify');
    console.log('  $ storyspec creative:report 法术编译纪元');
    console.log('  $ storyspec preview specify 法术编译纪元');
    console.log('  $ storyspec apply <preview-id> --yes');
    console.log('');
    console.log(chalk.cyan('首次创作主路径:'));
    console.log('  story:new         保存一句灵感');
    console.log('  next              选择长文 / 灵感 / 表格 / 随便聊聊');
    console.log('  interview         逐步补齐故事要素，区分确认和候选');
    console.log('  ingest            吸收长文资料，先预览再确认');
    console.log('  creative:report   看故事骨架、缺口和下一步');
    console.log('  preview/apply     先预览 specification 或 plan，再决定写入');
    console.log('');
    console.log(chalk.cyan('Agent 内部命令:'));
    console.log('  /storyspec-plan   基于已确认 specification 规划章节结构');
    console.log('  /storyspec-tasks  拆成可执行写作任务');
    console.log('  /storyspec-write  在任务和 Scene Card 明确后写正文');
    console.log('');
    console.log(chalk.gray('更多信息: https://github.com/WENZIZZHENG/story-spec'));
  });

  // 解析命令行参数
  program.parse(argv);

  // 如果没有提供任何命令，显示帮助信息
  if (!argv.slice(2).length) {
    program.outputHelp();
  }
}
