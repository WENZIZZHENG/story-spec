import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import {
  parsePresetManifest,
  type PresetManifest,
  type PresetManifestIssue
} from '../domain/preset-manifest.js';
import { inspectWorld } from './inspect-worldbuilding.js';

export interface PresetInspectionResult {
  packageRoot: string;
  presets: PresetManifest[];
  issues: PresetManifestIssue[];
}

export interface ActivePresetRecord {
  id: string;
  installedAt: string;
  manifestPath: string;
}

export interface PresetInstallResult {
  projectRoot: string;
  preset: PresetManifest;
  sourceDir: string;
  targetDir: string;
  currentPresetPath: string;
  writtenPaths: string[];
  dryRun: boolean;
}

export interface PresetDoctorIssue {
  severity: 'error' | 'warning' | 'info';
  code:
    | 'NO_ACTIVE_PRESET'
    | 'ACTIVE_PRESET_NOT_INSTALLED'
    | 'INVALID_ACTIVE_PRESET'
    | 'MISSING_PRESET_WORLD_FACT';
  path: string;
  message: string;
}

export interface PresetDoctorResult {
  projectRoot: string;
  activePreset?: PresetManifest;
  activePresetRecord?: ActivePresetRecord;
  issues: PresetDoctorIssue[];
}

export interface PresetInput {
  projectRoot: string;
  packageRoot: string;
  fileSystem: ProjectFileSystem;
}

export interface AddPresetInput extends PresetInput {
  presetId: string;
  dryRun?: boolean;
}

const PRESET_MANIFEST_FILE = 'preset.yaml';

const isPresetManifestFile = (file: string): boolean =>
  file === PRESET_MANIFEST_FILE || file === 'preset.yml';

const listPresetDirs = async (
  packageRoot: string,
  fs: ProjectFileSystem
): Promise<string[]> => {
  const presetsRoot = path.join(packageRoot, 'presets');
  if (!await fs.pathExists(presetsRoot)) {
    return [];
  }

  const dirs: string[] = [];
  for (const entry of await fs.readDir(presetsRoot)) {
    const entryPath = path.join(presetsRoot, entry);
    if ((await fs.stat(entryPath)).isDirectory()) {
      dirs.push(entryPath);
    }
  }

  return dirs.sort();
};

const readManifestFromDir = async (
  fs: ProjectFileSystem,
  dir: string
): Promise<{ manifest?: PresetManifest; issues: PresetManifestIssue[]; manifestPath: string }> => {
  const manifestFile = (await fs.readDir(dir)).find(isPresetManifestFile) ?? PRESET_MANIFEST_FILE;
  const manifestPath = path.join(dir, manifestFile);
  if (!await fs.pathExists(manifestPath)) {
    return {
      manifestPath,
      issues: [{
        severity: 'error',
        code: 'INVALID_PRESET_MANIFEST',
        path: manifestPath,
        message: '缺少 preset.yaml'
      }]
    };
  }

  const result = parsePresetManifest(await fs.readFile(manifestPath), manifestPath);
  return {
    ...result,
    manifestPath
  };
};

export const listPresets = async (input: PresetInput): Promise<PresetInspectionResult> => {
  const presets: PresetManifest[] = [];
  const issues: PresetManifestIssue[] = [];

  for (const dir of await listPresetDirs(input.packageRoot, input.fileSystem)) {
    const result = await readManifestFromDir(input.fileSystem, dir);
    if (result.manifest) {
      presets.push(result.manifest);
    }
    issues.push(...result.issues);
  }

  return {
    packageRoot: input.packageRoot,
    presets: presets.sort((left, right) => left.id.localeCompare(right.id)),
    issues
  };
};

const findPresetDir = async (
  packageRoot: string,
  fs: ProjectFileSystem,
  presetId: string
): Promise<{ sourceDir: string; manifest: PresetManifest; manifestPath: string } | undefined> => {
  for (const sourceDir of await listPresetDirs(packageRoot, fs)) {
    const result = await readManifestFromDir(fs, sourceDir);
    if (result.manifest?.id === presetId) {
      return {
        sourceDir,
        manifest: result.manifest,
        manifestPath: result.manifestPath
      };
    }
  }

  return undefined;
};

const listFiles = async (
  fs: ProjectFileSystem,
  rootDir: string,
  currentDir = rootDir
): Promise<string[]> => {
  if (!await fs.pathExists(rootDir)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of await fs.readDir(currentDir)) {
    const entryPath = path.join(currentDir, entry);
    const stat = await fs.stat(entryPath);
    if (stat.isDirectory()) {
      files.push(...await listFiles(fs, rootDir, entryPath));
    } else if (stat.isFile()) {
      files.push(path.relative(rootDir, entryPath).split(path.sep).join('/'));
    }
  }

  return files.sort();
};

const copyPresetSpecTemplates = async (
  input: AddPresetInput,
  sourceDir: string
): Promise<string[]> => {
  const specSource = path.join(sourceDir, 'spec');
  if (!await input.fileSystem.pathExists(specSource)) {
    return [];
  }

  const writtenPaths = (await listFiles(input.fileSystem, specSource))
    .map(file => path.join(input.projectRoot, 'spec', ...file.split('/')));

  if (!input.dryRun) {
    await input.fileSystem.copy(specSource, path.join(input.projectRoot, 'spec'), { overwrite: false });
  }

  return writtenPaths;
};

export const addPreset = async (input: AddPresetInput): Promise<PresetInstallResult> => {
  const found = await findPresetDir(input.packageRoot, input.fileSystem, input.presetId);
  if (!found) {
    throw new Error(`PRESET_NOT_FOUND:${input.presetId}`);
  }

  const targetDir = path.join(input.projectRoot, '.specify', 'presets', found.manifest.id);
  const currentPresetPath = path.join(input.projectRoot, 'spec', 'presets', 'current-preset.json');
  const writtenPaths = [
    targetDir,
    currentPresetPath,
    ...await copyPresetSpecTemplates(input, found.sourceDir)
  ];

  if (!input.dryRun) {
    await input.fileSystem.ensureDir(path.dirname(targetDir));
    await input.fileSystem.ensureDir(path.dirname(currentPresetPath));
    await input.fileSystem.copy(found.sourceDir, targetDir, { overwrite: false });
    await input.fileSystem.writeJson(currentPresetPath, {
      id: found.manifest.id,
      installedAt: new Date().toISOString(),
      manifestPath: `.specify/presets/${found.manifest.id}/preset.yaml`
    }, { spaces: 2 });
  }

  return {
    projectRoot: input.projectRoot,
    preset: found.manifest,
    sourceDir: found.sourceDir,
    targetDir,
    currentPresetPath,
    writtenPaths,
    dryRun: !!input.dryRun
  };
};

export const readActivePresetRecord = async (
  projectRoot: string,
  fs: ProjectFileSystem
): Promise<ActivePresetRecord | undefined> => {
  const currentPresetPath = path.join(projectRoot, 'spec', 'presets', 'current-preset.json');
  if (!await fs.pathExists(currentPresetPath)) {
    return undefined;
  }

  const record = await fs.readJson<Record<string, unknown>>(currentPresetPath);
  if (typeof record.id !== 'string' || typeof record.manifestPath !== 'string') {
    return undefined;
  }

  return {
    id: record.id,
    installedAt: typeof record.installedAt === 'string' ? record.installedAt : '',
    manifestPath: record.manifestPath
  };
};

export const loadActivePreset = async (
  projectRoot: string,
  fs: ProjectFileSystem
): Promise<{ record?: ActivePresetRecord; manifest?: PresetManifest; issues: PresetDoctorIssue[] }> => {
  const record = await readActivePresetRecord(projectRoot, fs);
  if (!record) {
    return {
      issues: [{
        severity: 'info',
        code: 'NO_ACTIVE_PRESET',
        path: path.join(projectRoot, 'spec', 'presets', 'current-preset.json'),
        message: '当前项目未启用 genre preset'
      }]
    };
  }

  const manifestPath = path.isAbsolute(record.manifestPath)
    ? record.manifestPath
    : path.join(projectRoot, ...record.manifestPath.split('/'));
  if (!await fs.pathExists(manifestPath)) {
    return {
      record,
      issues: [{
        severity: 'error',
        code: 'ACTIVE_PRESET_NOT_INSTALLED',
        path: manifestPath,
        message: `当前 preset ${record.id} 未安装到 .specify/presets`
      }]
    };
  }

  const result = parsePresetManifest(await fs.readFile(manifestPath), manifestPath);
  if (!result.manifest) {
    return {
      record,
      issues: result.issues.map(item => ({
        severity: item.severity,
        code: 'INVALID_ACTIVE_PRESET',
        path: item.path,
        message: item.message
      }))
    };
  }

  return {
    record,
    manifest: result.manifest,
    issues: []
  };
};

export const inspectPreset = async (input: Omit<PresetInput, 'packageRoot'>): Promise<PresetDoctorResult> => {
  const active = await loadActivePreset(input.projectRoot, input.fileSystem);
  const issues = [...active.issues];

  if (active.manifest) {
    const world = await inspectWorld({
      projectRoot: input.projectRoot,
      fileSystem: input.fileSystem
    });
    const worldFactIds = new Set(world.facts.map(fact => fact.id));
    for (const requirement of active.manifest.requiredWorldFacts) {
      if (!worldFactIds.has(requirement.id)) {
        issues.push({
          severity: 'warning',
          code: 'MISSING_PRESET_WORLD_FACT',
          path: path.join(input.projectRoot, 'spec', 'world'),
          message: `当前 preset 需要 WorldFact：${requirement.id}（${requirement.title}）`
        });
      }
    }
  }

  return {
    projectRoot: input.projectRoot,
    activePreset: active.manifest,
    activePresetRecord: active.record,
    issues
  };
};

export const renderPresetList = (result: PresetInspectionResult): string => [
  'Genre Presets',
  '',
  `Presets：${result.presets.length}`,
  `Issues：${result.issues.length}`,
  '',
  ...(result.presets.length > 0
    ? result.presets.map(preset => `- ${preset.id}：${preset.name}（${preset.genre}）`)
    : ['- 暂无内置 preset'])
].join('\n').trimEnd();

export const renderPresetDoctor = (result: PresetDoctorResult): string => [
  'Genre Preset Doctor',
  '',
  `当前 preset：${result.activePreset ? `${result.activePreset.id} ${result.activePreset.name}` : '未启用'}`,
  `Issues：${result.issues.length}`,
  '',
  ...(result.issues.length > 0
    ? result.issues.map(issue => `- [${issue.severity}] ${issue.code}: ${issue.path} - ${issue.message}`)
    : ['- preset 状态正常'])
].join('\n').trimEnd();
