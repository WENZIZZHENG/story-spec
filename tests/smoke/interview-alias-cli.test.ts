import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const cliPath = path.join(repoRoot, 'dist', 'cli.js');
const tempDirs: string[] = [];

const makeTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'storyspec-interview-alias-cli-'));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('interview aliases CLI smoke', () => {
  it('maps Chinese answer aliases to clarification question ids', async () => {
    const cwd = await makeTempDir();
    await execFileAsync('node', [
      cliPath,
      'init',
      'smoke',
      '--agent',
      'generic',
      '--method',
      'three-act',
      '--no-git'
    ], { cwd });

    const projectPath = path.join(cwd, 'smoke');
    await execFileAsync('node', [
      cliPath,
      'story:new',
      '法术程序师',
      '--idea',
      '工科青年穿越到剑与魔法世界。',
      '--json'
    ], { cwd: projectPath });

    const result = await execFileAsync('node', [
      cliPath,
      'interview',
      '法术程序师',
      '--answers',
      '主角=晏无开朗务实，遇事先拆问题。;第一舞台=魔导边境学院。;伙伴=莉莉丝重新拥有名字和选择。;能力体系=中度偏硬规则。',
      '--json'
    ], { cwd: projectPath });
    const output = JSON.parse(result.stdout);

    expect(output.updatedAnswerIds).toEqual(expect.arrayContaining([
      'core.protagonist',
      'core.stage',
      'core.partner',
      'magic.rule-hardness'
    ]));
    const record = await readFile(path.join(projectPath, 'stories', '法术程序师', 'clarifications.json'), 'utf-8');
    expect(record).toContain('"questionId": "core.protagonist"');
    expect(record).toContain('"questionId": "core.stage"');
    expect(record).toContain('"questionId": "core.partner"');
    expect(record).toContain('"questionId": "magic.rule-hardness"');
  });
});
