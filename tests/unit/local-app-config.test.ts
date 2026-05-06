import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getLocalAppRecentProjectsPath } from '../../src/infrastructure/local-app-config.js';

describe('local app config paths', () => {
  it('uses a user-level StorySpec config path for recent projects', () => {
    const configPath = getLocalAppRecentProjectsPath({
      platform: 'win32',
      env: {
        APPDATA: 'C:\\Users\\Author\\AppData\\Roaming'
      },
      homedir: () => 'C:\\Users\\Author'
    });

    expect(configPath).toBe(path.join(
      'C:\\Users\\Author\\AppData\\Roaming',
      'StorySpec',
      'recent-projects.json'
    ));
  });

  it('falls back to the home directory when platform config env is missing', () => {
    const configPath = getLocalAppRecentProjectsPath({
      platform: 'linux',
      env: {},
      homedir: () => '/home/author'
    });

    expect(configPath).toBe(path.join('/home/author', '.config', 'storyspec', 'recent-projects.json'));
  });
});
