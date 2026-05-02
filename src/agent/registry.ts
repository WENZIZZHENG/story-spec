import {
  createAgentCapabilities,
  type AgentCapabilities
} from './capabilities.js';

export const AGENT_INTEGRATION_IDS = [
  'generic',
  'continue-check',
  'claude',
  'cursor',
  'gemini',
  'windsurf',
  'roocode',
  'copilot',
  'qwen',
  'opencode',
  'codex',
  'kilocode',
  'auggie',
  'codebuddy',
  'q'
] as const;

export const LEGACY_AI_INTEGRATION_IDS = [
  'claude',
  'cursor',
  'gemini',
  'windsurf',
  'roocode',
  'copilot',
  'qwen',
  'opencode',
  'codex',
  'kilocode',
  'auggie',
  'codebuddy',
  'q'
] as const satisfies readonly AgentIntegrationId[];

export type AgentIntegrationId = typeof AGENT_INTEGRATION_IDS[number];
export type LegacyAIIntegrationId = typeof LEGACY_AI_INTEGRATION_IDS[number];
export type AgentIntegrationKind = 'cli' | 'ide' | 'web' | 'generic' | 'ci' | 'mcp';
export type AgentCommandSurface = 'slash-command' | 'skill' | 'markdown-command' | 'manual';
export type AgentSlashPrefix = '/' | '/novel.' | '/novel:' | '/novel-';
export type RendererId = AgentIntegrationId | 'generic-markdown';

export interface AgentInstallTarget {
  dir: string;
  commandsDir: string;
  distDir: string;
  initDirs?: string[];
  extraDirs?: string[];
}

export interface AgentIntegration {
  id: AgentIntegrationId;
  displayName: string;
  kind: AgentIntegrationKind;
  commandSurface: AgentCommandSurface;
  capabilities: AgentCapabilities;
  installTargets: readonly [AgentInstallTarget, ...AgentInstallTarget[]];
  renderer: RendererId;
  slashPrefix?: AgentSlashPrefix;
  legacyAiId?: LegacyAIIntegrationId;
}

export interface LegacyAIIntegration extends AgentIntegration {
  id: LegacyAIIntegrationId;
  legacyAiId: LegacyAIIntegrationId;
  slashPrefix: AgentSlashPrefix;
  renderer: LegacyAIIntegrationId;
}

const cliSlashCapabilities = () => createAgentCapabilities({
  readFiles: true,
  writeFiles: true,
  runShell: true,
  supportsSlashCommands: true,
  supportsProjectInstructions: true
});

const ideSlashCapabilities = () => createAgentCapabilities({
  readFiles: true,
  writeFiles: true,
  runShell: true,
  supportsSlashCommands: true,
  supportsProjectInstructions: true,
  supportsCheckpoints: true
});

const promptFileCapabilities = () => createAgentCapabilities({
  readFiles: true,
  writeFiles: true,
  runShell: false,
  supportsSlashCommands: false,
  supportsProjectInstructions: true
});

const genericMarkdownCapabilities = () => createAgentCapabilities({
  readFiles: true,
  writeFiles: true,
  runShell: false,
  supportsSlashCommands: false,
  supportsProjectInstructions: true,
  requiresHumanApproval: true
});

const readOnlyPromptCapabilities = () => createAgentCapabilities({
  readFiles: true,
  writeFiles: false,
  runShell: false,
  supportsSlashCommands: true,
  supportsProjectInstructions: true,
  requiresHumanApproval: true
});

export const AGENT_INTEGRATIONS = [
  {
    id: 'generic',
    displayName: 'Generic Markdown Agent',
    kind: 'generic',
    commandSurface: 'markdown-command',
    capabilities: genericMarkdownCapabilities(),
    installTargets: [{
      dir: '.specify',
      commandsDir: 'commands',
      distDir: 'dist/generic'
    }],
    renderer: 'generic-markdown'
  },
  {
    id: 'continue-check',
    displayName: 'Continue Check',
    kind: 'ide',
    commandSurface: 'markdown-command',
    capabilities: readOnlyPromptCapabilities(),
    installTargets: [{
      dir: '.continue',
      commandsDir: 'prompts',
      distDir: 'dist/continue-check'
    }],
    renderer: 'continue-check',
    slashPrefix: '/'
  },
  {
    id: 'claude',
    displayName: 'Claude Code',
    kind: 'cli',
    commandSurface: 'slash-command',
    capabilities: cliSlashCapabilities(),
    installTargets: [{
      dir: '.claude',
      commandsDir: 'commands',
      distDir: 'dist/claude'
    }],
    renderer: 'claude',
    slashPrefix: '/novel.',
    legacyAiId: 'claude'
  },
  {
    id: 'cursor',
    displayName: 'Cursor',
    kind: 'ide',
    commandSurface: 'slash-command',
    capabilities: ideSlashCapabilities(),
    installTargets: [{
      dir: '.cursor',
      commandsDir: 'commands',
      distDir: 'dist/cursor'
    }],
    renderer: 'cursor',
    slashPrefix: '/',
    legacyAiId: 'cursor'
  },
  {
    id: 'gemini',
    displayName: 'Gemini CLI',
    kind: 'cli',
    commandSurface: 'slash-command',
    capabilities: cliSlashCapabilities(),
    installTargets: [{
      dir: '.gemini',
      commandsDir: 'commands',
      distDir: 'dist/gemini'
    }],
    renderer: 'gemini',
    slashPrefix: '/novel:',
    legacyAiId: 'gemini'
  },
  {
    id: 'windsurf',
    displayName: 'Windsurf',
    kind: 'ide',
    commandSurface: 'slash-command',
    capabilities: ideSlashCapabilities(),
    installTargets: [{
      dir: '.windsurf',
      commandsDir: 'workflows',
      distDir: 'dist/windsurf'
    }],
    renderer: 'windsurf',
    slashPrefix: '/',
    legacyAiId: 'windsurf'
  },
  {
    id: 'roocode',
    displayName: 'Roo Code',
    kind: 'ide',
    commandSurface: 'slash-command',
    capabilities: ideSlashCapabilities(),
    installTargets: [{
      dir: '.roo',
      commandsDir: 'commands',
      distDir: 'dist/roocode'
    }],
    renderer: 'roocode',
    slashPrefix: '/',
    legacyAiId: 'roocode'
  },
  {
    id: 'copilot',
    displayName: 'GitHub Copilot',
    kind: 'ide',
    commandSurface: 'markdown-command',
    capabilities: promptFileCapabilities(),
    installTargets: [{
      dir: '.github',
      commandsDir: 'prompts',
      distDir: 'dist/copilot',
      extraDirs: ['.vscode']
    }],
    renderer: 'copilot',
    slashPrefix: '/',
    legacyAiId: 'copilot'
  },
  {
    id: 'qwen',
    displayName: 'Qwen Code',
    kind: 'cli',
    commandSurface: 'slash-command',
    capabilities: cliSlashCapabilities(),
    installTargets: [{
      dir: '.qwen',
      commandsDir: 'commands',
      distDir: 'dist/qwen'
    }],
    renderer: 'qwen',
    slashPrefix: '/',
    legacyAiId: 'qwen'
  },
  {
    id: 'opencode',
    displayName: 'OpenCode',
    kind: 'cli',
    commandSurface: 'slash-command',
    capabilities: cliSlashCapabilities(),
    installTargets: [{
      dir: '.opencode',
      commandsDir: 'command',
      distDir: 'dist/opencode'
    }],
    renderer: 'opencode',
    slashPrefix: '/',
    legacyAiId: 'opencode'
  },
  {
    id: 'codex',
    displayName: 'Codex CLI',
    kind: 'cli',
    commandSurface: 'slash-command',
    capabilities: cliSlashCapabilities(),
    installTargets: [{
      dir: '.codex',
      commandsDir: 'prompts',
      distDir: 'dist/codex'
    }],
    renderer: 'codex',
    slashPrefix: '/novel-',
    legacyAiId: 'codex'
  },
  {
    id: 'kilocode',
    displayName: 'Kilo Code',
    kind: 'ide',
    commandSurface: 'slash-command',
    capabilities: ideSlashCapabilities(),
    installTargets: [{
      dir: '.kilocode',
      commandsDir: 'workflows',
      distDir: 'dist/kilocode'
    }],
    renderer: 'kilocode',
    slashPrefix: '/',
    legacyAiId: 'kilocode'
  },
  {
    id: 'auggie',
    displayName: 'Auggie CLI',
    kind: 'cli',
    commandSurface: 'slash-command',
    capabilities: cliSlashCapabilities(),
    installTargets: [{
      dir: '.augment',
      commandsDir: 'commands',
      distDir: 'dist/auggie'
    }],
    renderer: 'auggie',
    slashPrefix: '/',
    legacyAiId: 'auggie'
  },
  {
    id: 'codebuddy',
    displayName: 'CodeBuddy',
    kind: 'ide',
    commandSurface: 'slash-command',
    capabilities: ideSlashCapabilities(),
    installTargets: [{
      dir: '.codebuddy',
      commandsDir: 'commands',
      distDir: 'dist/codebuddy'
    }],
    renderer: 'codebuddy',
    slashPrefix: '/',
    legacyAiId: 'codebuddy'
  },
  {
    id: 'q',
    displayName: 'Amazon Q Developer',
    kind: 'cli',
    commandSurface: 'markdown-command',
    capabilities: promptFileCapabilities(),
    installTargets: [{
      dir: '.amazonq',
      commandsDir: 'prompts',
      distDir: 'dist/q'
    }],
    renderer: 'q',
    slashPrefix: '/',
    legacyAiId: 'q'
  }
] as const satisfies readonly AgentIntegration[];

export const AGENT_INTEGRATION_OPTIONS = AGENT_INTEGRATION_IDS.join(' | ');

const findRequiredAgentIntegration = (id: AgentIntegrationId): AgentIntegration => {
  const integration = AGENT_INTEGRATIONS.find(candidate => candidate.id === id);
  if (!integration) {
    throw new Error(`Agent integration is not registered: ${id}`);
  }

  return integration;
};

export const LEGACY_AI_INTEGRATIONS = LEGACY_AI_INTEGRATION_IDS
  .map(id => findRequiredAgentIntegration(id) as LegacyAIIntegration);

export const isAgentIntegrationId = (id: string | undefined): id is AgentIntegrationId =>
  AGENT_INTEGRATION_IDS.includes(id as AgentIntegrationId);

export const isLegacyAIIntegrationId = (id: string | undefined): id is LegacyAIIntegrationId =>
  LEGACY_AI_INTEGRATION_IDS.includes(id as LegacyAIIntegrationId);

export const getAgentIntegration = (id: string | undefined): AgentIntegration | undefined =>
  AGENT_INTEGRATIONS.find(integration => integration.id === id);

export const getTargetAgentIntegrations = (
  all: boolean,
  selected: string
): AgentIntegration[] => {
  if (all) {
    return [...AGENT_INTEGRATIONS];
  }

  const integration = getAgentIntegration(selected);
  return integration ? [integration] : [];
};

export const getAgentInitDirs = (integrations: readonly AgentIntegration[]): string[] => {
  const dirs = new Set<string>();

  for (const integration of integrations) {
    for (const target of integration.installTargets) {
      const targetDirs = target.initDirs ?? [
        `${target.dir}/${target.commandsDir}`,
        ...target.extraDirs ?? []
      ];

      for (const dir of targetDirs) {
        dirs.add(dir);
      }
    }
  }

  return [...dirs];
};

export const formatAgentCommand = (
  integration: AgentIntegration | undefined,
  commandName: string,
  useGeneric = false
): string => {
  if (useGeneric || !integration?.slashPrefix) {
    return `/${commandName}`;
  }

  return `${integration.slashPrefix}${commandName}`;
};

export const formatAgentDisplayNames = (
  integrations: readonly AgentIntegration[]
): string => integrations.map(integration => integration.displayName).join('、');
