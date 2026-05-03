import path from 'node:path';
import type { ProjectFileSystem } from '../application/project-ports.js';

const DEFAULT_PROJECT_NAME = 'Novel Writer 项目';

const AGENTS_PROFILE_SECTIONS: Record<string, string[]> = {
  adult: [
    '成人向素材只能在规划文件中作为情节功能、同意边界、动机、关系变化和后果追踪。',
    '不要把亲密或暴力内容扁平化为猎奇场面；保留共情、主体性、余波和作者意图。'
  ],
  'slow-burn': [
    '优先使用渐进的情感升温和延迟回报；不要仓促推进吸引、信任、和解或背叛。',
    '当场景安静时，保护潜台词、犹疑和累积细节，不要强行制造快速转折。'
  ],
  adventure: [
    '在计划和任务中保持探索、发现、危险和外部利害关系可见。',
    '用地点、派系、物件和障碍中的具体行动平衡情感节拍。'
  ],
  romance: [
    '显式追踪关系状态变化：信任、欲望、冲突、脆弱、距离和修复。',
    '把每个角色都当作完整的人处理，保留其爱情线之外的动机。'
  ],
  'multi-thread': [
    '维护彼此区分的情节线，并明确活跃章节、交汇点、依赖关系和回收时机。',
    '写作前检查任务是否推进了目标情节线，避免无意抢走另一条线的揭示。'
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

export interface WriteAgentContractInput {
  packageRoot: string;
  projectRoot: string;
  projectName: string;
  agentsProfile?: string;
  fileSystem: ProjectFileSystem;
  overwrite?: boolean;
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
    return '- 默认画像：遵循项目宪章和任务元数据。';
  }

  const lines: string[] = [];
  for (const profile of selectedProfiles) {
    const section = AGENTS_PROFILE_SECTIONS[profile];
    if (!section) {
      lines.push(`- 自定义画像 \`${profile}\`：遵循 constitution、specification、tasks 和 tracking 文件中的项目本地说明。`);
      continue;
    }

    lines.push(`- 画像 \`${profile}\`：`);
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

export const writeAgentContract = async (
  input: WriteAgentContractInput
): Promise<string> => {
  const templatePath = getAgentContractTemplatePath(input.packageRoot);
  const template = await input.fileSystem.readFile(templatePath);
  const content = renderAgentContract({
    template,
    projectName: input.projectName,
    agentsProfile: input.agentsProfile
  });

  const projectContractPath = getProjectAgentContractPath(input.projectRoot);
  const agentsPath = path.join(input.projectRoot, 'AGENTS.md');
  const shouldWriteProjectContract = input.overwrite ?? !(await input.fileSystem.pathExists(projectContractPath));
  const shouldWriteAgents = input.overwrite ?? !(await input.fileSystem.pathExists(agentsPath));

  if (shouldWriteProjectContract) {
    await input.fileSystem.ensureDir(path.dirname(projectContractPath));
    await input.fileSystem.writeFile(projectContractPath, content);
  }

  if (shouldWriteAgents) {
    await input.fileSystem.ensureDir(path.dirname(agentsPath));
    await input.fileSystem.writeFile(agentsPath, content);
  }

  return content;
};
