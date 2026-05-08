export interface MultiuserUser {
  id: string;
  displayName: string;
}

export interface MultiuserSession {
  token: string;
  userId: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface UserContext {
  userId: string;
}

export interface SessionRepository {
  findUser(userId: string): Promise<MultiuserUser | undefined>;
  findSession(token: string): Promise<MultiuserSession | undefined>;
  saveSession(session: MultiuserSession): Promise<void>;
  revokeSession(token: string, revokedAt: string): Promise<MultiuserSession | undefined>;
}

export interface MemorySessionRepositoryInput {
  users: MultiuserUser[];
  sessions?: MultiuserSession[];
}

export interface CreateUserSessionInput {
  repository: SessionRepository;
  userId: string;
  token?: string;
  now?: () => string;
  ttlMs?: number;
  tokenGenerator?: () => string;
}

export interface RequireUserInput {
  repository: SessionRepository;
  token?: string;
  now?: () => string;
}

export interface RevokeSessionInput {
  repository: SessionRepository;
  token: string;
  now?: () => string;
}

export interface SessionResult {
  blocked: boolean;
  blockedReasons: string[];
  user?: MultiuserUser;
  session?: MultiuserSession;
  context?: UserContext;
}

const currentTimestamp = (): string => new Date().toISOString();

const defaultToken = (): string => `sess-${Math.random().toString(36).slice(2, 18)}`;

const blocked = (reason: string): SessionResult => ({
  blocked: true,
  blockedReasons: [reason]
});

const isExpired = (session: MultiuserSession, now: string): boolean =>
  Date.parse(session.expiresAt) <= Date.parse(now);

export const createMemorySessionRepository = (
  input: MemorySessionRepositoryInput
): SessionRepository => {
  const users = new Map(input.users.map(user => [user.id, user]));
  const sessions = new Map((input.sessions ?? []).map(session => [session.token, session]));

  return {
    async findUser(userId) {
      return users.get(userId);
    },
    async findSession(token) {
      return sessions.get(token);
    },
    async saveSession(session) {
      sessions.set(session.token, session);
    },
    async revokeSession(token, revokedAt) {
      const session = sessions.get(token);
      if (!session) {
        return undefined;
      }
      const revoked = {
        ...session,
        revokedAt
      };
      sessions.set(token, revoked);
      return revoked;
    }
  };
};

export const createUserSession = async (
  input: CreateUserSessionInput
): Promise<SessionResult> => {
  const user = await input.repository.findUser(input.userId);
  if (!user) {
    return blocked('用户不存在');
  }

  const now = input.now?.() ?? currentTimestamp();
  const ttlMs = input.ttlMs ?? 24 * 60 * 60 * 1000;
  const session = {
    token: input.token ?? input.tokenGenerator?.() ?? defaultToken(),
    userId: user.id,
    expiresAt: new Date(Date.parse(now) + ttlMs).toISOString(),
    revokedAt: undefined
  };

  await input.repository.saveSession(session);

  return {
    blocked: false,
    blockedReasons: [],
    user,
    session,
    context: {
      userId: user.id
    }
  };
};

export const requireUser = async (
  input: RequireUserInput
): Promise<SessionResult> => {
  const token = input.token?.trim();
  if (!token) {
    return blocked('缺少 session token');
  }

  const session = await input.repository.findSession(token);
  if (!session) {
    return blocked('session 不存在');
  }

  if (session.revokedAt) {
    return blocked('session 已撤销');
  }

  if (isExpired(session, input.now?.() ?? currentTimestamp())) {
    return blocked('session 已过期');
  }

  const user = await input.repository.findUser(session.userId);
  if (!user) {
    return blocked('用户不存在');
  }

  return {
    blocked: false,
    blockedReasons: [],
    user,
    session,
    context: {
      userId: user.id
    }
  };
};

export const revokeSession = async (
  input: RevokeSessionInput
): Promise<SessionResult> => {
  const token = input.token.trim();
  if (!token) {
    return blocked('缺少 session token');
  }

  const session = await input.repository.revokeSession(token, input.now?.() ?? currentTimestamp());
  if (!session) {
    return blocked('session 不存在');
  }

  return {
    blocked: false,
    blockedReasons: [],
    session
  };
};
