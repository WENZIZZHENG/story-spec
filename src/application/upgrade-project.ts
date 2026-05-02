import path from 'node:path';
import { getVersion } from '../version.js';
import {
  AI_PLATFORMS,
  getAIPlatform,
  type AIPlatformConfig
} from '../utils/ai-platforms.js';
import type { ProjectFileSystem } from './project-ports.js';

export interface UpdateContent {
  commands: boolean;
  scripts: boolean;
  templates: boolean;
  memory: boolean;
  spec: boolean;
  experts: boolean;
}

export interface UpgradeStats {
  commands: number;
  scripts: number;
  templates: number;
  memory: number;
  spec: number;
  experts: number;
  platforms: string[];
}

export type UpgradeProjectEvent =
  | { type: 'progress'; message: string }
  | { type: 'info'; message: string }
  | { type: 'warning'; message: string };

export type UpgradeProjectErrorCode =
  | 'NOT_PROJECT'
  | 'NO_AI_INSTALLED'
  | 'AI_NOT_INSTALLED';

export class UpgradeProjectError extends Error {
  constructor(
    public readonly code: UpgradeProjectErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'UpgradeProjectError';
  }
}

export interface UpgradeProjectPlanInput {
  projectPath: string;
  ai?: string;
  all?: boolean;
  updateContent: UpdateContent;
  fileSystem: ProjectFileSystem;
}

export interface UpgradeProjectPlan {
  projectPath: string;
  configPath: string;
  config: Record<string, unknown>;
  projectVersion: string;
  targetVersion: string;
  installedAI: AIPlatformConfig[];
  targetAI: AIPlatformConfig[];
  targetDisplayNames: string[];
  updateContent: UpdateContent;
}

export interface UpgradeProjectInput extends UpgradeProjectPlanInput {
  packageRoot: string;
  dryRun?: boolean;
  backup?: boolean;
  onEvent?: (event: UpgradeProjectEvent) => void;
}

export interface UpgradeProjectResult extends UpgradeProjectPlan {
  backupPath: string;
  stats: UpgradeStats;
  dryRun: boolean;
}

const USER_SPEC_DIRS = new Set(['tracking', 'knowledge']);

const emit = (
  onEvent: UpgradeProjectInput['onEvent'],
  event: UpgradeProjectEvent
) => {
  onEvent?.(event);
};

const countFiles = async (
  fs: ProjectFileSystem,
  dir: string,
  predicate: (fileName: string) => boolean,
  recursive = false
): Promise<number> => {
  if (!await fs.pathExists(dir)) {
    return 0;
  }

  let count = 0;
  const items = await fs.readDir(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = await fs.stat(itemPath);
    if (recursive && stat.isDirectory()) {
      count += await countFiles(fs, itemPath, predicate, true);
    } else if (stat.isFile() && predicate(item)) {
      count += 1;
    }
  }

  return count;
};

const copyIfExists = async (
  fs: ProjectFileSystem,
  source: string,
  dest: string
): Promise<boolean> => {
  if (!await fs.pathExists(source)) {
    return false;
  }

  await fs.copy(source, dest, { overwrite: true });
  return true;
};

const detectInstalledAI = async (
  fs: ProjectFileSystem,
  projectPath: string
) => {
  const installedAI: AIPlatformConfig[] = [];

  for (const aiConfig of AI_PLATFORMS) {
    if (await fs.pathExists(path.join(projectPath, aiConfig.dir))) {
      installedAI.push(aiConfig);
    }
  }

  return installedAI;
};

const resolveTargetAI = (
  installedAI: AIPlatformConfig[],
  ai: string | undefined
) => {
  if (!ai) {
    return installedAI;
  }

  const requestedPlatform = getAIPlatform(ai);
  if (!requestedPlatform || !installedAI.some(platform => platform.name === requestedPlatform.name)) {
    throw new UpgradeProjectError('AI_NOT_INSTALLED', `AI 配置 "${ai}" 未安装`);
  }

  return [requestedPlatform];
};

export const createUpgradeProjectPlan = async (
  input: UpgradeProjectPlanInput
): Promise<UpgradeProjectPlan> => {
  const fs = input.fileSystem;
  const configPath = path.join(input.projectPath, '.specify', 'config.json');
  if (!await fs.pathExists(configPath)) {
    throw new UpgradeProjectError('NOT_PROJECT', '当前目录不是 novel-writer 项目');
  }

  const config = await fs.readJson(configPath) as Record<string, unknown>;
  const installedAI = await detectInstalledAI(fs, input.projectPath);
  if (installedAI.length === 0) {
    throw new UpgradeProjectError('NO_AI_INSTALLED', '未检测到任何 AI 配置目录');
  }

  const targetAI = input.all ? installedAI : resolveTargetAI(installedAI, input.ai);

  return {
    projectPath: input.projectPath,
    configPath,
    config,
    projectVersion: typeof config.version === 'string' ? config.version : '未知',
    targetVersion: getVersion(),
    installedAI,
    targetAI,
    targetDisplayNames: targetAI.map(platform => platform.displayName),
    updateContent: input.updateContent
  };
};

const updateCommands = async (
  fs: ProjectFileSystem,
  targetAI: AIPlatformConfig[],
  projectPath: string,
  packageRoot: string,
  dryRun: boolean,
  onEvent: UpgradeProjectInput['onEvent']
): Promise<number> => {
  let count = 0;

  for (const aiConfig of targetAI) {
    const sourceDir = path.join(packageRoot, aiConfig.distDir);
    if (!await fs.pathExists(sourceDir)) {
      emit(onEvent, { type: 'warning', message: `${aiConfig.displayName}: 构建产物未找到` });
      continue;
    }

    const targetDir = path.join(projectPath, aiConfig.dir);
    const sourceCommandsDir = path.join(sourceDir, aiConfig.dir, aiConfig.commandsDir);
    const targetCommandsDir = path.join(targetDir, aiConfig.commandsDir);

    if (await fs.pathExists(sourceCommandsDir)) {
      if (!dryRun) {
        await fs.copy(sourceCommandsDir, targetCommandsDir, { overwrite: true });
      }

      const commandCount = await countFiles(fs, sourceCommandsDir, file =>
        file.endsWith('.md') || file.endsWith('.toml')
      );
      count += commandCount;
      emit(onEvent, { type: 'info', message: `${aiConfig.displayName}: ${commandCount} 个文件` });
    }

    if (!aiConfig.extraDirs) {
      continue;
    }

    for (const extraDir of aiConfig.extraDirs) {
      const sourceExtraDir = path.join(sourceDir, extraDir);
      const targetExtraDir = path.join(projectPath, extraDir);
      if (!await fs.pathExists(sourceExtraDir)) {
        continue;
      }

      if (!dryRun) {
        await fs.copy(sourceExtraDir, targetExtraDir, { overwrite: true });
      }
      emit(onEvent, { type: 'info', message: `${aiConfig.displayName}: 已更新 ${extraDir}` });
    }
  }

  return count;
};

const updateScripts = async (
  fs: ProjectFileSystem,
  projectPath: string,
  packageRoot: string,
  dryRun: boolean,
  onEvent: UpgradeProjectInput['onEvent']
): Promise<number> => {
  const scriptsSource = path.join(packageRoot, 'scripts');
  const scriptsDest = path.join(projectPath, '.specify', 'scripts');

  if (!await fs.pathExists(scriptsSource)) {
    emit(onEvent, { type: 'warning', message: '脚本源文件未找到' });
    return 0;
  }

  if (!dryRun) {
    await fs.copy(scriptsSource, scriptsDest, { overwrite: true });

    const bashDir = path.join(scriptsDest, 'bash');
    if (await fs.pathExists(bashDir)) {
      const bashFiles = await fs.readDir(bashDir);
      await Promise.all(bashFiles
        .filter(file => file.endsWith('.sh'))
        .map(file => fs.chmod(path.join(bashDir, file), 0o755)));
    }
  }

  const bashCount = await countFiles(fs, path.join(scriptsSource, 'bash'), file => file.endsWith('.sh'));
  const powershellCount = await countFiles(fs, path.join(scriptsSource, 'powershell'), file => file.endsWith('.ps1'));

  emit(onEvent, { type: 'info', message: `更新 ${bashCount} 个 bash 脚本` });
  emit(onEvent, { type: 'info', message: `更新 ${powershellCount} 个 powershell 脚本` });

  return bashCount + powershellCount;
};

const updateTemplates = async (
  fs: ProjectFileSystem,
  projectPath: string,
  packageRoot: string,
  dryRun: boolean,
  onEvent: UpgradeProjectInput['onEvent']
): Promise<number> => {
  const templatesSource = path.join(packageRoot, 'templates');
  const templatesDest = path.join(projectPath, '.specify', 'templates');

  if (!await fs.pathExists(templatesSource)) {
    emit(onEvent, { type: 'warning', message: '模板源文件未找到' });
    return 0;
  }

  if (!dryRun) {
    await fs.copy(templatesSource, templatesDest, { overwrite: true });
  }

  const templateCount = await countFiles(fs, templatesSource, file =>
    file.endsWith('.md') || file.endsWith('.yaml') || file.endsWith('.json'),
    true
  );
  emit(onEvent, { type: 'info', message: `更新 ${templateCount} 个模板文件` });

  return templateCount;
};

const updateMemory = async (
  fs: ProjectFileSystem,
  projectPath: string,
  packageRoot: string,
  dryRun: boolean,
  onEvent: UpgradeProjectInput['onEvent']
): Promise<number> => {
  const memorySource = path.join(packageRoot, 'memory');
  const memoryDest = path.join(projectPath, '.specify', 'memory');

  if (!await fs.pathExists(memorySource)) {
    emit(onEvent, { type: 'warning', message: '记忆源文件未找到' });
    return 0;
  }

  if (!dryRun) {
    await fs.copy(memorySource, memoryDest, { overwrite: true });
  }

  const memoryCount = await countFiles(fs, memorySource, file => file.endsWith('.md'), true);
  emit(onEvent, { type: 'info', message: `更新 ${memoryCount} 个记忆文件` });

  return memoryCount;
};

const updateSpec = async (
  fs: ProjectFileSystem,
  projectPath: string,
  packageRoot: string,
  dryRun: boolean,
  onEvent: UpgradeProjectInput['onEvent']
): Promise<number> => {
  const specSource = path.join(packageRoot, 'spec');
  const specDest = path.join(projectPath, 'spec');

  if (!await fs.pathExists(specSource)) {
    emit(onEvent, { type: 'warning', message: 'Spec 源文件未找到' });
    return 0;
  }

  let count = 0;
  const specItems = await fs.readDir(specSource);

  for (const item of specItems) {
    if (USER_SPEC_DIRS.has(item)) {
      continue;
    }

    const sourcePath = path.join(specSource, item);
    const targetPath = path.join(specDest, item);
    const stat = await fs.stat(sourcePath);

    if (!dryRun) {
      await fs.copy(sourcePath, targetPath, { overwrite: true });
    }

    count += stat.isDirectory()
      ? await countFiles(fs, sourcePath, file => file.endsWith('.md') || file.endsWith('.json'), true)
      : 1;
  }

  emit(onEvent, { type: 'info', message: `更新 spec/（presets 等）${count} 个文件` });

  return count;
};

const updateExperts = async (
  fs: ProjectFileSystem,
  projectPath: string,
  packageRoot: string,
  dryRun: boolean,
  onEvent: UpgradeProjectInput['onEvent']
): Promise<number> => {
  const expertsSource = path.join(packageRoot, 'experts');
  const expertsDest = path.join(projectPath, '.specify', 'experts');

  if (!await fs.pathExists(expertsDest)) {
    emit(onEvent, { type: 'info', message: '项目未安装专家模式，跳过' });
    return 0;
  }

  if (!await fs.pathExists(expertsSource)) {
    emit(onEvent, { type: 'warning', message: '专家源文件未找到' });
    return 0;
  }

  if (!dryRun) {
    await fs.copy(expertsSource, expertsDest, { overwrite: true });
  }

  const expertsCount = await countFiles(fs, expertsSource, file => file.endsWith('.md'), true);
  emit(onEvent, { type: 'info', message: `更新 ${expertsCount} 个专家文件` });

  return expertsCount;
};

const createBackup = async (
  fs: ProjectFileSystem,
  plan: UpgradeProjectPlan,
  onEvent: UpgradeProjectInput['onEvent']
): Promise<string> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = path.join(plan.projectPath, 'backup', timestamp);
  await fs.ensureDir(backupPath);

  emit(onEvent, { type: 'progress', message: '创建备份...' });

  if (plan.updateContent.commands) {
    for (const aiConfig of plan.targetAI) {
      const source = path.join(plan.projectPath, aiConfig.dir);
      const dest = path.join(backupPath, aiConfig.dir);
      if (await copyIfExists(fs, source, dest)) {
        emit(onEvent, { type: 'info', message: `备份 ${aiConfig.dir}/` });
      }
    }
  }

  if (plan.updateContent.scripts) {
    const source = path.join(plan.projectPath, '.specify', 'scripts');
    if (await copyIfExists(fs, source, path.join(backupPath, '.specify', 'scripts'))) {
      emit(onEvent, { type: 'info', message: '备份 .specify/scripts/' });
    }
  }

  if (plan.updateContent.templates) {
    const source = path.join(plan.projectPath, '.specify', 'templates');
    if (await copyIfExists(fs, source, path.join(backupPath, '.specify', 'templates'))) {
      emit(onEvent, { type: 'info', message: '备份 .specify/templates/' });
    }
  }

  if (plan.updateContent.memory) {
    const source = path.join(plan.projectPath, '.specify', 'memory');
    if (await copyIfExists(fs, source, path.join(backupPath, '.specify', 'memory'))) {
      emit(onEvent, { type: 'info', message: '备份 .specify/memory/' });
    }
  }

  const backupInfo = {
    timestamp,
    fromVersion: plan.projectVersion,
    toVersion: plan.targetVersion,
    upgradedAI: plan.targetAI.map(platform => platform.name),
    updateContent: plan.updateContent,
    backupPath
  };
  await fs.writeJson(path.join(backupPath, 'BACKUP_INFO.json'), backupInfo, { spaces: 2 });

  emit(onEvent, { type: 'info', message: `备份完成: ${backupPath}` });

  return backupPath;
};

export const upgradeProject = async (
  input: UpgradeProjectInput
): Promise<UpgradeProjectResult> => {
  const fs = input.fileSystem;
  const plan = await createUpgradeProjectPlan(input);
  const dryRun = !!input.dryRun;

  let backupPath = '';
  if (input.backup !== false && !dryRun) {
    backupPath = await createBackup(fs, plan, input.onEvent);
  }

  const stats: UpgradeStats = {
    commands: 0,
    scripts: 0,
    templates: 0,
    memory: 0,
    spec: 0,
    experts: 0,
    platforms: plan.targetDisplayNames
  };

  if (plan.updateContent.commands) {
    emit(input.onEvent, { type: 'progress', message: '更新命令文件...' });
    stats.commands = await updateCommands(fs, plan.targetAI, plan.projectPath, input.packageRoot, dryRun, input.onEvent);
  }

  if (plan.updateContent.scripts) {
    emit(input.onEvent, { type: 'progress', message: '更新脚本文件...' });
    stats.scripts = await updateScripts(fs, plan.projectPath, input.packageRoot, dryRun, input.onEvent);
  }

  if (plan.updateContent.spec) {
    emit(input.onEvent, { type: 'progress', message: '更新写作规范和预设...' });
    stats.spec = await updateSpec(fs, plan.projectPath, input.packageRoot, dryRun, input.onEvent);
  }

  if (plan.updateContent.experts) {
    emit(input.onEvent, { type: 'progress', message: '更新专家模式文件...' });
    stats.experts = await updateExperts(fs, plan.projectPath, input.packageRoot, dryRun, input.onEvent);
  }

  if (plan.updateContent.templates) {
    emit(input.onEvent, { type: 'progress', message: '更新模板文件...' });
    stats.templates = await updateTemplates(fs, plan.projectPath, input.packageRoot, dryRun, input.onEvent);
  }

  if (plan.updateContent.memory) {
    emit(input.onEvent, { type: 'progress', message: '更新记忆文件...' });
    stats.memory = await updateMemory(fs, plan.projectPath, input.packageRoot, dryRun, input.onEvent);
  }

  if (!dryRun) {
    await fs.writeJson(plan.configPath, {
      ...plan.config,
      version: plan.targetVersion
    }, { spaces: 2 });
  }

  return {
    ...plan,
    backupPath,
    stats,
    dryRun
  };
};
