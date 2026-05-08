import { describe, expect, it } from 'vitest';
import {
  createMemoryAuditLogRepository,
  recordAuditEvent
} from '../../src/server/audit/audit-log.js';
import {
  checkQuota,
  consumeQuota,
  createMemoryQuotaRepository
} from '../../src/server/quota/quota.js';

describe('multiuser audit and quota foundation', () => {
  it('records audit events with actor, project and job context', async () => {
    const repository = createMemoryAuditLogRepository();

    const result = await recordAuditEvent({
      repository,
      actorUserId: 'user-1',
      projectId: 'project-1',
      action: 'chapter.apply',
      source: 'agent-job',
      diffSummary: '写入 chapter-001.md',
      jobId: 'job-1',
      now: () => '2026-05-08T12:00:00.000Z',
      idGenerator: () => 'audit-1'
    });

    expect(result).toEqual({
      id: 'audit-1',
      actorUserId: 'user-1',
      projectId: 'project-1',
      action: 'chapter.apply',
      source: 'agent-job',
      diffSummary: '写入 chapter-001.md',
      jobId: 'job-1',
      createdAt: '2026-05-08T12:00:00.000Z'
    });
    await expect(repository.listByProject('project-1')).resolves.toEqual([result]);
  });

  it('checks and consumes quota without exceeding the limit', async () => {
    const repository = createMemoryQuotaRepository({
      buckets: [{
        id: 'quota-1',
        scopeType: 'project',
        scopeId: 'project-1',
        metric: 'job',
        limit: 3,
        used: 1
      }]
    });

    await expect(checkQuota({
      repository,
      scopeType: 'project',
      scopeId: 'project-1',
      metric: 'job',
      amount: 2
    })).resolves.toMatchObject({
      blocked: false,
      bucket: {
        used: 1,
        limit: 3
      }
    });

    await expect(consumeQuota({
      repository,
      scopeType: 'project',
      scopeId: 'project-1',
      metric: 'job',
      amount: 2
    })).resolves.toMatchObject({
      blocked: false,
      bucket: {
        used: 3,
        limit: 3
      }
    });
  });

  it('blocks quota consumption that would exceed the limit', async () => {
    const repository = createMemoryQuotaRepository({
      buckets: [{
        id: 'quota-1',
        scopeType: 'user',
        scopeId: 'user-1',
        metric: 'token',
        limit: 100,
        used: 90
      }]
    });

    await expect(consumeQuota({
      repository,
      scopeType: 'user',
      scopeId: 'user-1',
      metric: 'token',
      amount: 11
    })).resolves.toMatchObject({
      blocked: true,
      blockedReasons: ['配额不足：token 已用 90/100，本次需要 11']
    });
  });
});
