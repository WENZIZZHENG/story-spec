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

const UNTITLED_INPUT = [
  '晏无是个开朗务实的工科马列青年，穿越后习惯先拆问题、找主要矛盾，再把复杂事故拆成可以执行的步骤。他尊重人，行动力强，但感情迟钝，容易把亲密关系也理解成需要调试的系统。',
  '故事开局放在魔导边境学院。这里表面上是人类六国共同创办的最高魔法学府，真实问题却是知识解释权被学院高层和贵族系统垄断。',
  '他的能力来自穿越事故、禁区残响和符文碎片，能感知魔力流向、符文连接和术式断点。他用现代工程思维建立法术程序；但精神力有限，材料有限，初期正面战力弱。',
  '第一阶段不想提前定稿最终反派、长线文明威胁真相、感情线归属和莉莉丝身份背后的完整阴谋，这些只能作为候选逐步揭示。'
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

  it('keeps unlabelled long-form input as candidates in JSON output', async () => {
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
      'ingest',
      '法术程序师',
      '--text',
      UNTITLED_INPUT,
      '--apply-confirmed',
      '--json'
    ], { cwd: projectPath });
    const parsed = JSON.parse(result.stdout);

    expect(parsed.confirmedItems).toEqual([]);
    expect(parsed.candidateItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ questionId: 'core.protagonist', sourceLabel: '候选：主角' }),
      expect.objectContaining({ questionId: 'core.stage', sourceLabel: '候选：第一舞台' }),
      expect.objectContaining({ questionId: 'magic.rule-hardness', sourceLabel: '候选：能力体系' })
    ]));
    expect(parsed.written).toBe(false);
    await expect(readFile(path.join(projectPath, 'stories', '法术程序师', 'clarifications.json'), 'utf-8'))
      .rejects.toThrow();
  });
});
