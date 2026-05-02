import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { getProjectStatus, renderProjectStatus } from '../../application/get-project-status.js';
import { commandGitAdapter } from '../../infrastructure/command-git-adapter.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

export function registerCheckStatusCommand(program: Command): void {
  // check 命令 - 检查环境
  program
    .command('check')
    .description('检查系统环境和 AI 工具')
    .action(() => {
      console.log(chalk.cyan('检查系统环境...\n'));

      const checks = [
        { name: 'Node.js', command: 'node --version', installed: false },
        { name: 'Git', command: 'git --version', installed: false },
        { name: 'Claude CLI', command: 'claude --version', installed: false },
        { name: 'Cursor', command: 'cursor --version', installed: false },
        { name: 'Gemini CLI', command: 'gemini --version', installed: false },
        { name: 'Codex CLI', command: 'codex --version', installed: false }
      ];

      checks.forEach(check => {
        try {
          execSync(check.command, { stdio: 'ignore' });
          check.installed = true;
          console.log(chalk.green('✓') + ` ${check.name} 已安装`);
        } catch {
          console.log(chalk.yellow('⚠') + ` ${check.name} 未安装`);
        }
      });

      const hasAI = checks.slice(2).some(c => c.installed);
      if (!hasAI) {
        console.log('\n' + chalk.yellow('警告: 未检测到 AI 助手工具'));
        console.log('请安装以下任一工具:');
        console.log('  • Claude: https://claude.ai');
        console.log('  • Cursor: https://cursor.sh');
        console.log('  • Gemini: https://gemini.google.com');
        console.log('  • Codex CLI: https://developers.openai.com/codex');
        console.log('  • Roo Code: https://roocode.com');
      } else {
        console.log('\n' + chalk.green('环境检查通过！'));
      }
    });

  // codex-status 命令 - 输出 Codex 接手项目时最需要的状态摘要
  program
    .command('codex-status')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('汇总 Codex 可接手的小说项目状态')
    .action(async (options) => {
      try {
        const projectPath = await ensureProjectRoot();
        const status = await getProjectStatus({
          projectRoot: projectPath,
          fileSystem: nodeFileSystem,
          git: commandGitAdapter
        });

        if (options.json) {
          console.log(JSON.stringify(status, null, 2));
        } else {
          console.log(renderProjectStatus(status));
        }
      } catch (error: any) {
        if (error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n❌ 当前目录不是 novel-writer 项目'));
          console.log(chalk.gray('   请在项目根目录运行此命令，或使用 novel init 创建新项目\n'));
          process.exit(1);
        }

        console.error(chalk.red('❌ 读取 Codex 状态失败:'), error);
        process.exit(1);
      }
    });
}
