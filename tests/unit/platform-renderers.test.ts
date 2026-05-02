import { describe, expect, it } from 'vitest';
import { AGENT_INTEGRATION_IDS } from '../../src/agent/registry.js';
import {
  getAllPlatformRenderers,
  getPlatformRenderer,
  renderCommandForPlatform
} from '../../src/prompt/platform-renderers/index.js';

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
      outputFormat: 'markdown-generic'
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
    expect(generic.content).toContain('# 生成创作计划');
    expect(generic.content).toContain('## 目的');
    expect(generic.content).toContain('## 必须读取');
    expect(generic.content).toContain('## 允许写入');
    expect(generic.content).toContain('## 降级方案');
  });
});
