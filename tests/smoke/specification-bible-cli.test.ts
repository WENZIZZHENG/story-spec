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
  const dir = await mkdtemp(path.join(os.tmpdir(), 'storyspec-spec-bible-cli-'));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('specification bible CLI smoke', () => {
  it('applies a structured specification without truncating confirmed answers', async () => {
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
    const protagonist = '晏无开朗务实，遇事先拆问题，再找主要矛盾。他尊重人，行动力强，擅长把复杂问题拆成可执行步骤；缺点是感情迟钝，容易把亲密关系也当成需要调试的问题，所以这句长答案必须完整进入规格文件。';
    await execFileAsync('node', [
      cliPath,
      'story:new',
      '法术程序师',
      '--idea',
      '工科青年穿越到剑与魔法世界。',
      '--json'
    ], { cwd: projectPath });
    await execFileAsync('node', [
      cliPath,
      'interview',
      '法术程序师',
      '--answers',
      [
        'core.premise=晏无在魔导边境学院觉醒法术程序理解能力。',
        `core.protagonist=${protagonist}`,
        'core.partner=莉莉丝重新拥有名字和选择，瑟琳娜追寻真正正义。',
        'core.stage=魔导边境学院垄断知识解释权，普通学生和底层工作人员承受制度代价。',
        'magic.rule-hardness=中度偏硬规则，关键事故讲清魔力流向、术式断点和失败代价。',
        'core.faction-conflict=学院高层和贵族系统通过许可、考试和审查制造第一卷制度阻力。',
        'core.scope=第一阶段不能定稿最终反派、长线威胁真相和感情线归属。'
      ].join(';'),
      '--json'
    ], { cwd: projectPath });

    const previewResult = await execFileAsync('node', [
      cliPath,
      'preview',
      'specify',
      '法术程序师',
      '--json'
    ], { cwd: projectPath });
    const preview = JSON.parse(previewResult.stdout);
    await execFileAsync('node', [
      cliPath,
      'apply',
      preview.record.id,
      '--yes',
      '--json'
    ], { cwd: projectPath });

    const specification = await readFile(path.join(projectPath, 'stories', '法术程序师', 'specification.md'), 'utf-8');
    expect(specification).toContain('## 类型与阅读承诺');
    expect(specification).toContain('## 主角与成长线');
    expect(specification).toContain('## 创作边界');
    expect(specification).toContain(protagonist);
    expect(specification).toContain('这句长答案必须完整进入规格文件');
  });
});
