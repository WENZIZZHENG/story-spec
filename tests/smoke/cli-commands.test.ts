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
    expect(help).toContain('agent:list [options]');
    expect(help).toContain('agent:add [options] <id>');
    expect(help).toContain('agent:doctor [options]');
    expect(help).toContain('contract:print [options]');
    expect(help).toContain('contract:sync [options]');
    expect(help).toContain('plugins:add [options] <name>');
    expect(help).toContain('upgrade [options]');
    expect(help).toContain('status [options]');
    expect(help).toContain('handoff [options] [story]');
    expect(help).toContain('tasks:board [options] [story]');
    expect(help).toContain('validate [options]');
    expect(info).toContain('三幕结构');
    expect(info).toContain('雪花十步');
  });

  it('prints the default agent contract', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath,
      'contract:print',
      '--project-name',
      '星河'
    ], { cwd: repoRoot });

    expect(stdout).toContain('Novel Writer Agent Contract');
    expect(stdout).toContain('星河');
    expect(stdout).toContain('.specify/agent-contract.md');
  });

  it('previews syncing agent contract in a project', async () => {
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
      'contract:sync',
      '--dry-run',
      '--json'
    ], { cwd: projectPath });

    const result = JSON.parse(stdout);
    expect(result.source).toBe('project');
    expect(result.dryRun).toBe(true);
    expect(result.targets).toEqual(expect.arrayContaining([
      expect.objectContaining({
        relativePath: '.specify/agent-contract.md',
        action: 'source'
      }),
      expect.objectContaining({
        relativePath: 'AGENTS.md'
      })
    ]));
  });

  it('lists agent integrations as JSON', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath,
      'agent:list',
      '--json'
    ], { cwd: repoRoot });

    const result = JSON.parse(stdout);
    expect(result.count).toBeGreaterThan(1);
    expect(result.integrations[0]).toMatchObject({
      id: 'generic',
      displayName: 'Generic Markdown Agent',
      commandSurface: 'markdown-command',
      renderer: 'generic-markdown'
    });
    expect(result.integrations.some((integration: { id: string }) => integration.id === 'codex')).toBe(true);
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
    await writeFile(path.join(projectPath, '.codex', 'prompts', 'novel-translate.md'), 'existing');

    const { stdout } = await execFileAsync('node', [
      cliPath,
      'plugins:add',
      'translate',
      '--dry-run'
    ], { cwd: projectPath });

    expect(stdout).toContain('预览模式');
    expect(stdout).toContain('plugins/translate');
    expect(stdout).toContain('Agent integration 影响');
    expect(stdout).toContain('Codex CLI (codex)');
    expect(stdout).toContain('.codex/prompts/novel-translate.md');
    expect(stdout).toContain('Generic Markdown Agent (generic)');
    expect(stdout).toContain('未安装，跳过');
    expect(stdout).toContain('冲突');
  });

  it('blocks plugin overwrite unless --force is used', async () => {
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
    const commandPath = path.join(projectPath, '.codex', 'prompts', 'novel-translate.md');
    await writeFile(commandPath, 'existing');

    await expect(execFileAsync('node', [
      cliPath,
      'plugins:add',
      'translate'
    ], { cwd: projectPath })).rejects.toMatchObject({
      stderr: expect.stringContaining('冲突')
    });
    await expect(readFile(commandPath, 'utf-8')).resolves.toBe('existing');

    await execFileAsync('node', [
      cliPath,
      'plugins:add',
      'translate',
      '--force'
    ], { cwd: projectPath });

    await expect(readFile(commandPath, 'utf-8')).resolves.not.toBe('existing');
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

  it('shows a compatibility hint for legacy upgrade --ai', async () => {
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
      '--ai',
      'codex',
      '--commands',
      '--dry-run',
      '--yes'
    ], { cwd: projectPath });

    expect(stdout).toContain('--ai 已进入兼容期');
    expect(stdout).toContain('--agent codex');
  });

  it('adds generic commands to an existing project through upgrade --agent', async () => {
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
    await execFileAsync('node', [
      cliPath,
      'upgrade',
      '--agent',
      'generic',
      '--commands',
      '--yes',
      '--no-backup'
    ], { cwd: projectPath });

    await expect(readFile(path.join(projectPath, '.specify', 'commands', 'write.md'), 'utf-8'))
      .resolves.toContain('## 执行步骤');

    const validateResult = await execFileAsync('node', [
      cliPath,
      'validate',
      '--json'
    ], { cwd: projectPath });
    const validation = JSON.parse(validateResult.stdout);
    expect(validation.valid).toBe(true);
    expect(validation.summary.agentCommandsChecked).toBeGreaterThan(0);
  });

  it('adds generic commands through agent:add', async () => {
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
      'agent:add',
      'generic',
      '--no-backup'
    ], { cwd: projectPath });

    expect(stdout).toContain('Agent integration 安装');
    expect(stdout).toContain('Generic Markdown Agent');
    await expect(readFile(path.join(projectPath, '.specify', 'commands', 'write.md'), 'utf-8'))
      .resolves.toContain('## 执行步骤');
  });

  it('checks installed agent integrations through agent:doctor', async () => {
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
    const { stdout } = await execFileAsync('node', [
      cliPath,
      'agent:doctor',
      '--json'
    ], { cwd: projectPath });

    const result = JSON.parse(stdout);
    expect(result.valid).toBe(true);
    expect(result.integrations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'generic',
        installed: true,
        commandCount: expect.any(Number)
      })
    ]));
  });

  it('exports tasks.md as a JSON task board', async () => {
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
    const storyPath = path.join(projectPath, 'stories', '001-demo');
    await mkdir(storyPath, { recursive: true });
    await writeFile(path.join(storyPath, 'tasks.md'), `- [ ] [P0] [WRITE-READY] **T001** - 起草第一章
  - **必须读取**：
    - \`specification.md\`
  - **允许修改**：
    - \`content/chapter-001.md\`
  - **依赖**：无
  - **输出**：\`content/chapter-001.md\`
  - **验收标准**：
    - [ ] 完成正文
`);

    const { stdout } = await execFileAsync('node', [
      cliPath,
      'tasks:board',
      '--json'
    ], { cwd: projectPath });

    const board = JSON.parse(stdout);
    expect(board.story.name).toBe('001-demo');
    expect(board.summary.total).toBe(1);
    expect(board.tasks[0].githubIssue.title).toBe('[P0] T001 起草第一章');
  });

  it('generates a JSON handoff package', async () => {
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
    const storyPath = path.join(projectPath, 'stories', '001-demo');
    await mkdir(storyPath, { recursive: true });
    await writeFile(path.join(storyPath, 'specification.md'), '# spec');
    await writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
    await writeFile(path.join(storyPath, 'tasks.md'), `- [ ] [P0] [WRITE-READY] **T001** - 起草第一章
  - **必须读取**：
    - \`specification.md\`
  - **允许修改**：
    - \`content/chapter-001.md\`
  - **依赖**：无
  - **输出**：\`content/chapter-001.md\`
`);

    const { stdout } = await execFileAsync('node', [
      cliPath,
      'handoff',
      '--json'
    ], { cwd: projectPath });

    const handoff = JSON.parse(stdout);
    expect(handoff.story.name).toBe('001-demo');
    expect(handoff.nextTask.id).toBe('T001');
    expect(handoff.currentChapter.path).toBe('stories/001-demo/content/chapter-001.md');
  });
});
