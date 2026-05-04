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
  const dir = await mkdtemp(path.join(os.tmpdir(), 'storyspec-preview-summary-cli-'));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('preview summary CLI smoke', () => {
  it('writes preview summaries for JSON automation and human reports', async () => {
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
    await execFileAsync('node', [
      cliPath,
      'interview',
      '法术程序师',
      '--answers',
      'core.premise=晏无在魔导边境学院觉醒法术程序理解能力。',
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

    expect(preview.record.writeSummary.confirmedItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ questionId: 'core.premise' })
    ]));
    expect(preview.record.writeSummary.agentSuggestions.length).toBeGreaterThan(0);

    const report = await readFile(preview.markdownPath, 'utf-8');
    expect(report).toContain('## 写入摘要');
    expect(report).toContain('### 作者确认项');
    expect(report).toContain('core.premise');
    expect(report).toContain('### Agent 建议');
    expect(report).toContain('### 待确认项');
  });
});
