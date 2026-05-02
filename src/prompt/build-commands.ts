import path from 'node:path';
import fs from 'fs-extra';
import type { AIPlatformId } from '../utils/ai-platforms.js';
import type { ScriptVariant } from './compiler.js';
import { renderCommandForPlatform } from './platform-renderers/index.js';

export const BUILD_COMMAND_AGENTS = [
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
] as const satisfies readonly AIPlatformId[];

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

const PLATFORM_COMMAND_DIRS: Record<BuildCommandAgent, string> = {
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

const getScriptDirectoryName = (script: ScriptVariant): 'bash' | 'powershell' => (
  script === 'sh' ? 'bash' : 'powershell'
);

const listCommandTemplates = async (rootDir: string): Promise<string[]> => {
  const commandsDir = path.join(rootDir, 'templates', 'commands');
  if (!await fs.pathExists(commandsDir)) {
    return [];
  }

  const entries = await fs.readdir(commandsDir);
  return entries
    .filter(entry => entry.endsWith('.md'))
    .sort()
    .map(entry => path.join(commandsDir, entry));
};

const copyIfExists = async (sourcePath: string, targetPath: string): Promise<boolean> => {
  if (!await fs.pathExists(sourcePath)) {
    return false;
  }

  await fs.copy(sourcePath, targetPath);
  return true;
};

const copyScriptSupportFiles = async (
  rootDir: string,
  specDir: string,
  script: ScriptVariant
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
  script: ScriptVariant
): Promise<void> => {
  const specDir = path.join(baseDir, '.specify');
  await fs.ensureDir(specDir);

  await copyIfExists(path.join(rootDir, 'memory'), path.join(specDir, 'memory'));
  await copyScriptSupportFiles(rootDir, specDir, script);
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

  const templates = await listCommandTemplates(rootDir);
  for (const templatePath of templates) {
    const template = await fs.readFile(templatePath, 'utf-8');
    const commandName = path.basename(templatePath, '.md');
    const rendered = renderCommandForPlatform({
      commandName,
      template,
      platform: agent,
      scriptVariant: script
    });

    await fs.writeFile(path.join(outputDir, rendered.outputFile), rendered.content);
  }

  return templates.length;
};

export const buildCommandArtifacts = async (
  input: BuildCommandArtifactsInput
): Promise<BuildCommandArtifactsResult> => {
  const outDir = input.outDir ?? path.join(input.rootDir, 'dist');
  const agents = input.agents?.length ? [...input.agents] : [...BUILD_COMMAND_AGENTS];
  const scripts = input.scripts?.length ? [...input.scripts] : [...BUILD_COMMAND_SCRIPTS];
  const variants: BuildCommandVariantResult[] = [];

  await fs.remove(outDir);
  await fs.ensureDir(outDir);

  for (const agent of agents) {
    for (const script of scripts) {
      const baseDir = path.join(outDir, agent);
      await fs.ensureDir(baseDir);
      await copySupportFiles(input.rootDir, baseDir, script);
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
