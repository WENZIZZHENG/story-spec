import os from 'node:os';
import path from 'node:path';

export interface LocalAppConfigPathInput {
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  homedir?: () => string;
}

const resolveConfigRoot = (input: LocalAppConfigPathInput): string => {
  const platform = input.platform ?? process.platform;
  const env = input.env ?? process.env;
  const home = input.homedir?.() ?? os.homedir();

  if (platform === 'win32') {
    return path.join(env.APPDATA ?? path.join(home, 'AppData', 'Roaming'), 'StorySpec');
  }

  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'StorySpec');
  }

  return path.join(env.XDG_CONFIG_HOME ?? path.join(home, '.config'), 'storyspec');
};

export const getLocalAppRecentProjectsPath = (
  input: LocalAppConfigPathInput = {}
): string => path.join(resolveConfigRoot(input), 'recent-projects.json');
