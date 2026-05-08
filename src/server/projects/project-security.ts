import path from 'node:path';

export type ProjectRole = 'owner' | 'member';

export interface MultiuserProject {
  id: string;
  ownerUserId: string;
  dataRoot: string;
}

export interface ProjectMembership {
  projectId: string;
  userId: string;
  role: ProjectRole;
}

export interface ProjectAccessContext {
  userId: string;
  projectId: string;
  role: ProjectRole;
}

export interface ProjectAccessRepository {
  findProject(projectId: string): Promise<MultiuserProject | undefined>;
  findMembership(input: { projectId: string; userId: string }): Promise<ProjectMembership | undefined>;
}

export interface RequireProjectAccessInput {
  repository: ProjectAccessRepository;
  userId?: string;
  projectId?: string;
  minimumRole?: ProjectRole;
}

export interface ProjectAccessResult {
  blocked: boolean;
  blockedReasons: string[];
  project?: MultiuserProject;
  context?: ProjectAccessContext;
}

export interface MemoryProjectAccessRepositoryInput {
  projects: MultiuserProject[];
  memberships: ProjectMembership[];
}

export interface ProjectStorage {
  readonly project: MultiuserProject;
  resolve(relativePath: string): string;
}

const roleRank: Record<ProjectRole, number> = {
  member: 1,
  owner: 2
};

const blocked = (reason: string): ProjectAccessResult => ({
  blocked: true,
  blockedReasons: [reason]
});

export const createMemoryProjectAccessRepository = (
  input: MemoryProjectAccessRepositoryInput
): ProjectAccessRepository => {
  const projects = new Map(input.projects.map(project => [project.id, {
    ...project,
    dataRoot: path.resolve(project.dataRoot)
  }]));
  const memberships = new Map(input.memberships.map(membership => [
    `${membership.projectId}:${membership.userId}`,
    membership
  ]));

  return {
    async findProject(projectId) {
      return projects.get(projectId);
    },
    async findMembership(query) {
      return memberships.get(`${query.projectId}:${query.userId}`);
    }
  };
};

export const requireProjectAccess = async (
  input: RequireProjectAccessInput
): Promise<ProjectAccessResult> => {
  const userId = input.userId?.trim();
  const projectId = input.projectId?.trim();

  if (!userId) {
    return blocked('缺少 userId，禁止匿名访问项目');
  }

  if (!projectId) {
    return blocked('缺少 projectId，禁止仅凭文件路径访问项目');
  }

  const project = await input.repository.findProject(projectId);
  if (!project) {
    return blocked('项目不存在');
  }

  const membership = await input.repository.findMembership({ projectId, userId });
  if (!membership) {
    return blocked('用户无权访问该项目');
  }

  const minimumRole = input.minimumRole ?? 'member';
  if (roleRank[membership.role] < roleRank[minimumRole]) {
    return blocked('用户角色权限不足');
  }

  return {
    blocked: false,
    blockedReasons: [],
    project,
    context: {
      userId,
      projectId,
      role: membership.role
    }
  };
};

const normalizePathParts = (relativePath: string): string[] =>
  relativePath
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean);

export const createProjectStorage = (project: MultiuserProject): ProjectStorage => {
  const dataRoot = path.resolve(project.dataRoot);

  return {
    project: {
      ...project,
      dataRoot
    },
    resolve(relativePath) {
      const trimmed = relativePath.trim();
      if (!trimmed) {
        throw new Error('项目路径不能为空');
      }

      if (path.isAbsolute(trimmed)) {
        throw new Error('项目路径必须是相对路径');
      }

      const parts = normalizePathParts(trimmed);
      if (parts.some(part => part === '..')) {
        throw new Error('项目路径不能包含 ..');
      }

      const resolved = path.resolve(dataRoot, ...parts);
      const relative = path.relative(dataRoot, resolved);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error('项目路径越界');
      }

      return resolved;
    }
  };
};
