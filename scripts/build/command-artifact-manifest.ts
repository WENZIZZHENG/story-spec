#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCommandArtifacts,
  BUILD_COMMAND_AGENTS
} from '../../src/prompt/build-commands.js';

interface ArtifactEntry {
  path: string;
  sha256: string;
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

const createManifest = async (): Promise<ArtifactManifest> => {
  const outDir = path.join(os.tmpdir(), `novel-command-artifacts-${Date.now()}`);

  try {
    await buildCommandArtifacts({
      rootDir,
      outDir,
      agents: BUILD_COMMAND_AGENTS,
      scripts
    });

    const files = await walkFiles(outDir);
    const entries = await Promise.all(files.map(async filePath => ({
      path: path.relative(outDir, filePath).replace(/\\/g, '/'),
      sha256: await hashFile(filePath)
    })));

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
