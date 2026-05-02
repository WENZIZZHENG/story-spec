import path from 'node:path';
import type { ProjectFileSystem } from '../application/project-ports.js';

const DEFAULT_PROJECT_NAME = 'Novel Writer Project';

const AGENTS_PROFILE_SECTIONS: Record<string, string[]> = {
  adult: [
    'Adult material may be tracked in planning files as plot function, consent boundary, motivation, relationship change, and consequence.',
    'Do not flatten intimate or violent material into spectacle; preserve empathy, agency, aftermath, and authorial intent.'
  ],
  'slow-burn': [
    'Prefer gradual emotional escalation and delayed payoff; do not rush attraction, trust, reconciliation, or betrayal.',
    'When a scene feels quiet, protect subtext, hesitation, and accumulated detail instead of forcing a fast turn.'
  ],
  adventure: [
    'Keep exploration, discovery, danger, and external stakes visible in plans and tasks.',
    'Balance emotional beats with concrete movement through places, factions, artifacts, and obstacles.'
  ],
  romance: [
    'Track relationship state changes explicitly: trust, desire, conflict, vulnerability, distance, and repair.',
    'Respect each character as a full person with motives outside the romance line.'
  ],
  'multi-thread': [
    'Maintain separate plot threads with clear active chapters, intersections, dependencies, and payoff timing.',
    'Before writing, check whether the task advances the intended thread or accidentally steals another thread\'s reveal.'
  ]
};

export interface RenderAgentContractInput {
  template: string;
  projectName?: string;
  agentsProfile?: string;
}

export interface LoadAgentContractInput {
  packageRoot: string;
  projectRoot?: string;
  projectName?: string;
  agentsProfile?: string;
  fileSystem: ProjectFileSystem;
}

export interface LoadAgentContractResult {
  content: string;
  source: 'project' | 'template';
  path: string;
}

const normalizeAgentsProfiles = (profiles?: string): string[] => {
  if (!profiles) {
    return [];
  }

  return [...new Set(profiles
    .split(',')
    .map(profile => profile.trim().toLowerCase())
    .filter(profile => profile.length > 0))];
};

export const renderAgentsProfileSection = (profiles?: string): string => {
  const selectedProfiles = normalizeAgentsProfiles(profiles);
  if (selectedProfiles.length === 0) {
    return '- Default profile: follow the project constitution and task metadata.';
  }

  const lines: string[] = [];
  for (const profile of selectedProfiles) {
    const section = AGENTS_PROFILE_SECTIONS[profile];
    if (!section) {
      lines.push(`- Custom profile \`${profile}\`: follow project-local notes in constitution, specification, tasks, and tracking files.`);
      continue;
    }

    lines.push(`- Profile \`${profile}\`:`);
    for (const rule of section) {
      lines.push(`  - ${rule}`);
    }
  }

  return lines.join('\n');
};

export const renderAgentContract = (input: RenderAgentContractInput): string =>
  input.template
    .replace(/\{\{PROJECT_NAME\}\}/g, input.projectName ?? DEFAULT_PROJECT_NAME)
    .replace(/\{\{AGENTS_PROFILE_SECTION\}\}/g, renderAgentsProfileSection(input.agentsProfile));

export const getAgentContractTemplatePath = (packageRoot: string): string =>
  path.join(packageRoot, 'templates', 'agent', 'agent-contract.md');

export const getProjectAgentContractPath = (projectRoot: string): string =>
  path.join(projectRoot, '.specify', 'agent-contract.md');

export const loadAgentContract = async (
  input: LoadAgentContractInput
): Promise<LoadAgentContractResult> => {
  if (input.projectRoot) {
    const projectContractPath = getProjectAgentContractPath(input.projectRoot);
    if (await input.fileSystem.pathExists(projectContractPath)) {
      return {
        content: await input.fileSystem.readFile(projectContractPath),
        source: 'project',
        path: projectContractPath
      };
    }
  }

  const templatePath = getAgentContractTemplatePath(input.packageRoot);
  const template = await input.fileSystem.readFile(templatePath);

  return {
    content: renderAgentContract({
      template,
      projectName: input.projectName,
      agentsProfile: input.agentsProfile
    }),
    source: 'template',
    path: templatePath
  };
};
