import { describe, expect, it } from 'vitest';
import {
  listAgentIntegrations,
  renderAgentIntegrationList
} from '../../src/application/list-agent-integrations.js';
import { AGENT_INTEGRATION_IDS } from '../../src/agent/registry.js';

describe('listAgentIntegrations', () => {
  it('serializes every registered agent integration for automation', () => {
    const result = listAgentIntegrations();

    expect(result.count).toBe(AGENT_INTEGRATION_IDS.length);
    expect(result.integrations.map(integration => integration.id)).toEqual([...AGENT_INTEGRATION_IDS]);
    expect(result.integrations[0]).toMatchObject({
      id: 'generic',
      commandSurface: 'markdown-command',
      renderer: 'generic-markdown',
      capabilities: expect.objectContaining({
        readFiles: true,
        writeFiles: true,
        runShell: false,
        supportsSlashCommands: false
      }),
      installTargets: [{
        dir: '.specify',
        commandsDir: 'commands',
        distDir: 'dist/generic'
      }]
    });
  });

  it('renders a readable agent list for humans', () => {
    const output = renderAgentIntegrationList(listAgentIntegrations());

    expect(output).toContain('Agent integrations');
    expect(output).toContain('generic - Generic Markdown Agent');
    expect(output).toContain('codex - Codex CLI');
    expect(output).toContain('安装目标: .codex/prompts');
    expect(output).toContain('能力: read, write, shell, slash, instructions');
  });
});
