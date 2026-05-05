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
    expect(help).toContain('interview [options] [story]');
    expect(help).toContain('clarify [options] [story]');
    expect(help).toContain('story:new [options] <name>');
    expect(help).toContain('next [options] [story]');
    expect(help).toContain('core [options] [story]');
    expect(help).toContain('ingest [options] [story]');
    expect(help).toContain('co:create [options] [story]');
    expect(help).toContain('creative:report [options] [story]');
    expect(help).toContain('clarification:doctor');
    expect(help).toContain('clarification:rollback');
    expect(help).toContain('preview');
    expect(help).toContain('apply [options] <previewId>');
    expect(help).toContain('plugins:add [options] <name>');
    expect(help).toContain('upgrade [options]');
    expect(help).toContain('status [options]');
    expect(help).toContain('handoff [options] [story]');
    expect(help).toContain('tasks:board [options] [story]');
    expect(help).toContain('tasks:set-status [options] <taskId>');
    expect(help).toContain('task:finish [options] <taskId>');
    expect(help).toContain('validate [options]');
    expect(help).toContain('review [options]');
    expect(help).toContain('preset:list [options]');
    expect(help).toContain('preset:add [options] <id>');
    expect(help).toContain('preset:doctor [options]');
    expect(help).toContain('context:pack [options] [story]');
    expect(help).toContain('draft:new [options] [story]');
    expect(help).toContain('narrative:test [options] [story]');
    expect(help).toContain('dialogue:extract [options] [story]');
    expect(help).toContain('branch:create [options] <title>');
    expect(help).toContain('author-profile [options]');
    expect(help).toContain('promise:check [options]');
    expect(help).toContain('tension:chart [options]');
    expect(help).toContain('research:add [options] <title>');
    expect(help).toContain('style:lint [options] [story]');
    expect(help).toContain('compile [options]');
    expect(help).toContain('feedback:to-tasks [options]');
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

    expect(stdout).toContain('StorySpec Agent 合约');
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
    expect(stdout).toContain('storyspec plugins add <name>');
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
    expect(stdout).toContain('.codex/prompts/storyspec-translate.md');
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
    const commandPath = path.join(projectPath, '.codex', 'prompts', 'storyspec-translate.md');
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

    expect(stdout).toContain('StorySpec 项目升级');
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

  it('sets a task status from the CLI without rewriting unchanged files', async () => {
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
    const tasksPath = path.join(storyPath, 'tasks.md');
    const boardPath = path.join(storyPath, 'task-board.json');
    await mkdir(storyPath, { recursive: true });
    await writeFile(tasksPath, `- [ ] [P0] [WRITE-READY] **T001** - 起草第一章
  - **必须读取**：
    - \`specification.md\`
  - **允许修改**：
    - \`content/chapter-001.md\`
  - **依赖**：无
  - **输出**：\`content/chapter-001.md\`
`);

    const doneResult = await execFileAsync('node', [
      cliPath,
      'tasks:set-status',
      'T001',
      '001-demo',
      '--status',
      'done',
      '--json'
    ], { cwd: projectPath });
    const done = JSON.parse(doneResult.stdout);

    expect(done).toMatchObject({
      taskId: 'T001',
      statusBefore: 'todo',
      statusAfter: 'done',
      changed: true
    });
    await expect(readFile(tasksPath, 'utf-8'))
      .resolves.toContain('- [x] [P0] [WRITE-READY] **T001** - 起草第一章');
    const boardAfterFirstRun = await readFile(boardPath, 'utf-8');

    const doneAgainResult = await execFileAsync('node', [
      cliPath,
      'tasks:set-status',
      'T001',
      '001-demo',
      '--status',
      'done',
      '--json'
    ], { cwd: projectPath });
    const doneAgain = JSON.parse(doneAgainResult.stdout);

    expect(doneAgain).toMatchObject({
      taskId: 'T001',
      statusBefore: 'done',
      statusAfter: 'done',
      changed: false,
      updatedFiles: []
    });
    await expect(readFile(boardPath, 'utf-8')).resolves.toBe(boardAfterFirstRun);
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

  it('generates a target-agent aware handoff package', async () => {
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
      '--target-agent',
      'continue-check',
      '--json'
    ], { cwd: projectPath });

    const handoff = JSON.parse(stdout);
    expect(handoff.targetAgent).toMatchObject({
      id: 'continue-check',
      capabilities: expect.objectContaining({
        writeFiles: false,
        runShell: false
      })
    });
    expect(handoff.riskBoundaries.join('\n')).toContain('只读模式');
  });

  it('checks world and canon documents as JSON', async () => {
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
    const worldResult = await execFileAsync('node', [
      cliPath,
      'world:check',
      '--json'
    ], { cwd: projectPath });
    const canonResult = await execFileAsync('node', [
      cliPath,
      'canon:check',
      '--json'
    ], { cwd: projectPath });

    const world = JSON.parse(worldResult.stdout);
    const canon = JSON.parse(canonResult.stdout);

    expect(world.files.length).toBeGreaterThan(0);
    expect(world.facts.length).toBeGreaterThan(0);
    expect(world.issues).toEqual([]);
    expect(canon.files.length).toBeGreaterThan(0);
    expect(canon.facts.length).toBeGreaterThan(0);
    expect(canon.issues).toEqual([]);
  });

  it('checks graph and scene documents as JSON', async () => {
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
    const storyPath = path.join(projectPath, 'stories', '001-demo');
    await mkdir(storyPath, { recursive: true });

    const initSceneResult = await execFileAsync('node', [
      cliPath,
      'scene:init',
      '001-demo',
      '--json'
    ], { cwd: projectPath });
    const graphResult = await execFileAsync('node', [
      cliPath,
      'graph:build',
      '--json'
    ], { cwd: projectPath });
    const entityResult = await execFileAsync('node', [
      cliPath,
      'entity:list',
      '--json'
    ], { cwd: projectPath });
    const sceneResult = await execFileAsync('node', [
      cliPath,
      'scene:check',
      '001-demo',
      '--json'
    ], { cwd: projectPath });
    const compileResult = await execFileAsync('node', [
      cliPath,
      'scene:compile',
      '001-demo',
      '--json'
    ], { cwd: projectPath });
    const impactResult = await execFileAsync('node', [
      cliPath,
      'graph:impact',
      'entity.protagonist',
      '--json'
    ], { cwd: projectPath });

    const initialized = JSON.parse(initSceneResult.stdout);
    const graph = JSON.parse(graphResult.stdout);
    const entity = JSON.parse(entityResult.stdout);
    const scenes = JSON.parse(sceneResult.stdout);
    const compiled = JSON.parse(compileResult.stdout);
    const impact = JSON.parse(impactResult.stdout);

    expect(initialized.outputPath).toContain('scene-001.yaml');
    expect(graph.entities.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.indexes.adjacency['entity.protagonist']).toContain('entity.start-location');
    expect(entity.entities.length).toBe(graph.entities.length);
    expect(scenes.scenes).toHaveLength(1);
    expect(scenes.issues).toEqual([]);
    expect(compiled.draftPaths).toContain('content/chapter-001.md');
    expect(impact.edges.length).toBeGreaterThan(0);
    expect(impact.evidencePaths.length).toBeGreaterThan(0);
  });

  it('checks voice fingerprints as JSON', async () => {
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
    const voiceResult = await execFileAsync('node', [
      cliPath,
      'voice:check',
      '--json'
    ], { cwd: projectPath });
    const sampleResult = await execFileAsync('node', [
      cliPath,
      'voice:sample',
      'entity.protagonist',
      '--json'
    ], { cwd: projectPath });

    const voice = JSON.parse(voiceResult.stdout);
    const sample = JSON.parse(sampleResult.stdout);

    expect(voice.fingerprints.length).toBeGreaterThan(0);
    expect(voice.issues).toEqual([]);
    expect(sample.fingerprint.characterId).toBe('entity.protagonist');
    expect(sample.samples.length).toBeGreaterThan(0);
  });

  it('runs reviewer loop as JSON', async () => {
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
    const reviewResult = await execFileAsync('node', [
      cliPath,
      'review',
      '--panel',
      'worldbuilding,voice,editor',
      '--chapter',
      '001',
      '--json'
    ], { cwd: projectPath });

    const review = JSON.parse(reviewResult.stdout);
    expect(review.reviewers.map((reviewer: { id: string }) => reviewer.id)).toEqual([
      'worldbuilding',
      'voice',
      'editor'
    ]);
    expect(review.chapter).toBe('001');
    expect(review.findings.every((finding: {
      path: string;
      severity: string;
      evidence: string;
      suggestedAction: string;
    }) => (
      typeof finding.path === 'string'
      && typeof finding.severity === 'string'
      && typeof finding.evidence === 'string'
      && typeof finding.suggestedAction === 'string'
    ))).toBe(true);
    expect(review.taskDrafts).toEqual(expect.any(Array));
  });

  it('installs and validates a genre preset as JSON', async () => {
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
    const listResult = await execFileAsync('node', [
      cliPath,
      'preset:list',
      '--json'
    ], { cwd: repoRoot });
    const list = JSON.parse(listResult.stdout);

    expect(list.presets.map((preset: { id: string }) => preset.id)).toContain('xuanhuan-cultivation');

    const addResult = await execFileAsync('node', [
      cliPath,
      'preset:add',
      'xuanhuan-cultivation',
      '--json'
    ], { cwd: projectPath });
    const installed = JSON.parse(addResult.stdout);

    expect(installed.preset.id).toBe('xuanhuan-cultivation');
    expect(installed.targetDir).toContain(path.join('.specify', 'presets', 'xuanhuan-cultivation'));
    await expect(readFile(path.join(projectPath, 'spec', 'presets', 'current-preset.json'), 'utf-8'))
      .resolves.toContain('xuanhuan-cultivation');

    const doctorResult = await execFileAsync('node', [
      cliPath,
      'preset:doctor',
      '--json'
    ], { cwd: projectPath });
    const doctor = JSON.parse(doctorResult.stdout);

    expect(doctor.activePreset.id).toBe('xuanhuan-cultivation');
    expect(doctor.issues).toEqual([]);

    const validateResult = await execFileAsync('node', [
      cliPath,
      'validate',
      '--json'
    ], { cwd: projectPath });
    const validation = JSON.parse(validateResult.stdout);

    expect(validation.valid).toBe(true);
    expect(validation.summary.activePreset).toBe('xuanhuan-cultivation');
    expect(validation.issues).toEqual([]);
  });

  it('runs workbench context, draft, and narrative commands as JSON', async () => {
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
    const storyPath = path.join(projectPath, 'stories', '001-demo');
    await mkdir(storyPath, { recursive: true });
    await mkdir(path.join(storyPath, 'scenes'), { recursive: true });
    await writeFile(path.join(storyPath, 'specification.md'), '# spec');
    await writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
    await writeFile(path.join(storyPath, 'tasks.md'), `# tasks

- [ ] [P0] [WRITE-READY] **T001** - 起草第一章
  - **必须读取**：
    - \`scenes/scene-001.yaml\`
  - **允许修改**：
    - \`content/chapter-001.md\`
    - \`tasks.md\`
  - **输出**：\`content/chapter-001.md\`
  - **验收标准**：
    - [ ] 主角主动做选择
    - [ ] 场景体现世界规则带来的行动代价
`);
    await writeFile(path.join(storyPath, 'scenes', 'scene-001.yaml'), `id: scene-001
chapter: chapter-001
order: 1
pov: 主角
location: 起始地点
time: 故事开始
sceneGoal: 主角决定处理第一处异常
conflict: 地方规则阻止他直接动手
outcome: 主角选择先争取一个临时许可
plotThread: 第一章主线转折
readerPromise: 读者看到主角开始主动处理异常
relationshipChange: 主角和潜在伙伴从互相试探转向有限合作
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
entities:
  - entity.protagonist
worldElements:
  - world.example.rule
reveals:
  - world.example.rule 会改变主角行动
`);

    const packResult = await execFileAsync('node', [
      cliPath,
      'context:pack',
      '001-demo',
      '--task',
      'T001',
      '--json'
    ], { cwd: projectPath });
    const pack = JSON.parse(packResult.stdout);

    expect(pack.targetTask).toBe('T001');
    expect(pack.mustRead.every((item: { reason: string }) => item.reason.length > 0)).toBe(true);
    expect(pack.allowedWrites).toContain('stories/001-demo/content/chapter-001.md');

    const draftResult = await execFileAsync('node', [
      cliPath,
      'draft:new',
      '001-demo',
      '--chapter',
      '001',
      '--json'
    ], { cwd: projectPath });
    const draft = JSON.parse(draftResult.stdout);

    expect(draft.record.id).toBe('chapter-001.v1');
    expect(draft.record.status).toBe('draft');

    const promotePreviewResult = await execFileAsync('node', [
      cliPath,
      'draft:promote',
      'chapter-001.v1',
      '--story',
      '001-demo',
      '--json'
    ], { cwd: projectPath });
    const promotePreview = JSON.parse(promotePreviewResult.stdout);

    expect(promotePreview.dryRun).toBe(true);

    const narrativeResult = await execFileAsync('node', [
      cliPath,
      'narrative:test',
      '001-demo',
      '--chapter',
      '001',
      '--json'
    ], { cwd: projectPath });
    const narrative = JSON.parse(narrativeResult.stdout);

    expect(narrative.summary.pass).toBeGreaterThan(0);
    expect(narrative.results[0].suggestedAction).toEqual(expect.any(String));
  });

  it('runs story onboarding, creative report, preview, and apply as JSON', async () => {
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
    const storyResult = await execFileAsync('node', [
      cliPath,
      'story:new',
      '法术编译纪元',
      '--idea',
      '异界穿越、轻松冒险、编程施法',
      '--json'
    ], { cwd: projectPath });
    const story = JSON.parse(storyResult.stdout);

    expect(story.story).toBe('法术编译纪元');
    await expect(readFile(path.join(projectPath, 'stories', '法术编译纪元', 'idea.md'), 'utf-8'))
      .resolves.toContain('## 用户原文');

    const nextResult = await execFileAsync('node', [
      cliPath,
      'next',
      '法术编译纪元',
      '--json'
    ], { cwd: projectPath });
    const next = JSON.parse(nextResult.stdout);

    expect(next.stage).toBe('idea');
    expect(next.actions[0].action).toBe('continue_interview');
    expect(next.actions.map((action: { action: string }) => action.action)).not.toContain('run_command');
    expect(next.actions[0].command).toBe('storyspec interview 法术编译纪元 --focus power --premise "异界穿越、轻松冒险、编程施法"');

    const statusResult = await execFileAsync('node', [
      cliPath,
      'status',
      '--json'
    ], { cwd: projectPath });
    const status = JSON.parse(statusResult.stdout);

    expect(status.navigationEntries.map((entry: { action: string }) => entry.action)).toEqual([
      'ingest_longform_material',
      'start_from_short_idea',
      'ingest_table_material',
      'start_casual_chat'
    ]);
    expect(status.navigationEntries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        action: 'ingest_longform_material',
        copyableCommand: expect.stringMatching(/^storyspec ingest /)
      }),
      expect.objectContaining({
        action: 'ingest_table_material',
        copyableCommand: expect.stringMatching(/^storyspec ingest /)
      })
    ]));
    expect(status.navigationEntries.map((entry: { copyableCommand: string }) => entry.copyableCommand).join('\n'))
      .not.toContain('storyspec next 法术编译纪元\nstoryspec next 法术编译纪元');

    await execFileAsync('node', [
      cliPath,
      'interview',
      '法术编译纪元',
      '--premise',
      '异界穿越、轻松冒险、编程施法',
      '--answers',
      'core.premise=编程施法只是工具，开局仍然是轻松冒险。;core.protagonist=主角开局的盲区是把人的立场也当成可直接重构的系统，目标是先学会理解人和组织再改造规则。;magic.rule-hardness=中间路线，关键战斗讲规则，日常冒险保持轻巧。',
      '--max-questions',
      '2',
      '--json'
    ], { cwd: projectPath });

    const reportResult = await execFileAsync('node', [
      cliPath,
      'creative:report',
      '法术编译纪元',
      '--json'
    ], { cwd: projectPath });
    const report = JSON.parse(reportResult.stdout);

    expect(report.confirmed).toEqual(expect.arrayContaining([
      expect.objectContaining({ questionId: 'core.premise' })
    ]));

    const previewResult = await execFileAsync('node', [
      cliPath,
      'preview',
      'specify',
      '法术编译纪元',
      '--json'
    ], { cwd: projectPath });
    const preview = JSON.parse(previewResult.stdout);

    expect(preview.record.kind).toBe('specify');
    expect(preview.record.risks).toEqual([]);

    const dryRunResult = await execFileAsync('node', [
      cliPath,
      'apply',
      preview.record.id,
      '--json'
    ], { cwd: projectPath });
    const dryRun = JSON.parse(dryRunResult.stdout);

    expect(dryRun.dryRun).toBe(true);
    await expect(readFile(path.join(projectPath, 'stories', '法术编译纪元', 'specification.md'), 'utf-8'))
      .rejects.toThrow();

    const applyResult = await execFileAsync('node', [
      cliPath,
      'apply',
      preview.record.id,
      '--yes',
      '--json'
    ], { cwd: projectPath });
    const applied = JSON.parse(applyResult.stdout);

    expect(applied.applied).toBe(true);
    await expect(readFile(path.join(projectPath, 'stories', '法术编译纪元', 'specification.md'), 'utf-8'))
      .resolves.toContain('## 用户已确认');
  });

  it('rolls back a confirmed clarification answer into a candidate from the CLI', async () => {
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
      '法术编译纪元',
      '--idea',
      '异界穿越、轻松冒险、编程施法',
      '--json'
    ], { cwd: projectPath });
    await execFileAsync('node', [
      cliPath,
      'interview',
      '法术编译纪元',
      '--premise',
      '异界穿越、轻松冒险、编程施法',
      '--answers',
      'core.premise=编程施法只是工具，开局仍然是轻松冒险。;magic.rule-hardness=中间路线，关键战斗讲规则，日常冒险保持轻巧。',
      '--max-questions',
      '2',
      '--json'
    ], { cwd: projectPath });

    const rollbackResult = await execFileAsync('node', [
      cliPath,
      'clarification:rollback',
      '--story',
      '法术编译纪元',
      '--question',
      'magic.rule-hardness',
      '--json'
    ], { cwd: projectPath });
    const rollback = JSON.parse(rollbackResult.stdout);

    expect(rollback.rolledBack).toMatchObject({
      questionId: 'magic.rule-hardness',
      previousConfirmed: true,
      nextConfirmed: false,
      nextSource: 'ai-suggested'
    });
    await expect(readFile(path.join(projectPath, 'stories', '法术编译纪元', 'clarifications.md'), 'utf-8'))
      .resolves.toContain('AI 建议，待确认');
  });

  it('previews and fixes orphan clarification answers from the CLI', async () => {
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
      '法术编译纪元',
      '--idea',
      '异界穿越、轻松冒险、编程施法',
      '--json'
    ], { cwd: projectPath });
    const storyPath = path.join(projectPath, 'stories', '法术编译纪元');
    await writeFile(path.join(storyPath, 'clarifications.json'), JSON.stringify({
      schemaVersion: '1.0',
      story: '法术编译纪元',
      premise: '异界穿越、轻松冒险、编程施法',
      createdAt: '2026-05-03T12:00:00.000Z',
      updatedAt: '2026-05-03T12:00:00.000Z',
      questions: [{
        id: 'core.premise',
        stage: 'specify',
        topic: 'premise',
        question: '故事核心是什么？',
        whyItMatters: '影响规格生成。',
        type: 'textarea',
        required: true,
        options: [],
        exampleAnswers: [],
        dependsOn: []
      }],
      answers: [
        {
          questionId: 'core.premise',
          answer: '编程施法只是工具。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T12:00:00.000Z',
          updatedAt: '2026-05-03T12:00:00.000Z'
        },
        {
          questionId: '文风',
          answer: '轻松明快。',
          source: 'user-explicit',
          confidence: 1,
          confirmed: true,
          createdAt: '2026-05-03T12:01:00.000Z',
          updatedAt: '2026-05-03T12:01:00.000Z'
        }
      ]
    }, null, 2));

    const previewResult = await execFileAsync('node', [
      cliPath,
      'clarification:doctor',
      '--story',
      '法术编译纪元',
      '--json'
    ], { cwd: projectPath });
    const preview = JSON.parse(previewResult.stdout);

    expect(preview.fixed).toBe(false);
    expect(preview.summary.orphanAnswers).toBe(1);
    expect(preview.orphanAnswers[0]).toMatchObject({
      questionId: '文风',
      action: 'archive'
    });

    const fixResult = await execFileAsync('node', [
      cliPath,
      'clarification:doctor',
      '--story',
      '法术编译纪元',
      '--fix',
      '--json'
    ], { cwd: projectPath });
    const fixed = JSON.parse(fixResult.stdout);

    expect(fixed.fixed).toBe(true);
    const record = JSON.parse(await readFile(path.join(storyPath, 'clarifications.json'), 'utf-8'));
    expect(record.answers).toEqual([
      expect.objectContaining({ questionId: 'core.premise' })
    ]);
    expect(record.archivedAnswers).toEqual([
      expect.objectContaining({
        questionId: '文风',
        answer: '轻松明快。',
        reason: 'orphan-answer-question-not-found'
      })
    ]);
    await expect(readFile(path.join(storyPath, 'clarifications.md'), 'utf-8'))
      .resolves.toContain('## 已归档澄清答案');
  });

  it('runs dialogue, branch, promise, and tension commands as JSON', async () => {
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
    const storyPath = path.join(projectPath, 'stories', '001-demo');
    await mkdir(storyPath, { recursive: true });
    await writeFile(path.join(storyPath, 'specification.md'), '# spec');
    await writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
    await writeFile(path.join(storyPath, 'tasks.md'), `# tasks

- [ ] [P0] [WRITE-READY] **T001** - 调整第一场转折
  - **必须读取**：
    - \`scenes/scene-001.yaml\`
  - **允许修改**：
    - \`content/chapter-001.md\`
  - **输出**：\`content/chapter-001.md\`
`);
    await writeFile(path.join(projectPath, 'spec', 'tracking', 'promises.json'), JSON.stringify({
      promises: [{
        id: 'promise.identity',
        type: 'mystery',
        promise: '身份谜题',
        establishedAt: 'chapter-001',
        reinforcedAt: [],
        status: 'open',
        readerExpectation: '期待身份揭示'
      }]
    }));
    await writeFile(path.join(projectPath, 'spec', 'tracking', 'tension-curve.json'), JSON.stringify({
      tensionPoints: [{
        chapter: 'chapter-012',
        scene: 'scene-001',
        tension: 8,
        emotionalCharge: 7,
        informationGain: 4,
        payoff: 1
      }]
    }));

    const rhythmResult = await execFileAsync('node', [
      cliPath,
      'rhythm:init',
      '--average-chapter-length',
      '3200',
      '--hook-frequency',
      '3',
      '--payoff-interval',
      '6',
      '--info-reveal-density',
      '2',
      '--json'
    ], { cwd: projectPath });
    const rhythm = JSON.parse(rhythmResult.stdout);

    expect(rhythm.config.sourceMode).toBe('manual-abstract');
    expect(rhythm.config.safetyBoundary).toContain('不复制参考作品表达');
    await expect(readFile(path.join(projectPath, 'spec', 'tracking', 'rhythm-config.json'), 'utf-8'))
      .resolves.toContain('"manual-abstract"');

    const dialogueResult = await execFileAsync('node', [
      cliPath,
      'dialogue:extract',
      '001-demo',
      '--scene',
      'scene-001',
      '--chapter',
      '001',
      '--json'
    ], { cwd: projectPath });
    const dialogue = JSON.parse(dialogueResult.stdout);

    expect(dialogue.written).toBe(true);
    expect(dialogue.outputPath).toContain(path.join('stories', '001-demo', 'dialogue'));

    const dialogueCheckResult = await execFileAsync('node', [
      cliPath,
      'dialogue:check',
      '001-demo',
      '--json'
    ], { cwd: projectPath });
    const dialogueCheck = JSON.parse(dialogueCheckResult.stdout);

    expect(dialogueCheck.beats).toHaveLength(1);
    expect(dialogueCheck.issues).toEqual([]);

    const branchResult = await execFileAsync('node', [
      cliPath,
      'branch:create',
      '提前揭示身份',
      '--story',
      '001-demo',
      '--changed-scenes',
      'scene-001',
      '--json'
    ], { cwd: projectPath });
    const branch = JSON.parse(branchResult.stdout);

    expect(branch.branch.status).toBe('exploring');
    expect(branch.branchDir).toContain(path.join('stories', '001-demo', 'branches'));

    const compareResult = await execFileAsync('node', [
      cliPath,
      'branch:compare',
      branch.branch.id,
      '--story',
      '001-demo',
      '--json'
    ], { cwd: projectPath });
    const compare = JSON.parse(compareResult.stdout);

    expect(compare.changedScenes).toContain('scene-001');
    expect(compare.impactedTasks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'T001' })
    ]));

    const promotePreviewResult = await execFileAsync('node', [
      cliPath,
      'branch:promote',
      branch.branch.id,
      '--story',
      '001-demo',
      '--json'
    ], { cwd: projectPath });
    const promotePreview = JSON.parse(promotePreviewResult.stdout);

    expect(promotePreview.dryRun).toBe(true);

    const promiseResult = await execFileAsync('node', [
      cliPath,
      'promise:check',
      '--json'
    ], { cwd: projectPath });
    const promise = JSON.parse(promiseResult.stdout);

    expect(promise.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'PROMISE_OPEN_TOO_LONG' }),
      expect.objectContaining({ code: 'TENSION_PAYOFF_GAP' })
    ]));
    expect(promise.taskDrafts.length).toBeGreaterThan(0);

    const tensionResult = await execFileAsync('node', [
      cliPath,
      'tension:chart',
      '--json'
    ], { cwd: projectPath });
    const tension = JSON.parse(tensionResult.stdout);

    expect(tension.markdown).toContain('| Chapter | Scene | Tension | Emotion | Info | Payoff |');
  });

  it('runs research, style, compile, and feedback commands as JSON', async () => {
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
    const storyPath = path.join(projectPath, 'stories', '001-demo');
    await mkdir(path.join(storyPath, 'content'), { recursive: true });
    await mkdir(path.join(storyPath, 'scenes'), { recursive: true });
    await writeFile(path.join(storyPath, 'specification.md'), '# spec');
    await writeFile(path.join(storyPath, 'creative-plan.md'), '# plan');
    await writeFile(path.join(storyPath, 'tasks.md'), '# tasks');
    await writeFile(path.join(storyPath, 'content', 'chapter-001.md'), '# 第一章\n\n他心中涌起一种无法言说的感觉。');
    await writeFile(path.join(storyPath, 'scenes', 'scene-001.yaml'), [
      'id: scene-001',
      'chapter: chapter-001',
      'order: 1',
      'pov: 主角',
      'location: 门外',
      'time: 夜',
      'sceneGoal: 进入',
      'conflict: 有人阻拦',
      'outcome: 推开门',
      'draftPath: content/chapter-001.md'
    ].join('\n'));
    await writeFile(path.join(storyPath, 'scenes', 'scene-002.yaml'), [
      'id: scene-002',
      'chapter: chapter-002',
      'order: 2',
      'pov: 主角',
      'location: 堂前',
      'time: 夜',
      'sceneGoal: 对峙',
      'conflict: 谎言',
      'outcome: 暂退',
      'draftPath: content/chapter-002.md'
    ].join('\n'));
    await writeFile(path.join(projectPath, 'feedback', 'beta-reader-001.md'), '开头目标不够清楚。');

    const researchAddResult = await execFileAsync('node', [
      cliPath,
      'research:add',
      '朝代制度笔记',
      '--type',
      'personal-note',
      '--note',
      '官制资料',
      '--json'
    ], { cwd: projectPath });
    const researchAdd = JSON.parse(researchAddResult.stdout);
    expect(researchAdd.source.id).toBe('source.朝代制度笔记');
    expect(researchAdd.notePath).toContain(path.join('research', 'notes'));

    const researchLinkResult = await execFileAsync('node', [
      cliPath,
      'research:link',
      researchAdd.source.id,
      'spec/world/rules.yaml',
      '--target-id',
      'world.government',
      '--reason',
      '支撑设定',
      '--json'
    ], { cwd: projectPath });
    const researchLink = JSON.parse(researchLinkResult.stdout);
    expect(researchLink.link.targetPath).toBe('spec/world/rules.yaml');

    const researchCheckResult = await execFileAsync('node', [
      cliPath,
      'research:check',
      '--json'
    ], { cwd: projectPath });
    const researchCheck = JSON.parse(researchCheckResult.stdout);
    expect(researchCheck.valid).toBe(true);
    expect(researchCheck.issues).toEqual([]);

    const styleResult = await execFileAsync('node', [
      cliPath,
      'style:lint',
      '001-demo',
      '--chapter',
      '001',
      '--json'
    ], { cwd: projectPath });
    const style = JSON.parse(styleResult.stdout);
    expect(style.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: 'style.ai-empty-abstract',
        evidence: expect.stringContaining('一种无法言说的感觉')
      })
    ]));

    const compileResult = await execFileAsync('node', [
      cliPath,
      'compile',
      '--story',
      '001-demo',
      '--format',
      'markdown',
      '--with-frontmatter',
      '--include',
      'appendix',
      '--json'
    ], { cwd: projectPath });
    const compiled = JSON.parse(compileResult.stdout);
    expect(compiled.outputPath).toContain(path.join('build', 'manuscript.md'));
    expect(compiled.frontmatterPath).toContain(path.join('build', 'manuscript.frontmatter.json'));
    expect(compiled.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_CHAPTER_FILE' })
    ]));
    await expect(readFile(path.join(projectPath, 'build', 'manuscript.md'), 'utf-8')).resolves.toContain('# 第一章');

    const writtenOnlyCompileResult = await execFileAsync('node', [
      cliPath,
      'compile',
      '--story',
      '001-demo',
      '--written-only',
      '--json'
    ], { cwd: projectPath });
    const writtenOnlyCompiled = JSON.parse(writtenOnlyCompileResult.stdout);
    expect(writtenOnlyCompiled.chapters).toHaveLength(1);
    expect(writtenOnlyCompiled.warnings).toEqual([]);

    const checkCompileResult = await execFileAsync('node', [
      cliPath,
      'compile',
      '--story',
      '001-demo',
      '--check',
      '--json'
    ], { cwd: projectPath });
    const checkedCompile = JSON.parse(checkCompileResult.stdout);
    expect(checkedCompile.written).toBe(false);
    await rm(path.join(projectPath, 'build'), { recursive: true, force: true });
    await execFileAsync('node', [
      cliPath,
      'compile',
      '--story',
      '001-demo',
      '--check',
      '--json'
    ], { cwd: projectPath });
    await expect(readFile(path.join(projectPath, 'build', 'manuscript.md'), 'utf-8'))
      .rejects.toThrow();

    const feedbackImportResult = await execFileAsync('node', [
      cliPath,
      'feedback:import',
      'feedback/beta-reader-001.md',
      '--source',
      'beta-reader-001',
      '--target',
      'stories/001-demo/content/chapter-001.md',
      '--json'
    ], { cwd: projectPath });
    const feedbackImport = JSON.parse(feedbackImportResult.stdout);
    expect(feedbackImport.imported).toHaveLength(1);

    const feedbackTasksResult = await execFileAsync('node', [
      cliPath,
      'feedback:to-tasks',
      '--json'
    ], { cwd: projectPath });
    const feedbackTasks = JSON.parse(feedbackTasksResult.stdout);
    expect(feedbackTasks.taskDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        sourceFinding: `feedback:${feedbackImport.imported[0].id}`
      })
    ]));
  });
});
