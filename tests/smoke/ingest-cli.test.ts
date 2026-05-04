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

const LONG_INPUT = [
  '核心创意：工科马列青年晏无穿越到剑与魔法的世界，在魔导边境学院获得学生身份，觉醒法术程序理解能力。',
  '主角：晏无开朗务实，遇事先拆问题，再找主要矛盾，缺点是感情迟钝。',
  '能力体系：他能以编程思维理解符文组合，建立法术程序，限制是精神力有限、材料有限、初期正面战力弱。',
  '第一舞台：魔导边境学院，知识解释权被学院高层和贵族系统垄断。',
  '核心伙伴：莉莉丝重新拥有名字和选择，瑟琳娜追寻真正正义，塞拉斯蒂娅从书斋走向实践。',
  '创作边界：第一阶段不能定稿最终反派、长线威胁真相和感情线归属。',
  '补充：规则中度偏硬，学院日常和实习任务要有互动冒险感。'
].join('\n\n');

const makeTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'storyspec-ingest-cli-'));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('ingest CLI smoke', () => {
  it('previews and applies long-form story input', async () => {
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
    const notesPath = path.join(projectPath, 'notes.md');
    await execFileAsync('node', [
      cliPath,
      'story:new',
      '法术程序师',
      '--idea',
      '工科青年穿越到剑与魔法世界。',
      '--json'
    ], { cwd: projectPath });
    await writeFile(notesPath, LONG_INPUT, 'utf-8');

    const previewResult = await execFileAsync('node', [
      cliPath,
      'ingest',
      '法术程序师',
      '--file',
      'notes.md',
      '--json'
    ], { cwd: projectPath });
    const preview = JSON.parse(previewResult.stdout);

    expect(preview.written).toBe(false);
    expect(preview.confirmedItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ questionId: 'core.premise' }),
      expect.objectContaining({ questionId: 'core.scope' })
    ]));
    await expect(readFile(path.join(projectPath, 'stories', '法术程序师', 'clarifications.json'), 'utf-8'))
      .rejects.toThrow();

    const applyResult = await execFileAsync('node', [
      cliPath,
      'ingest',
      '法术程序师',
      '--file',
      'notes.md',
      '--apply-confirmed',
      '--json'
    ], { cwd: projectPath });
    const applied = JSON.parse(applyResult.stdout);

    expect(applied.written).toBe(true);
    expect(applied.updatedAnswerIds).toEqual(expect.arrayContaining([
      'core.premise',
      'core.protagonist',
      'core.scope'
    ]));
    await expect(readFile(path.join(projectPath, 'stories', '法术程序师', 'clarifications.json'), 'utf-8'))
      .resolves.toContain('core.scope');
  });
});
