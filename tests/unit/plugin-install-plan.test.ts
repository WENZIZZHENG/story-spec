import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PluginManager } from '../../src/plugins/manager.js';

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
  const dir = await mkdtemp(path.join(os.tmpdir(), 'novel-plugin-plan-'));
  tempDirs.push(dir);
  return dir;
};

const writeFixtureFile = async (rootDir: string, relativePath: string, content: string) => {
  const targetPath = path.join(rootDir, relativePath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, content);
};

const createPluginSource = async () => {
  const sourcePath = await makeTempDir();

  await writeFixtureFile(sourcePath, 'config.yaml', `name: demo-plugin
version: 1.0.0
description: Demo plugin
type: feature
commands:
  - id: demo-command
    file: commands/demo-command.md
    description: Demo command
experts:
  - id: demo-expert
    file: experts/demo-expert.md
    title: Demo expert
    description: Demo expert
`);
  await writeFixtureFile(sourcePath, 'commands/demo-command.md', `---
description: Demo command
---

Run demo
`);
  await writeFixtureFile(sourcePath, 'commands-gemini/demo-command.toml', 'description = "Demo command"\nprompt = "Run demo"\n');
  await writeFixtureFile(sourcePath, 'experts/demo-expert.md', '# Demo expert');

  return sourcePath;
};

const createHookPluginSource = async () => {
  const sourcePath = await makeTempDir();

  await writeFixtureFile(sourcePath, 'config.yaml', `name: hook-plugin
version: 1.0.0
description: Hook plugin
type: feature
hooks:
  - id: enrich-plan
    point: pre-prompt-compile
    source: commands/plan-enhance.md
    target: .specify/templates/commands/plan.md
    marker: demo-plan
    strategy: replace-marker
`);
  await writeFixtureFile(sourcePath, 'commands/plan-enhance.md', 'Injected hook content');

  return sourcePath;
};

const createProjectRoot = async () => {
  const projectRoot = await makeTempDir();
  await mkdir(path.join(projectRoot, '.claude', 'commands'), { recursive: true });
  await mkdir(path.join(projectRoot, '.gemini', 'commands'), { recursive: true });
  await mkdir(path.join(projectRoot, '.cursor', 'commands'), { recursive: true });
  return projectRoot;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('PluginManager install plan', () => {
  it('plans plugin package, command, gemini command and expert writes with conflicts', async () => {
    const projectRoot = await createProjectRoot();
    const sourcePath = await createPluginSource();
    const manager = new PluginManager(projectRoot);

    await mkdir(path.join(projectRoot, 'plugins', 'demo-plugin'), { recursive: true });
    await writeFixtureFile(projectRoot, '.claude/commands/demo-command.md', 'existing');

    const plan = await manager.planInstallPlugin('demo-plugin', sourcePath);

    expect(plan.manifest.name).toBe('demo-plugin');
    expect(plan.operations.map(operation => ({
      kind: operation.kind,
      target: path.relative(projectRoot, operation.targetPath).replace(/\\/g, '/'),
      conflict: operation.conflict
    }))).toEqual(expect.arrayContaining([
      { kind: 'copy-plugin', target: 'plugins/demo-plugin', conflict: true },
      { kind: 'install-command', target: '.claude/commands/demo-command.md', conflict: true },
      { kind: 'install-command', target: '.cursor/commands/demo-command.md', conflict: false },
      { kind: 'install-gemini-command', target: '.gemini/commands/demo-command.toml', conflict: false },
      { kind: 'register-expert', target: 'experts/plugins/demo-plugin/demo-expert.md', conflict: false }
    ]));
    expect(plan.conflicts.map(conflict => path.relative(projectRoot, conflict.targetPath).replace(/\\/g, '/'))).toEqual([
      'plugins/demo-plugin',
      '.claude/commands/demo-command.md'
    ]);
  });

  it('applies a previously generated install plan', async () => {
    const projectRoot = await createProjectRoot();
    const sourcePath = await createPluginSource();
    const manager = new PluginManager(projectRoot);
    const plan = await manager.planInstallPlugin('demo-plugin', sourcePath);

    await manager.applyInstallPlan(plan);

    await expect(exists(path.join(projectRoot, 'plugins', 'demo-plugin', 'config.yaml'))).resolves.toBe(true);
    await expect(exists(path.join(projectRoot, '.claude', 'commands', 'demo-command.md'))).resolves.toBe(true);
    await expect(exists(path.join(projectRoot, '.cursor', 'commands', 'demo-command.md'))).resolves.toBe(true);
    await expect(exists(path.join(projectRoot, '.gemini', 'commands', 'demo-command.toml'))).resolves.toBe(true);
    await expect(exists(path.join(projectRoot, 'experts', 'plugins', 'demo-plugin', 'demo-expert.md'))).resolves.toBe(true);
    await expect(readFile(path.join(projectRoot, '.gemini', 'commands', 'demo-command.toml'), 'utf-8')).resolves.toContain('Demo command');
  });

  it('plans and applies replace-marker hook operations', async () => {
    const projectRoot = await createProjectRoot();
    const sourcePath = await createHookPluginSource();
    const manager = new PluginManager(projectRoot);

    await writeFixtureFile(
      projectRoot,
      '.specify/templates/commands/plan.md',
      'Before\n<!-- PLUGIN_HOOK: demo-plan -->\nAfter'
    );

    const plan = await manager.planInstallPlugin('hook-plugin', sourcePath);

    expect(plan.operations.map(operation => ({
      kind: operation.kind,
      target: path.relative(projectRoot, operation.targetPath).replace(/\\/g, '/'),
      conflict: operation.conflict
    }))).toEqual(expect.arrayContaining([
      { kind: 'apply-hook', target: '.specify/templates/commands/plan.md', conflict: false }
    ]));

    await manager.applyInstallPlan(plan);

    await expect(readFile(path.join(projectRoot, '.specify/templates/commands/plan.md'), 'utf-8')).resolves.toBe(
      'Before\nInjected hook content\nAfter'
    );
  });

  it('blocks conflicting writes unless force is enabled', async () => {
    const projectRoot = await createProjectRoot();
    const sourcePath = await createPluginSource();
    const manager = new PluginManager(projectRoot);

    await writeFixtureFile(projectRoot, '.claude/commands/demo-command.md', 'existing');
    const plan = await manager.planInstallPlugin('demo-plugin', sourcePath);

    await expect(manager.applyInstallPlan(plan)).rejects.toMatchObject({
      name: 'PluginInstallConflictError'
    });
    await expect(readFile(path.join(projectRoot, '.claude/commands/demo-command.md'), 'utf-8')).resolves.toBe('existing');

    await manager.applyInstallPlan(plan, { force: true });

    await expect(readFile(path.join(projectRoot, '.claude/commands/demo-command.md'), 'utf-8')).resolves.toContain('Run demo');
  });
});
