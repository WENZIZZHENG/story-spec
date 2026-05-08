import { describe, expect, it } from 'vitest';
import { createMemoryAuditLogRepository } from '../../src/server/audit/audit-log.js';
import {
  createProjectDeletionPlan,
  createProjectExportManifest,
  createProjectSnapshotPlan,
  recordProjectLifecycleAudit
} from '../../src/server/projects/project-lifecycle.js';

const project = {
  id: 'project-1',
  ownerUserId: 'user-1',
  dataRoot: 'D:\\storyspec-data\\project-1'
};

describe('multiuser project lifecycle plans', () => {
  it('creates snapshot and export plans without touching project files', () => {
    expect(createProjectSnapshotPlan({
      project,
      now: () => '2026-05-08T12:00:00.000Z',
      idGenerator: () => 'snapshot-1'
    })).toEqual({
      id: 'snapshot-1',
      projectId: 'project-1',
      dataRoot: 'D:\\storyspec-data\\project-1',
      artifactPath: 'snapshots/project-1/snapshot-1.zip',
      createdAt: '2026-05-08T12:00:00.000Z'
    });

    expect(createProjectExportManifest({
      project,
      now: () => '2026-05-08T12:00:00.000Z'
    })).toEqual({
      projectId: 'project-1',
      dataRoot: 'D:\\storyspec-data\\project-1',
      format: 'storyspec-project',
      createdAt: '2026-05-08T12:00:00.000Z',
      include: [
        'stories/**',
        'spec/**',
        '.specify/memory/**',
        'README.md'
      ]
    });
  });

  it('creates deletion plans that require confirmation and can be audited', async () => {
    const auditRepository = createMemoryAuditLogRepository();
    const plan = createProjectDeletionPlan({
      project,
      actorUserId: 'user-1',
      now: () => '2026-05-08T12:00:00.000Z'
    });

    expect(plan).toEqual({
      projectId: 'project-1',
      actorUserId: 'user-1',
      dataRoot: 'D:\\storyspec-data\\project-1',
      requiresConfirmation: true,
      auditAction: 'project.delete.plan',
      createdAt: '2026-05-08T12:00:00.000Z'
    });

    await recordProjectLifecycleAudit({
      repository: auditRepository,
      plan,
      now: () => '2026-05-08T12:01:00.000Z',
      idGenerator: () => 'audit-delete-plan'
    });

    await expect(auditRepository.listByProject('project-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'audit-delete-plan',
        actorUserId: 'user-1',
        projectId: 'project-1',
        action: 'project.delete.plan',
        source: 'project-lifecycle',
        diffSummary: '计划删除项目 project-1，等待二次确认'
      })
    ]);
  });
});
