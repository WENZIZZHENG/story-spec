import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { detectInstalledAI, findProjectRoot, getProjectInfo } from '../../src/utils/project.js';

const tempDirs: string[] = [];

const createTempProject = async () => {
  const projectPath = await mkdtemp(path.join(os.tmpdir(), 'novel-project-test-'));
  tempDirs.push(projectPath);
  await mkdir(path.join(projectPath, '.specify'), { recursive: true });
  await writeFile(
    path.join(projectPath, '.specify', 'config.json'),
    JSON.stringify({ name: 'smoke', version: '1.2.3' }, null, 2)
  );
  return projectPath;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('project utilities', () => {
  it('detects installed AI platforms through the shared registry', async () => {
    const projectPath = await createTempProject();
    await mkdir(path.join(projectPath, '.github'), { recursive: true });
    await mkdir(path.join(projectPath, '.codex'), { recursive: true });
    await mkdir(path.join(projectPath, '.not-an-ai'), { recursive: true });

    await expect(detectInstalledAI(projectPath)).resolves.toEqual(['copilot', 'codex']);
  });

  it('finds a project root from nested directories', async () => {
    const projectPath = await createTempProject();
    const nestedPath = path.join(projectPath, 'stories', '001-demo', 'content');
    await mkdir(nestedPath, { recursive: true });

    await expect(findProjectRoot(nestedPath)).resolves.toBe(projectPath);
  });

  it('returns project info with version and installed AI config', async () => {
    const projectPath = await createTempProject();
    await mkdir(path.join(projectPath, '.codex'), { recursive: true });

    await expect(getProjectInfo(projectPath)).resolves.toMatchObject({
      root: projectPath,
      version: '1.2.3',
      installedAI: ['codex']
    });
  });
});
