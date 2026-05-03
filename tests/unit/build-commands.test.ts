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
  const dir = await mkdtemp(path.join(os.tmpdir(), 'storyspec-build-commands-'));
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
  await writeFile(path.join(rootDir, 'templates', 'commands', 'write.command.yaml'), `id: write
title: Write chapter
stage: drafting
description: Write chapter from tasks
arguments:
  hint: "[task]"
requiredReads:
  - stories/*/tasks.md
allowedWrites:
  - stories/*/content/**
scripts:
  check:
    capability: check-writing-state
    sh: scripts/bash/check-writing-state.sh
    ps: scripts/powershell/check-writing-state.ps1
`);
  await writeFile(path.join(rootDir, 'templates', 'commands', 'write.prompt.md'), `Input: $ARGUMENTS
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
  await mkdir(path.join(rootDir, 'dist'), { recursive: true });
  await writeFile(path.join(rootDir, 'dist', 'script-runtime.js'), 'console.log("runtime")');
  await mkdir(path.join(rootDir, 'dist', 'application'), { recursive: true });
  await writeFile(path.join(rootDir, 'dist', 'application', 'check-writing-state.js'), 'export const checkWritingState = async () => ({});');
  await mkdir(path.join(rootDir, 'dist', 'domain'), { recursive: true });
  await writeFile(path.join(rootDir, 'dist', 'domain', 'story-artifact.js'), 'export const parseWritingTasksFromMarkdown = () => [];');

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
      { agent: 'codex', script: 'sh', commandCount: 2 },
      { agent: 'gemini', script: 'sh', commandCount: 2 }
    ]);

    const codexPrompt = await readFile(path.join(outDir, 'codex', '.codex', 'prompts', 'storyspec-plan.md'), 'utf-8');
    expect(codexPrompt).not.toMatch(/^---/);
    expect(codexPrompt).toContain('Agent: codex');
    expect(codexPrompt).toContain('.specify/scripts/bash/plan-story.sh');
    const codexSpecPrompt = await readFile(path.join(outDir, 'codex', '.codex', 'prompts', 'storyspec-write.md'), 'utf-8');
    expect(codexSpecPrompt).not.toMatch(/^---/);
    expect(codexSpecPrompt).toContain('Agent: codex');
    expect(codexSpecPrompt).toContain('.specify/scripts/bash/check-writing-state.sh');

    const geminiPrompt = await readFile(path.join(outDir, 'gemini', '.gemini', 'commands', 'storyspec', 'plan.toml'), 'utf-8');
    expect(geminiPrompt).toContain('description = "Plan story"');
    expect(geminiPrompt).toContain('Input: {{args}}');
    expect(geminiPrompt).toContain('.specify/scripts/bash/plan-story.sh');
    const geminiSpecPrompt = await readFile(path.join(outDir, 'gemini', '.gemini', 'commands', 'storyspec', 'write.toml'), 'utf-8');
    expect(geminiSpecPrompt).toContain('description = "Write chapter from tasks"');
    expect(geminiSpecPrompt).toContain('Input: {{args}}');
    expect(geminiSpecPrompt).toContain('.specify/scripts/bash/check-writing-state.sh');

    await expect(exists(path.join(outDir, 'codex', '.specify', 'memory', 'constitution.md'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'scripts', 'bash', 'plan-story.sh'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'scripts', 'helper.cjs'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'scripts', 'runtime', 'script-runtime.js'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'scripts', 'runtime', 'application', 'check-writing-state.js'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'scripts', 'runtime', 'domain', 'story-artifact.js'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'templates', 'knowledge', 'world.md'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'templates', 'commands', 'plan.md'))).resolves.toBe(false);
    await expect(exists(path.join(outDir, 'codex', 'spec', 'presets', 'three-act.md'))).resolves.toBe(true);

    await expect(readdir(path.join(outDir, 'codex', 'spec', 'tracking'))).resolves.toEqual([]);
    await expect(readdir(path.join(outDir, 'codex', 'spec', 'knowledge'))).resolves.toEqual([]);
  });

  it('generates generic Markdown commands under .specify/commands', async () => {
    const rootDir = await createPackageRootFixture();
    const outDir = path.join(rootDir, 'out');

    const result = await buildCommandArtifacts({
      rootDir,
      outDir,
      agents: ['generic'],
      scripts: ['sh']
    });

    expect(result.variants).toEqual([
      { agent: 'generic', script: 'sh', commandCount: 2 }
    ]);

    const genericCommand = await readFile(path.join(outDir, 'generic', '.specify', 'commands', 'plan.md'), 'utf-8');
    expect(genericCommand).toContain('# Plan story');
    const genericSpecCommand = await readFile(path.join(outDir, 'generic', '.specify', 'commands', 'write.md'), 'utf-8');
    expect(genericSpecCommand).toContain('# Write chapter');
    expect(genericSpecCommand).toContain('[task]');
    expect(genericSpecCommand).toContain('- `stories/*/tasks.md`');
    expect(genericSpecCommand).toContain('- `stories/*/content/**`');
    expect(genericSpecCommand).not.toContain('.specify/scripts/bash/check-writing-state.sh');
    expect(genericSpecCommand).toContain('当前 agent 不支持 shell');
    expect(genericCommand).toContain('## 前置条件');
    expect(genericCommand).toContain('## 必须读取');
    expect(genericCommand).toContain('## 允许写入');
    expect(genericCommand).toContain('## 执行步骤');
    expect(genericCommand).toContain('## 输出位置');
    expect(genericCommand).toContain('## 降级方案');
    expect(genericCommand).not.toContain('.specify/scripts/bash/plan-story.sh');
    expect(genericCommand).toContain('当前 agent 不支持 shell');
  });

  it('generates read-only Continue check prompts', async () => {
    const rootDir = await createPackageRootFixture();
    const outDir = path.join(rootDir, 'out');

    const result = await buildCommandArtifacts({
      rootDir,
      outDir,
      agents: ['continue-check'],
      scripts: ['sh']
    });

    expect(result.variants).toEqual([
      { agent: 'continue-check', script: 'sh', commandCount: 2 }
    ]);

    const prompt = await readFile(path.join(outDir, 'continue-check', '.continue', 'prompts', 'write.md'), 'utf-8');
    expect(prompt).toContain('# Write chapter');
    expect(prompt).toContain('当前 agent 是只读模式');
    expect(prompt).toContain('不要创建、修改或删除文件');
    expect(prompt).toContain('以下路径只作为建议修改范围');
    expect(prompt).toContain('- `stories/*/content/**`');
    expect(prompt).not.toContain('.specify/scripts/bash/check-writing-state.sh');
    expect(prompt).toContain('当前 agent 不支持 shell');
  });

  it('snapshots the runtime bundle before cleaning the default dist output', async () => {
    const rootDir = await createPackageRootFixture();

    await buildCommandArtifacts({
      rootDir,
      agents: ['codex'],
      scripts: ['sh']
    });

    await expect(exists(path.join(rootDir, 'dist', 'codex', '.specify', 'scripts', 'runtime', 'script-runtime.js'))).resolves.toBe(true);
    await expect(exists(path.join(rootDir, 'dist', 'codex', '.specify', 'scripts', 'runtime', 'application', 'check-writing-state.js'))).resolves.toBe(true);
    await expect(exists(path.join(rootDir, 'dist', 'codex', '.specify', 'scripts', 'runtime', 'domain', 'story-artifact.js'))).resolves.toBe(true);
  });
});
