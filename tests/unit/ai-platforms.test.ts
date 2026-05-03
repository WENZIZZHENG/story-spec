import { describe, expect, it } from 'vitest';
import {
  AI_PLATFORM_IDS,
  AI_PLATFORMS,
  formatAICommand,
  formatDisplayNames,
  getAIInitDirs,
  getAIPlatform,
  getTargetAIPlatforms
} from '../../src/utils/ai-platforms.js';

describe('AI platform registry', () => {
  it('keeps platform IDs and configs in the same order', () => {
    expect(AI_PLATFORMS.map(platform => platform.name)).toEqual([...AI_PLATFORM_IDS]);
    expect(new Set(AI_PLATFORM_IDS).size).toBe(AI_PLATFORM_IDS.length);
  });

  it('resolves selected and all target platforms from the registry', () => {
    expect(getTargetAIPlatforms(false, 'codex').map(platform => platform.name)).toEqual(['codex']);
    expect(getTargetAIPlatforms(true, 'codex').map(platform => platform.name)).toEqual([...AI_PLATFORM_IDS]);
    expect(getTargetAIPlatforms(false, 'unknown')).toEqual([]);
  });

  it('derives initialization directories without duplicates', () => {
    const dirs = getAIInitDirs([
      getAIPlatform('copilot')!,
      getAIPlatform('codex')!
    ]);

    expect(dirs).toEqual(['.github/prompts', '.vscode', '.codex/prompts']);
    expect(new Set(dirs).size).toBe(dirs.length);
  });

  it('formats slash commands with platform-specific prefixes', () => {
    expect(formatAICommand(getAIPlatform('claude'), 'write')).toBe('/storyspec.write');
    expect(formatAICommand(getAIPlatform('gemini'), 'write')).toBe('/storyspec:write');
    expect(formatAICommand(getAIPlatform('codex'), 'write')).toBe('/storyspec-write');
    expect(formatAICommand(getAIPlatform('cursor'), 'write')).toBe('/write');
    expect(formatAICommand(getAIPlatform('codex'), 'write', true)).toBe('/write');
  });

  it('formats display names for init --all messaging', () => {
    const displayNames = formatDisplayNames([
      getAIPlatform('claude')!,
      getAIPlatform('codex')!,
      getAIPlatform('q')!
    ]);

    expect(displayNames).toBe('Claude Code、Codex CLI、Amazon Q Developer');
  });
});
