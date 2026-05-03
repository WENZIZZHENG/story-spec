#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCommandArtifacts,
  BUILD_COMMAND_AGENTS,
  getBuildCommandOutputPath
} from '../../src/prompt/build-commands.js';
import { listCommandSources } from '../../src/prompt/command-source.js';
import { getPlatformRenderer } from '../../src/prompt/platform-renderers/index.js';

interface ArtifactEntry {
  path: string;
  sha256: string;
  commandSource?: {
    command: string;
    kind: 'legacy-template' | 'command-spec';
    sourcePath: string;
    promptPath?: string;
  };
}

interface ArtifactManifest {
  generatedBy: string;
  agents: string[];
  scripts: string[];
  files: ArtifactEntry[];
}

const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(dirname, '..', '..');
const manifestPath = path.join(rootDir, 'tests', 'fixtures', 'command-artifacts.manifest.json');
const scripts = ['sh'] as const;

type CommandSourceByOutputPath = Map<string, ArtifactEntry['commandSource']>;

const walkFiles = async (dir: string): Promise<string[]> => {
  const files: string[] = [];

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(entryPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
};

const hashFile = async (filePath: string): Promise<string> => {
  const hash = createHash('sha256');
  hash.update(await readFile(filePath));
  return hash.digest('hex');
};

const normalizePath = (filePath: string): string => path.relative(rootDir, filePath).replace(/\\/g, '/');

const createCommandSourceIndex = async (): Promise<CommandSourceByOutputPath> => {
  const commandSources = await listCommandSources(rootDir);
  const index: CommandSourceByOutputPath = new Map();

  for (const agent of BUILD_COMMAND_AGENTS) {
    const renderer = getPlatformRenderer(agent);

    for (const source of commandSources) {
      const outputPath = getBuildCommandOutputPath(agent, renderer, source.commandName);
      index.set(outputPath, {
        command: source.commandName,
        kind: source.kind,
        sourcePath: normalizePath(source.sourcePath),
        ...source.kind === 'command-spec' ? { promptPath: normalizePath(source.promptPath) } : {}
      });
    }
  }

  return index;
};

const createManifest = async (): Promise<ArtifactManifest> => {
  const outDir = path.join(os.tmpdir(), `storyspec-command-artifacts-${Date.now()}`);

  try {
    await buildCommandArtifacts({
      rootDir,
      outDir,
      agents: BUILD_COMMAND_AGENTS,
      scripts
    });

    const files = await walkFiles(outDir);
    const commandSourceIndex = await createCommandSourceIndex();
    const entries = await Promise.all(files.map(async filePath => {
      const relativePath = path.relative(outDir, filePath).replace(/\\/g, '/');
      const commandSource = commandSourceIndex.get(relativePath);

      return {
        path: relativePath,
        sha256: await hashFile(filePath),
        ...commandSource ? { commandSource } : {}
      };
    }));

    return {
      generatedBy: 'scripts/build/command-artifact-manifest.ts',
      agents: [...BUILD_COMMAND_AGENTS],
      scripts: [...scripts],
      files: entries.sort((left, right) => left.path.localeCompare(right.path))
    };
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
};

const stableStringify = (manifest: ArtifactManifest): string =>
  `${JSON.stringify(manifest, null, 2)}\n`;

const main = async (): Promise<void> => {
  const mode = process.argv.includes('--update') ? 'update' : 'check';
  const manifest = await createManifest();
  const content = stableStringify(manifest);

  if (mode === 'update') {
    await writeFile(manifestPath, content);
    console.log(`已更新生成产物 manifest: ${manifestPath}`);
    return;
  }

  const expected = await readFile(manifestPath, 'utf-8');
  if (expected !== content) {
    console.error('生成产物 manifest 已变化。请运行 npm run update:command-manifest 并提交结果。');
    process.exit(1);
  }

  console.log('生成产物 manifest 一致。');
};

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
