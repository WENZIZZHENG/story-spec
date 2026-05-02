export const AI_PLATFORM_IDS = [
  'claude',
  'cursor',
  'gemini',
  'windsurf',
  'roocode',
  'copilot',
  'qwen',
  'opencode',
  'codex',
  'kilocode',
  'auggie',
  'codebuddy',
  'q'
] as const;

export type AIPlatformId = typeof AI_PLATFORM_IDS[number];

export interface AIPlatformConfig {
  name: AIPlatformId;
  dir: string;
  commandsDir: string;
  displayName: string;
  distDir: string;
  commandPrefix: '/' | '/novel.' | '/novel:' | '/novel-';
  initDirs?: string[];
  extraDirs?: string[];
}

export const AI_PLATFORMS: readonly AIPlatformConfig[] = [
  { name: 'claude', dir: '.claude', commandsDir: 'commands', displayName: 'Claude Code', distDir: 'dist/claude', commandPrefix: '/novel.' },
  { name: 'cursor', dir: '.cursor', commandsDir: 'commands', displayName: 'Cursor', distDir: 'dist/cursor', commandPrefix: '/' },
  { name: 'gemini', dir: '.gemini', commandsDir: 'commands', displayName: 'Gemini CLI', distDir: 'dist/gemini', commandPrefix: '/novel:' },
  { name: 'windsurf', dir: '.windsurf', commandsDir: 'workflows', displayName: 'Windsurf', distDir: 'dist/windsurf', commandPrefix: '/' },
  { name: 'roocode', dir: '.roo', commandsDir: 'commands', displayName: 'Roo Code', distDir: 'dist/roocode', commandPrefix: '/' },
  { name: 'copilot', dir: '.github', commandsDir: 'prompts', displayName: 'GitHub Copilot', distDir: 'dist/copilot', commandPrefix: '/', extraDirs: ['.vscode'] },
  { name: 'qwen', dir: '.qwen', commandsDir: 'commands', displayName: 'Qwen Code', distDir: 'dist/qwen', commandPrefix: '/' },
  { name: 'opencode', dir: '.opencode', commandsDir: 'command', displayName: 'OpenCode', distDir: 'dist/opencode', commandPrefix: '/' },
  { name: 'codex', dir: '.codex', commandsDir: 'prompts', displayName: 'Codex CLI', distDir: 'dist/codex', commandPrefix: '/novel-' },
  { name: 'kilocode', dir: '.kilocode', commandsDir: 'workflows', displayName: 'Kilo Code', distDir: 'dist/kilocode', commandPrefix: '/' },
  { name: 'auggie', dir: '.augment', commandsDir: 'commands', displayName: 'Auggie CLI', distDir: 'dist/auggie', commandPrefix: '/' },
  { name: 'codebuddy', dir: '.codebuddy', commandsDir: 'commands', displayName: 'CodeBuddy', distDir: 'dist/codebuddy', commandPrefix: '/' },
  { name: 'q', dir: '.amazonq', commandsDir: 'prompts', displayName: 'Amazon Q Developer', distDir: 'dist/q', commandPrefix: '/' }
];

export const AI_PLATFORM_OPTIONS = AI_PLATFORM_IDS.join(' | ');

export function getAIPlatform(id: string | undefined): AIPlatformConfig | undefined {
  return AI_PLATFORMS.find(platform => platform.name === id);
}

export function getTargetAIPlatforms(all: boolean, selected: string): AIPlatformConfig[] {
  if (all) {
    return [...AI_PLATFORMS];
  }

  const platform = getAIPlatform(selected);
  return platform ? [platform] : [];
}

export function getAIInitDirs(platforms: readonly AIPlatformConfig[]): string[] {
  const dirs = new Set<string>();

  for (const platform of platforms) {
    const platformDirs = platform.initDirs ?? [`${platform.dir}/${platform.commandsDir}`, ...platform.extraDirs ?? []];
    for (const dir of platformDirs) {
      dirs.add(dir);
    }
  }

  return [...dirs];
}

export function formatAICommand(platform: AIPlatformConfig | undefined, commandName: string, useGeneric = false): string {
  if (useGeneric || !platform) {
    return `/${commandName}`;
  }

  return `${platform.commandPrefix}${commandName}`;
}

export function formatDisplayNames(platforms: readonly AIPlatformConfig[]): string {
  return platforms.map(platform => platform.displayName).join('、');
}
