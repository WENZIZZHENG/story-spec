import {
  AGENT_INTEGRATIONS,
  type AgentIntegration,
  type AgentInstallTarget
} from '../agent/registry.js';
import type { AgentCapabilities } from '../agent/capabilities.js';

export interface ListedAgentIntegration {
  id: string;
  displayName: string;
  kind: string;
  commandSurface: string;
  renderer: string;
  capabilities: AgentCapabilities;
  installTargets: AgentInstallTarget[];
  slashPrefix?: string;
  legacyAiId?: string;
}

export interface ListAgentIntegrationsResult {
  count: number;
  integrations: ListedAgentIntegration[];
}

const cloneInstallTargets = (
  installTargets: AgentIntegration['installTargets']
): AgentInstallTarget[] => installTargets.map(target => ({
  ...target,
  initDirs: target.initDirs ? [...target.initDirs] : undefined,
  extraDirs: target.extraDirs ? [...target.extraDirs] : undefined
}));

const toListedAgentIntegration = (
  integration: AgentIntegration
): ListedAgentIntegration => ({
  id: integration.id,
  displayName: integration.displayName,
  kind: integration.kind,
  commandSurface: integration.commandSurface,
  renderer: integration.renderer,
  capabilities: { ...integration.capabilities },
  installTargets: cloneInstallTargets(integration.installTargets),
  slashPrefix: integration.slashPrefix,
  legacyAiId: integration.legacyAiId
});

export const listAgentIntegrations = (): ListAgentIntegrationsResult => {
  const integrations = AGENT_INTEGRATIONS.map(toListedAgentIntegration);

  return {
    count: integrations.length,
    integrations
  };
};

const formatInstallTargets = (targets: readonly AgentInstallTarget[]): string =>
  targets.map(target => `${target.dir}/${target.commandsDir}`).join(', ');

const formatCapabilities = (capabilities: AgentCapabilities): string => {
  const labels = [
    capabilities.readFiles ? 'read' : '',
    capabilities.writeFiles ? 'write' : '',
    capabilities.runShell ? 'shell' : '',
    capabilities.supportsSlashCommands ? 'slash' : '',
    capabilities.supportsSkills ? 'skills' : '',
    capabilities.supportsProjectInstructions ? 'instructions' : '',
    capabilities.supportsMcp ? 'mcp' : '',
    capabilities.supportsBrowser ? 'browser' : '',
    capabilities.supportsCheckpoints ? 'checkpoints' : '',
    capabilities.requiresHumanApproval ? 'approval' : ''
  ].filter(Boolean);

  return labels.join(', ') || 'none';
};

export const renderAgentIntegrationList = (
  result: ListAgentIntegrationsResult
): string => {
  const lines = [
    'Agent integrations',
    `总数: ${result.count}`,
    ''
  ];

  for (const integration of result.integrations) {
    lines.push(`${integration.id} - ${integration.displayName}`);
    lines.push(`  类型: ${integration.kind}`);
    lines.push(`  命令界面: ${integration.commandSurface}`);
    lines.push(`  renderer: ${integration.renderer}`);
    lines.push(`  安装目标: ${formatInstallTargets(integration.installTargets)}`);
    lines.push(`  能力: ${formatCapabilities(integration.capabilities)}`);
    if (integration.slashPrefix) {
      lines.push(`  slash 前缀: ${integration.slashPrefix}`);
    }
    if (integration.legacyAiId) {
      lines.push(`  旧 AI ID: ${integration.legacyAiId}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
};
