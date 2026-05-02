import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
  listAgentIntegrations,
  renderAgentIntegrationList
} from '../../application/list-agent-integrations.js';
import {
  doctorAgentIntegrations,
  renderAgentDoctorResult
} from '../../application/doctor-agent-integrations.js';
import {
  upgradeProject,
  UpgradeProjectError
} from '../../application/upgrade-project.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { AGENT_INTEGRATION_OPTIONS } from '../../agent/registry.js';
import { ensureProjectRoot } from '../../utils/project.js';

export interface RegisterAgentCommandOptions {
  packageRoot: string;
}

export const registerAgentCommand = (
  program: Command,
  options: RegisterAgentCommandOptions
): void => {
  program
    .command('agent:list')
    .description('列出支持的 agent integrations')
    .option('--json', '输出 JSON，便于自动化读取')
    .action((options) => {
      const result = listAgentIntegrations();

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(renderAgentIntegrationList(result));
    });

  program
    .command('agent:add <id>')
    .description('给当前项目添加 agent integration')
    .option('--dry-run', '预览将写入的文件，不实际修改')
    .option('--no-backup', '跳过备份')
    .action(async (id, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await upgradeProject({
          projectPath: projectRoot,
          packageRoot: options.packageRoot,
          agent: id,
          updateContent: {
            commands: true,
            scripts: false,
            templates: false,
            memory: false,
            spec: false,
            experts: false
          },
          fileSystem: nodeFileSystem,
          dryRun: commandOptions.dryRun,
          backup: commandOptions.backup
        });

        console.log(chalk.cyan('\nAgent integration 安装'));
        console.log(chalk.gray(`项目：${projectRoot}`));
        console.log(chalk.gray(`目标：${result.targetDisplayNames.join(', ')}`));
        if (result.dryRun) {
          console.log(chalk.yellow('预览模式：不会写入任何文件'));
        }
        console.log(chalk.green(`命令文件：${result.stats.commands} 个`));
        console.log('');
      } catch (error) {
        if (error instanceof UpgradeProjectError) {
          console.log(chalk.red(`\n添加 agent integration 失败：${error.message}`));
          if (error.code === 'AGENT_NOT_FOUND') {
            console.log(chalk.gray(`可选值：${AGENT_INTEGRATION_OPTIONS}`));
          }
          process.exit(1);
        }

        if (error instanceof Error && error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 novel-writer 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 novel init 创建新项目\n'));
          process.exit(1);
        }

        console.error(chalk.red('\n添加 agent integration 失败'), error);
        process.exit(1);
      }
    });

  program
    .command('agent:doctor')
    .description('检查当前项目的 agent integrations')
    .option('--json', '输出 JSON，便于自动化读取')
    .action(async (commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await doctorAgentIntegrations({
          projectRoot,
          packageRoot: options.packageRoot,
          fileSystem: nodeFileSystem
        });

        if (commandOptions.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(renderAgentDoctorResult(result));
        }

        if (!result.valid) {
          process.exitCode = 1;
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'NOT_IN_PROJECT') {
          console.log(chalk.red('\n当前目录不是 novel-writer 项目'));
          console.log(chalk.gray('请在项目根目录运行此命令，或使用 novel init 创建新项目\n'));
          process.exit(1);
        }

        console.error(chalk.red('\n检查 agent integrations 失败'), error);
        process.exit(1);
      }
    });
};
