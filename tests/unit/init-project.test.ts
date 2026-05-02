import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  initProject,
  InitProjectError,
  type InitProjectEvent
} from '../../src/application/init-project.js';
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
  const dir = await mkdtemp(path.join(os.tmpdir(), 'novel-init-project-'));
  tempDirs.push(dir);
  return dir;
};

const createPackageRootFixture = async () => {
  const packageRoot = await makeTempDir();

  await mkdir(path.join(packageRoot, 'dist', 'codex', '.codex', 'prompts'), { recursive: true });
  await writeFile(path.join(packageRoot, 'dist', 'codex', '.codex', 'prompts', 'novel-write.md'), '# write');
  await mkdir(path.join(packageRoot, 'dist', 'generic', '.specify', 'commands'), { recursive: true });
  await writeFile(path.join(packageRoot, 'dist', 'generic', '.specify', 'commands', 'write.md'), '# generic write');

  await mkdir(path.join(packageRoot, 'templates', 'agent'), { recursive: true });
  await mkdir(path.join(packageRoot, 'templates', 'tracking'), { recursive: true });
  await mkdir(path.join(packageRoot, 'templates', 'knowledge'), { recursive: true });
  await mkdir(path.join(packageRoot, 'templates', 'world'), { recursive: true });
  await mkdir(path.join(packageRoot, 'templates', 'canon'), { recursive: true });
  await writeFile(
    path.join(packageRoot, 'templates', 'agent', 'agent-contract.md'),
    '# Contract {{PROJECT_NAME}}\n\n{{AGENTS_PROFILE_SECTION}}\n'
  );
  await writeFile(path.join(packageRoot, 'templates', 'tracking', 'plot-tracker.json'), '{}');
  await writeFile(path.join(packageRoot, 'templates', 'knowledge', 'world-setting.md'), 'updated [日期]');
  await writeFile(path.join(packageRoot, 'templates', 'world', 'rules.yaml'), 'worldFacts: []');
  await writeFile(path.join(packageRoot, 'templates', 'canon', 'facts.json'), '{"canonFacts": []}');

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
      fileSystem: nodeFileSystem,
      onEvent: event => events.push(event)
    });

    expect(result.projectName).toBe('smoke');
    expect(result.targetPlatforms.map(platform => platform.name)).toEqual(['codex']);
    expect(result.aiDirs).toContain('.codex/prompts');
    expect(events).toContainEqual({ type: 'progress', message: '已安装 codex 配置...' });

    const projectPath = path.join(cwd, 'smoke');
    await expect(exists(path.join(projectPath, '.specify', 'config.json'))).resolves.toBe(true);
    await expect(exists(path.join(projectPath, '.specify', 'agent-contract.md'))).resolves.toBe(true);
    await expect(exists(path.join(projectPath, '.codex', 'prompts', 'novel-write.md'))).resolves.toBe(true);
    await expect(exists(path.join(projectPath, 'AGENTS.md'))).resolves.toBe(true);
    await expect(readFile(path.join(projectPath, '.specify', 'agent-contract.md'), 'utf-8')).resolves.toContain('Contract smoke');
    await expect(readFile(path.join(projectPath, 'AGENTS.md'), 'utf-8')).resolves.toContain('Default profile');
    await expect(exists(path.join(projectPath, 'spec', 'tracking', 'plot-tracker.json'))).resolves.toBe(true);
    await expect(exists(path.join(projectPath, 'spec', 'knowledge', 'world-setting.md'))).resolves.toBe(true);
    await expect(exists(path.join(projectPath, 'spec', 'world', 'rules.yaml'))).resolves.toBe(true);
    await expect(exists(path.join(projectPath, 'spec', 'canon', 'facts.json'))).resolves.toBe(true);
  });

  it('renders configured AGENTS.md writing profiles for Codex projects', async () => {
    const cwd = await makeTempDir();
    const packageRoot = await createPackageRootFixture();

    await initProject({
      name: 'profiled',
      cwd,
      packageRoot,
      here: false,
      ai: 'codex',
      all: false,
      method: 'three-act',
      git: false,
      withExperts: false,
      agentsProfile: 'adult,slow-burn,adventure',
      fileSystem: nodeFileSystem
    });

    const agents = await readFile(path.join(cwd, 'profiled', 'AGENTS.md'), 'utf-8');
    expect(agents).toContain('Profile `adult`');
    expect(agents).toContain('consent boundary');
    expect(agents).toContain('Profile `slow-burn`');
    expect(agents).toContain('gradual emotional escalation');
    expect(agents).toContain('Profile `adventure`');
    expect(agents).toContain('external stakes');
    await expect(readFile(path.join(cwd, 'profiled', '.specify', 'agent-contract.md'), 'utf-8')).resolves.toContain('Profile `adult`');
  });

  it('creates a generic agent project with Markdown commands', async () => {
    const cwd = await makeTempDir();
    const packageRoot = await createPackageRootFixture();

    const result = await initProject({
      name: 'generic-smoke',
      cwd,
      packageRoot,
      here: false,
      agent: 'generic',
      method: 'three-act',
      git: false,
      withExperts: false,
      fileSystem: nodeFileSystem
    });

    expect(result.targetAgents.map(agent => agent.id)).toEqual(['generic']);
    expect(result.targetPlatforms).toEqual([]);
    expect(result.aiDirs).toContain('.specify/commands');

    const projectPath = path.join(cwd, 'generic-smoke');
    await expect(exists(path.join(projectPath, '.specify', 'commands', 'write.md'))).resolves.toBe(true);
    await expect(exists(path.join(projectPath, '.codex'))).resolves.toBe(false);

    const config = JSON.parse(await readFile(path.join(projectPath, '.specify', 'config.json'), 'utf-8')) as {
      agent: string;
      integrations: Array<{ id: string }>;
    };
    expect(config.agent).toBe('generic');
    expect(config.integrations).toEqual([expect.objectContaining({ id: 'generic' })]);
  });

  it('keeps legacy --all limited to legacy AI platforms', async () => {
    const cwd = await makeTempDir();
    const packageRoot = await createPackageRootFixture();

    const result = await initProject({
      name: 'all-legacy',
      cwd,
      packageRoot,
      here: false,
      ai: 'codex',
      all: true,
      method: 'three-act',
      git: false,
      withExperts: false,
      fileSystem: nodeFileSystem
    });

    expect(result.targetAgents.map(agent => agent.id)).not.toContain('generic');
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
      withExperts: false,
      fileSystem: nodeFileSystem
    })).rejects.toMatchObject({
      name: 'InitProjectError',
      code: 'PROJECT_EXISTS'
    } satisfies Partial<InitProjectError>);
  });
});
