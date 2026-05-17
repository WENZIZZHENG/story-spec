import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createMemoryProjectAccessRepository,
  createProjectStorage,
  requireProjectAccess
} from '../../src/server/projects/project-security.js';

describe('multiuser project security', () => {
  it('authorizes an owner through user and project identity', async () => {
    const dataRoot = path.resolve('D:\\storyspec-data\\projects\\spell-era');
    const repository = createMemoryProjectAccessRepository({
      projects: [{
        id: 'project-1',
        ownerUserId: 'user-1',
        dataRoot
      }],
      memberships: [{
        projectId: 'project-1',
        userId: 'user-1',
        role: 'owner'
      }]
    });

    const result = await requireProjectAccess({
      repository,
      userId: 'user-1',
      projectId: 'project-1',
      minimumRole: 'owner'
    });

    expect(result.blocked).toBe(false);
    expect(result.project).toMatchObject({
      id: 'project-1',
      ownerUserId: 'user-1',
      dataRoot
    });
    expect(result.context).toEqual({
      userId: 'user-1',
      projectId: 'project-1',
      role: 'owner'
    });
  });

  it('blocks action-level access when a project role lacks permission', async () => {
    const repository = createMemoryProjectAccessRepository({
      projects: [{
        id: 'project-1',
        ownerUserId: 'user-1',
        dataRoot: path.resolve('D:\\storyspec-data\\projects\\spell-era')
      }],
      memberships: [{
        projectId: 'project-1',
        userId: 'user-2',
        role: 'viewer'
      }]
    });

    await expect(requireProjectAccess({
      repository,
      userId: 'user-2',
      projectId: 'project-1',
      requiredAction: 'comment'
    })).resolves.toMatchObject({
      blocked: true,
      blockedReasons: ['只读成员不能评论，需要向项目拥有者申请更高权限。']
    });
  });

  it('rejects non-members and path-only access', async () => {
    const repository = createMemoryProjectAccessRepository({
      projects: [{
        id: 'project-1',
        ownerUserId: 'user-1',
        dataRoot: path.resolve('D:\\storyspec-data\\projects\\spell-era')
      }],
      memberships: []
    });

    await expect(requireProjectAccess({
      repository,
      userId: 'user-2',
      projectId: 'project-1'
    })).resolves.toMatchObject({
      blocked: true,
      blockedReasons: ['用户无权访问该项目']
    });

    await expect(requireProjectAccess({
      repository,
      userId: 'user-2',
      projectId: ''
    })).resolves.toMatchObject({
      blocked: true,
      blockedReasons: ['缺少 projectId，禁止仅凭文件路径访问项目']
    });
  });

  it('resolves relative paths inside the project data root and rejects escapes', () => {
    const storage = createProjectStorage({
      id: 'project-1',
      ownerUserId: 'user-1',
      dataRoot: path.resolve('D:\\storyspec-data\\projects\\spell-era')
    });

    expect(storage.resolve('stories/main/specification.md')).toBe(
      path.join(path.resolve('D:\\storyspec-data\\projects\\spell-era'), 'stories', 'main', 'specification.md')
    );

    expect(() => storage.resolve('../other-project/secret.md')).toThrow('项目路径不能包含 ..');
    expect(() => storage.resolve(path.resolve('D:\\storyspec-data\\projects\\other\\secret.md'))).toThrow('项目路径必须是相对路径');
    expect(() => storage.resolve('')).toThrow('项目路径不能为空');
  });
});
