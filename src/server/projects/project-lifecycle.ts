import type { AuditLogRepository } from '../audit/audit-log.js';
import { recordAuditEvent } from '../audit/audit-log.js';
import type { MultiuserProject } from './project-security.js';

export interface ProjectSnapshotPlan {
  id: string;
  projectId: string;
  dataRoot: string;
  artifactPath: string;
  createdAt: string;
}

export interface ProjectExportManifest {
  projectId: string;
  dataRoot: string;
  format: 'storyspec-project';
  createdAt: string;
  include: string[];
}

export interface ProjectDeletionPlan {
  projectId: string;
  actorUserId: string;
  dataRoot: string;
  requiresConfirmation: true;
  auditAction: 'project.delete.plan';
  createdAt: string;
}

export interface ProjectLifecycleInput {
  project: MultiuserProject;
  now?: () => string;
}

export interface ProjectSnapshotPlanInput extends ProjectLifecycleInput {
  idGenerator?: () => string;
}

export interface ProjectDeletionPlanInput extends ProjectLifecycleInput {
  actorUserId: string;
}

export interface RecordProjectLifecycleAuditInput {
  repository: AuditLogRepository;
  plan: ProjectDeletionPlan;
  now?: () => string;
  idGenerator?: () => string;
}

const currentTimestamp = (): string => new Date().toISOString();
const defaultSnapshotId = (): string => `snapshot-${Math.random().toString(36).slice(2, 12)}`;

export const createProjectSnapshotPlan = (
  input: ProjectSnapshotPlanInput
): ProjectSnapshotPlan => {
  const id = input.idGenerator?.() ?? defaultSnapshotId();
  return {
    id,
    projectId: input.project.id,
    dataRoot: input.project.dataRoot,
    artifactPath: `snapshots/${input.project.id}/${id}.zip`,
    createdAt: input.now?.() ?? currentTimestamp()
  };
};

export const createProjectExportManifest = (
  input: ProjectLifecycleInput
): ProjectExportManifest => ({
  projectId: input.project.id,
  dataRoot: input.project.dataRoot,
  format: 'storyspec-project',
  createdAt: input.now?.() ?? currentTimestamp(),
  include: [
    'stories/**',
    'spec/**',
    '.specify/memory/**',
    'README.md'
  ]
});

export const createProjectDeletionPlan = (
  input: ProjectDeletionPlanInput
): ProjectDeletionPlan => ({
  projectId: input.project.id,
  actorUserId: input.actorUserId,
  dataRoot: input.project.dataRoot,
  requiresConfirmation: true,
  auditAction: 'project.delete.plan',
  createdAt: input.now?.() ?? currentTimestamp()
});

export const recordProjectLifecycleAudit = async (
  input: RecordProjectLifecycleAuditInput
) => recordAuditEvent({
  repository: input.repository,
  actorUserId: input.plan.actorUserId,
  projectId: input.plan.projectId,
  action: input.plan.auditAction,
  source: 'project-lifecycle',
  diffSummary: `计划删除项目 ${input.plan.projectId}，等待二次确认`,
  now: input.now,
  idGenerator: input.idGenerator
});
