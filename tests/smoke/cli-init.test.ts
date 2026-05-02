import { execFile } from 'node:child_process';
import { access, mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

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

    expect(stdout).toContain('/novel-constitution');
    expect(stdout).toContain('/novel-write');
    expect(await exists(path.join(projectPath, 'AGENTS.md'))).toBe(true);
    expect(prompts.filter(file => file.endsWith('.md'))).toHaveLength(13);
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
    const expectedDirs = [
      '.claude/commands',
      '.cursor/commands',
      '.gemini/commands',
      '.windsurf/workflows',
      '.roo/commands',
      '.github/prompts',
      '.vscode',
      '.qwen/commands',
      '.opencode/command',
      '.codex/prompts',
      '.kilocode/workflows',
      '.augment/commands',
      '.codebuddy/commands',
      '.amazonq/prompts'
    ];

    await Promise.all(expectedDirs.map(async dir => {
      expect(await exists(path.join(projectPath, dir))).toBe(true);
    }));
  });
});
