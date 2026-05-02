import { execFile } from 'node:child_process';
import { access, mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import golden from '../fixtures/cli-init-golden.json' with { type: 'json' };

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const cliPath = path.join(repoRoot, 'dist', 'cli.js');
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
  const dir = await mkdtemp(path.join(os.tmpdir(), 'novel-cli-smoke-'));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('CLI init smoke', () => {
  it('initializes a Codex project with prompts and AGENTS.md', async () => {
    const cwd = await makeTempDir();
    const { stdout } = await execFileAsync('node', [
      cliPath,
      'init',
      'smoke',
      '--ai',
      'codex',
      '--method',
      'three-act',
      '--no-git'
    ], { cwd });

    const projectPath = path.join(cwd, 'smoke');
    const prompts = await readdir(path.join(projectPath, '.codex', 'prompts'));

    golden.codex.requiredStdout.forEach(text => {
      expect(stdout).toContain(text);
    });
    await Promise.all(golden.codex.requiredFiles.map(async file => {
      expect(await exists(path.join(projectPath, file))).toBe(true);
    }));
    expect(prompts.filter(file => file.endsWith('.md'))).toHaveLength(golden.codex.promptCount);

    const statusResult = await execFileAsync('node', [
      cliPath,
      'codex-status',
      '--json'
    ], { cwd: projectPath });
    const status = JSON.parse(statusResult.stdout);

    expect(status.projectName).toBe(golden.codex.status.projectName);
    expect(status.method).toBe(golden.codex.status.method);
    expect(status.configuredAI).toEqual(golden.codex.status.configuredAI);
    expect(status.codex.prompts).toBe(true);
    expect(status.codex.agentsFile).toBe(true);
    expect(status.tracking).toHaveLength(golden.codex.status.trackingFiles);

    const validateResult = await execFileAsync('node', [
      cliPath,
      'validate',
      '--json'
    ], { cwd: projectPath });
    const validation = JSON.parse(validateResult.stdout);

    expect(validation.projectRoot).toBe(projectPath);
    expect(validation.valid).toBe(true);
    expect(validation.summary.trackingFiles).toBe(golden.codex.status.trackingFiles);
    expect(validation.issues).toEqual([]);

    const filteredValidateResult = await execFileAsync('node', [
      cliPath,
      'validate',
      '--json',
      '--severity',
      'error'
    ], { cwd: projectPath });
    const filteredValidation = JSON.parse(filteredValidateResult.stdout);

    expect(filteredValidation.minSeverity).toBe('error');
    expect(filteredValidation.issues).toEqual([]);
  });

  it('initializes every configured AI platform with command directories', async () => {
    const cwd = await makeTempDir();
    await execFileAsync('node', [
      cliPath,
      'init',
      'smoke',
      '--all',
      '--method',
      'three-act',
      '--no-git'
    ], { cwd });

    const projectPath = path.join(cwd, 'smoke');
    await Promise.all(golden.allPlatforms.expectedDirs.map(async dir => {
      expect(await exists(path.join(projectPath, dir))).toBe(true);
    }));
  });
});
