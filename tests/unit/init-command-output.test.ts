import { describe, expect, it } from 'vitest';
import { renderInitSuccessNextSteps } from '../../src/cli/commands/init.command.js';
import type { AgentIntegration } from '../../src/agent/registry.js';

const codexAgent = {
  id: 'codex',
  displayName: 'Codex',
  commandSurface: 'slash-command',
  slashPrefix: 'storyspec-'
} as AgentIntegration;

describe('init command output', () => {
  it('renders a short post-success path before optional details', () => {
    const output = renderInitSuccessNextSteps({
      projectName: '星尘驿站',
      targetAgents: [codexAgent],
      here: false,
      all: false,
      allAgents: false,
      selectedAgentDisplayName: 'Codex',
      compatibilityHint: undefined
    });

    expect(output).toContain('接下来:');
    expect(output.indexOf('cd 星尘驿站')).toBeLessThan(output.indexOf('storyspec story:new 故事名'));
    expect(output).toContain('storyspec next 故事名');
    expect(output).toContain('storyspec preview specify 故事名');
    expect(output).toContain('storyspec init --help');
    expect(output).not.toContain('storyspec interview 故事名 --focus protagonist --premise "一句话创意"');
    expect(output).not.toContain('后续 agent 斜杠命令');
  });
});
