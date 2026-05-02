import { describe, expect, it } from 'vitest';
import { AGENT_INTEGRATION_IDS } from '../../src/agent/registry.js';
import {
  getAllPlatformRenderers,
  getPlatformRenderer,
  renderCommandForPlatform
} from '../../src/prompt/platform-renderers/index.js';
import { parseCommandSpec } from '../../src/prompt/command-spec.js';

const template = `---
description: 生成创作计划
argument-hint: [技术偏好]
scripts:
  sh: scripts/bash/plan-story.sh
  ps: scripts/powershell/plan-story.ps1
---

用户输入：$ARGUMENTS
Agent: __AGENT__
运行 {SCRIPT}
`;

const commandSpec = parseCommandSpec(`id: write
title: Write chapter
stage: drafting
description: Write chapter from tasks
arguments:
  hint: "[task]"
requiredReads:
  - .specify/memory/constitution.md
  - stories/*/tasks.md
allowedWrites:
  - stories/*/content/**
scripts:
  check:
    capability: check-writing-state
    sh: .specify/scripts/bash/check-writing-state.sh
    ps: .specify/scripts/powershell/check-writing-state.ps1
`, 'write.command.yaml').spec!;

const promptBody = `Input: $ARGUMENTS
Agent: __AGENT__
Run {SCRIPT}
`;

describe('platform renderers', () => {
  it('covers every registered AI platform', () => {
    expect(getAllPlatformRenderers().map(renderer => renderer.platform).sort())
      .toEqual([...AGENT_INTEGRATION_IDS].sort());
  });

  it('describes command output conventions for supported platforms', () => {
    expect(getPlatformRenderer('claude')).toMatchObject({
      platform: 'claude',
      namespace: 'novel.',
      extension: 'md',
      outputFormat: 'markdown-full',
      argFormat: '$ARGUMENTS'
    });
    expect(getPlatformRenderer('gemini')).toMatchObject({
      platform: 'gemini',
      namespace: '',
      extension: 'toml',
      outputFormat: 'toml',
      argFormat: '{{args}}'
    });
    expect(getPlatformRenderer('codex')).toMatchObject({
      platform: 'codex',
      namespace: 'novel-',
      outputFormat: 'markdown-none'
    });
    expect(getPlatformRenderer('generic')).toMatchObject({
      platform: 'generic',
      namespace: '',
      outputFormat: 'markdown-generic',
      runShell: false
    });
  });

  it('renders platform-specific output filenames and content', () => {
    const codex = renderCommandForPlatform({
      commandName: 'plan',
      template,
      platform: 'codex',
      scriptVariant: 'sh'
    });
    const gemini = renderCommandForPlatform({
      commandName: 'plan',
      template,
      platform: 'gemini',
      scriptVariant: 'ps'
    });
    const generic = renderCommandForPlatform({
      commandName: 'plan',
      template,
      platform: 'generic',
      scriptVariant: 'sh'
    });

    expect(codex.outputFile).toBe('novel-plan.md');
    expect(codex.content).not.toMatch(/^---/);
    expect(codex.content).toContain('Agent: codex');
    expect(codex.content).toContain('.specify/scripts/bash/plan-story.sh');

    expect(gemini.outputFile).toBe('plan.toml');
    expect(gemini.content).toContain('prompt = """');
    expect(gemini.content).toContain('用户输入：{{args}}');
    expect(gemini.content).toContain('.specify/scripts/powershell/plan-story.ps1');

    expect(generic.outputFile).toBe('plan.md');
    expect(generic.content).not.toContain('.specify/scripts/bash/plan-story.sh');
    expect(generic.content).toContain('当前 agent 不支持 shell');
    expect(generic.content).toContain('# 生成创作计划');
    expect(generic.content).toContain('## 目的');
    expect(generic.content).toContain('## 必须读取');
    expect(generic.content).toContain('## 允许写入');
    expect(generic.content).toContain('## 降级方案');
  });
  it('renders CommandSpec sources without legacy template frontmatter', () => {
    const commandSource = {
      kind: 'command-spec' as const,
      commandName: 'write',
      spec: commandSpec,
      promptBody,
      sourcePath: 'templates/commands/write.command.yaml',
      promptPath: 'templates/commands/write.prompt.md'
    };
    const codex = renderCommandForPlatform({
      commandName: 'write',
      commandSource,
      platform: 'codex',
      scriptVariant: 'sh'
    });
    const generic = renderCommandForPlatform({
      commandName: 'write',
      commandSource,
      platform: 'generic',
      scriptVariant: 'ps'
    });
    const copilot = renderCommandForPlatform({
      commandName: 'write',
      commandSource,
      platform: 'copilot',
      scriptVariant: 'sh'
    });

    expect(codex.outputFile).toBe('novel-write.md');
    expect(codex.content).not.toMatch(/^---/);
    expect(codex.content).toContain('Agent: codex');
    expect(codex.content).toContain('.specify/scripts/bash/check-writing-state.sh');

    expect(generic.outputFile).toBe('write.md');
    expect(generic.content).toContain('# Write chapter');
    expect(generic.content).toContain('[task]');
    expect(generic.content).toContain('- `.specify/memory/constitution.md`');
    expect(generic.content).toContain('- `stories/*/content/**`');
    expect(generic.content).not.toContain('.specify/scripts/powershell/check-writing-state.ps1');
    expect(generic.content).toContain('当前 agent 不支持 shell');

    expect(copilot.content).not.toContain('.specify/scripts/bash/check-writing-state.sh');
    expect(copilot.content).toContain('当前 agent 不支持 shell');
  });
});
