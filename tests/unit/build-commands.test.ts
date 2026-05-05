import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildCommandArtifacts } from '../../src/prompt/build-commands.js';

const tempDirs: string[] = [];

const exists = async (targetPath: string) => {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const makeTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'storyspec-build-commands-'));
  tempDirs.push(dir);
  return dir;
};

const createPackageRootFixture = async () => {
  const rootDir = await makeTempDir();

  await mkdir(path.join(rootDir, 'templates', 'commands'), { recursive: true });
  await writeFile(path.join(rootDir, 'templates', 'commands', 'plan.md'), `---
description: Plan story
argument-hint: [idea]
scripts:
  sh: scripts/bash/plan-story.sh
  ps: scripts/powershell/plan-story.ps1
---

Input: $ARGUMENTS
Agent: __AGENT__
Run {SCRIPT}
`);
  await writeFile(path.join(rootDir, 'templates', 'commands', 'write.command.yaml'), `id: write
title: Write chapter
stage: drafting
description: Write chapter from tasks
arguments:
  hint: "[task]"
requiredReads:
  - stories/*/tasks.md
allowedWrites:
  - stories/*/content/**
scripts:
  check:
    capability: check-writing-state
    sh: scripts/bash/check-writing-state.sh
    ps: scripts/powershell/check-writing-state.ps1
`);
  await writeFile(path.join(rootDir, 'templates', 'commands', 'write.prompt.md'), `Input: $ARGUMENTS
Agent: __AGENT__
## 任务边界

- 只执行状态为 \`pending\` 或用户明确指定的写作任务。
- 如果任务标记为 [PLAN-ONLY]，停止正文写作，先提示补充规划或澄清。
- 写章前先输出章节前置约束卡，覆盖时间点、当前能力与语言水平、情感检查点、硬约束、软约束和写后自检对照；等待作者确认约束卡或改写后再进入 beat 预览和正文。
- 章节前置约束卡资料不足时标为待确认，不得编造角色心理、语言进度、能力数值、关系事实或世界观正典。
- 约束卡确认后再输出 3-6 条 scene beat 或等价方向预览，beat 只是方向预览，不是已完成正文。
- 资料不足时，先列出缺失上下文，不得编造正典事实。
- 写作必须经过 preview / confirm / apply，不得跳过预览直接修改正文，也不得修改未授权文件。

## 阶段性反馈契约

- 阶段 0 - 章节前置约束卡：先输出约束卡并等待作者确认；JSON stage 字段仍使用 plan。
- 阶段 1 - beat 预览：约束卡确认后输出 3-6 条 scene beat，说明目标、冲突、人物变化、风险和缺口；JSON stage 字段只能使用 plan、write、finish，此阶段为 plan。
- 阶段 2 - 正文块：正文按 scene 或段落组分块输出，每块说明已完成的剧情功能和下一块目标；JSON stage 字段为 write。
- 阶段 3 - 收尾验证：输出正文路径、字数、验证、tracking 待更新/待确认、写后自检对照和 next action；JSON stage 字段为 finish。

## 写作流程

1. 将选中任务标记为 in_progress。
2. 先输出章节前置约束卡，并等待作者确认约束卡。
3. 约束卡确认后输出 3-6 条 scene beat 或等价方向预览。
4. 长章节必须分块输出。
5. 收尾时单独给出摘要，必须包含正文路径、建议或已执行验证、tracking 待更新/待确认、写后自检对照、next action。
Run {SCRIPT}
`);

  await mkdir(path.join(rootDir, 'templates', 'knowledge'), { recursive: true });
  await writeFile(path.join(rootDir, 'templates', 'knowledge', 'world.md'), '# world');
  await writeFile(path.join(rootDir, 'templates', 'CLAUDE.md'), '# claude entry');
  await writeFile(path.join(rootDir, 'templates', 'GEMINI.md'), '# gemini entry');
  await writeFile(path.join(rootDir, 'templates', 'copilot-instructions.md'), '# copilot instructions');
  await writeFile(path.join(rootDir, 'templates', 'vscode-settings.json'), '{"copilot":true}');
  await mkdir(path.join(rootDir, 'templates', 'cursor-rules'), { recursive: true });
  await writeFile(path.join(rootDir, 'templates', 'cursor-rules', 'story-spec.mdc'), '# cursor rule');
  await mkdir(path.join(rootDir, 'templates', 'continue-rules'), { recursive: true });
  await writeFile(path.join(rootDir, 'templates', 'continue-rules', 'story-spec.md'), '# continue rule');

  await mkdir(path.join(rootDir, 'agent-guides'), { recursive: true });
  await writeFile(path.join(rootDir, 'agent-guides', 'story-creation-guide.md'), '# story guide');

  await mkdir(path.join(rootDir, 'memory'), { recursive: true });
  await writeFile(path.join(rootDir, 'memory', 'constitution.md'), '# constitution');

  await mkdir(path.join(rootDir, 'scripts', 'bash'), { recursive: true });
  await mkdir(path.join(rootDir, 'scripts', 'powershell'), { recursive: true });
  await writeFile(path.join(rootDir, 'scripts', 'bash', 'plan-story.sh'), '#!/usr/bin/env bash');
  await writeFile(path.join(rootDir, 'scripts', 'powershell', 'plan-story.ps1'), 'Write-Output plan');
  await writeFile(path.join(rootDir, 'scripts', 'helper.cjs'), 'module.exports = {};');
  await mkdir(path.join(rootDir, 'dist'), { recursive: true });
  await writeFile(path.join(rootDir, 'dist', 'script-runtime.js'), 'console.log("runtime")');
  await mkdir(path.join(rootDir, 'dist', 'application'), { recursive: true });
  await writeFile(path.join(rootDir, 'dist', 'application', 'check-writing-state.js'), 'export const checkWritingState = async () => ({});');
  await mkdir(path.join(rootDir, 'dist', 'domain'), { recursive: true });
  await writeFile(path.join(rootDir, 'dist', 'domain', 'story-artifact.js'), 'export const parseWritingTasksFromMarkdown = () => [];');

  await mkdir(path.join(rootDir, 'experts', 'core'), { recursive: true });
  await writeFile(path.join(rootDir, 'experts', 'core', 'plot.md'), '# plot');

  await mkdir(path.join(rootDir, 'spec', 'presets'), { recursive: true });
  await mkdir(path.join(rootDir, 'spec', 'tracking'), { recursive: true });
  await mkdir(path.join(rootDir, 'spec', 'knowledge'), { recursive: true });
  await writeFile(path.join(rootDir, 'spec', 'presets', 'three-act.md'), '# three act');
  await writeFile(path.join(rootDir, 'spec', 'tracking', 'user-data.json'), '{}');
  await writeFile(path.join(rootDir, 'spec', 'knowledge', 'user-notes.md'), '# notes');

  return rootDir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('buildCommandArtifacts', () => {
  it('generates platform commands and support files without shell scripts', async () => {
    const rootDir = await createPackageRootFixture();
    const outDir = path.join(rootDir, 'out');

    const result = await buildCommandArtifacts({
      rootDir,
      outDir,
      agents: ['codex', 'gemini'],
      scripts: ['sh']
    });

    expect(result.variants).toEqual([
      { agent: 'codex', script: 'sh', commandCount: 2 },
      { agent: 'gemini', script: 'sh', commandCount: 2 }
    ]);

    const codexPrompt = await readFile(path.join(outDir, 'codex', '.codex', 'prompts', 'storyspec-plan.md'), 'utf-8');
    expect(codexPrompt).not.toMatch(/^---/);
    expect(codexPrompt).toContain('Agent: codex');
    expect(codexPrompt).toContain('.specify/scripts/bash/plan-story.sh');
    const codexSpecPrompt = await readFile(path.join(outDir, 'codex', '.codex', 'prompts', 'storyspec-write.md'), 'utf-8');
    expect(codexSpecPrompt).not.toMatch(/^---/);
    expect(codexSpecPrompt).toContain('Agent: codex');
    expect(codexSpecPrompt).toContain('.specify/scripts/bash/check-writing-state.sh');
    expect(codexSpecPrompt).toContain('任务边界');
    expect(codexSpecPrompt).toContain('3-6 条 scene beat');
    expect(codexSpecPrompt).toContain('阶段 1 - beat 预览');
    expect(codexSpecPrompt).toContain('阶段 2 - 正文块');
    expect(codexSpecPrompt).toContain('阶段 3 - 收尾验证');
    expect(codexSpecPrompt).toContain('JSON stage 字段只能使用 plan、write、finish');
    expect(codexSpecPrompt).toContain('长章节必须分块输出');
    expect(codexSpecPrompt).toContain('收尾时单独给出摘要');
    expect(codexSpecPrompt).toContain('章节前置约束卡');
    expect(codexSpecPrompt).toContain('等待作者确认约束卡');
    expect(codexSpecPrompt).toContain('写后自检对照');

    const geminiPrompt = await readFile(path.join(outDir, 'gemini', '.gemini', 'commands', 'storyspec', 'plan.toml'), 'utf-8');
    expect(geminiPrompt).toContain('description = "Plan story"');
    expect(geminiPrompt).toContain('Input: {{args}}');
    expect(geminiPrompt).toContain('.specify/scripts/bash/plan-story.sh');
    const geminiSpecPrompt = await readFile(path.join(outDir, 'gemini', '.gemini', 'commands', 'storyspec', 'write.toml'), 'utf-8');
    expect(geminiSpecPrompt).toContain('description = "Write chapter from tasks"');
    expect(geminiSpecPrompt).toContain('Input: {{args}}');
    expect(geminiSpecPrompt).toContain('.specify/scripts/bash/check-writing-state.sh');
    expect(geminiSpecPrompt).toContain('任务边界');
    expect(geminiSpecPrompt).toContain('3-6 条 scene beat');
    expect(geminiSpecPrompt).toContain('阶段 1 - beat 预览');
    expect(geminiSpecPrompt).toContain('阶段 2 - 正文块');
    expect(geminiSpecPrompt).toContain('阶段 3 - 收尾验证');
    expect(geminiSpecPrompt).toContain('JSON stage 字段只能使用 plan、write、finish');
    expect(geminiSpecPrompt).toContain('长章节必须分块输出');
    expect(geminiSpecPrompt).toContain('收尾时单独给出摘要');
    expect(geminiSpecPrompt).toContain('章节前置约束卡');
    expect(geminiSpecPrompt).toContain('等待作者确认约束卡');
    expect(geminiSpecPrompt).toContain('写后自检对照');

    await expect(exists(path.join(outDir, 'codex', '.specify', 'memory', 'constitution.md'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'scripts', 'bash', 'plan-story.sh'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'scripts', 'helper.cjs'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'scripts', 'runtime', 'script-runtime.js'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'scripts', 'runtime', 'application', 'check-writing-state.js'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'scripts', 'runtime', 'domain', 'story-artifact.js'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'templates', 'knowledge', 'world.md'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'agent-guides', 'story-creation-guide.md'))).resolves.toBe(true);
    await expect(exists(path.join(outDir, 'codex', '.specify', 'templates', 'commands', 'plan.md'))).resolves.toBe(false);
    await expect(exists(path.join(outDir, 'codex', 'spec', 'presets', 'three-act.md'))).resolves.toBe(true);

    await expect(readdir(path.join(outDir, 'codex', 'spec', 'tracking'))).resolves.toEqual([]);
    await expect(readdir(path.join(outDir, 'codex', 'spec', 'knowledge'))).resolves.toEqual([]);
  });

  it('copies platform project instruction entrypoints', async () => {
    const rootDir = await createPackageRootFixture();
    const outDir = path.join(rootDir, 'out');

    await buildCommandArtifacts({
      rootDir,
      outDir,
      agents: ['claude', 'gemini', 'cursor', 'continue-check', 'copilot'],
      scripts: ['sh']
    });

    await expect(readFile(path.join(outDir, 'claude', 'CLAUDE.md'), 'utf-8')).resolves.toContain('claude entry');
    await expect(readFile(path.join(outDir, 'gemini', '.gemini', 'GEMINI.md'), 'utf-8')).resolves.toContain('gemini entry');
    await expect(readFile(path.join(outDir, 'cursor', '.cursor', 'rules', 'story-spec.mdc'), 'utf-8')).resolves.toContain('cursor rule');
    await expect(readFile(path.join(outDir, 'continue-check', '.continue', 'rules', 'story-spec.md'), 'utf-8')).resolves.toContain('continue rule');
    await expect(readFile(path.join(outDir, 'copilot', '.github', 'copilot-instructions.md'), 'utf-8')).resolves.toContain('copilot instructions');
    await expect(readFile(path.join(outDir, 'copilot', '.vscode', 'settings.json'), 'utf-8')).resolves.toContain('copilot');
  });

  it('generates generic Markdown commands under .specify/commands', async () => {
    const rootDir = await createPackageRootFixture();
    const outDir = path.join(rootDir, 'out');

    const result = await buildCommandArtifacts({
      rootDir,
      outDir,
      agents: ['generic'],
      scripts: ['sh']
    });

    expect(result.variants).toEqual([
      { agent: 'generic', script: 'sh', commandCount: 2 }
    ]);

    const genericCommand = await readFile(path.join(outDir, 'generic', '.specify', 'commands', 'plan.md'), 'utf-8');
    expect(genericCommand).toContain('# Plan story');
    const genericSpecCommand = await readFile(path.join(outDir, 'generic', '.specify', 'commands', 'write.md'), 'utf-8');
    expect(genericSpecCommand).toContain('# Write chapter');
    expect(genericSpecCommand).toContain('[task]');
    expect(genericSpecCommand).toContain('- `stories/*/tasks.md`');
    expect(genericSpecCommand).toContain('- `stories/*/content/**`');
    expect(genericSpecCommand).not.toContain('.specify/scripts/bash/check-writing-state.sh');
    expect(genericSpecCommand).toContain('当前 agent 不支持 shell');
    expect(genericCommand).toContain('## 前置条件');
    expect(genericCommand).toContain('## 必须读取');
    expect(genericCommand).toContain('## 允许写入');
    expect(genericCommand).toContain('## 执行步骤');
    expect(genericCommand).toContain('## 输出位置');
    expect(genericCommand).toContain('## 降级方案');
    expect(genericCommand).not.toContain('.specify/scripts/bash/plan-story.sh');
    expect(genericCommand).toContain('当前 agent 不支持 shell');
    expect(genericSpecCommand).toContain('任务边界');
    expect(genericSpecCommand).toContain('3-6 条 scene beat');
    expect(genericSpecCommand).toContain('阶段 1 - beat 预览');
    expect(genericSpecCommand).toContain('阶段 2 - 正文块');
    expect(genericSpecCommand).toContain('阶段 3 - 收尾验证');
    expect(genericSpecCommand).toContain('JSON stage 字段只能使用 plan、write、finish');
    expect(genericSpecCommand).toContain('长章节必须分块输出');
    expect(genericSpecCommand).toContain('收尾时单独给出摘要');
    expect(genericSpecCommand).toContain('章节前置约束卡');
    expect(genericSpecCommand).toContain('等待作者确认约束卡');
    expect(genericSpecCommand).toContain('写后自检对照');
  });

  it('generates read-only Continue check prompts', async () => {
    const rootDir = await createPackageRootFixture();
    const outDir = path.join(rootDir, 'out');

    const result = await buildCommandArtifacts({
      rootDir,
      outDir,
      agents: ['continue-check'],
      scripts: ['sh']
    });

    expect(result.variants).toEqual([
      { agent: 'continue-check', script: 'sh', commandCount: 2 }
    ]);

    const prompt = await readFile(path.join(outDir, 'continue-check', '.continue', 'prompts', 'write.md'), 'utf-8');
    expect(prompt).toContain('# Write chapter');
    expect(prompt).toContain('当前 agent 是只读模式');
    expect(prompt).toContain('不要创建、修改或删除文件');
    expect(prompt).toContain('以下路径只作为建议修改范围');
    expect(prompt).toContain('- `stories/*/content/**`');
    expect(prompt).not.toContain('.specify/scripts/bash/check-writing-state.sh');
    expect(prompt).toContain('当前 agent 不支持 shell');
  });

  it('snapshots the runtime bundle before cleaning the default dist output', async () => {
    const rootDir = await createPackageRootFixture();

    await buildCommandArtifacts({
      rootDir,
      agents: ['codex'],
      scripts: ['sh']
    });

    await expect(exists(path.join(rootDir, 'dist', 'codex', '.specify', 'scripts', 'runtime', 'script-runtime.js'))).resolves.toBe(true);
    await expect(exists(path.join(rootDir, 'dist', 'codex', '.specify', 'scripts', 'runtime', 'application', 'check-writing-state.js'))).resolves.toBe(true);
    await expect(exists(path.join(rootDir, 'dist', 'codex', '.specify', 'scripts', 'runtime', 'domain', 'story-artifact.js'))).resolves.toBe(true);
  });
});
