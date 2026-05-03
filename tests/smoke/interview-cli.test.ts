import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const cliPath = path.join(repoRoot, 'dist', 'cli.js');
const tempDirs: string[] = [];

const makeTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'novel-interview-cli-'));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('interview CLI smoke', () => {
  it('creates clarification records and replay data without an agent', async () => {
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
    const storyPath = path.join(projectPath, 'stories', 'idea-demo');
    await mkdir(storyPath, { recursive: true });
    await writeFile(path.join(storyPath, 'idea.md'), '# 模糊创意');

    const firstResult = await execFileAsync('node', [
      cliPath,
      'interview',
      'idea-demo',
      '--premise',
      '异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁',
      '--use-examples',
      '--max-questions',
      '3',
      '--json'
    ], { cwd: projectPath });
    const first = JSON.parse(firstResult.stdout);

    expect(first.story).toBe('idea-demo');
    expect(first.record.answers.length).toBe(3);
    expect(first.updatedAnswerIds.length).toBe(3);
    expect(first.handoffPrompt).toContain('/novel-specify');
    await expect(readFile(path.join(storyPath, 'clarifications.json'), 'utf-8'))
      .resolves.toContain('user-explicit');
    await expect(readFile(path.join(storyPath, 'clarifications.md'), 'utf-8'))
      .resolves.toContain('## 需要澄清');

    const secondResult = await execFileAsync('node', [
      cliPath,
      'clarify',
      'idea-demo',
      '--answers',
      'core.premise=编程施法是工具，开局仍然是轻松冒险。',
      '--max-questions',
      '3',
      '--json'
    ], { cwd: projectPath });
    const second = JSON.parse(secondResult.stdout);

    expect(second.updatedAnswerIds).toEqual(['core.premise']);
    expect(second.reusedAnswerIds.length).toBeGreaterThan(0);
    expect(second.record.answers).toEqual(expect.arrayContaining([
      expect.objectContaining({
        questionId: 'core.premise',
        answer: '编程施法是工具，开局仍然是轻松冒险。',
        source: 'user-explicit',
        confirmed: true
      })
    ]));
  });
});
