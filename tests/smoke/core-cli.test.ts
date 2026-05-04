import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const cliPath = path.join(repoRoot, 'dist', 'cli.js');
const tempDirs: string[] = [];

const makeTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'storyspec-core-cli-'));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('core CLI smoke', () => {
  it('renders story core summary as JSON and missing-only views', async () => {
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
      '工科青年穿越到魔导边境学院，用编程思维理解符文组合。',
      '--json'
    ], { cwd: projectPath });
    await execFileAsync('node', [
      cliPath,
      'interview',
      '法术程序师',
      '--answers',
      [
        'core.premise=晏无在魔导边境学院觉醒法术程序理解能力。',
        'core.protagonist=晏无开朗务实，目标是理解学院制度并找出主要矛盾。',
        'magic.rule-hardness=中度偏硬规则，关键事故讲清魔力流向、术式断点和失败代价。',
        'core.scope=第一阶段不能定稿最终反派、长线威胁真相和感情线归属。'
      ].join(';'),
      '--json'
    ], { cwd: projectPath });

    const coreResult = await execFileAsync('node', [
      cliPath,
      'core',
      '法术程序师',
      '--json'
    ], { cwd: projectPath });
    const core = JSON.parse(coreResult.stdout);

    expect(core.story).toBe('法术程序师');
    expect(core.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'premise', status: 'confirmed' }),
      expect.objectContaining({ id: 'protagonist', status: 'confirmed' }),
      expect.objectContaining({ id: 'power', status: 'confirmed' }),
      expect.objectContaining({ id: 'scope', status: 'confirmed' })
    ]));

    const missingResult = await execFileAsync('node', [
      cliPath,
      'core',
      '法术程序师',
      '--missing',
      '--json'
    ], { cwd: projectPath });
    const missing = JSON.parse(missingResult.stdout);

    expect(missing.missingOnly).toBe(true);
    expect(missing.items.some((item: { status: string }) => item.status === 'confirmed')).toBe(false);
    expect(missing.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'partner', status: 'missing' }),
      expect.objectContaining({ id: 'stage', status: 'missing' })
    ]));
  });
});
