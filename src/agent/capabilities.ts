export interface AgentCapabilities {
  readFiles: boolean;
  writeFiles: boolean;
  runShell: boolean;
  supportsSlashCommands: boolean;
  supportsSkills: boolean;
  supportsProjectInstructions: boolean;
  supportsMcp: boolean;
  supportsBrowser: boolean;
  supportsCheckpoints: boolean;
  requiresHumanApproval?: boolean;
}

export const createAgentCapabilities = (
  overrides: Partial<AgentCapabilities>
): AgentCapabilities => ({
  readFiles: false,
  writeFiles: false,
  runShell: false,
  supportsSlashCommands: false,
  supportsSkills: false,
  supportsProjectInstructions: false,
  supportsMcp: false,
  supportsBrowser: false,
  supportsCheckpoints: false,
  ...overrides
});

export const AGENT_CAPABILITY_KEYS = [
  'readFiles',
  'writeFiles',
  'runShell',
  'supportsSlashCommands',
  'supportsSkills',
  'supportsProjectInstructions',
  'supportsMcp',
  'supportsBrowser',
  'supportsCheckpoints',
  'requiresHumanApproval'
] as const satisfies readonly (keyof AgentCapabilities)[];

export type AgentCapabilityKey = typeof AGENT_CAPABILITY_KEYS[number];
