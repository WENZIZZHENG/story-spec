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
    expect(result).toMatch(/^## 输入澄清引导/);
    expect(result).toContain('先提示用户补充 `[技术偏好]`');
    expect(result).toContain('只是题材标签、风格词、偏好组合');
    expect(result).toContain('先区分“用户已明确”“需要澄清”');
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
    expect(result).toContain('## 输入澄清引导');
    expect(result).toContain('先提示用户补充 `[技术偏好]`');
    expect(result).toContain('3-8 个简短问题');
    expect(result).toContain('用户输入：{{args}}');
    expect(result).toContain('Agent: gemini');
    expect(result).toContain('运行 .specify/scripts/powershell/plan-story.ps1');
    expect(result.trimEnd()).toMatch(/"""$/);
  });

  it('adds input clarification onboarding for CommandSpec prompts', () => {
    const result = compileCommandSpec({
      spec: commandSpec,
      promptBody: '用户输入：$ARGUMENTS\n开始写作。\n',
      agent: 'codex',
      argFormat: '$ARGUMENTS',
      scriptVariant: 'sh',
      outputFormat: 'markdown-none'
    });

    expect(result).toMatch(/^## 输入澄清引导/);
    expect(result).toContain('本命令用途：基于任务清单执行章节写作。');
    expect(result).toContain('先提示用户补充 `[章节编号或任务ID]`');
    expect(result).toContain('AI 可以提出但不能替用户定稿的建议');
    expect(result).toContain('用户输入：$ARGUMENTS');
  });

  it('compiles a real repository command template', async () => {
    const constitutionTemplate = await readFile(path.join(repoRoot, 'templates', 'commands', 'constitution.md'), 'utf-8');
    const planTemplate = await readFile(path.join(repoRoot, 'templates', 'commands', 'plan.md'), 'utf-8');
    const specifyTemplate = await readFile(path.join(repoRoot, 'templates', 'commands', 'specify.md'), 'utf-8');
    const tasksTemplate = await readFile(path.join(repoRoot, 'templates', 'commands', 'tasks.md'), 'utf-8');
    const clarifyTemplate = await readFile(path.join(repoRoot, 'templates', 'commands', 'clarify.md'), 'utf-8');

    const constitution = compileCommandTemplate({
      template: constitutionTemplate,
      agent: 'codex',
      argFormat: '$ARGUMENTS',
      scriptVariant: 'sh',
      outputFormat: 'markdown-none'
    });
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
    const specify = compileCommandTemplate({
      template: specifyTemplate,
      agent: 'codex',
      argFormat: '$ARGUMENTS',
      scriptVariant: 'sh',
      outputFormat: 'markdown-none'
    });
    const tasks = compileCommandTemplate({
      template: tasksTemplate,
      agent: 'codex',
      argFormat: '$ARGUMENTS',
      scriptVariant: 'sh',
      outputFormat: 'markdown-none'
    });
    const clarify = compileCommandTemplate({
      template: clarifyTemplate,
      agent: 'codex',
      argFormat: '$ARGUMENTS',
      scriptVariant: 'sh',
      outputFormat: 'markdown-none'
    });

    for (const highImpactCommand of [constitution, codex, specify, tasks]) {
      expect(highImpactCommand).toContain('## 写入前预览门禁');
      expect(highImpactCommand).toContain('preview');
      expect(highImpactCommand).toContain('confirm');
      expect(highImpactCommand).toContain('apply');
      expect(highImpactCommand).toContain('拟写入文件路径');
      expect(highImpactCommand).toContain('用户明确输入');
      expect(highImpactCommand).toContain('AI 建议内容');
      expect(highImpactCommand).toContain('未决 `[需要澄清]`');
      expect(highImpactCommand).toContain('可能影响到的后续文件');
      expect(highImpactCommand).toContain('默认只输出 preview，不写文件');
    }
    expect(codex).not.toMatch(/^---/);
    expect(codex).toMatch(/^## 输入澄清引导/);
    expect(codex).toContain('.specify/scripts/bash/plan-story.sh');
    expect(codex).toContain('$ARGUMENTS');
    expect(gemini).toContain('description = "');
    expect(gemini).toContain('## 写入前预览门禁');
    expect(gemini).toContain('.specify/scripts/powershell/plan-story.ps1');
    expect(gemini).toContain('{{args}}');
    expect(specify).toContain('#### 0.1 创作控制权保护');
    expect(specify).toContain('不要创建或修改 `stories/*/specification.md`');
    expect(specify).toContain('**用户已明确**');
    expect(specify).toContain('**需要澄清**');
    expect(specify).toContain('**可复制示例**');
    expect(specify).toContain('### 5.5 来源标记与正典防污染');
    expect(specify).toContain('source.aiSuggested: true');
    expect(specify).toContain('source.confirmedByUser: false');
    expect(clarify).toContain('### 创作控制权保护');
    expect(clarify).toContain('stories/<story>/clarifications.json');
    expect(clarify).toContain('不要修改 `stories/*/specification.md`');
    expect(clarify).toContain('ai-suggested');
    expect(clarify).not.toContain('## 写入前预览门禁');
  });
});
