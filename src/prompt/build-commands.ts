import path from 'node:path';
import fs from 'fs-extra';
import type { AgentIntegrationId } from '../agent/registry.js';
import type { ScriptVariant } from './compiler.js';
import { listCommandSources } from './command-source.js';
import {
  renderCommandForPlatform,
  type PlatformRenderer
} from './platform-renderers/index.js';

export const BUILD_COMMAND_AGENTS = [
  'generic',
  'continue-check',
  'claude',
  'gemini',
  'cursor',
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

export type BuildCommandAgent = typeof BUILD_COMMAND_AGENTS[number];

export const BUILD_COMMAND_SCRIPTS = ['sh', 'ps'] as const satisfies readonly ScriptVariant[];

export interface BuildCommandArtifactsInput {
  rootDir: string;
  outDir?: string;
  agents?: readonly BuildCommandAgent[];
  scripts?: readonly ScriptVariant[];
}

export interface BuildCommandVariantResult {
  agent: BuildCommandAgent;
  script: ScriptVariant;
  commandCount: number;
}

export interface BuildCommandArtifactsResult {
  outDir: string;
  variants: BuildCommandVariantResult[];
}

interface RuntimeBundleFile {
  relativePath: string;
  content: Buffer;
}

const PLATFORM_COMMAND_DIRS: Record<BuildCommandAgent, string> = {
  generic: path.join('.specify', 'commands'),
  'continue-check': path.join('.continue', 'prompts'),
  claude: path.join('.claude', 'commands'),
  gemini: path.join('.gemini', 'commands', 'novel'),
  cursor: path.join('.cursor', 'commands'),
  windsurf: path.join('.windsurf', 'workflows'),
  roocode: path.join('.roo', 'commands'),
  copilot: path.join('.github', 'prompts'),
  qwen: path.join('.qwen', 'commands'),
  opencode: path.join('.opencode', 'command'),
  codex: path.join('.codex', 'prompts'),
  kilocode: path.join('.kilocode', 'workflows'),
  auggie: path.join('.augment', 'commands'),
  codebuddy: path.join('.codebuddy', 'commands'),
  q: path.join('.amazonq', 'prompts')
};

export const getBuildCommandOutputPath = (
  agent: BuildCommandAgent,
  renderer: PlatformRenderer,
  commandName: string
): string => path.join(
  agent,
  PLATFORM_COMMAND_DIRS[agent],
  `${renderer.namespace}${commandName}.${renderer.extension}`
).replace(/\\/g, '/');

const getScriptDirectoryName = (script: ScriptVariant): 'bash' | 'powershell' => (
  script === 'sh' ? 'bash' : 'powershell'
);

const copyIfExists = async (sourcePath: string, targetPath: string): Promise<boolean> => {
  if (!await fs.pathExists(sourcePath)) {
    return false;
  }

  await fs.copy(sourcePath, targetPath);
  return true;
};

const readRuntimeBundle = async (rootDir: string): Promise<RuntimeBundleFile[]> => {
  const distDir = path.join(rootDir, 'dist');
  const runtimeFiles = [
    'script-runtime.js',
    path.join('application', 'check-writing-state.js'),
    path.join('domain', 'story-artifact.js')
  ];
  const runtimeBundle: RuntimeBundleFile[] = [];

  for (const relativePath of runtimeFiles) {
    const sourcePath = path.join(distDir, relativePath);
    if (await fs.pathExists(sourcePath)) {
      runtimeBundle.push({
        relativePath,
        content: await fs.readFile(sourcePath)
      });
    }
  }

  return runtimeBundle;
};

const writeRuntimeBundle = async (
  scriptsDest: string,
  runtimeBundle: readonly RuntimeBundleFile[]
): Promise<void> => {
  if (runtimeBundle.length === 0) {
    return;
  }

  const runtimeDest = path.join(scriptsDest, 'runtime');
  for (const file of runtimeBundle) {
    await fs.outputFile(path.join(runtimeDest, file.relativePath), file.content);
  }
};

const copyScriptSupportFiles = async (
  rootDir: string,
  specDir: string,
  script: ScriptVariant,
  runtimeBundle: readonly RuntimeBundleFile[]
): Promise<void> => {
  const scriptsSource = path.join(rootDir, 'scripts');
  if (!await fs.pathExists(scriptsSource)) {
    return;
  }

  const scriptsDest = path.join(specDir, 'scripts');
  await fs.ensureDir(scriptsDest);

  const scriptDirectoryName = getScriptDirectoryName(script);
  await copyIfExists(
    path.join(scriptsSource, scriptDirectoryName),
    path.join(scriptsDest, scriptDirectoryName)
  );

  const entries = await fs.readdir(scriptsSource);
  for (const entry of entries) {
    const sourcePath = path.join(scriptsSource, entry);
    const stat = await fs.stat(sourcePath);
    if (stat.isFile()) {
      await fs.copy(sourcePath, path.join(scriptsDest, entry));
    }
  }

  await writeRuntimeBundle(scriptsDest, runtimeBundle);
};

const copyTemplateSupportFiles = async (rootDir: string, specDir: string): Promise<void> => {
  const templatesSource = path.join(rootDir, 'templates');
  if (!await fs.pathExists(templatesSource)) {
    return;
  }

  const templatesDest = path.join(specDir, 'templates');
  await fs.copy(templatesSource, templatesDest, {
    filter: sourcePath => {
      const relativePath = path.relative(templatesSource, sourcePath);
      if (!relativePath) {
        return true;
      }

      const segments = relativePath.split(path.sep);
      return !segments.some(segment => segment === 'commands' || segment.startsWith('commands-'));
    }
  });
};

const copySpecSupportFiles = async (rootDir: string, baseDir: string): Promise<void> => {
  const specSource = path.join(rootDir, 'spec');
  if (!await fs.pathExists(specSource)) {
    return;
  }

  const specDest = path.join(baseDir, 'spec');
  await fs.ensureDir(specDest);

  const items = await fs.readdir(specSource);
  for (const item of items) {
    const targetPath = path.join(specDest, item);
    if (item === 'tracking' || item === 'knowledge') {
      await fs.ensureDir(targetPath);
      continue;
    }

    await fs.copy(path.join(specSource, item), targetPath);
  }
};

const copySupportFiles = async (
  rootDir: string,
  baseDir: string,
  script: ScriptVariant,
  runtimeBundle: readonly RuntimeBundleFile[]
): Promise<void> => {
  const specDir = path.join(baseDir, '.specify');
  await fs.ensureDir(specDir);

  await copyIfExists(path.join(rootDir, 'memory'), path.join(specDir, 'memory'));
  await copyScriptSupportFiles(rootDir, specDir, script, runtimeBundle);
  await copyTemplateSupportFiles(rootDir, specDir);
  await copyIfExists(path.join(rootDir, 'experts'), path.join(specDir, 'experts'));
  await copySpecSupportFiles(rootDir, baseDir);
};

const generatePlatformCommands = async (
  rootDir: string,
  baseDir: string,
  agent: BuildCommandAgent,
  script: ScriptVariant
): Promise<number> => {
  const outputDir = path.join(baseDir, PLATFORM_COMMAND_DIRS[agent]);
  await fs.ensureDir(outputDir);

  const commandSources = await listCommandSources(rootDir);
  for (const commandSource of commandSources) {
    const rendered = renderCommandForPlatform({
      commandName: commandSource.commandName,
      commandSource,
      platform: agent,
      scriptVariant: script
    });

    await fs.writeFile(path.join(outputDir, rendered.outputFile), rendered.content);
  }

  return commandSources.length;
};

export const buildCommandArtifacts = async (
  input: BuildCommandArtifactsInput
): Promise<BuildCommandArtifactsResult> => {
  const outDir = input.outDir ?? path.join(input.rootDir, 'dist');
  const agents = input.agents?.length ? [...input.agents] : [...BUILD_COMMAND_AGENTS];
  const scripts = input.scripts?.length ? [...input.scripts] : [...BUILD_COMMAND_SCRIPTS];
  const variants: BuildCommandVariantResult[] = [];
  const runtimeBundle = await readRuntimeBundle(input.rootDir);

  await fs.remove(outDir);
  await fs.ensureDir(outDir);

  for (const agent of agents) {
    for (const script of scripts) {
      const baseDir = path.join(outDir, agent);
      await fs.ensureDir(baseDir);
      await copySupportFiles(input.rootDir, baseDir, script, runtimeBundle);
      variants.push({
        agent,
        script,
        commandCount: await generatePlatformCommands(input.rootDir, baseDir, agent, script)
      });
    }
  }

  return {
    outDir,
    variants
  };
};
