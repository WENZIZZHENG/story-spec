import { describe, expect, it } from 'vitest';
import {
  AGENT_INTEGRATION_IDS,
  AGENT_INTEGRATIONS,
  formatAgentCommand,
  formatAgentDisplayNames,
  getAgentInitDirs,
  getAgentIntegration,
  getTargetAgentIntegrations,
  LEGACY_AI_INTEGRATIONS,
  LEGACY_AI_INTEGRATION_IDS
} from '../../src/agent/registry.js';
import { AI_PLATFORM_IDS, AI_PLATFORMS } from '../../src/utils/ai-platforms.js';

describe('agent integration registry', () => {
  it('keeps agent IDs and configs in the same order', () => {
    expect(AGENT_INTEGRATIONS.map(integration => integration.id)).toEqual([...AGENT_INTEGRATION_IDS]);
    expect(new Set(AGENT_INTEGRATION_IDS).size).toBe(AGENT_INTEGRATION_IDS.length);
  });

  it('adds generic as an agent integration without changing legacy AI IDs', () => {
    expect(getAgentIntegration('generic')).toMatchObject({
      id: 'generic',
      displayName: 'Generic Markdown Agent',
      commandSurface: 'markdown-command',
      renderer: 'generic-markdown',
      capabilities: expect.objectContaining({
        readFiles: true,
        writeFiles: true,
        runShell: false,
        supportsSlashCommands: false,
        requiresHumanApproval: true
      })
    });

    expect([...AI_PLATFORM_IDS]).toEqual([...LEGACY_AI_INTEGRATION_IDS]);
    expect(AI_PLATFORMS.map(platform => platform.name)).not.toContain('generic');
  });

  it('registers continue-check as a read-only agent integration', () => {
    expect(getAgentIntegration('continue-check')).toMatchObject({
      id: 'continue-check',
      displayName: 'Continue Check',
      commandSurface: 'markdown-command',
      renderer: 'continue-check',
      capabilities: expect.objectContaining({
        readFiles: true,
        writeFiles: false,
        runShell: false,
        supportsSlashCommands: true,
        requiresHumanApproval: true
      }),
      installTargets: [{
        dir: '.continue',
        commandsDir: 'prompts',
        distDir: 'dist/continue-check',
        extraDirs: ['.continue/rules']
      }]
    });

    expect(AI_PLATFORMS.map(platform => platform.name)).not.toContain('continue-check');
  });

  it('maps legacy AI integrations to the old platform registry shape', () => {
    expect(LEGACY_AI_INTEGRATIONS.map(integration => integration.id)).toEqual([...AI_PLATFORM_IDS]);
    expect(AI_PLATFORMS.map(platform => ({
      name: platform.name,
      dir: platform.dir,
      commandsDir: platform.commandsDir,
      displayName: platform.displayName,
      distDir: platform.distDir,
      commandPrefix: platform.commandPrefix
    }))).toEqual(LEGACY_AI_INTEGRATIONS.map(integration => {
      const target = integration.installTargets[0];

      return {
        name: integration.legacyAiId,
        dir: target.dir,
        commandsDir: target.commandsDir,
        displayName: integration.displayName,
        distDir: target.distDir,
        commandPrefix: integration.slashPrefix
      };
    }));
  });

  it('resolves target integrations and initialization directories', () => {
    expect(getTargetAgentIntegrations(false, 'generic').map(integration => integration.id)).toEqual(['generic']);
    expect(getTargetAgentIntegrations(false, 'missing')).toEqual([]);
    expect(getTargetAgentIntegrations(true, 'codex').map(integration => integration.id)).toEqual([...AGENT_INTEGRATION_IDS]);

    expect(getAgentInitDirs([
      getAgentIntegration('generic')!,
      getAgentIntegration('copilot')!,
      getAgentIntegration('codex')!
    ])).toEqual([
      '.specify/commands',
      '.github/prompts',
      '.vscode',
      '.codex/prompts'
    ]);
  });

  it('formats commands and display names from agent integrations', () => {
    expect(formatAgentCommand(getAgentIntegration('codex'), 'write')).toBe('/storyspec-write');
    expect(formatAgentCommand(getAgentIntegration('claude'), 'write')).toBe('/storyspec.write');
    expect(formatAgentCommand(getAgentIntegration('generic'), 'write')).toBe('/write');
    expect(formatAgentCommand(getAgentIntegration('codex'), 'write', true)).toBe('/write');

    expect(formatAgentDisplayNames([
      getAgentIntegration('generic')!,
      getAgentIntegration('codex')!,
      getAgentIntegration('q')!
    ])).toBe('Generic Markdown Agent、Codex CLI、Amazon Q Developer');
  });
});
