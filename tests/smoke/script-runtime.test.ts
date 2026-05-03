import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const runtimePath = path.join(repoRoot, 'dist', 'script-runtime.js');
const powershellScriptPath = path.join(repoRoot, 'scripts', 'powershell', 'check-writing-state.ps1');
const tempDirs: string[] = [];

const makeTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'novel-script-runtime-'));
  tempDirs.push(dir);
  return dir;
};

const writeFixtureFile = async (rootDir: string, relativePath: string, content: string) => {
  const targetPath = path.join(rootDir, relativePath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, content);
};

const createProjectFixture = async () => {
  const projectRoot = await makeTempDir();

  await writeFixtureFile(projectRoot, '.specify/config.json', JSON.stringify({ name: 'runtime-demo' }));
  await writeFixtureFile(projectRoot, '.specify/memory/writing-constitution.md', '# constitution');
  await writeFixtureFile(projectRoot, 'stories/demo/specification.md', '# spec');
  await writeFixtureFile(projectRoot, 'stories/demo/creative-plan.md', '# plan');
  await writeFixtureFile(projectRoot, 'stories/demo/tasks.md', `- [ ] [P0] **T001** - 第一章
  - **输出**：\`content/chapter-001.md\`
`);
  await writeFixtureFile(projectRoot, 'stories/demo/scenes/scene-001.yaml', `id: scene-001
chapter: chapter-001
order: 1
pov: 主角
location: 起始地点
time: 故事开始
sceneGoal: 主角处理第一处异常
conflict: 地方规则阻止他直接动手
outcome: 主角选择先争取临时许可
plotThread: 第一章主线转折
readerPromise: 读者看到主角主动应对异常
relationshipChange: 主角和潜在伙伴从试探转向有限合作
worldReveal:
  factId: world.example.rule
  actionImpact: 规则迫使主角改变解决问题的顺序
  beneficiaries:
    - 地方管理者
  costs:
    - 主角
  violationConsequence: 违规会失去后续调查资格
emotionalBeat: 从困惑转向主动
endingHook: 临时许可背后出现更大的异常
successCriteria:
  - 主角必须做出可见选择
  - 读者必须看见规则代价
`);
  await writeFixtureFile(projectRoot, 'stories/demo/content/chapter-001.md', '正文正文');
  await writeFixtureFile(projectRoot, 'spec/tracking/plot.json', '{"ok":true}');

  return projectRoot;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('script runtime compatibility', () => {
  it('runs TypeScript writing-state runtime directly', async () => {
    const projectRoot = await createProjectFixture();

    const { stdout } = await execFileAsync('node', [
      runtimePath,
      'check-writing-state',
      '--project-root',
      projectRoot,
      '--checklist'
    ], { cwd: projectRoot });

    expect(stdout).toContain('# 写作状态检查 Checklist');
    expect(stdout).toContain('CHK001 writing-constitution.md 存在');
    expect(stdout).toContain('下一任务：T001 - 第一章');
  });

  it('keeps the PowerShell script path working through the runtime wrapper', async () => {
    const projectRoot = await createProjectFixture();

    const { stdout } = await execFileAsync('powershell', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      powershellScriptPath,
      '--project-root',
      projectRoot,
      '--checklist'
    ], { cwd: projectRoot });

    expect(stdout).toContain('# 写作状态检查 Checklist');
    expect(stdout).toContain('CHK001 writing-constitution.md 存在');
  });
});
