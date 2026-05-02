import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const cliPath = path.join(repoRoot, 'dist', 'cli.js');
const tempDirs: string[] = [];

const makeTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'novel-cli-commands-'));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('CLI command modules smoke', () => {
  it('renders help and info from split command modules', async () => {
    const [{ stdout: help }, { stdout: info }] = await Promise.all([
      execFileAsync('node', [cliPath, '--help'], { cwd: repoRoot }),
      execFileAsync('node', [cliPath, 'info'], { cwd: repoRoot })
    ]);

    expect(help).toContain('init [options] [name]');
    expect(help).toContain('plugins:add [options] <name>');
    expect(help).toContain('upgrade [options]');
    expect(help).toContain('validate [options]');
    expect(info).toContain('三幕结构');
    expect(info).toContain('雪花十步');
  });

  it('runs plugin help without requiring a project', async () => {
    const { stdout } = await execFileAsync('node', [cliPath, 'plugins'], { cwd: repoRoot });

    expect(stdout).toContain('插件管理命令');
    expect(stdout).toContain('novel plugins add <name>');
  });

  it('previews plugin installation without writing files', async () => {
    const cwd = await makeTempDir();
    await execFileAsync('node', [
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
    await writeFile(path.join(projectPath, '.codex', 'prompts', 'translate.md'), 'existing');

    const { stdout } = await execFileAsync('node', [
      cliPath,
      'plugins:add',
      'translate',
      '--dry-run'
    ], { cwd: projectPath });

    expect(stdout).toContain('预览模式');
    expect(stdout).toContain('plugins/translate');
    expect(stdout).toContain('.codex/prompts/translate.md');
    expect(stdout).toContain('冲突');
  });

  it('runs upgrade dry-run against an initialized project', async () => {
    const cwd = await makeTempDir();
    await execFileAsync('node', [
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
    const { stdout } = await execFileAsync('node', [
      cliPath,
      'upgrade',
      '--dry-run',
      '--yes'
    ], { cwd: projectPath });

    expect(stdout).toContain('Novel Writer 项目升级');
    expect(stdout).toContain('预览模式');
    expect(stdout).toContain('更新命令文件');
  });
});
