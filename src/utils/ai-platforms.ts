import {
  formatAgentCommand,
  getAgentIntegration,
  LEGACY_AI_INTEGRATIONS,
  LEGACY_AI_INTEGRATION_IDS,
  type AgentSlashPrefix,
  type LegacyAIIntegration,
  type LegacyAIIntegrationId
} from '../agent/registry.js';

export const AI_PLATFORM_IDS = LEGACY_AI_INTEGRATION_IDS;

export type AIPlatformId = LegacyAIIntegrationId;

export interface AIPlatformConfig {
  name: AIPlatformId;
  dir: string;
  commandsDir: string;
  displayName: string;
  distDir: string;
  commandPrefix: AgentSlashPrefix;
  initDirs?: string[];
  extraDirs?: string[];
}

const toAIPlatformConfig = (integration: LegacyAIIntegration): AIPlatformConfig => {
  const target = integration.installTargets[0];

  return {
    name: integration.legacyAiId,
    dir: target.dir,
    commandsDir: target.commandsDir,
    displayName: integration.displayName,
    distDir: target.distDir,
    commandPrefix: integration.slashPrefix,
    initDirs: target.initDirs,
    extraDirs: target.extraDirs
  };
};

export const AI_PLATFORMS: readonly AIPlatformConfig[] = LEGACY_AI_INTEGRATIONS
  .map(toAIPlatformConfig);

export const AI_PLATFORM_OPTIONS = AI_PLATFORM_IDS.join(' | ');

export function getAIPlatform(id: string | undefined): AIPlatformConfig | undefined {
  return AI_PLATFORMS.find(platform => platform.name === id);
}

export function getTargetAIPlatforms(all: boolean, selected: string): AIPlatformConfig[] {
  if (all) {
    return [...AI_PLATFORMS];
  }

  const platform = getAIPlatform(selected);
  return platform ? [platform] : [];
}

export function getAIInitDirs(platforms: readonly AIPlatformConfig[]): string[] {
  const dirs = new Set<string>();

  for (const platform of platforms) {
    const platformDirs = platform.initDirs ?? [`${platform.dir}/${platform.commandsDir}`, ...platform.extraDirs ?? []];
    for (const dir of platformDirs) {
      dirs.add(dir);
    }
  }

  return [...dirs];
}

export function formatAICommand(platform: AIPlatformConfig | undefined, commandName: string, useGeneric = false): string {
  if (!platform) {
    return `/${commandName}`;
  }

  const integration = getAgentIntegration(platform.name);
  if (integration) {
    return formatAgentCommand(integration, commandName, useGeneric);
  }

  if (useGeneric) {
    return `/${commandName}`;
  }

  return `${platform.commandPrefix}${commandName}`;
}

export function formatDisplayNames(platforms: readonly AIPlatformConfig[]): string {
  return platforms.map(platform => platform.displayName).join('、');
}
