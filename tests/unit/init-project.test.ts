import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  initProject,
  InitProjectError,
  type InitProjectEvent
} from '../../src/application/init-project.js';

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
  const dir = await mkdtemp(path.join(os.tmpdir(), 'novel-init-project-'));
  tempDirs.push(dir);
  return dir;
};

const createPackageRootFixture = async () => {
  const packageRoot = await makeTempDir();

  await mkdir(path.join(packageRoot, 'dist', 'codex', '.codex', 'prompts'), { recursive: true });
  await writeFile(path.join(packageRoot, 'dist', 'codex', '.codex', 'prompts', 'novel-write.md'), '# write');

  await mkdir(path.join(packageRoot, 'templates', 'tracking'), { recursive: true });
  await mkdir(path.join(packageRoot, 'templates', 'knowledge'), { recursive: true });
  await writeFile(path.join(packageRoot, 'templates', 'AGENTS.codex.md'), '# {{PROJECT_NAME}}\n');
  await writeFile(path.join(packageRoot, 'templates', 'tracking', 'plot-tracker.json'), '{}');
  await writeFile(path.join(packageRoot, 'templates', 'knowledge', 'world-setting.md'), 'updated [日期]');

  await mkdir(path.join(packageRoot, 'spec', 'presets', 'three-act'), { recursive: true });
  await writeFile(path.join(packageRoot, 'spec', 'config.json'), '{}');
  await writeFile(path.join(packageRoot, 'spec', 'presets', 'three-act', 'story.md'), '# story');

  return packageRoot;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('initProject', () => {
  it('creates a Codex project from package artifacts', async () => {
    const cwd = await makeTempDir();
    const packageRoot = await createPackageRootFixture();
    const events: InitProjectEvent[] = [];

    const result = await initProject({
      name: 'smoke',
      cwd,
      packageRoot,
      here: false,
      ai: 'codex',
      all: false,
      method: 'three-act',
      git: false,
      withExperts: false,
      onEvent: event => events.push(event)
    });

    expect(result.projectName).toBe('smoke');
    expect(result.targetPlatforms.map(platform => platform.name)).toEqual(['codex']);
    expect(result.aiDirs).toContain('.codex/prompts');
    expect(events).toContainEqual({ type: 'progress', message: '已安装 codex 配置...' });

    const projectPath = path.join(cwd, 'smoke');
    await expect(exists(path.join(projectPath, '.specify', 'config.json'))).resolves.toBe(true);
    await expect(exists(path.join(projectPath, '.codex', 'prompts', 'novel-write.md'))).resolves.toBe(true);
    await expect(exists(path.join(projectPath, 'AGENTS.md'))).resolves.toBe(true);
    await expect(exists(path.join(projectPath, 'spec', 'tracking', 'plot-tracker.json'))).resolves.toBe(true);
    await expect(exists(path.join(projectPath, 'spec', 'knowledge', 'world-setting.md'))).resolves.toBe(true);
  });

  it('rejects an existing project directory', async () => {
    const cwd = await makeTempDir();
    const packageRoot = await createPackageRootFixture();
    await mkdir(path.join(cwd, 'smoke'));

    await expect(initProject({
      name: 'smoke',
      cwd,
      packageRoot,
      here: false,
      ai: 'codex',
      all: false,
      method: 'three-act',
      git: false,
      withExperts: false
    })).rejects.toMatchObject({
      name: 'InitProjectError',
      code: 'PROJECT_EXISTS'
    } satisfies Partial<InitProjectError>);
  });
});
