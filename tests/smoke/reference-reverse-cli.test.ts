import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const cliPath = path.join(repoRoot, 'dist', 'cli.js');
const tempDirs: string[] = [];

const NOTES = [
  '参考作品：灰塔符文师',
  '我喜欢底层矿村、贵族学院、知识垄断和符文调试的爽点。',
  '我不喜欢后期直接继承灰塔王座，也不想复制艾琳娜、黑曜教团、第七符文。',
  '我想修复魔力枯竭危机和师徒慢热承诺，但做成新的边境公共设施故事，不续写原作。'
].join('\n');

const makeTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'storyspec-reference-cli-'));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('reference reverse CLI smoke', () => {
  it('prints a preview-only JSON extraction without writing canon files', async () => {
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
      '新法术公共设施',
      '--idea',
      '边境维修工重建魔法公共设施。',
      '--json'
    ], { cwd: projectPath });

    const result = await execFileAsync('node', [
      cliPath,
      'reference:reverse',
      '新法术公共设施',
      '--title',
      '灰塔符文师',
      '--text',
      NOTES,
      '--json'
    ], { cwd: projectPath });
    const parsed = JSON.parse(result.stdout);

    expect(parsed.written).toBe(false);
    expect(parsed.story).toBe('新法术公共设施');
    expect(parsed.originalDependencies).toEqual(expect.arrayContaining([
      expect.objectContaining({ item: '灰塔' }),
      expect.objectContaining({ item: '艾琳娜' })
    ]));
    expect(parsed.highRiskSimilarities).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '直接续写或修复原作结局' })
    ]));
    expect(parsed.appealSignals).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '底层进入规则核心' }),
      expect.objectContaining({ label: '规则化神秘系统' })
    ]));
    expect(parsed.translatableStructures.map((item: { label: string }) => item.label)).toContain('知识垄断与解释权');
    expect(parsed.readerPromises).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '解释权成长' }),
      expect.objectContaining({ label: '公共危机兑现' })
    ]));
    expect(parsed.repairDirections).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '拒绝突兀身份奖励' })
    ]));
    expect(parsed.originalizationGuides).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceStructure: '符文调试爽点' })
    ]));
    expect(parsed.doNotCopy).toContain('不要生成未授权的原作续写正文。');
    await expect(readFile(path.join(projectPath, 'stories', '新法术公共设施', 'specification.md'), 'utf-8'))
      .rejects.toThrow();
    await expect(readFile(path.join(projectPath, 'spec', 'canon', 'canon.json'), 'utf-8'))
      .rejects.toThrow();
  });

  it('supports reading notes from a local file and rendering text output', async () => {
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
      '新法术公共设施',
      '--idea',
      '边境维修工重建魔法公共设施。',
      '--json'
    ], { cwd: projectPath });
    await writeFile(path.join(projectPath, 'reference-notes.md'), NOTES, 'utf-8');

    const result = await execFileAsync('node', [
      cliPath,
      'reference:reverse',
      '新法术公共设施',
      '--file',
      'reference-notes.md'
    ], { cwd: projectPath });

    expect(result.stdout).toContain('StorySpec 参考作品反向拆解预览');
    expect(result.stdout).toContain('预览未写入');
    expect(result.stdout).toContain('结构吸引力');
    expect(result.stdout).toContain('读者承诺');
    expect(result.stdout).toContain('修复方向');
    expect(result.stdout).toContain('原创化指南');
    expect(result.stdout).toContain('不得直接照搬');
    expect(result.stdout).toContain('不要生成未授权的原作续写正文');
  });
});
