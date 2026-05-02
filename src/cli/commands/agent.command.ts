import type { Command } from '@commander-js/extra-typings';
import {
  listAgentIntegrations,
  renderAgentIntegrationList
} from '../../application/list-agent-integrations.js';

export const registerAgentCommand = (program: Command): void => {
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
};
