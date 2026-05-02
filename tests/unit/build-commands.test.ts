import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildCommandArtifacts } from '../../src/prompt/build-commands.js';

const tempDirs: string[] = [];

const exists = async (targetPath: string) => {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const makeTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'novel-build-commands-'));
  tempDirs.push(dir);
  return dir;
};

const createPackageRootFixture = async () => {
  const rootDir = await makeTempDir();

  await mkdir(path.join(rootDir, 'templates', 'commands'), { recursive: true });
  await writeFile(path.join(rootDir, 'templates', 'commands', 'plan.md'), `---
description: Plan story
argument-hint: [idea]
scripts:
  sh: scripts/bash/plan-story.sh
  ps: scripts/powershell/plan-story.ps1
---

Input: $ARGUMENTS
Agent: __AGENT__
Run {SCRIPT}
`);

  await mkdir(path.join(rootDir, 'templates', 'knowledge'), { recursive: true });
  await writeFile(path.join(rootDir, 'templates', 'knowledge', 'world.md'), '# world');

  await mkdir(path.join(rootDir, 'memory'), { recursive: true });
  await writeFile(path.join(rootDir, 'memory', 'constitution.md'), '# constitution');

  await mkdir(path.join(rootDir, 'scripts', 'bash'), { recursive: true });
  await mkdir(path.join(rootDir, 'scripts', 'powershell'), { recursive: true });
  await writeFile(path.join(rootDir, 'scripts', 'bash', 'plan-story.sh'), '#!/usr/bin/env bash');
  await writeFile(path.join(rootDir, 'scripts', 'powershell', 'plan-story.ps1'), 'Write-Output plan');
  await writeFile(path.join(rootDir, 'scripts', 'helper.cjs'), 'module.exports = {};');

  await mkdir(path.join(rootDir, 'experts', 'core'), { recursive: true });
  await writeFile(path.join(rootDir, 'experts', 'core', 'plot.md'), '# plot');

  await mkdir(path.join(rootDir, 'spec', 'presets'), { recursive: true });
  await mkdir(path.join(rootDir, 'spec', 'tracking'), { recursive: true });
  await mkdir(path.join(rootDir, 'spec', 'knowledge'), { recursive: true });
  await writeFile(path.join(rootDir, 'spec', 'presets', 'three-act.md'), '# three act');
  await writeFile(path.join(rootDir, 'spec', 'tracking', 'user-data.json'), '{}');
  await writeFile(path.join(rootDir, 'spec', 'knowledge', 'user-notes.md'), '# notes');

  return rootDir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('buildCommandArtifacts', () => {
  it('generates platform commands and support files without shell scripts', async () => {
    const rootDir = await createPackageRootFixture();
    const outDir = path.join(rootDir, 'out');

    const result = await buildCommandArtifacts({
      rootDir,
      outDir,
      agents: ['codex', 'gemini'],
      scripts: ['sh']
    });

    expect(result.variants).toEqual([
      { agent: 'codex', script: 'sh', commandCount: 1 },
      { agent: 'gemini', script: 'sh', commandCount: 1 }
    ]);

    const codexPrompt = await readFile(path.join(outDir, 'codex', '.codex', 'prompts', 'novel-plan.md'), 'utf-8');
    expect(codexPrompt).not.toMatch(/^---/);
    expect(codexPrompt).toContain('Agent: codex');
    expect(codexPrompt).toContain('.specify/scripts/bash/plan-story.sh');

    const geminiPrompt = await readFile(path.join(outDir, 'gemini', '.gemini', 'commands', 'novel', 'plan.toml'), 'utf-8');
    expect(geminiPrompt).toContain('description = "Plan story"');
    expect(geminiPrompt).toContain('Input: {{args}}');
    expect(geminiPrompt).toContain('.specify/scripts/bash/plan-story.sh');

    await expect(exists(path.join(outDir, 'codex', '.specify', 'memory', 'constitution.md'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'scripts', 'bash', 'plan-story.sh'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'scripts', 'helper.cjs'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'templates', 'knowledge', 'world.md'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'templates', 'commands', 'plan.md'))).resolves.toBe(false);
    await expect(exists(path.join(outDir, 'codex', 'spec', 'presets', 'three-act.md'))).resolves.toBe(true);

    await expect(readdir(path.join(outDir, 'codex', 'spec', 'tracking'))).resolves.toEqual([]);
    await expect(readdir(path.join(outDir, 'codex', 'spec', 'knowledge'))).resolves.toEqual([]);
  });
});
