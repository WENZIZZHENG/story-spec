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
      projectPath: 'D:/project/小说/星尘驿站',
      targetAgents: [codexAgent],
      here: false,
      all: false,
      allAgents: false,
      selectedAgentDisplayName: 'Codex',
      compatibilityHint: undefined
    });

    expect(output).toContain('接下来:');
    expect(output).toContain('工作区已就绪：D:/project/小说/星尘驿站');
    expect(output).not.toContain('cd 星尘驿站');
    expect(output).toContain('storyspec next 故事名');
    expect(output).toContain('storyspec preview specify 故事名');
    expect(output).toContain('storyspec init --help');
    expect(output).toContain('先看素材分流');
    expect(output).not.toContain('storyspec interview 故事名 --focus protagonist --premise "一句话创意"');
    expect(output).not.toContain('后续 agent 斜杠命令');
  });
});
