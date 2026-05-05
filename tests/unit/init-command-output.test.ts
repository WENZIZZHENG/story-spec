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
      projectPath: 'D:\\workspace\\星尘驿站',
      targetAgents: [codexAgent],
      here: false,
      all: false,
      allAgents: false,
      selectedAgentDisplayName: 'Codex',
      compatibilityHint: undefined
    });

    expect(output).toContain('工作区已就绪: D:\\workspace\\星尘驿站');
    expect(output.indexOf('工作区已就绪')).toBeLessThan(output.indexOf('素材分流入口:'));
    expect(output.indexOf('素材分流入口:')).toBeLessThan(output.indexOf('storyspec story:new 故事名'));
    expect(output).toContain('接下来:');
    expect(output.indexOf('cd 星尘驿站')).toBeLessThan(output.indexOf('storyspec story:new 故事名'));
    expect(output).toContain('storyspec next 故事名');
    expect(output).toContain('storyspec preview specify 故事名');
    expect(output).toContain('storyspec init --help');
    expect(output).toContain('先看素材分流');
    expect(output).not.toContain('storyspec interview 故事名 --focus protagonist --premise "一句话创意"');
    expect(output).not.toContain('后续 agent 斜杠命令');
  });

  it('uses the full path in cd guidance for explicit workspaces', () => {
    const output = renderInitSuccessNextSteps({
      projectName: '星尘驿站',
      projectPath: 'D:\\workspace\\创作 工作区\\星尘驿站',
      targetAgents: [codexAgent],
      here: false,
      all: false,
      allAgents: false,
      selectedAgentDisplayName: 'Codex',
      usesExplicitWorkspace: true
    });

    expect(output).toContain('cd D:\\workspace\\创作 工作区\\星尘驿站');
    expect(output).not.toContain('cd 星尘驿站 - 进入项目目录');
  });
});
