import { describe, expect, it } from 'vitest';
import {
  createMemorySessionRepository,
  createUserSession,
  requireUser,
  revokeSession
} from '../../src/server/auth/session.js';

describe('multiuser session foundation', () => {
  it('creates a session and resolves an authenticated user context', async () => {
    const repository = createMemorySessionRepository({
      users: [{
        id: 'user-1',
        displayName: '作者甲'
      }]
    });

    const created = await createUserSession({
      repository,
      userId: 'user-1',
      token: 'session-token',
      now: () => '2026-05-08T12:00:00.000Z',
      ttlMs: 60_000
    });

    expect(created.blocked).toBe(false);
    expect(created.session).toMatchObject({
      token: 'session-token',
      userId: 'user-1',
      expiresAt: '2026-05-08T12:01:00.000Z',
      revokedAt: undefined
    });

    await expect(requireUser({
      repository,
      token: 'session-token',
      now: () => '2026-05-08T12:00:30.000Z'
    })).resolves.toMatchObject({
      blocked: false,
      user: {
        id: 'user-1',
        displayName: '作者甲'
      },
      context: {
        userId: 'user-1'
      }
    });
  });

  it('rejects missing, expired and revoked sessions', async () => {
    const repository = createMemorySessionRepository({
      users: [{
        id: 'user-1',
        displayName: '作者甲'
      }]
    });

    await createUserSession({
      repository,
      userId: 'user-1',
      token: 'expired-token',
      now: () => '2026-05-08T12:00:00.000Z',
      ttlMs: 1_000
    });
    await createUserSession({
      repository,
      userId: 'user-1',
      token: 'revoked-token',
      now: () => '2026-05-08T12:00:00.000Z',
      ttlMs: 60_000
    });
    await revokeSession({
      repository,
      token: 'revoked-token',
      now: () => '2026-05-08T12:00:10.000Z'
    });

    await expect(requireUser({
      repository,
      token: ''
    })).resolves.toMatchObject({
      blocked: true,
      blockedReasons: ['缺少 session token']
    });
    await expect(requireUser({
      repository,
      token: 'expired-token',
      now: () => '2026-05-08T12:00:02.000Z'
    })).resolves.toMatchObject({
      blocked: true,
      blockedReasons: ['session 已过期']
    });
    await expect(requireUser({
      repository,
      token: 'revoked-token',
      now: () => '2026-05-08T12:00:20.000Z'
    })).resolves.toMatchObject({
      blocked: true,
      blockedReasons: ['session 已撤销']
    });
  });
});
