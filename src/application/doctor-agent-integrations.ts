import path from 'node:path';
import {
  AGENT_INTEGRATIONS,
  type AgentIntegration
} from '../agent/registry.js';
import type { ProjectFileSystem } from './project-ports.js';
import {
  renderTemplateSourceDiagnostics,
  resolveProjectTemplateStack,
  type TemplateSourceDiagnostic
} from '../templates/resolver.js';

export type AgentDoctorIssueCode =
  | 'MISSING_AGENT_CONTRACT'
  | 'MISSING_AGENTS_FILE'
  | 'MISSING_INSTALL_TARGET'
  | 'MISSING_COMMANDS_DIR'
  | 'MISSING_COMMAND_FILE'
  | 'MISSING_DIST';

export interface AgentDoctorIssue {
  severity: 'error' | 'warning';
  code: AgentDoctorIssueCode;
  agent?: string;
  path: string;
  message: string;
}

export interface AgentDoctorIntegrationStatus {
  id: string;
  displayName: string;
  installed: boolean;
  commandSurface: string;
  commandCount: number;
  issues: AgentDoctorIssue[];
}

export interface DoctorAgentIntegrationsInput {
  projectRoot: string;
  packageRoot: string;
  fileSystem: ProjectFileSystem;
}

export interface DoctorAgentIntegrationsResult {
  projectRoot: string;
  valid: boolean;
  integrations: AgentDoctorIntegrationStatus[];
  issues: AgentDoctorIssue[];
  templateDiagnostics: TemplateSourceDiagnostic[];
}

const createIssue = (
  code: AgentDoctorIssueCode,
  pathValue: string,
  message: string,
  severity: 'error' | 'warning' = 'error',
  agent?: string
): AgentDoctorIssue => ({
  severity,
  code,
  agent,
  path: pathValue,
  message
});

const configDeclaresAgent = (
  config: Record<string, unknown>,
  agentId: string
): boolean => {
  if (config.agent === agentId || config.ai === agentId) {
    return true;
  }

  if (!Array.isArray(config.integrations)) {
    return false;
  }

  return config.integrations.some(integration => {
    if (integration === agentId) {
      return true;
    }

    return typeof integration === 'object'
      && integration !== null
      && 'id' in integration
      && integration.id === agentId;
  });
};

const readProjectConfig = async (
  fs: ProjectFileSystem,
  projectRoot: string
): Promise<Record<string, unknown>> => {
  try {
    return await fs.readJson(path.join(projectRoot, '.specify', 'config.json'));
  } catch {
    return {};
  }
};

const listCommandFiles = async (
  fs: ProjectFileSystem,
  commandsDir: string
): Promise<string[]> => {
  if (!await fs.pathExists(commandsDir)) {
    return [];
  }

  return (await fs.readDir(commandsDir))
    .filter(file => file.endsWith('.md') || file.endsWith('.toml') || file.endsWith('.prompt.md'))
    .sort();
};

const getExpectedCommandFiles = async (
  fs: ProjectFileSystem,
  packageRoot: string,
  integration: AgentIntegration
): Promise<string[]> => {
  const target = integration.installTargets[0];
  const sourceDir = path.join(packageRoot, target.distDir, target.dir, target.commandsDir);
  return listCommandFiles(fs, sourceDir);
};

const isInstalled = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  config: Record<string, unknown>,
  integration: AgentIntegration
): Promise<boolean> => {
  if (configDeclaresAgent(config, integration.id)) {
    return true;
  }

  for (const target of integration.installTargets) {
    if (await fs.pathExists(path.join(projectRoot, target.dir, target.commandsDir))) {
      return true;
    }
  }

  return false;
};

const doctorIntegration = async (
  input: DoctorAgentIntegrationsInput,
  config: Record<string, unknown>,
  integration: AgentIntegration
): Promise<AgentDoctorIntegrationStatus> => {
  const fs = input.fileSystem;
  const target = integration.installTargets[0];
  const installed = await isInstalled(fs, input.projectRoot, config, integration);
  const issues: AgentDoctorIssue[] = [];

  if (!installed) {
    return {
      id: integration.id,
      displayName: integration.displayName,
      installed: false,
      commandSurface: integration.commandSurface,
      commandCount: 0,
      issues
    };
  }

  const distDir = path.join(input.packageRoot, target.distDir);
  const installTargetPath = path.join(input.projectRoot, target.dir);
  const commandsDir = path.join(installTargetPath, target.commandsDir);
  const expectedCommandFiles = await getExpectedCommandFiles(fs, input.packageRoot, integration);
  const installedCommandFiles = await listCommandFiles(fs, commandsDir);

  if (!await fs.pathExists(distDir)) {
    issues.push(createIssue(
      'MISSING_DIST',
      distDir,
      `${integration.displayName} 构建产物缺失，请运行 npm run build:commands`,
      'warning',
      integration.id
    ));
  }

  if (!await fs.pathExists(installTargetPath)) {
    issues.push(createIssue(
      'MISSING_INSTALL_TARGET',
      installTargetPath,
      `${integration.displayName} 安装目录缺失`,
      'error',
      integration.id
    ));
  }

  if (!await fs.pathExists(commandsDir)) {
    issues.push(createIssue(
      'MISSING_COMMANDS_DIR',
      commandsDir,
      `${integration.displayName} 命令目录缺失`,
      'error',
      integration.id
    ));
  }

  for (const file of expectedCommandFiles) {
    if (!installedCommandFiles.includes(file)) {
      issues.push(createIssue(
        'MISSING_COMMAND_FILE',
        path.join(commandsDir, file),
        `${integration.displayName} 缺少命令文件：${file}`,
        'error',
        integration.id
      ));
    }
  }

  return {
    id: integration.id,
    displayName: integration.displayName,
    installed,
    commandSurface: integration.commandSurface,
    commandCount: installedCommandFiles.length,
    issues
  };
};

export const doctorAgentIntegrations = async (
  input: DoctorAgentIntegrationsInput
): Promise<DoctorAgentIntegrationsResult> => {
  const fs = input.fileSystem;
  const config = await readProjectConfig(fs, input.projectRoot);
  const issues: AgentDoctorIssue[] = [];
  const contractPath = path.join(input.projectRoot, '.specify', 'agent-contract.md');
  const agentsPath = path.join(input.projectRoot, 'AGENTS.md');

  if (!await fs.pathExists(contractPath)) {
    issues.push(createIssue('MISSING_AGENT_CONTRACT', contractPath, '缺少 .specify/agent-contract.md'));
  }

  if (!await fs.pathExists(agentsPath)) {
    issues.push(createIssue('MISSING_AGENTS_FILE', agentsPath, '缺少 AGENTS.md'));
  }

  const integrations = await Promise.all(AGENT_INTEGRATIONS.map(integration =>
    doctorIntegration(input, config, integration)
  ));
  const integrationIssues = integrations.flatMap(integration => integration.issues);
  const allIssues = [...issues, ...integrationIssues];
  const templateStack = await resolveProjectTemplateStack({
    projectRoot: input.projectRoot,
    fileSystem: fs
  });

  return {
    projectRoot: input.projectRoot,
    valid: !allIssues.some(issue => issue.severity === 'error'),
    integrations,
    issues: allIssues,
    templateDiagnostics: templateStack.diagnostics
  };
};

export const renderAgentDoctorResult = (result: DoctorAgentIntegrationsResult): string => {
  const lines = [
    'Agent integration doctor',
    '',
    `根目录：${result.projectRoot}`,
    `结果：${result.valid ? '通过' : '失败'}`,
    ''
  ];

  for (const integration of result.integrations.filter(item => item.installed)) {
    lines.push(`- ${integration.displayName}: ${integration.commandCount} commands`);
    for (const issue of integration.issues) {
      lines.push(`  [${issue.severity}] ${issue.code}: ${issue.path} - ${issue.message}`);
    }
  }

  const rootIssues = result.issues.filter(issue => !issue.agent);
  if (rootIssues.length > 0) {
    lines.push('', '项目入口问题：');
    for (const issue of rootIssues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.path} - ${issue.message}`);
    }
  }

  lines.push('', renderTemplateSourceDiagnostics(result.templateDiagnostics, {
    heading: 'Template source diagnostics'
  }));

  return lines.join('\n');
};
