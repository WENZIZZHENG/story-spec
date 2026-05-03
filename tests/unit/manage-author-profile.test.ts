import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  authorProfilePath,
  initAuthorProfile,
  loadAuthorProfile,
  renderAuthorProfileSummary,
  summarizeAuthorProfile,
  updateAuthorProfile
} from '../../src/application/manage-author-profile.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-author-profile');
  const fileSystem = new MemoryFileSystem(projectRoot);

  return { projectRoot, fileSystem };
};

describe('manage author profile', () => {
  it('creates a skippable first-use sample without treating it as confirmed preference', async () => {
    const { projectRoot, fileSystem } = createProject();

    const result = await initAuthorProfile({
      projectRoot,
      fileSystem,
      answers: {
        genre: '18+ 玄幻、异界穿越、轻松冒险',
        pacing: '慢热，先共创关键选择'
      },
      now: () => new Date('2026-05-04T08:00:00.000Z')
    });

    expect(result.sampleQuestions).toHaveLength(4);
    expect(result.sampleQuestions.every(question => question.skippable)).toBe(true);
    expect(result.profile.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'pref.genre',
        status: 'provisional',
        source: 'sampled',
        value: '18+ 玄幻、异界穿越、轻松冒险'
      }),
      expect.objectContaining({
        id: 'pref.pacing',
        status: 'provisional',
        source: 'sampled'
      })
    ]));
    expect(result.summary.confirmedCount).toBe(0);
    expect(result.summary.provisionalCount).toBe(2);
    await expect(fileSystem.pathExists(authorProfilePath(projectRoot))).resolves.toBe(true);
  });

  it('loads confirmed author preferences as reusable hints while keeping provisional entries weaker', async () => {
    const { projectRoot, fileSystem } = createProject();
    await fileSystem.writeJson(authorProfilePath(projectRoot), {
      schemaVersion: '1.0',
      updatedAt: '2026-05-04T08:00:00.000Z',
      notes: [],
      entries: [
        {
          id: 'pref.genre',
          category: 'genre',
          label: '题材偏好',
          value: '轻松冒险优先，文明级威胁慢慢浮现',
          status: 'confirmed',
          source: 'user-explicit',
          evidence: ['用户确认'],
          createdAt: '2026-05-04T08:00:00.000Z',
          updatedAt: '2026-05-04T08:00:00.000Z',
          confirmedAt: '2026-05-04T08:00:00.000Z'
        },
        {
          id: 'pref.boundary',
          category: 'boundary',
          label: '创作禁区',
          value: '不要把建设流写成纯种田',
          status: 'provisional',
          source: 'sampled',
          evidence: ['首次采样'],
          createdAt: '2026-05-04T08:00:00.000Z',
          updatedAt: '2026-05-04T08:00:00.000Z'
        },
        {
          id: 'pref.voice',
          category: 'voice',
          label: '叙述声音',
          value: '废弃的声音偏好',
          status: 'deprecated',
          source: 'sampled',
          evidence: [],
          createdAt: '2026-05-04T08:00:00.000Z',
          updatedAt: '2026-05-04T08:00:00.000Z'
        }
      ]
    }, { spaces: 2 });

    const result = await loadAuthorProfile({ projectRoot, fileSystem });

    expect(result.exists).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.summary.activeHints).toEqual([
      '[confirmed] 题材偏好：轻松冒险优先，文明级威胁慢慢浮现',
      '[provisional] 创作禁区：不要把建设流写成纯种田'
    ]);
    expect(renderAuthorProfileSummary(result)).toContain('只影响推荐和示例，不进入故事正典');
  });

  it('lets the author confirm, deprecate, ignore, or clear long-term preferences explicitly', async () => {
    const { projectRoot, fileSystem } = createProject();
    await initAuthorProfile({
      projectRoot,
      fileSystem,
      answers: {
        genre: '异界穿越',
        voice: '轻松但不胡闹'
      },
      now: () => new Date('2026-05-04T08:00:00.000Z')
    });

    const confirmed = await updateAuthorProfile({
      projectRoot,
      fileSystem,
      confirmIds: ['pref.genre'],
      ignoreIds: ['pref.voice'],
      now: () => new Date('2026-05-04T09:00:00.000Z')
    });
    expect(confirmed.profile.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'pref.genre',
        status: 'confirmed',
        confirmedAt: '2026-05-04T09:00:00.000Z'
      }),
      expect.objectContaining({
        id: 'pref.voice',
        ignored: true
      })
    ]));
    expect(summarizeAuthorProfile(confirmed.profile).activeHints.join('\n')).not.toContain('轻松但不胡闹');

    const deprecated = await updateAuthorProfile({
      projectRoot,
      fileSystem,
      deprecateIds: ['pref.genre'],
      now: () => new Date('2026-05-04T10:00:00.000Z')
    });
    expect(deprecated.profile.entries.find(entry => entry.id === 'pref.genre')?.status).toBe('deprecated');

    const cleared = await updateAuthorProfile({
      projectRoot,
      fileSystem,
      clear: true,
      now: () => new Date('2026-05-04T11:00:00.000Z')
    });
    expect(cleared.profile.entries).toEqual([]);
  });
});
