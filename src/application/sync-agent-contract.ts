import path from 'node:path';
import {
  getAgentContractTemplatePath,
  getProjectAgentContractPath,
  renderAgentContract
} from '../agent/contract.js';
import type { ProjectFileSystem } from './project-ports.js';

export type SyncAgentContractSource = 'project' | 'template';
export type SyncAgentContractTargetAction = 'source' | 'write' | 'unchanged';

export interface SyncAgentContractInput {
  projectRoot: string;
  packageRoot: string;
  projectName?: string;
  agentsProfile?: string;
  fromTemplate?: boolean;
  dryRun?: boolean;
  fileSystem: ProjectFileSystem;
}

export interface SyncAgentContractTarget {
  path: string;
  relativePath: string;
  action: SyncAgentContractTargetAction;
}

export interface SyncAgentContractResult {
  projectRoot: string;
  source: SyncAgentContractSource;
  sourcePath: string;
  dryRun: boolean;
  targets: SyncAgentContractTarget[];
}

const samePath = (left: string, right: string): boolean =>
  path.resolve(left) === path.resolve(right);

const toProjectRelativePath = (projectRoot: string, targetPath: string): string =>
  path.relative(projectRoot, targetPath).replace(/\\/g, '/');

const resolveProjectName = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  explicitName?: string
): Promise<string> => {
  if (explicitName) {
    return explicitName;
  }

  const configPath = path.join(projectRoot, '.specify', 'config.json');
  if (await fs.pathExists(configPath)) {
    const config = await fs.readJson<Record<string, unknown>>(configPath);
    const name = config.name ?? config.projectName;
    if (typeof name === 'string' && name.trim().length > 0) {
      return name;
    }
  }

  return path.basename(projectRoot);
};

const renderTemplateContract = async (input: SyncAgentContractInput): Promise<string> => {
  const template = await input.fileSystem.readFile(getAgentContractTemplatePath(input.packageRoot));
  return renderAgentContract({
    template,
    projectName: await resolveProjectName(input.fileSystem, input.projectRoot, input.projectName),
    agentsProfile: input.agentsProfile
  });
};

const planTarget = async (
  input: SyncAgentContractInput,
  targetPath: string,
  content: string,
  sourcePath: string,
  source: SyncAgentContractSource
): Promise<SyncAgentContractTarget> => {
  const target: SyncAgentContractTarget = {
    path: targetPath,
    relativePath: toProjectRelativePath(input.projectRoot, targetPath),
    action: 'write'
  };

  if (source === 'project' && samePath(targetPath, sourcePath)) {
    return { ...target, action: 'source' };
  }

  if (await input.fileSystem.pathExists(targetPath)) {
    const currentContent = await input.fileSystem.readFile(targetPath);
    if (currentContent === content) {
      return { ...target, action: 'unchanged' };
    }
  }

  if (!input.dryRun) {
    await input.fileSystem.ensureDir(path.dirname(targetPath));
    await input.fileSystem.writeFile(targetPath, content);
  }

  return target;
};

export const syncAgentContract = async (
  input: SyncAgentContractInput
): Promise<SyncAgentContractResult> => {
  const projectContractPath = getProjectAgentContractPath(input.projectRoot);
  const agentsPath = path.join(input.projectRoot, 'AGENTS.md');
  const hasProjectContract = await input.fileSystem.pathExists(projectContractPath);

  const source: SyncAgentContractSource = input.fromTemplate || !hasProjectContract ? 'template' : 'project';
  const sourcePath = source === 'project'
    ? projectContractPath
    : getAgentContractTemplatePath(input.packageRoot);
  const content = source === 'project'
    ? await input.fileSystem.readFile(projectContractPath)
    : await renderTemplateContract(input);

  const targets = [
    await planTarget(input, projectContractPath, content, sourcePath, source),
    await planTarget(input, agentsPath, content, sourcePath, source)
  ];

  return {
    projectRoot: input.projectRoot,
    source,
    sourcePath,
    dryRun: !!input.dryRun,
    targets
  };
};
