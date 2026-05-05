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

const createCommandSpecPluginSource = async () => {
  const sourcePath = await makeTempDir();

  await writeFixtureFile(sourcePath, 'config.yaml', `name: spec-plugin
version: 1.0.0
description: Spec plugin
type: feature
commands:
  - id: spec-command
    file: commands/spec-command.md
    description: Spec command
`);
  await writeFixtureFile(sourcePath, 'commands/spec-command.md', '# legacy fallback');
  await writeFixtureFile(sourcePath, 'commands/spec-command.command.yaml', `id: spec-command
title: Spec command
stage: custom
description: Rendered from spec
arguments:
  hint: "[input]"
requiredReads:
  - stories/*/tasks.md
allowedWrites:
  - spec/reports/**
scripts:
  check:
    capability: spec-check
    sh: scripts/bash/spec-check.sh
    ps: scripts/powershell/spec-check.ps1
`);
  await writeFixtureFile(sourcePath, 'commands/spec-command.prompt.md', `Input: $ARGUMENTS
Agent: __AGENT__
Run {SCRIPT}
`);

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
    await writeFixtureFile(projectRoot, '.claude/commands/storyspec.demo-command.md', 'existing');

    const plan = await manager.planInstallPlugin('demo-plugin', sourcePath);

    expect(plan.manifest.name).toBe('demo-plugin');
    expect(plan.operations.map(operation => ({
      kind: operation.kind,
      target: path.relative(projectRoot, operation.targetPath).replace(/\\/g, '/'),
      conflict: operation.conflict
    }))).toEqual(expect.arrayContaining([
      { kind: 'copy-plugin', target: 'plugins/demo-plugin', conflict: true },
      { kind: 'install-command', target: '.claude/commands/storyspec.demo-command.md', conflict: true },
      { kind: 'install-command', target: '.cursor/commands/demo-command.md', conflict: false },
      { kind: 'install-gemini-command', target: '.gemini/commands/demo-command.toml', conflict: false },
      { kind: 'register-expert', target: 'experts/plugins/demo-plugin/demo-expert.md', conflict: false }
    ]));
    expect(plan.conflicts.map(conflict => path.relative(projectRoot, conflict.targetPath).replace(/\\/g, '/'))).toEqual([
      'plugins/demo-plugin',
      '.claude/commands/storyspec.demo-command.md'
    ]);
    expect(plan.agentImpacts.map(impact => ({
      agent: impact.agent,
      installed: impact.installed,
      statuses: impact.commandImpacts.map(commandImpact => commandImpact.status),
      targets: impact.commandImpacts.map(commandImpact => path.relative(projectRoot, commandImpact.targetPath).replace(/\\/g, '/'))
    }))).toEqual(expect.arrayContaining([
      {
        agent: 'claude',
        installed: true,
        statuses: ['conflict'],
        targets: ['.claude/commands/storyspec.demo-command.md']
      },
      {
        agent: 'codex',
        installed: false,
        statuses: ['skipped'],
        targets: ['.codex/prompts/storyspec-demo-command.md']
      }
    ]));
  });

  it('applies a previously generated install plan', async () => {
    const projectRoot = await createProjectRoot();
    const sourcePath = await createPluginSource();
    const manager = new PluginManager(projectRoot);
    const plan = await manager.planInstallPlugin('demo-plugin', sourcePath);

    await manager.applyInstallPlan(plan);

    await expect(exists(path.join(projectRoot, 'plugins', 'demo-plugin', 'config.yaml'))).resolves.toBe(true);
    await expect(exists(path.join(projectRoot, '.claude', 'commands', 'storyspec.demo-command.md'))).resolves.toBe(true);
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

    await writeFixtureFile(projectRoot, '.claude/commands/storyspec.demo-command.md', 'existing');
    const plan = await manager.planInstallPlugin('demo-plugin', sourcePath);

    await expect(manager.applyInstallPlan(plan)).rejects.toMatchObject({
      name: 'PluginInstallConflictError'
    });
    await expect(readFile(path.join(projectRoot, '.claude/commands/storyspec.demo-command.md'), 'utf-8')).resolves.toBe('existing');

    await manager.applyInstallPlan(plan, { force: true });

    await expect(readFile(path.join(projectRoot, '.claude/commands/storyspec.demo-command.md'), 'utf-8')).resolves.toContain('Run demo');
  });

  it('renders plugin CommandSpec commands through the agent renderers', async () => {
    const projectRoot = await createProjectRoot();
    const sourcePath = await createCommandSpecPluginSource();
    const manager = new PluginManager(projectRoot);

    await mkdir(path.join(projectRoot, '.codex', 'prompts'), { recursive: true });
    await mkdir(path.join(projectRoot, '.specify', 'commands'), { recursive: true });

    const plan = await manager.planInstallPlugin('spec-plugin', sourcePath);

    expect(plan.operations.map(operation => ({
      kind: operation.kind,
      target: path.relative(projectRoot, operation.targetPath).replace(/\\/g, '/'),
      generated: operation.generated
    }))).toEqual(expect.arrayContaining([
      { kind: 'install-command', target: '.codex/prompts/storyspec-spec-command.md', generated: true },
      { kind: 'install-gemini-command', target: '.gemini/commands/spec-command.toml', generated: true },
      { kind: 'install-command', target: '.specify/commands/spec-command.md', generated: true }
    ]));
    expect(plan.agentImpacts.map(impact => ({
      agent: impact.agent,
      installed: impact.installed,
      target: impact.commandImpacts[0]?.targetPath
        ? path.relative(projectRoot, impact.commandImpacts[0].targetPath).replace(/\\/g, '/')
        : undefined,
      status: impact.commandImpacts[0]?.status
    }))).toEqual(expect.arrayContaining([
      { agent: 'codex', installed: true, target: '.codex/prompts/storyspec-spec-command.md', status: 'write' },
      { agent: 'generic', installed: true, target: '.specify/commands/spec-command.md', status: 'write' },
      { agent: 'q', installed: false, target: '.amazonq/prompts/spec-command.md', status: 'skipped' }
    ]));

    await manager.applyInstallPlan(plan);

    await expect(readFile(path.join(projectRoot, '.codex', 'prompts', 'storyspec-spec-command.md'), 'utf-8'))
      .resolves.toContain('Agent: codex');
    await expect(readFile(path.join(projectRoot, '.gemini', 'commands', 'spec-command.toml'), 'utf-8'))
      .resolves.toContain('description = "Rendered from spec"');
    await expect(readFile(path.join(projectRoot, '.specify', 'commands', 'spec-command.md'), 'utf-8'))
      .resolves.toContain('- `stories/*/tasks.md`');
  });

  it('rejects plugins that require a newer core version', async () => {
    const projectRoot = await createProjectRoot();
    const sourcePath = await makeTempDir();
    const manager = new PluginManager(projectRoot);

    await writeFixtureFile(sourcePath, 'config.yaml', `name: future-plugin
version: 1.0.0
description: Future plugin
type: feature
dependencies:
  core: ">=99.0.0"
`);

    await expect(manager.planInstallPlugin('future-plugin', sourcePath)).rejects.toThrow(/需要 StorySpec >=99\.0\.0/);
  });

  it('resolves bundled, local path and file URL plugin sources', async () => {
    const projectRoot = await createProjectRoot();
    const sourcePath = await createPluginSource();
    const packageRoot = await makeTempDir();
    await mkdir(path.join(packageRoot, 'plugins'), { recursive: true });
    await mkdir(path.join(packageRoot, 'plugins', 'bundled-plugin'), { recursive: true });
    await writeFixtureFile(packageRoot, 'plugins/bundled-plugin/config.yaml', `name: bundled-plugin
version: 1.0.0
description: Bundled plugin
type: feature
`);
    const manager = new PluginManager(projectRoot);

    await expect(manager.resolvePluginSource('bundled-plugin', packageRoot)).resolves.toBe(path.join(packageRoot, 'plugins', 'bundled-plugin'));
    await expect(manager.resolvePluginSource(sourcePath, packageRoot)).resolves.toBe(sourcePath);
    await expect(manager.resolvePluginSource(new URL(`file:///${sourcePath.replace(/\\/g, '/')}`).href, packageRoot))
      .resolves.toBe(sourcePath);
    await expect(manager.resolvePluginSource('https://example.com/plugin.git', packageRoot)).rejects.toThrow(/网络插件安装尚未支持/);
  });
});
