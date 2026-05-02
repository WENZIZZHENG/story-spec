import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  parseCommandTemplate,
  parseCommandTemplateFrontmatter
} from '../../src/prompt/frontmatter.js';

const template = `---
description: 基于故事规格制定技术实现方案
argument-hint: [技术偏好和选择]
allowed-tools: Read(//stories/**/specification.md), Write(//stories/**/creative-plan.md)
model: claude-sonnet-4-5-20250929
scripts:
  sh: .specify/scripts/bash/plan-story.sh
  ps: .specify/scripts/powershell/plan-story.ps1
---

用户输入：$ARGUMENTS

## 目标
生成创作计划。
`;

const repoRoot = path.resolve(import.meta.dirname, '..', '..');

describe('prompt frontmatter parser', () => {
  it('parses command metadata and body from template markdown', () => {
    const result = parseCommandTemplate(template);

    expect(result.hasFrontmatter).toBe(true);
    expect(result.frontmatter).toMatchObject({
      description: '基于故事规格制定技术实现方案',
      argumentHint: '[技术偏好和选择]',
      allowedTools: 'Read(//stories/**/specification.md), Write(//stories/**/creative-plan.md)',
      model: 'claude-sonnet-4-5-20250929',
      scripts: {
        sh: '.specify/scripts/bash/plan-story.sh',
        ps: '.specify/scripts/powershell/plan-story.ps1'
      }
    });
    expect(result.body).toContain('用户输入：$ARGUMENTS');
    expect(result.body).not.toContain('description:');
  });

  it('returns empty metadata when a template has no frontmatter block', () => {
    const result = parseCommandTemplate('纯 Markdown 正文');

    expect(result.hasFrontmatter).toBe(false);
    expect(result.frontmatter.scripts).toEqual({});
    expect(result.body).toBe('纯 Markdown 正文');
  });

  it('exposes raw frontmatter for future compiler fields', () => {
    const frontmatter = parseCommandTemplateFrontmatter(template);

    expect(frontmatter.raw['argument-hint']).toBe('[技术偏好和选择]');
    expect(frontmatter.raw.scripts).toEqual({
      sh: '.specify/scripts/bash/plan-story.sh',
      ps: '.specify/scripts/powershell/plan-story.ps1'
    });
  });

  it('parses all command template scripts from the repository templates', async () => {
    const commandsDir = path.join(repoRoot, 'templates', 'commands');
    const files = (await readdir(commandsDir))
      .filter(file => file.endsWith('.md') && !file.endsWith('.prompt.md'));

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = await readFile(path.join(commandsDir, file), 'utf-8');
      const result = parseCommandTemplate(content);

      expect(result.hasFrontmatter, file).toBe(true);
      expect(result.frontmatter.description, file).toBeTruthy();
      expect(result.frontmatter.scripts.sh, file).toBeTruthy();
      expect(result.frontmatter.scripts.ps, file).toBeTruthy();
      expect(result.body, file).not.toMatch(/^---/);
    }
  });
});
