import type { Command } from '@commander-js/extra-typings';
import {
  loadAgentContract
} from '../../agent/contract.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { findProjectRoot } from '../../utils/project.js';

export interface RegisterContractCommandOptions {
  packageRoot: string;
}

export const registerContractCommand = (
  program: Command,
  options: RegisterContractCommandOptions
): void => {
  program
    .command('contract:print')
    .description('输出当前 agent contract')
    .option('--project-name <name>', '未在项目内运行时使用的项目名')
    .option('--profile <profiles>', '逗号分隔的 agent profile')
    .action(async (commandOptions) => {
      const projectRoot = await findProjectRoot();
      const result = await loadAgentContract({
        packageRoot: options.packageRoot,
        projectRoot: projectRoot ?? undefined,
        projectName: commandOptions.projectName,
        agentsProfile: commandOptions.profile,
        fileSystem: nodeFileSystem
      });

      console.log(result.content);
    });
};
