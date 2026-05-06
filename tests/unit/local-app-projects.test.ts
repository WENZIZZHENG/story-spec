import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';
import {
  createJsonRecentProjectStore,
  createLocalAppProject,
  createMemoryRecentProjectStore,
  openLocalAppProject
} from '../../src/application/local-app-projects.js';
import type { InitProjectInput, InitProjectResult } from '../../src/application/init-project.js';

describe('local app projects', () => {
  it('opens a valid StorySpec project and records it as recent', async () => {
    const fs = new MemoryFileSystem('D:\\workspace');
    const store = createMemoryRecentProjectStore();
    const projectRoot = path.resolve('D:\\workspace\\spell-era');
    await fs.ensureDir(path.join(projectRoot, '.specify'));
    await fs.writeJson(path.join(projectRoot, '.specify', 'config.json'), {
      name: '法术编译纪元'
    });

    const result = await openLocalAppProject({
      projectRoot,
      fileSystem: fs,
      recentProjects: store,
      now: () => '2026-05-06T13:30:00.000Z'
    });

    expect(result.blocked).toBe(false);
    expect(result.project).toEqual({
      name: '法术编译纪元',
      path: projectRoot,
      lastOpenedAt: '2026-05-06T13:30:00.000Z'
    });
    await expect(store.list()).resolves.toEqual([result.project]);
  });

  it('rejects a non StorySpec project without recording it', async () => {
    const fs = new MemoryFileSystem('D:\\workspace');
    const store = createMemoryRecentProjectStore();
    const projectRoot = path.resolve('D:\\workspace\\notes-only');
    await fs.ensureDir(projectRoot);

    const result = await openLocalAppProject({
      projectRoot,
      fileSystem: fs,
      recentProjects: store,
      now: () => '2026-05-06T13:30:00.000Z'
    });

    expect(result).toMatchObject({
      blocked: true,
      blockedReasons: ['缺少 .specify/config.json，所选目录不是 StorySpec 项目根目录']
    });
    await expect(store.list()).resolves.toEqual([]);
  });

  it('sorts recent projects by last opened time', async () => {
    const store = createMemoryRecentProjectStore();

    await store.record({
      name: '旧项目',
      path: path.resolve('D:\\workspace\\old'),
      lastOpenedAt: '2026-05-06T10:00:00.000Z'
    });
    await store.record({
      name: '新项目',
      path: path.resolve('D:\\workspace\\new'),
      lastOpenedAt: '2026-05-06T12:00:00.000Z'
    });

    await expect(store.list()).resolves.toMatchObject([
      { name: '新项目' },
      { name: '旧项目' }
    ]);
  });

  it('persists recent projects to a JSON store outside the project root', async () => {
    const fs = new MemoryFileSystem('D:\\workspace');
    const storePath = path.resolve('D:\\user-config\\storyspec\\recent-projects.json');
    const store = createJsonRecentProjectStore({
      fileSystem: fs,
      storePath
    });
    const project = {
      name: '法术编译纪元',
      path: path.resolve('D:\\workspace\\spell-era'),
      lastOpenedAt: '2026-05-06T13:30:00.000Z'
    };

    await store.record(project);

    await expect(store.list()).resolves.toEqual([project]);
    await expect(fs.pathExists(path.join(project.path, 'recent-projects.json'))).resolves.toBe(false);
    await expect(fs.readJson(storePath)).resolves.toEqual([project]);
  });

  it('creates a project through initProject with codex as the default agent', async () => {
    const fs = new MemoryFileSystem('D:\\workspace');
    const store = createMemoryRecentProjectStore();
    const initCalls: InitProjectInput[] = [];
    const projectPath = path.resolve('D:\\workspace\\spell-era');

    const result = await createLocalAppProject({
      name: 'spell-era',
      workspacePath: projectPath,
      cwd: 'D:\\workspace',
      packageRoot: 'D:\\package',
      method: 'three-act',
      git: false,
      withExperts: false,
      fileSystem: fs,
      recentProjects: store,
      now: () => '2026-05-06T13:30:00.000Z',
      initProject: async input => {
        initCalls.push(input);
        await fs.ensureDir(path.join(projectPath, '.specify'));
        await fs.writeJson(path.join(projectPath, '.specify', 'config.json'), {
          name: 'spell-era'
        });
        return {
          projectName: 'spell-era',
          projectPath,
          aiDirs: ['.codex/prompts'],
          targetPlatforms: [],
          targetAgents: []
        } satisfies InitProjectResult;
      }
    });

    expect(initCalls).toHaveLength(1);
    expect(initCalls[0]).toMatchObject({
      agent: 'codex',
      method: 'three-act',
      git: false,
      withExperts: false
    });
    expect(initCalls[0].ai).toBeUndefined();
    expect(result.blocked).toBe(false);
    expect(result.project).toMatchObject({
      name: 'spell-era',
      path: projectPath,
      lastOpenedAt: '2026-05-06T13:30:00.000Z'
    });
    await expect(store.list()).resolves.toEqual([result.project]);
  });
});
