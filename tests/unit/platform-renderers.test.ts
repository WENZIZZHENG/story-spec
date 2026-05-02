import { describe, expect, it } from 'vitest';
import { AI_PLATFORM_IDS } from '../../src/utils/ai-platforms.js';
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
      .toEqual([...AI_PLATFORM_IDS].sort());
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

    expect(codex.outputFile).toBe('novel-plan.md');
    expect(codex.content).not.toMatch(/^---/);
    expect(codex.content).toContain('Agent: codex');
    expect(codex.content).toContain('.specify/scripts/bash/plan-story.sh');

    expect(gemini.outputFile).toBe('plan.toml');
    expect(gemini.content).toContain('prompt = """');
    expect(gemini.content).toContain('用户输入：{{args}}');
    expect(gemini.content).toContain('.specify/scripts/powershell/plan-story.ps1');
  });
});
