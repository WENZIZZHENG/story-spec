import { describe, expect, it } from 'vitest';
import {
  MULTIUSER_MIGRATION_VERSION,
  createMultiuserMigrationPlan,
  multiuserDatabaseSchema
} from '../../src/server/db/schema.js';
import {
  createMultiuserDatabaseRepositories,
  type MultiuserDatabaseExecutor
} from '../../src/server/db/repositories.js';

describe('multiuser database foundation', () => {
  it('defines all core metadata tables and repeatable migration SQL', () => {
    expect(MULTIUSER_MIGRATION_VERSION).toBe(2);
    expect(Object.keys(multiuserDatabaseSchema).sort()).toEqual([
      'agentJobs',
      'auditLogs',
      'collaborationApplyRequests',
      'collaborationCanonPatches',
      'collaborationProposals',
      'collaborationReviewDecisions',
      'memberships',
      'projects',
      'quotaBuckets',
      'sessions',
      'users'
    ]);

    expect(multiuserDatabaseSchema.users.columns).toEqual(expect.arrayContaining([
      'id',
      'display_name',
      'created_at'
    ]));
    expect(multiuserDatabaseSchema.sessions.columns).toEqual(expect.arrayContaining([
      'token',
      'user_id',
      'expires_at',
      'revoked_at'
    ]));
    expect(multiuserDatabaseSchema.projects.columns).toEqual(expect.arrayContaining([
      'id',
      'owner_user_id',
      'data_root'
    ]));
    expect(multiuserDatabaseSchema.memberships.columns).toEqual(expect.arrayContaining([
      'project_id',
      'user_id',
      'role'
    ]));
    expect(multiuserDatabaseSchema.memberships.createStatements.join('\n')).toContain(
      "role in ('owner', 'editor', 'reviewer', 'viewer', 'agent')"
    );
    expect(multiuserDatabaseSchema.agentJobs.columns).toEqual(expect.arrayContaining([
      'id',
      'user_id',
      'project_id',
      'kind',
      'runtime',
      'status',
      'attempt',
      'idempotency_key',
      'created_at',
      'updated_at',
      'error_message'
    ]));
    expect(multiuserDatabaseSchema.auditLogs.columns).toEqual(expect.arrayContaining([
      'id',
      'actor_user_id',
      'project_id',
      'action',
      'source',
      'diff_summary',
      'job_id',
      'created_at'
    ]));
    expect(multiuserDatabaseSchema.quotaBuckets.columns).toEqual(expect.arrayContaining([
      'id',
      'owner_type',
      'owner_id',
      'metric',
      'limit_value',
      'used',
      'updated_at'
    ]));
    expect(multiuserDatabaseSchema.collaborationProposals.columns).toEqual(expect.arrayContaining([
      'id',
      'actor_user_id',
      'project_id',
      'story_id',
      'status',
      'target',
      'source_refs',
      'summary',
      'risks',
      'created_at',
      'updated_at'
    ]));

    const migration = createMultiuserMigrationPlan();
    expect(migration.version).toBe(2);
    expect(migration.statements).toEqual(expect.arrayContaining([
      expect.stringContaining('create table if not exists users'),
      expect.stringContaining('create table if not exists sessions'),
      expect.stringContaining('create table if not exists projects'),
      expect.stringContaining('create table if not exists memberships'),
      expect.stringContaining('create table if not exists agent_jobs'),
      expect.stringContaining('create table if not exists audit_logs'),
      expect.stringContaining('create table if not exists quota_buckets'),
      expect.stringContaining('create table if not exists collaboration_proposals'),
      expect.stringContaining('create table if not exists collaboration_review_decisions'),
      expect.stringContaining('create table if not exists collaboration_canon_patches'),
      expect.stringContaining('create table if not exists collaboration_apply_requests')
    ]));
    expect(createMultiuserMigrationPlan()).toEqual(migration);
  });

  it('adapts repository interfaces through a database executor boundary', async () => {
    const queries: Array<{ sql: string; params: unknown[] }> = [];
    const executor: MultiuserDatabaseExecutor = {
      async queryOne(sql, params) {
        queries.push({ sql, params });
        if (sql.includes('from users')) {
          return { id: 'user-1', display_name: '作者甲' };
        }
        if (sql.includes('from projects')) {
          return {
            id: 'project-1',
            owner_user_id: 'user-1',
            data_root: 'D:\\storyspec-data\\project-1'
          };
        }
        if (sql.includes('from memberships')) {
          return {
            project_id: 'project-1',
            user_id: 'user-1',
            role: 'owner'
          };
        }
        if (sql.includes('from quota_buckets')) {
          return {
            id: 'quota-1',
            owner_type: 'project',
            owner_id: 'project-1',
            metric: 'job',
            limit_value: 3,
            used: 1
          };
        }
        return undefined;
      },
      async queryMany(sql, params) {
        queries.push({ sql, params });
        return [{
          id: 'audit-1',
          actor_user_id: 'user-1',
          project_id: 'project-1',
          action: 'chapter.apply',
          source: 'agent-job',
          diff_summary: '写入 chapter-001.md',
          job_id: 'job-1',
          created_at: '2026-05-08T12:00:00.000Z'
        }];
      },
      async execute(sql, params) {
        queries.push({ sql, params });
      }
    };
    const repositories = createMultiuserDatabaseRepositories(executor);

    await expect(repositories.sessions.findUser('user-1')).resolves.toEqual({
      id: 'user-1',
      displayName: '作者甲'
    });
    await expect(repositories.projects.findProject('project-1')).resolves.toEqual({
      id: 'project-1',
      ownerUserId: 'user-1',
      dataRoot: 'D:\\storyspec-data\\project-1'
    });
    await expect(repositories.projects.findMembership({
      projectId: 'project-1',
      userId: 'user-1'
    })).resolves.toEqual({
      projectId: 'project-1',
      userId: 'user-1',
      role: 'owner'
    });
    await expect(repositories.quota.findBucket({
      scopeType: 'project',
      scopeId: 'project-1',
      metric: 'job'
    })).resolves.toEqual({
      id: 'quota-1',
      scopeType: 'project',
      scopeId: 'project-1',
      metric: 'job',
      limit: 3,
      used: 1
    });
    await expect(repositories.audit.listByProject('project-1')).resolves.toEqual([{
      id: 'audit-1',
      actorUserId: 'user-1',
      projectId: 'project-1',
      action: 'chapter.apply',
      source: 'agent-job',
      diffSummary: '写入 chapter-001.md',
      jobId: 'job-1',
      createdAt: '2026-05-08T12:00:00.000Z'
    }]);

    await repositories.sessions.saveSession({
      token: 'session-1',
      userId: 'user-1',
      expiresAt: '2026-05-08T13:00:00.000Z'
    });
    await repositories.quota.saveBucket({
      id: 'quota-1',
      scopeType: 'project',
      scopeId: 'project-1',
      metric: 'job',
      limit: 3,
      used: 2
    });

    expect(queries.some(query => query.sql.includes('insert into sessions'))).toBe(true);
    expect(queries.some(query => query.sql.includes('insert into quota_buckets'))).toBe(true);
  });

  it('adapts collaboration canon repository through the database executor boundary', async () => {
    const queries: Array<{ sql: string; params: unknown[] }> = [];
    const executor: MultiuserDatabaseExecutor = {
      async queryOne(sql, params) {
        queries.push({ sql, params });
        if (sql.includes('from collaboration_proposals')) {
          return {
            id: 'proposal-1',
            actor_user_id: 'user-1',
            project_id: 'project-1',
            story_id: 'story-main',
            status: 'approved',
            target: {
              kind: 'canon',
              path: 'stories/main/canon.md',
              resourceVersion: 'canon-v1'
            },
            source_refs: [{
              kind: 'manual',
              id: 'note-1',
              label: '人工记录'
            }],
            summary: '候选事实。',
            risks: [],
            created_at: '2026-05-08T12:00:00.000Z',
            updated_at: '2026-05-08T12:01:00.000Z'
          };
        }
        return undefined;
      },
      async queryMany(sql, params) {
        queries.push({ sql, params });
        if (sql.includes('from collaboration_review_decisions')) {
          return [{
            id: 'review-1',
            proposal_id: 'proposal-1',
            reviewer_user_id: 'user-2',
            decision: 'approve',
            note: '可以应用。',
            created_at: '2026-05-08T12:02:00.000Z'
          }];
        }
        if (sql.includes('from collaboration_canon_patches')) {
          return [{
            id: 'patch-1',
            proposal_id: 'proposal-1',
            target_path: 'stories/main/canon.md',
            kind: 'canon-fact',
            diff_summary: '新增正典事实。',
            rollback_hint: '删除 fact-1。',
            source_refs: ['note-1']
          }];
        }
        if (sql.includes('from collaboration_apply_requests')) {
          return [{
            id: 'apply-1',
            proposal_id: 'proposal-1',
            actor_user_id: 'user-1',
            status: 'ready',
            current_version: {
              resourceVersion: 'canon-v1',
              storyStage: 'drafting',
              canonFactIds: ['fact-old'],
              taskState: 'open'
            },
            patch_ids: ['patch-1'],
            reviewer_ids: ['user-2'],
            blocked_reasons: [],
            created_at: '2026-05-08T12:03:00.000Z'
          }];
        }
        if (sql.includes('from collaboration_proposals')) {
          return [{
            id: 'proposal-1',
            actor_user_id: 'user-1',
            project_id: 'project-1',
            story_id: 'story-main',
            status: 'approved',
            target: {
              kind: 'canon',
              path: 'stories/main/canon.md',
              resourceVersion: 'canon-v1'
            },
            source_refs: [],
            summary: '候选事实。',
            risks: [],
            created_at: '2026-05-08T12:00:00.000Z',
            updated_at: '2026-05-08T12:01:00.000Z'
          }];
        }
        return [];
      },
      async execute(sql, params) {
        queries.push({ sql, params });
      }
    };
    const repositories = createMultiuserDatabaseRepositories(executor);

    await repositories.collaboration.saveProposal({
      id: 'proposal-1',
      actorUserId: 'user-1',
      projectId: 'project-1',
      storyId: 'story-main',
      status: 'draft',
      target: {
        kind: 'canon',
        path: 'stories/main/canon.md',
        resourceVersion: 'canon-v1'
      },
      sourceRefs: [{
        kind: 'manual',
        id: 'note-1',
        label: '人工记录'
      }],
      summary: '候选事实。',
      risks: [],
      createdAt: '2026-05-08T12:00:00.000Z',
      updatedAt: '2026-05-08T12:00:00.000Z'
    });
    await expect(repositories.collaboration.findProposalById('proposal-1')).resolves.toMatchObject({
      id: 'proposal-1',
      actorUserId: 'user-1',
      target: {
        kind: 'canon'
      }
    });

    await repositories.collaboration.saveReviewDecision({
      id: 'review-1',
      proposalId: 'proposal-1',
      reviewerUserId: 'user-2',
      decision: 'approve',
      note: '可以应用。',
      createdAt: '2026-05-08T12:02:00.000Z'
    });
    await expect(repositories.collaboration.listReviewDecisions('proposal-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'review-1',
        proposalId: 'proposal-1',
        decision: 'approve'
      })
    ]);

    await repositories.collaboration.savePatch({
      id: 'patch-1',
      proposalId: 'proposal-1',
      targetPath: 'stories/main/canon.md',
      kind: 'canon-fact',
      diffSummary: '新增正典事实。',
      rollbackHint: '删除 fact-1。',
      sourceRefs: ['note-1']
    });
    await expect(repositories.collaboration.listPatches('proposal-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'patch-1',
        sourceRefs: ['note-1']
      })
    ]);

    await repositories.collaboration.saveApplyRequest({
      id: 'apply-1',
      proposalId: 'proposal-1',
      actorUserId: 'user-1',
      status: 'ready',
      currentVersion: {
        resourceVersion: 'canon-v1',
        storyStage: 'drafting',
        canonFactIds: ['fact-old'],
        taskState: 'open'
      },
      patchIds: ['patch-1'],
      reviewerIds: ['user-2'],
      blockedReasons: [],
      createdAt: '2026-05-08T12:03:00.000Z'
    });
    expect(repositories.collaboration.snapshot()).toMatchObject({
      proposals: [
        { id: 'proposal-1' }
      ],
      reviewDecisions: [
        { id: 'review-1' }
      ],
      patches: [
        { id: 'patch-1' }
      ],
      applyRequests: [
        { id: 'apply-1' }
      ],
      commentThreads: []
    });
    expect(queries.some(query => query.sql.includes('insert into collaboration_proposals'))).toBe(true);
    expect(queries.some(query => query.sql.includes('insert into collaboration_review_decisions'))).toBe(true);
    expect(queries.some(query => query.sql.includes('insert into collaboration_canon_patches'))).toBe(true);
    expect(queries.some(query => query.sql.includes('insert into collaboration_apply_requests'))).toBe(true);
  });
});
