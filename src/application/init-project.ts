import path from 'path';
import { writeAgentContract } from '../agent/contract.js';
import {
  getAgentInitDirs,
  getAgentIntegration,
  getTargetAgentIntegrations,
  type AgentIntegration
} from '../agent/registry.js';
import { getVersion } from '../version.js';
import {
  getAIInitDirs,
  getAIPlatform,
  getTargetAIPlatforms,
  type AIPlatformConfig
} from '../utils/ai-platforms.js';
import type { GitAdapter, PluginInstaller, ProjectFileSystem } from './project-ports.js';

export type InitProjectEvent =
  | { type: 'progress'; message: string }
  | { type: 'info'; message: string }
  | { type: 'warning'; message: string };

export interface InitProjectInput {
  name?: string;
  workspacePath?: string;
  cwd: string;
  packageRoot: string;
  here: boolean;
  ai?: string;
  all?: boolean;
  agent?: string;
  allAgents?: boolean;
  method: string;
  git: boolean;
  withExperts: boolean;
  plugins?: string;
  agentsProfile?: string;
  fileSystem: ProjectFileSystem;
  gitAdapter?: GitAdapter;
  pluginInstaller?: PluginInstaller;
  onEvent?: (event: InitProjectEvent) => void;
}

export interface InitProjectResult {
  projectName: string;
  projectPath: string;
  aiDirs: string[];
  targetPlatforms: AIPlatformConfig[];
  targetAgents: AgentIntegration[];
}

export class InitProjectError extends Error {
  constructor(
    message: string,
    readonly code: 'MISSING_NAME' | 'PROJECT_EXISTS'
  ) {
    super(message);
    this.name = 'InitProjectError';
  }
}

function generateTomlCommand(template: string, scriptPath: string): string {
  const descMatch = template.match(/description:\s*(.+)/);
  const description = descMatch ? descMatch[1].trim() : '命令说明';
  const content = template.replace(/^---[\s\S]*?---\n/, '');
  const processedContent = content.replace(/{SCRIPT}/g, scriptPath);
  const normalizedContent = processedContent.replace(/\r\n/g, '\n');
  const promptValue = JSON.stringify(normalizedContent);
  const escapedDescription = description
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');

  return `description = "${escapedDescription}"

prompt = ${promptValue}
`;
}

const emit = (input: InitProjectInput, event: InitProjectEvent): void => {
  input.onEvent?.(event);
};

const ensureBashExecutable = async (fs: ProjectFileSystem, bashDir: string): Promise<void> => {
  if (!await fs.pathExists(bashDir)) {
    return;
  }

  const bashFiles = await fs.readDir(bashDir);
  for (const file of bashFiles) {
    if (file.endsWith('.sh')) {
      await fs.chmod(path.join(bashDir, file), 0o755);
    }
  }
};

const resolveProjectTarget = async (input: InitProjectInput): Promise<{ projectName: string; projectPath: string }> => {
  const fs = input.fileSystem;
  if (input.here) {
    const projectPath = input.cwd;
    return {
      projectName: path.basename(projectPath),
      projectPath
    };
  }

  if (input.workspacePath) {
    const projectPath = path.resolve(input.cwd, input.workspacePath);
    if (await fs.pathExists(projectPath)) {
      throw new InitProjectError(`项目目录 "${projectPath}" 已存在`, 'PROJECT_EXISTS');
    }

    await fs.ensureDir(projectPath);
    return {
      projectName: path.basename(projectPath),
      projectPath
    };
  }

  if (!input.name) {
    throw new InitProjectError('请提供项目名称、工作区路径，或使用 --here 参数', 'MISSING_NAME');
  }

  const trimmedName = input.name.trim();
  const projectPath = path.isAbsolute(trimmedName) || trimmedName.includes(path.sep) || trimmedName.includes('/')
    ? path.resolve(input.cwd, trimmedName)
    : path.join(input.cwd, trimmedName);
  const configPath = path.join(projectPath, '.specify', 'config.json');
  if (await fs.pathExists(projectPath)) {
    if (await fs.pathExists(configPath)) {
      throw new InitProjectError(`工作区 "${projectPath}" 已经是 StorySpec 项目`, 'PROJECT_EXISTS');
    }

    throw new InitProjectError(`工作区 "${projectPath}" 已存在`, 'PROJECT_EXISTS');
  }

  if (await fs.pathExists(configPath)) {
    throw new InitProjectError(`工作区 "${projectPath}" 已经是 StorySpec 项目`, 'PROJECT_EXISTS');
  }

  await fs.ensureDir(projectPath);
  return {
    projectName: path.basename(projectPath),
    projectPath
  };
};

const createBaseDirs = async (
  fs: ProjectFileSystem,
  projectPath: string,
  aiDirs: string[]
): Promise<void> => {
  const baseDirs = [
    '.specify',
    '.specify/context-packs',
    '.specify/memory',
    '.specify/scripts',
    '.specify/scripts/bash',
    '.specify/scripts/powershell',
    '.specify/templates',
    'stories',
    'spec',
    'spec/presets',
    'spec/tracking',
    'spec/knowledge',
    'spec/world',
    'spec/canon',
    'spec/graph',
    'spec/voice',
    'spec/voice/samples',
    'spec/style',
    'research',
    'research/notes',
    'research/sources',
    'feedback',
    'build'
  ];

  for (const dir of [...baseDirs, ...aiDirs]) {
    await fs.ensureDir(path.join(projectPath, dir));
  }
};

const writeProjectConfig = async (
  fs: ProjectFileSystem,
  projectPath: string,
  projectName: string,
  input: InitProjectInput,
  targetAgents: readonly AgentIntegration[]
): Promise<void> => {
  const integrations = targetAgents.map(integration => ({
    id: integration.id,
    renderer: integration.renderer,
    commandSurface: integration.commandSurface
  }));
  const config = {
    name: projectName,
    type: 'novel',
    ai: input.ai,
    agent: !input.all && !input.allAgents && targetAgents.length === 1 ? targetAgents[0].id : undefined,
    integrations,
    legacy: input.ai ? { ai: input.ai } : undefined,
    method: input.method,
    created: new Date().toISOString(),
    version: getVersion()
  };

  await fs.writeJson(path.join(projectPath, '.specify', 'config.json'), config, { spaces: 2 });
};

const copyPlatformArtifacts = async (
  fs: ProjectFileSystem,
  projectPath: string,
  targetAgents: readonly AgentIntegration[],
  input: InitProjectInput
): Promise<void> => {
  for (const integration of targetAgents) {
    const sourceDir = path.join(input.packageRoot, integration.installTargets[0].distDir);
    if (await fs.pathExists(sourceDir)) {
      await fs.copy(sourceDir, projectPath, { overwrite: false });
      emit(input, { type: 'progress', message: `已安装 ${integration.id} 配置...` });
    } else {
      emit(input, {
        type: 'warning',
        message: `\n警告: ${integration.id} 构建产物未找到，请运行 npm run build:commands`
      });
    }
  }
};

const copyFallbackScripts = async (
  fs: ProjectFileSystem,
  projectPath: string,
  packageRoot: string
): Promise<void> => {
  const scriptsDir = path.join(packageRoot, 'scripts');
  const scriptsDest = path.join(projectPath, '.specify', 'scripts');

  if (await fs.pathExists(scriptsDir)) {
    await fs.copy(scriptsDir, scriptsDest, { overwrite: false });
    await ensureBashExecutable(fs, path.join(scriptsDest, 'bash'));
  }
};

const copyContinuationEntry = async (
  fs: ProjectFileSystem,
  projectPath: string,
  packageRoot: string
): Promise<void> => {
  const source = path.join(packageRoot, 'templates', 'CONTINUE.md');
  const dest = path.join(projectPath, 'CONTINUE.md');

  if (await fs.pathExists(source) && !await fs.pathExists(dest)) {
    await fs.copy(source, dest, { overwrite: false });
  }
};

const copyTemplatesAndKnowledge = async (
  fs: ProjectFileSystem,
  projectPath: string,
  projectName: string,
  input: InitProjectInput
): Promise<void> => {
  const templatesDir = path.join(input.packageRoot, 'templates');
  if (await fs.pathExists(templatesDir)) {
    await fs.copy(templatesDir, path.join(projectPath, '.specify', 'templates'));
  }

  await copyContinuationEntry(fs, projectPath, input.packageRoot);

  const agentGuidesDir = path.join(input.packageRoot, 'agent-guides');
  if (await fs.pathExists(agentGuidesDir)) {
    await fs.copy(agentGuidesDir, path.join(projectPath, '.specify', 'agent-guides'));
  }

  if (await fs.pathExists(path.join(templatesDir, 'agent', 'agent-contract.md'))) {
    await writeAgentContract({
      packageRoot: input.packageRoot,
      projectRoot: projectPath,
      projectName,
      agentsProfile: input.agentsProfile,
      fileSystem: fs
    });
  }

  const memoryDir = path.join(input.packageRoot, 'memory');
  if (await fs.pathExists(memoryDir)) {
    await fs.copy(memoryDir, path.join(projectPath, '.specify', 'memory'));
  }

  const trackingTemplatesDir = path.join(input.packageRoot, 'templates', 'tracking');
  if (await fs.pathExists(trackingTemplatesDir)) {
    await fs.copy(trackingTemplatesDir, path.join(projectPath, 'spec', 'tracking'));
  }

  const knowledgeTemplatesDir = path.join(input.packageRoot, 'templates', 'knowledge');
  if (await fs.pathExists(knowledgeTemplatesDir)) {
    const userKnowledgeDir = path.join(projectPath, 'spec', 'knowledge');
    await fs.copy(knowledgeTemplatesDir, userKnowledgeDir);

    const knowledgeFiles = await fs.readDir(userKnowledgeDir);
    const currentDate = new Date().toISOString().split('T')[0];
    for (const file of knowledgeFiles) {
      if (file.endsWith('.md')) {
        const filePath = path.join(userKnowledgeDir, file);
        const content = (await fs.readFile(filePath))
          .replace(/\[日期\]/g, currentDate);
        await fs.writeFile(filePath, content);
      }
    }
  }

  const worldTemplatesDir = path.join(input.packageRoot, 'templates', 'world');
  if (await fs.pathExists(worldTemplatesDir)) {
    await fs.copy(worldTemplatesDir, path.join(projectPath, 'spec', 'world'));
  }

  const canonTemplatesDir = path.join(input.packageRoot, 'templates', 'canon');
  if (await fs.pathExists(canonTemplatesDir)) {
    await fs.copy(canonTemplatesDir, path.join(projectPath, 'spec', 'canon'));
  }

  const graphTemplatesDir = path.join(input.packageRoot, 'templates', 'graph');
  if (await fs.pathExists(graphTemplatesDir)) {
    await fs.copy(graphTemplatesDir, path.join(projectPath, 'spec', 'graph'));
  }

  const voiceTemplatesDir = path.join(input.packageRoot, 'templates', 'voice');
  if (await fs.pathExists(voiceTemplatesDir)) {
    await fs.copy(voiceTemplatesDir, path.join(projectPath, 'spec', 'voice'));
  }

  const styleTemplatesDir = path.join(input.packageRoot, 'templates', 'style');
  if (await fs.pathExists(styleTemplatesDir)) {
    await fs.copy(styleTemplatesDir, path.join(projectPath, 'spec', 'style'));
  }

  const researchTemplatesDir = path.join(input.packageRoot, 'templates', 'research');
  if (await fs.pathExists(researchTemplatesDir)) {
    await fs.copy(researchTemplatesDir, path.join(projectPath, 'research'));
  }

  const feedbackTemplatesDir = path.join(input.packageRoot, 'templates', 'feedback');
  if (await fs.pathExists(feedbackTemplatesDir)) {
    await fs.copy(feedbackTemplatesDir, path.join(projectPath, 'feedback'));
  }
};

const copySpec = async (
  fs: ProjectFileSystem,
  projectPath: string,
  packageRoot: string
): Promise<void> => {
  const specDir = path.join(packageRoot, 'spec');
  if (!await fs.pathExists(specDir)) {
    return;
  }

  const userSpecDir = path.join(projectPath, 'spec');
  const specItems = await fs.readDir(specDir);
  for (const item of specItems) {
    if (item !== 'tracking' && item !== 'knowledge') {
      await fs.copy(path.join(specDir, item), path.join(userSpecDir, item), { overwrite: false });
    }
  }
};

const copyPlatformExtras = async (
  fs: ProjectFileSystem,
  projectPath: string,
  targetPlatforms: AIPlatformConfig[],
  targetAgents: readonly AgentIntegration[],
  input: InitProjectInput
): Promise<void> => {
  if (targetPlatforms.some(platform => platform.name === 'gemini')) {
    const geminiSettingsSource = path.join(input.packageRoot, 'templates', 'gemini-settings.json');
    const geminiSettingsDest = path.join(projectPath, '.gemini', 'settings.json');
    if (await fs.pathExists(geminiSettingsSource)) {
      await fs.copy(geminiSettingsSource, geminiSettingsDest);
      emit(input, { type: 'info', message: '  ✓ 已复制 Gemini settings.json' });
    }

    const geminiMdSource = path.join(input.packageRoot, 'templates', 'GEMINI.md');
    const geminiMdDest = path.join(projectPath, '.gemini', 'GEMINI.md');
    if (await fs.pathExists(geminiMdSource)) {
      await fs.copy(geminiMdSource, geminiMdDest);
      emit(input, { type: 'info', message: '  ✓ 已复制 GEMINI.md' });
    }
  }

  if (targetPlatforms.some(platform => platform.name === 'claude')) {
    const claudeMdSource = path.join(input.packageRoot, 'templates', 'CLAUDE.md');
    const claudeMdDest = path.join(projectPath, 'CLAUDE.md');
    if (await fs.pathExists(claudeMdSource)) {
      await fs.copy(claudeMdSource, claudeMdDest);
      emit(input, { type: 'info', message: '  ✓ 已复制 CLAUDE.md' });
    }
  }

  if (targetPlatforms.some(platform => platform.name === 'cursor')) {
    const cursorRulesSource = path.join(input.packageRoot, 'templates', 'cursor-rules');
    const cursorRulesDest = path.join(projectPath, '.cursor', 'rules');
    if (await fs.pathExists(cursorRulesSource)) {
      await fs.copy(cursorRulesSource, cursorRulesDest);
      emit(input, { type: 'info', message: '  ✓ 已复制 Cursor rules' });
    }
  }

  if (targetAgents.some(agent => agent.id === 'continue-check')) {
    const continueRulesSource = path.join(input.packageRoot, 'templates', 'continue-rules');
    const continueRulesDest = path.join(projectPath, '.continue', 'rules');
    if (await fs.pathExists(continueRulesSource)) {
      await fs.copy(continueRulesSource, continueRulesDest);
      emit(input, { type: 'info', message: '  ✓ 已复制 Continue rules' });
    }
  }

  if (targetPlatforms.some(platform => platform.name === 'copilot')) {
    const copilotInstructionsSource = path.join(input.packageRoot, 'templates', 'copilot-instructions.md');
    const copilotInstructionsDest = path.join(projectPath, '.github', 'copilot-instructions.md');
    if (await fs.pathExists(copilotInstructionsSource)) {
      await fs.copy(copilotInstructionsSource, copilotInstructionsDest);
      emit(input, { type: 'info', message: '  ✓ 已复制 GitHub Copilot instructions' });
    }

    const vscodeSettingsSource = path.join(input.packageRoot, 'templates', 'vscode-settings.json');
    const vscodeSettingsDest = path.join(projectPath, '.vscode', 'settings.json');
    if (await fs.pathExists(vscodeSettingsSource)) {
      await fs.copy(vscodeSettingsSource, vscodeSettingsDest);
      emit(input, { type: 'info', message: '  ✓ 已复制 GitHub Copilot settings.json' });
    }
  }
};

const installExperts = async (
  fs: ProjectFileSystem,
  projectPath: string,
  aiDirs: string[],
  input: InitProjectInput
): Promise<void> => {
  if (!input.withExperts) {
    return;
  }

  emit(input, { type: 'progress', message: '安装专家模式...' });

  const expertsSourceDir = path.join(input.packageRoot, 'experts');
  if (await fs.pathExists(expertsSourceDir)) {
    await fs.copy(expertsSourceDir, path.join(projectPath, 'experts'));
  }

  const expertCommandSource = path.join(input.packageRoot, 'templates', 'commands', 'expert.md');
  if (!await fs.pathExists(expertCommandSource)) {
    return;
  }

  const expertContent = await fs.readFile(expertCommandSource);
  for (const aiDir of aiDirs) {
    if (aiDir.includes('claude') || aiDir.includes('cursor') || aiDir.includes('windsurf') || aiDir.includes('.roo')) {
      await fs.writeFile(path.join(projectPath, aiDir, 'expert.md'), expertContent);
    }

    if (aiDir.includes('gemini')) {
      await fs.writeFile(
        path.join(projectPath, aiDir, 'expert.toml'),
        generateTomlCommand(expertContent, '')
      );
    }
  }
};

const installPlugins = async (projectPath: string, input: InitProjectInput): Promise<void> => {
  if (!input.plugins) {
    return;
  }

  if (!input.pluginInstaller) {
    emit(input, { type: 'warning', message: '\n警告: 未配置插件安装器，跳过插件安装' });
    return;
  }

  emit(input, { type: 'progress', message: '安装插件...' });

  const pluginNames = input.plugins.split(',').map(plugin => plugin.trim());

  for (const pluginName of pluginNames) {
    const builtinPluginPath = path.join(input.packageRoot, 'plugins', pluginName);
    if (await input.fileSystem.pathExists(builtinPluginPath)) {
      await input.pluginInstaller.install(projectPath, pluginName, builtinPluginPath);
    } else {
      emit(input, {
        type: 'warning',
        message: `\n警告: 插件 "${pluginName}" 未找到`
      });
    }
  }
};

const initializeGit = async (projectPath: string, input: InitProjectInput): Promise<void> => {
  if (!input.git) {
    return;
  }

  if (!input.gitAdapter) {
    emit(input, { type: 'warning', message: '\n提示: 未配置 Git 适配器，已跳过 Git 初始化' });
    return;
  }

  try {
    await input.gitAdapter.init(projectPath);

    const gitignore = `# 临时文件
*.tmp
*.swp
.DS_Store

# 编辑器配置
.vscode/
.idea/

# AI 缓存
.ai-cache/

# StorySpec 生成稿
build/

# 节点模块
node_modules/
`;
    await input.fileSystem.writeFile(path.join(projectPath, '.gitignore'), gitignore);

    await input.gitAdapter.addAll(projectPath);
    await input.gitAdapter.commit(projectPath, '初始化小说项目');
  } catch {
    emit(input, { type: 'warning', message: '\n提示: Git 初始化失败，但项目已创建成功' });
  }
};

const resolveTargetAgents = (input: InitProjectInput): AgentIntegration[] => {
  if (input.allAgents) {
    return getTargetAgentIntegrations(true, '');
  }

  if (input.agent) {
    return getTargetAgentIntegrations(false, input.agent);
  }

  return getTargetAIPlatforms(!!input.all, input.ai ?? 'claude')
    .map(platform => getAgentIntegration(platform.name))
    .filter((integration): integration is AgentIntegration => integration !== undefined);
};

const resolveTargetPlatforms = (
  targetAgents: readonly AgentIntegration[]
): AIPlatformConfig[] => targetAgents
  .map(integration => integration.legacyAiId ? getAIPlatform(integration.legacyAiId) : undefined)
  .filter((platform): platform is AIPlatformConfig => platform !== undefined);

export async function initProject(input: InitProjectInput): Promise<InitProjectResult> {
  const fs = input.fileSystem;
  const { projectName, projectPath } = await resolveProjectTarget(input);
  const targetAgents = resolveTargetAgents(input);
  const targetPlatforms = resolveTargetPlatforms(targetAgents);
  const aiDirs = input.agent || input.allAgents
    ? getAgentInitDirs(targetAgents)
    : getAIInitDirs(targetPlatforms);

  await createBaseDirs(fs, projectPath, aiDirs);
  await writeProjectConfig(fs, projectPath, projectName, input, targetAgents);
  await copyPlatformArtifacts(fs, projectPath, targetAgents, input);
  await copyFallbackScripts(fs, projectPath, input.packageRoot);
  await copyTemplatesAndKnowledge(fs, projectPath, projectName, input);
  await copySpec(fs, projectPath, input.packageRoot);
  await copyPlatformExtras(fs, projectPath, targetPlatforms, targetAgents, input);
  await installExperts(fs, projectPath, aiDirs, input);
  await installPlugins(projectPath, input);
  await initializeGit(projectPath, input);

  return {
    projectName,
    projectPath,
    aiDirs,
    targetPlatforms,
    targetAgents
  };
}
