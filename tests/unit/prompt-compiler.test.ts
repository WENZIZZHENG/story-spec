import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  compileCommandSpec,
  compileCommandTemplate,
  rewriteSpecifyPaths,
  type CommandOutputFormat
} from '../../src/prompt/compiler.js';
import { parseCommandSpec } from '../../src/prompt/command-spec.js';

const template = `---
description: 生成创作计划
argument-hint: [技术偏好]
allowed-tools: Read(memory/constitution.md), Bash(scripts/bash/plan-story.sh)
model: claude-sonnet-4-5-20250929
scripts:
  sh: scripts/bash/plan-story.sh
  ps: scripts/powershell/plan-story.ps1
---

用户输入：$ARGUMENTS
Agent: __AGENT__
运行 {SCRIPT}
读取 memory/constitution.md 和 templates/story-template.md。
`;

const repoRoot = path.resolve(import.meta.dirname, '..', '..');

const compile = (format: CommandOutputFormat) => compileCommandTemplate({
  template,
  agent: 'codex',
  argFormat: '$ARGUMENTS',
  scriptVariant: 'sh',
  outputFormat: format
});

const commandSpec = parseCommandSpec(`id: write
title: 章节写作
stage: drafting
description: 基于任务清单执行章节写作
arguments:
  hint: "[章节编号或任务ID]"
requiredReads:
  - stories/*/tasks.md
allowedWrites:
  - stories/*/content/**
`, 'write.command.yaml').spec!;

describe('prompt compiler', () => {
  it('rewrites support paths without duplicating .specify prefixes', () => {
    expect(rewriteSpecifyPaths('memory/a.md .specify/memory/b.md scripts/x.sh templates/t.md'))
      .toBe('.specify/memory/a.md .specify/memory/b.md .specify/scripts/x.sh .specify/templates/t.md');
  });

  it('compiles pure markdown output without frontmatter', () => {
    const result = compile('markdown-none');

    expect(result).not.toMatch(/^---/);
    expect(result).toMatch(/^## 空参数引导/);
    expect(result).toContain('先提示用户补充 `[技术偏好]`');
    expect(result).toContain('提供 2-3 个可直接复制的示例输入');
    expect(result).toContain('用户输入：$ARGUMENTS');
    expect(result).toContain('Agent: codex');
    expect(result).toContain('运行 .specify/scripts/bash/plan-story.sh');
    expect(result).toContain('.specify/memory/constitution.md');
    expect(result).toContain('.specify/templates/story-template.md');
  });

  it('compiles minimal and partial markdown frontmatter', () => {
    expect(compile('markdown-minimal')).toMatch(/^---\ndescription: 生成创作计划\n---\n\n/);
    expect(compile('markdown-partial')).toMatch(/^---\ndescription: 生成创作计划\nargument-hint: \[技术偏好\]\n---\n\n/);
  });

  it('compiles TOML output for Gemini-style command files', () => {
    const result = compileCommandTemplate({
      template,
      agent: 'gemini',
      argFormat: '{{args}}',
      scriptVariant: 'ps',
      outputFormat: 'toml'
    });

    expect(result).toContain('description = "生成创作计划"');
    expect(result).toContain('prompt = """');
    expect(result).toContain('## 空参数引导');
    expect(result).toContain('先提示用户补充 `[技术偏好]`');
    expect(result).toContain('用户输入：{{args}}');
    expect(result).toContain('Agent: gemini');
    expect(result).toContain('运行 .specify/scripts/powershell/plan-story.ps1');
    expect(result.trimEnd()).toMatch(/"""$/);
  });

  it('adds empty-argument onboarding for CommandSpec prompts', () => {
    const result = compileCommandSpec({
      spec: commandSpec,
      promptBody: '用户输入：$ARGUMENTS\n开始写作。\n',
      agent: 'codex',
      argFormat: '$ARGUMENTS',
      scriptVariant: 'sh',
      outputFormat: 'markdown-none'
    });

    expect(result).toMatch(/^## 空参数引导/);
    expect(result).toContain('本命令用途：基于任务清单执行章节写作。');
    expect(result).toContain('先提示用户补充 `[章节编号或任务ID]`');
    expect(result).toContain('用户输入：$ARGUMENTS');
  });

  it('compiles a real repository command template', async () => {
    const planTemplate = await readFile(path.join(repoRoot, 'templates', 'commands', 'plan.md'), 'utf-8');

    const codex = compileCommandTemplate({
      template: planTemplate,
      agent: 'codex',
      argFormat: '$ARGUMENTS',
      scriptVariant: 'sh',
      outputFormat: 'markdown-none'
    });
    const gemini = compileCommandTemplate({
      template: planTemplate,
      agent: 'gemini',
      argFormat: '{{args}}',
      scriptVariant: 'ps',
      outputFormat: 'toml'
    });

    expect(codex).not.toMatch(/^---/);
    expect(codex).toContain('.specify/scripts/bash/plan-story.sh');
    expect(codex).toContain('$ARGUMENTS');
    expect(gemini).toContain('description = "');
    expect(gemini).toContain('.specify/scripts/powershell/plan-story.ps1');
    expect(gemini).toContain('{{args}}');
  });
});
