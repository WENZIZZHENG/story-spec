import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  upgradeProject,
  UpgradeProjectError,
  type UpgradeProjectEvent
} from '../../src/application/upgrade-project.js';
import { nodeFileSystem } from '../../src/infrastructure/node-file-system.js';

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
  const dir = await mkdtemp(path.join(os.tmpdir(), 'novel-upgrade-project-'));
  tempDirs.push(dir);
  return dir;
};

const createPackageRootFixture = async () => {
  const packageRoot = await makeTempDir();

  await mkdir(path.join(packageRoot, 'dist', 'codex', '.codex', 'prompts'), { recursive: true });
  await writeFile(path.join(packageRoot, 'dist', 'codex', '.codex', 'prompts', 'novel-write.md'), 'new command');
  await mkdir(path.join(packageRoot, 'dist', 'generic', '.specify', 'commands'), { recursive: true });
  await writeFile(path.join(packageRoot, 'dist', 'generic', '.specify', 'commands', 'write.md'), 'generic write');

  await mkdir(path.join(packageRoot, 'scripts', 'bash'), { recursive: true });
  await mkdir(path.join(packageRoot, 'scripts', 'powershell'), { recursive: true });
  await writeFile(path.join(packageRoot, 'scripts', 'bash', 'check-writing-state.sh'), '#!/usr/bin/env bash');
  await writeFile(path.join(packageRoot, 'scripts', 'powershell', 'check-writing-state.ps1'), 'Write-Output ok');

  await mkdir(path.join(packageRoot, 'spec', 'presets', 'three-act'), { recursive: true });
  await mkdir(path.join(packageRoot, 'spec', 'tracking'), { recursive: true });
  await mkdir(path.join(packageRoot, 'spec', 'knowledge'), { recursive: true });
  await writeFile(path.join(packageRoot, 'spec', 'config.json'), '{"schemaVersion":1}');
  await writeFile(path.join(packageRoot, 'spec', 'presets', 'three-act', 'story.md'), 'new spec');
  await writeFile(path.join(packageRoot, 'spec', 'tracking', 'should-not-copy.json'), '{}');
  await writeFile(path.join(packageRoot, 'spec', 'knowledge', 'should-not-copy.md'), 'knowledge');

  return packageRoot;
};

const createProjectFixture = async () => {
  const projectPath = await makeTempDir();

  await mkdir(path.join(projectPath, '.specify'), { recursive: true });
  await writeFile(path.join(projectPath, '.specify', 'config.json'), JSON.stringify({
    projectName: 'demo',
    version: '0.1.0'
  }));

  await mkdir(path.join(projectPath, '.codex', 'prompts'), { recursive: true });
  await writeFile(path.join(projectPath, '.codex', 'prompts', 'novel-write.md'), 'old command');

  await mkdir(path.join(projectPath, '.specify', 'scripts'), { recursive: true });
  await writeFile(path.join(projectPath, '.specify', 'scripts', 'old.txt'), 'old script');

  await mkdir(path.join(projectPath, 'spec', 'tracking'), { recursive: true });
  await mkdir(path.join(projectPath, 'spec', 'knowledge'), { recursive: true });
  await writeFile(path.join(projectPath, 'spec', 'tracking', 'plot-tracker.json'), '{"user":true}');
  await writeFile(path.join(projectPath, 'spec', 'knowledge', 'world.md'), 'user knowledge');

  return projectPath;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('upgradeProject', () => {
  it('previews selected content without changing project files', async () => {
    const packageRoot = await createPackageRootFixture();
    const projectPath = await createProjectFixture();
    const events: UpgradeProjectEvent[] = [];

    const result = await upgradeProject({
      projectPath,
      packageRoot,
      ai: 'codex',
      updateContent: {
        commands: true,
        scripts: false,
        templates: false,
        memory: false,
        spec: false,
        experts: false
      },
      fileSystem: nodeFileSystem,
      dryRun: true,
      backup: true,
      onEvent: event => events.push(event)
    });

    expect(result.projectVersion).toBe('0.1.0');
    expect(result.stats.commands).toBe(1);
    expect(result.stats.scripts).toBe(0);
    expect(result.backupPath).toBe('');
    expect(events).toContainEqual({ type: 'progress', message: '更新命令文件...' });

    await expect(readFile(path.join(projectPath, '.codex', 'prompts', 'novel-write.md'), 'utf8')).resolves.toBe('old command');
    await expect(exists(path.join(projectPath, 'backup'))).resolves.toBe(false);
  });

  it('updates selected content, protects user data, and creates a backup', async () => {
    const packageRoot = await createPackageRootFixture();
    const projectPath = await createProjectFixture();

    const result = await upgradeProject({
      projectPath,
      packageRoot,
      ai: 'codex',
      updateContent: {
        commands: true,
        scripts: false,
        templates: false,
        memory: false,
        spec: true,
        experts: false
      },
      fileSystem: nodeFileSystem,
      dryRun: false,
      backup: true
    });

    expect(result.stats.commands).toBe(1);
    expect(result.stats.spec).toBe(2);
    expect(result.backupPath).toContain(path.join(projectPath, 'backup'));

    await expect(readFile(path.join(projectPath, '.codex', 'prompts', 'novel-write.md'), 'utf8')).resolves.toBe('new command');
    await expect(readFile(path.join(projectPath, 'backup', path.basename(result.backupPath), '.codex', 'prompts', 'novel-write.md'), 'utf8')).resolves.toBe('old command');
    await expect(readFile(path.join(projectPath, 'spec', 'tracking', 'plot-tracker.json'), 'utf8')).resolves.toBe('{"user":true}');
    await expect(exists(path.join(projectPath, 'spec', 'tracking', 'should-not-copy.json'))).resolves.toBe(false);

    const config = JSON.parse(await readFile(path.join(projectPath, '.specify', 'config.json'), 'utf8')) as {
      version: string;
      integrations: Array<{ id: string }>;
    };
    expect(config.version).not.toBe('0.1.0');
    expect(config.integrations).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'codex' })
    ]));
  });

  it('infers installed legacy AI directories into config integrations during upgrade', async () => {
    const packageRoot = await createPackageRootFixture();
    const projectPath = await createProjectFixture();

    await upgradeProject({
      projectPath,
      packageRoot,
      updateContent: {
        commands: true,
        scripts: false,
        templates: false,
        memory: false,
        spec: false,
        experts: false
      },
      fileSystem: nodeFileSystem,
      dryRun: false,
      backup: false
    });

    const config = JSON.parse(await readFile(path.join(projectPath, '.specify', 'config.json'), 'utf8')) as {
      integrations: Array<{ id: string; renderer: string; commandSurface: string }>;
    };
    expect(config.integrations).toEqual([
      expect.objectContaining({
        id: 'codex',
        renderer: 'codex',
        commandSurface: 'slash-command'
      })
    ]);
  });

  it('can add generic agent commands to an existing project', async () => {
    const packageRoot = await createPackageRootFixture();
    const projectPath = await createProjectFixture();

    const result = await upgradeProject({
      projectPath,
      packageRoot,
      agent: 'generic',
      updateContent: {
        commands: true,
        scripts: false,
        templates: false,
        memory: false,
        spec: false,
        experts: false
      },
      fileSystem: nodeFileSystem,
      dryRun: false,
      backup: false
    });

    expect(result.targetAgents.map(agent => agent.id)).toEqual(['generic']);
    expect(result.targetAI).toEqual([]);
    expect(result.stats.commands).toBe(1);
    await expect(readFile(path.join(projectPath, '.specify', 'commands', 'write.md'), 'utf8')).resolves.toBe('generic write');

    const config = JSON.parse(await readFile(path.join(projectPath, '.specify', 'config.json'), 'utf8')) as {
      integrations: Array<{ id: string }>;
    };
    expect(config.integrations).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'generic' })
    ]));
  });

  it('rejects non novel-writer projects', async () => {
    const packageRoot = await createPackageRootFixture();
    const projectPath = await makeTempDir();

    await expect(upgradeProject({
      projectPath,
      packageRoot,
      ai: 'codex',
      updateContent: {
        commands: true,
        scripts: true,
        templates: false,
        memory: false,
        spec: true,
        experts: false
      },
      fileSystem: nodeFileSystem,
      dryRun: true,
      backup: false
    })).rejects.toMatchObject({
      name: 'UpgradeProjectError',
      code: 'NOT_PROJECT'
    } satisfies Partial<UpgradeProjectError>);
  });
});
