import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { AuditLogRepository } from '../audit/audit-log.js';
import { recordAuditEvent } from '../audit/audit-log.js';
import type { SessionRepository } from '../auth/session.js';
import { requireUser } from '../auth/session.js';
import type {
  CanonPatchKind,
  CollaborationCanonRepository,
  CollaborationRisk,
  CollaborationSourceRef,
  CollaborationTarget,
  ReviewDecisionValue,
  VersionSnapshot
} from '../collaboration/canon-merge.js';
import {
  addCollaborationComment,
  buildCollaborationCanonReviewPanel,
  createApplyRequest,
  createCanonPatch,
  createCollaborationProposal,
  submitReviewDecision
} from '../collaboration/canon-merge.js';
import type { AgentJob, AgentJobRepository } from '../jobs/agent-job.js';
import {
  buildAgentJobDashboard,
  cancelAgentJob,
  createAgentJob,
  retryAgentJob
} from '../jobs/agent-job.js';
import type { ProjectPermissionAction } from '../projects/permission-model.js';
import type { ProjectAccessRepository } from '../projects/project-security.js';
import { createProjectStorage, requireProjectAccess } from '../projects/project-security.js';
import type { QuotaRepository } from '../quota/quota.js';
import { checkQuota, consumeQuota } from '../quota/quota.js';
import type { PostgresReadyState } from '../db/postgres.js';
import type { AgentJobQueue } from '../queue/agent-job-queue.js';
import { createAgentJobQueuePayload, unconfiguredQueueReadyState } from '../queue/agent-job-queue.js';
import {
  createErrorResponse,
  createRequestContext,
  createServerHealth
} from './server-core.js';

export interface StartMultiuserServerInput {
  host: string;
  port: number;
  version: string;
  sessionRepository?: SessionRepository;
  projectRepository?: ProjectAccessRepository;
  jobRepository?: AgentJobRepository;
  jobQueue?: AgentJobQueue;
  collaborationRepository?: CollaborationCanonRepository;
  auditRepository?: AuditLogRepository;
  quotaRepository?: QuotaRepository;
  database?: PostgresReadyState;
  runtimeIds?: string[];
  now?: () => string;
  jobIdGenerator?: () => string;
}

export interface MultiuserServer {
  url: string;
  host: string;
  port: number;
  close(): Promise<void>;
}

const readBody = async (request: http.IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
};

const getRequestId = (request: http.IncomingMessage): string =>
  String(request.headers['x-request-id'] ?? request.headers['x-storyspec-request-id'] ?? '');

const getSessionToken = (request: http.IncomingMessage): string => {
  const authorization = String(request.headers.authorization ?? '');
  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice('bearer '.length).trim();
  }
  return String(request.headers['x-storyspec-session-token'] ?? '');
};

const sendJson = (
  response: http.ServerResponse,
  statusCode: number,
  body: unknown,
  requestId?: string
): void => {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    ...(requestId ? { 'x-request-id': requestId } : {})
  });
  response.end(JSON.stringify(body));
};

const parseJsonBody = async (request: http.IncomingMessage): Promise<Record<string, unknown>> => {
  const raw = await readBody(request);
  if (!raw.trim()) {
    return {};
  }
  try {
    const value = JSON.parse(raw) as unknown;
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
};

const requireProjectContext = async (
  input: {
    request: http.IncomingMessage;
    sessionRepository: SessionRepository;
    projectRepository: ProjectAccessRepository;
    projectId?: string;
    requiredAction?: ProjectPermissionAction;
    now?: () => string;
  }
) => {
  const userResult = await requireUser({
    repository: input.sessionRepository,
    token: getSessionToken(input.request),
    now: input.now
  });
  if (userResult.blocked || !userResult.context) {
    return {
      statusCode: 401,
      code: 'AUTH_REQUIRED',
      message: userResult.blockedReasons[0] ?? '认证失败'
    } as const;
  }

  const accessResult = await requireProjectAccess({
    repository: input.projectRepository,
    userId: userResult.context.userId,
    projectId: input.projectId,
    requiredAction: input.requiredAction
  });
  if (accessResult.blocked || !accessResult.context || !accessResult.project) {
    return {
      statusCode: 403,
      code: 'PROJECT_ACCESS_DENIED',
      message: accessResult.blockedReasons[0] ?? '用户无权访问该项目'
    } as const;
  }

  return {
    statusCode: 200,
    userContext: userResult.context,
    project: accessResult.project,
    accessContext: accessResult.context
  } as const;
};

const checkJobQuota = async (
  input: {
    quotaRepository?: QuotaRepository;
    userId: string;
    projectId: string;
  }
) => {
  if (!input.quotaRepository) {
    return { blocked: false, blockedReasons: [] };
  }

  const projectQuota = await checkQuota({
    repository: input.quotaRepository,
    scopeType: 'project',
    scopeId: input.projectId,
    metric: 'job',
    amount: 1
  });
  if (projectQuota.blocked) {
    return projectQuota;
  }

  return checkQuota({
    repository: input.quotaRepository,
    scopeType: 'user',
    scopeId: input.userId,
    metric: 'job',
    amount: 1
  });
};

const consumeJobQuota = async (
  input: {
    quotaRepository?: QuotaRepository;
    userId: string;
    projectId: string;
  }
): Promise<void> => {
  if (!input.quotaRepository) {
    return;
  }

  await consumeQuota({
    repository: input.quotaRepository,
    scopeType: 'project',
    scopeId: input.projectId,
    metric: 'job',
    amount: 1
  });
  await consumeQuota({
    repository: input.quotaRepository,
    scopeType: 'user',
    scopeId: input.userId,
    metric: 'job',
    amount: 1
  });
};

const auditServerMutation = async (
  input: {
    auditRepository?: AuditLogRepository;
    actorUserId: string;
    projectId: string;
    action:
      | 'agent_job.create'
      | 'agent_job.cancel'
      | 'agent_job.retry'
      | 'collaboration.proposal.create'
      | 'collaboration.comment.create'
      | 'collaboration.review.submit'
      | 'collaboration.patch.create'
      | 'collaboration.apply_request.create';
    jobId?: string;
    diffSummary: string;
    now?: () => string;
  }
): Promise<void> => {
  if (!input.auditRepository) {
    return;
  }

  await recordAuditEvent({
    repository: input.auditRepository,
    actorUserId: input.actorUserId,
    projectId: input.projectId,
    action: input.action,
    source: 'multiuser-server',
    diffSummary: input.diffSummary,
    jobId: input.jobId,
    now: input.now
  });
};

const getQueueSnapshot = (queue: AgentJobQueue | undefined) => {
  if (!queue || !('snapshot' in queue) || typeof queue.snapshot !== 'function') {
    return undefined;
  }
  return queue.snapshot() as {
    pending: unknown[];
    acknowledged: unknown[];
    failed: unknown[];
  };
};

const repositoryNotConfigured = (requestId?: string) => createErrorResponse({
  statusCode: 503,
  requestId,
  code: 'MULTIUSER_REPOSITORY_NOT_CONFIGURED',
  message: '多用户 repository 尚未配置'
});

const collaborationMutationBlocked = (requestId: string | undefined, error: unknown) => createErrorResponse({
  statusCode: 400,
  requestId,
  code: 'COLLABORATION_MUTATION_BLOCKED',
  message: error instanceof Error ? error.message : String(error)
});

export const startMultiuserServer = async (input: StartMultiuserServerInput): Promise<MultiuserServer> => {
  const server = http.createServer(async (request, response) => {
    const context = createRequestContext({
      requestId: getRequestId(request)
    });
    const url = new URL(request.url ?? '/', `http://${input.host}`);

    try {
      if (request.method === 'GET' && url.pathname === '/health') {
        sendJson(response, 200, createServerHealth({
          version: input.version
        }), context.requestId);
        return;
      }

      if (request.method === 'GET' && url.pathname === '/ready') {
        sendJson(response, 200, {
          service: 'storyspec-multiuser',
          status: 'ready',
          version: input.version,
          database: input.database ?? {
            configured: false,
            connected: false,
            migrated: false
          },
          repositories: {
            sessions: Boolean(input.sessionRepository),
            projects: Boolean(input.projectRepository),
            jobs: Boolean(input.jobRepository),
            collaboration: Boolean(input.collaborationRepository),
            audit: Boolean(input.auditRepository),
            quota: Boolean(input.quotaRepository)
          },
          queue: input.jobQueue?.getReadyState() ?? unconfiguredQueueReadyState(),
          runtimes: input.runtimeIds ?? []
        }, context.requestId);
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/projects') {
        if (!input.sessionRepository || !input.projectRepository) {
          sendJson(response, 503, createErrorResponse({
            statusCode: 503,
            requestId: context.requestId,
            code: 'MULTIUSER_REPOSITORY_NOT_CONFIGURED',
            message: '多用户 repository 尚未配置'
          }), context.requestId);
          return;
        }

        const userResult = await requireUser({
          repository: input.sessionRepository,
          token: getSessionToken(request),
          now: input.now
        });
        if (userResult.blocked || !userResult.context) {
          sendJson(response, 401, createErrorResponse({
            statusCode: 401,
            requestId: context.requestId,
            code: 'AUTH_REQUIRED',
            message: userResult.blockedReasons[0] ?? '认证失败'
          }), context.requestId);
          return;
        }

        const projects = input.projectRepository.listProjectsForUser
          ? await input.projectRepository.listProjectsForUser(userResult.context.userId)
          : [];
        sendJson(response, 200, { projects }, context.requestId);
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/context') {
        if (!input.sessionRepository || !input.projectRepository) {
          sendJson(response, 503, createErrorResponse({
            statusCode: 503,
            requestId: context.requestId,
            code: 'MULTIUSER_REPOSITORY_NOT_CONFIGURED',
            message: '多用户 repository 尚未配置'
          }), context.requestId);
          return;
        }

        const guard = await requireProjectContext({
          request,
          sessionRepository: input.sessionRepository,
          projectRepository: input.projectRepository,
          projectId: url.searchParams.get('projectId') ?? undefined,
          now: input.now
        });
        if (guard.statusCode !== 200) {
          sendJson(response, guard.statusCode, createErrorResponse({
            statusCode: guard.statusCode,
            requestId: context.requestId,
            code: guard.code,
            message: guard.message
          }), context.requestId);
          return;
        }

        sendJson(response, 200, {
          requestId: context.requestId,
          userId: guard.accessContext.userId,
          projectId: guard.accessContext.projectId,
          role: guard.accessContext.role
        }, context.requestId);
        return;
      }

      const projectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)(?:\/(resolve|members))?$/);
      if (request.method === 'GET' && projectMatch) {
        if (!input.sessionRepository || !input.projectRepository) {
          sendJson(response, 503, createErrorResponse({
            statusCode: 503,
            requestId: context.requestId,
            code: 'MULTIUSER_REPOSITORY_NOT_CONFIGURED',
            message: '多用户 repository 尚未配置'
          }), context.requestId);
          return;
        }

        const guard = await requireProjectContext({
          request,
          sessionRepository: input.sessionRepository,
          projectRepository: input.projectRepository,
          projectId: decodeURIComponent(projectMatch[1] ?? ''),
          now: input.now
        });
        if (guard.statusCode !== 200) {
          sendJson(response, guard.statusCode, createErrorResponse({
            statusCode: guard.statusCode,
            requestId: context.requestId,
            code: guard.code,
            message: guard.message
          }), context.requestId);
          return;
        }

        if (projectMatch[2] === 'members') {
          const members = input.projectRepository.listMembers
            ? await input.projectRepository.listMembers(guard.project.id)
            : [];
          sendJson(response, 200, {
            projectId: guard.project.id,
            members
          }, context.requestId);
          return;
        }

        if (projectMatch[2] === 'resolve') {
          const relativePath = url.searchParams.get('path') ?? '';
          try {
            sendJson(response, 200, {
              projectId: guard.project.id,
              relativePath,
              resolvedPath: createProjectStorage(guard.project).resolve(relativePath)
            }, context.requestId);
          } catch (error) {
            sendJson(response, 400, createErrorResponse({
              statusCode: 400,
              requestId: context.requestId,
              code: 'PROJECT_PATH_INVALID',
              message: error instanceof Error ? error.message : String(error)
            }), context.requestId);
          }
          return;
        }

        sendJson(response, 200, {
          id: guard.project.id,
          ownerUserId: guard.project.ownerUserId,
          dataRoot: guard.project.dataRoot
        }, context.requestId);
        return;
      }

      const collaborationMatch = url.pathname.match(
        /^\/api\/projects\/([^/]+)\/collaboration\/proposals(?:\/([^/]+)\/(reviews|patches|apply-requests|comments))?$/
      );
      const canonReviewMatch = url.pathname.match(
        /^\/api\/projects\/([^/]+)\/stories\/([^/]+)\/canon-review$/
      );
      if (
        request.method === 'GET'
        && (canonReviewMatch || (collaborationMatch && !collaborationMatch[2] && !collaborationMatch[3]))
      ) {
        if (!input.sessionRepository || !input.projectRepository || !input.collaborationRepository) {
          sendJson(response, 503, repositoryNotConfigured(context.requestId), context.requestId);
          return;
        }

        const projectId = decodeURIComponent((canonReviewMatch?.[1] ?? collaborationMatch?.[1]) ?? '');
        const storyId = canonReviewMatch?.[2]
          ? decodeURIComponent(canonReviewMatch[2])
          : url.searchParams.get('storyId') ?? undefined;
        const guard = await requireProjectContext({
          request,
          sessionRepository: input.sessionRepository,
          projectRepository: input.projectRepository,
          projectId,
          now: input.now
        });
        if (guard.statusCode !== 200) {
          sendJson(response, guard.statusCode, createErrorResponse({
            statusCode: guard.statusCode,
            requestId: context.requestId,
            code: guard.code,
            message: guard.message
          }), context.requestId);
          return;
        }

        const panel = await buildCollaborationCanonReviewPanel({
          repository: input.collaborationRepository,
          projectId: guard.accessContext.projectId,
          storyId
        });
        sendJson(response, 200, panel, context.requestId);
        return;
      }
      if (collaborationMatch && request.method === 'GET' && collaborationMatch[3] === 'comments') {
        if (!input.sessionRepository || !input.projectRepository || !input.collaborationRepository) {
          sendJson(response, 503, repositoryNotConfigured(context.requestId), context.requestId);
          return;
        }

        const projectId = decodeURIComponent(collaborationMatch[1] ?? '');
        const proposalId = collaborationMatch[2] ? decodeURIComponent(collaborationMatch[2]) : undefined;
        const guard = await requireProjectContext({
          request,
          sessionRepository: input.sessionRepository,
          projectRepository: input.projectRepository,
          projectId,
          now: input.now
        });
        if (guard.statusCode !== 200) {
          sendJson(response, guard.statusCode, createErrorResponse({
            statusCode: guard.statusCode,
            requestId: context.requestId,
            code: guard.code,
            message: guard.message
          }), context.requestId);
          return;
        }

        const proposal = proposalId
          ? await input.collaborationRepository.findProposalById(proposalId)
          : undefined;
        if (!proposal) {
          sendJson(response, 404, createErrorResponse({
            statusCode: 404,
            requestId: context.requestId,
            code: 'PROPOSAL_NOT_FOUND',
            message: 'proposal 不存在'
          }), context.requestId);
          return;
        }
        if (proposal.projectId !== guard.accessContext.projectId) {
          sendJson(response, 403, createErrorResponse({
            statusCode: 403,
            requestId: context.requestId,
            code: 'PROPOSAL_PROJECT_MISMATCH',
            message: 'proposal 不属于当前项目'
          }), context.requestId);
          return;
        }

        const threads = input.collaborationRepository.listCommentThreads
          ? await input.collaborationRepository.listCommentThreads({
            projectId: guard.accessContext.projectId,
            anchorKind: 'proposal',
            anchorId: proposal.id
          })
          : [];
        sendJson(response, 200, {
          proposalId: proposal.id,
          threads
        }, context.requestId);
        return;
      }
      if (collaborationMatch && request.method === 'POST') {
        if (!input.sessionRepository || !input.projectRepository || !input.collaborationRepository) {
          sendJson(response, 503, repositoryNotConfigured(context.requestId), context.requestId);
          return;
        }

        const projectId = decodeURIComponent(collaborationMatch[1] ?? '');
        const proposalId = collaborationMatch[2] ? decodeURIComponent(collaborationMatch[2]) : undefined;
        const action = collaborationMatch[3];
        const requiredAction: ProjectPermissionAction = action === 'reviews' || action === 'comments'
          ? 'review-canon'
          : action === 'apply-requests'
            ? 'apply-canon-change'
            : 'create-candidate';
        const guard = await requireProjectContext({
          request,
          sessionRepository: input.sessionRepository,
          projectRepository: input.projectRepository,
          projectId,
          requiredAction,
          now: input.now
        });
        if (guard.statusCode !== 200) {
          sendJson(response, guard.statusCode, createErrorResponse({
            statusCode: guard.statusCode,
            requestId: context.requestId,
            code: guard.code,
            message: guard.message
          }), context.requestId);
          return;
        }

        const ensureProjectProposal = async (id: string | undefined) => {
          if (!id) {
            return {
              statusCode: 404,
              code: 'PROPOSAL_NOT_FOUND',
              message: 'proposal 不存在'
            } as const;
          }
          const proposal = await input.collaborationRepository?.findProposalById(id);
          if (!proposal) {
            return {
              statusCode: 404,
              code: 'PROPOSAL_NOT_FOUND',
              message: 'proposal 不存在'
            } as const;
          }
          if (proposal.projectId !== guard.accessContext.projectId) {
            return {
              statusCode: 403,
              code: 'PROPOSAL_PROJECT_MISMATCH',
              message: 'proposal 不属于当前项目'
            } as const;
          }
          return { statusCode: 200, proposal } as const;
        };

        try {
          const body = await parseJsonBody(request);
          if (!proposalId && !action) {
            const proposal = await createCollaborationProposal({
              repository: input.collaborationRepository,
              actorUserId: guard.accessContext.userId,
              projectId: guard.accessContext.projectId,
              storyId: String(body.storyId ?? ''),
              target: body.target as CollaborationTarget,
              sourceRefs: (body.sourceRefs ?? []) as CollaborationSourceRef[],
              summary: String(body.summary ?? ''),
              risks: (body.risks ?? []) as CollaborationRisk[],
              now: input.now
            });
            await auditServerMutation({
              auditRepository: input.auditRepository,
              actorUserId: guard.accessContext.userId,
              projectId: guard.accessContext.projectId,
              action: 'collaboration.proposal.create',
              diffSummary: `创建协作正典 proposal ${proposal.id}`,
              now: input.now
            });
            sendJson(response, 200, proposal, context.requestId);
            return;
          }

          const proposalCheck = await ensureProjectProposal(proposalId);
          if (proposalCheck.statusCode !== 200) {
            sendJson(response, proposalCheck.statusCode, createErrorResponse({
              statusCode: proposalCheck.statusCode,
              requestId: context.requestId,
              code: proposalCheck.code,
              message: proposalCheck.message
            }), context.requestId);
            return;
          }

          if (action === 'reviews') {
            const decision = await submitReviewDecision({
              repository: input.collaborationRepository,
              proposalId: proposalCheck.proposal.id,
              reviewerUserId: guard.accessContext.userId,
              decision: String(body.decision ?? '') as ReviewDecisionValue,
              note: body.note === undefined ? undefined : String(body.note),
              now: input.now
            });
            await auditServerMutation({
              auditRepository: input.auditRepository,
              actorUserId: guard.accessContext.userId,
              projectId: guard.accessContext.projectId,
              action: 'collaboration.review.submit',
              diffSummary: `提交协作正典 review ${decision.id}：${decision.decision}`,
              now: input.now
            });
            sendJson(response, 200, decision, context.requestId);
            return;
          }

          if (action === 'comments') {
            const thread = await addCollaborationComment({
              repository: input.collaborationRepository,
              actorUserId: guard.accessContext.userId,
              projectId: guard.accessContext.projectId,
              storyId: proposalCheck.proposal.storyId,
              anchorKind: 'proposal',
              anchorId: proposalCheck.proposal.id,
              body: String(body.body ?? ''),
              now: input.now
            });
            await auditServerMutation({
              auditRepository: input.auditRepository,
              actorUserId: guard.accessContext.userId,
              projectId: guard.accessContext.projectId,
              action: 'collaboration.comment.create',
              diffSummary: `创建协作正典 comment ${thread.id}`,
              now: input.now
            });
            sendJson(response, 200, thread, context.requestId);
            return;
          }

          if (action === 'patches') {
            const patch = await createCanonPatch({
              repository: input.collaborationRepository,
              proposalId: proposalCheck.proposal.id,
              targetPath: String(body.targetPath ?? ''),
              kind: String(body.kind ?? '') as CanonPatchKind,
              diffSummary: String(body.diffSummary ?? ''),
              rollbackHint: String(body.rollbackHint ?? ''),
              sourceRefs: (body.sourceRefs ?? []) as string[]
            });
            await auditServerMutation({
              auditRepository: input.auditRepository,
              actorUserId: guard.accessContext.userId,
              projectId: guard.accessContext.projectId,
              action: 'collaboration.patch.create',
              diffSummary: `创建协作正典 patch ${patch.id}`,
              now: input.now
            });
            sendJson(response, 200, patch, context.requestId);
            return;
          }

          if (action === 'apply-requests') {
            const applyRequest = await createApplyRequest({
              repository: input.collaborationRepository,
              proposalId: proposalCheck.proposal.id,
              actorUserId: guard.accessContext.userId,
              currentVersion: body.currentVersion as VersionSnapshot,
              authorConfirmed: Boolean(body.authorConfirmed),
              now: input.now
            });
            await auditServerMutation({
              auditRepository: input.auditRepository,
              actorUserId: guard.accessContext.userId,
              projectId: guard.accessContext.projectId,
              action: 'collaboration.apply_request.create',
              diffSummary: `创建协作正典 apply request ${applyRequest.id}：${applyRequest.status}`,
              now: input.now
            });
            sendJson(response, 200, applyRequest, context.requestId);
            return;
          }
        } catch (error) {
          sendJson(response, 400, collaborationMutationBlocked(context.requestId, error), context.requestId);
          return;
        }
      }

      const jobMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/jobs(?:\/([^/]+)(?:\/(cancel|retry))?)?$/);
      if (jobMatch && (request.method === 'GET' || request.method === 'POST')) {
        if (!input.sessionRepository || !input.projectRepository || !input.jobRepository) {
          sendJson(response, 503, createErrorResponse({
            statusCode: 503,
            requestId: context.requestId,
            code: 'MULTIUSER_REPOSITORY_NOT_CONFIGURED',
            message: '多用户 repository 尚未配置'
          }), context.requestId);
          return;
        }

        const guard = await requireProjectContext({
          request,
          sessionRepository: input.sessionRepository,
          projectRepository: input.projectRepository,
          projectId: decodeURIComponent(jobMatch[1] ?? ''),
          now: input.now
        });
        if (guard.statusCode !== 200) {
          sendJson(response, guard.statusCode, createErrorResponse({
            statusCode: guard.statusCode,
            requestId: context.requestId,
            code: guard.code,
            message: guard.message
          }), context.requestId);
          return;
        }

        const jobId = jobMatch[2] ? decodeURIComponent(jobMatch[2]) : undefined;
        const action = jobMatch[3];
        const ensureProjectJob = async (job: AgentJob | undefined) => {
          if (!job) {
            return {
              statusCode: 404,
              code: 'JOB_NOT_FOUND',
              message: 'job 不存在'
            } as const;
          }
          if (job.projectId !== guard.accessContext.projectId) {
            return {
              statusCode: 403,
              code: 'JOB_PROJECT_MISMATCH',
              message: 'job 不属于当前项目'
            } as const;
          }
          return { statusCode: 200, job } as const;
        };

        if (request.method === 'POST' && !jobId) {
          const body = await parseJsonBody(request);
          const quota = await checkJobQuota({
            quotaRepository: input.quotaRepository,
            userId: guard.accessContext.userId,
            projectId: guard.accessContext.projectId
          });
          if (quota.blocked) {
            sendJson(response, 429, createErrorResponse({
              statusCode: 429,
              requestId: context.requestId,
              code: 'QUOTA_EXCEEDED',
              message: quota.blockedReasons[0] ?? '配额不足'
            }), context.requestId);
            return;
          }

          const existingActiveJob = body.idempotencyKey === undefined
            ? undefined
            : await input.jobRepository.findActiveByIdempotencyKey({
              userId: guard.accessContext.userId,
              projectId: guard.accessContext.projectId,
              idempotencyKey: String(body.idempotencyKey)
            });
          const result = await createAgentJob({
            repository: input.jobRepository,
            userId: guard.accessContext.userId,
            projectId: guard.accessContext.projectId,
            kind: String(body.kind ?? ''),
            runtime: String(body.runtime ?? ''),
            idempotencyKey: body.idempotencyKey === undefined ? undefined : String(body.idempotencyKey),
            now: input.now,
            idGenerator: input.jobIdGenerator
          });
          if (result.blocked || !result.job) {
            sendJson(response, 400, createErrorResponse({
              statusCode: 400,
              requestId: context.requestId,
              code: 'JOB_CREATE_BLOCKED',
              message: result.blockedReasons[0] ?? 'job 创建失败'
            }), context.requestId);
            return;
          }
          if (!existingActiveJob && input.jobQueue) {
            await input.jobQueue.enqueue(createAgentJobQueuePayload(result.job));
          }
          await consumeJobQuota({
            quotaRepository: input.quotaRepository,
            userId: guard.accessContext.userId,
            projectId: guard.accessContext.projectId
          });
          await auditServerMutation({
            auditRepository: input.auditRepository,
            actorUserId: guard.accessContext.userId,
            projectId: guard.accessContext.projectId,
            action: 'agent_job.create',
            jobId: result.job.id,
            diffSummary: `创建 ${result.job.kind} job`,
            now: input.now
          });
          sendJson(response, 200, result.job, context.requestId);
          return;
        }

        if (request.method === 'GET' && jobId === 'dashboard' && !action) {
          const jobs = input.jobRepository.listByProject
            ? await input.jobRepository.listByProject(guard.accessContext.projectId)
            : [];
          sendJson(response, 200, buildAgentJobDashboard({
            projectId: guard.accessContext.projectId,
            jobs,
            queueReadyState: input.jobQueue?.getReadyState() ?? unconfiguredQueueReadyState(),
            queueSnapshot: getQueueSnapshot(input.jobQueue)
          }), context.requestId);
          return;
        }

        if (!jobId) {
          if (request.method === 'GET') {
            const jobs = input.jobRepository.listByProject
              ? await input.jobRepository.listByProject(guard.accessContext.projectId)
              : [];
            sendJson(response, 200, {
              projectId: guard.accessContext.projectId,
              jobs
            }, context.requestId);
            return;
          }

          sendJson(response, 404, createErrorResponse({
            statusCode: 404,
            requestId: context.requestId,
            code: 'ROUTE_NOT_FOUND',
            message: '未知的多用户 server 路径'
          }), context.requestId);
          return;
        }

        const existing = await ensureProjectJob(await input.jobRepository.findById(jobId));
        if (existing.statusCode !== 200) {
          sendJson(response, existing.statusCode, createErrorResponse({
            statusCode: existing.statusCode,
            requestId: context.requestId,
            code: existing.code,
            message: existing.message
          }), context.requestId);
          return;
        }

        if (request.method === 'GET' && !action) {
          sendJson(response, 200, existing.job, context.requestId);
          return;
        }

        if (request.method === 'POST' && action === 'cancel') {
          const result = await cancelAgentJob({
            repository: input.jobRepository,
            jobId,
            now: input.now
          });
          if (result.blocked || !result.job) {
            sendJson(response, 400, createErrorResponse({
              statusCode: 400,
              requestId: context.requestId,
              code: 'JOB_CANCEL_BLOCKED',
              message: result.blockedReasons[0] ?? 'job 取消失败'
            }), context.requestId);
            return;
          }
          await auditServerMutation({
            auditRepository: input.auditRepository,
            actorUserId: guard.accessContext.userId,
            projectId: guard.accessContext.projectId,
            action: 'agent_job.cancel',
            jobId: result.job.id,
            diffSummary: `取消 ${result.job.kind} job`,
            now: input.now
          });
          sendJson(response, 200, result.job, context.requestId);
          return;
        }

        if (request.method === 'POST' && action === 'retry') {
          const result = await retryAgentJob({
            repository: input.jobRepository,
            jobId,
            now: input.now,
            idGenerator: input.jobIdGenerator
          });
          if (result.blocked || !result.job) {
            sendJson(response, 400, createErrorResponse({
              statusCode: 400,
              requestId: context.requestId,
              code: 'JOB_RETRY_BLOCKED',
              message: result.blockedReasons[0] ?? 'job 重试失败'
            }), context.requestId);
            return;
          }
          await auditServerMutation({
            auditRepository: input.auditRepository,
            actorUserId: guard.accessContext.userId,
            projectId: guard.accessContext.projectId,
            action: 'agent_job.retry',
            jobId: result.job.id,
            diffSummary: `重试 ${existing.job.kind} job`,
            now: input.now
          });
          sendJson(response, 200, result.job, context.requestId);
          return;
        }
      }

      await readBody(request);
      sendJson(response, 404, createErrorResponse({
        statusCode: 404,
        requestId: context.requestId,
        code: 'ROUTE_NOT_FOUND',
        message: '未知的多用户 server 路径'
      }), context.requestId);
    } catch (error) {
      const fallbackContext = createRequestContext({ requestId: context.requestId });
      sendJson(response, 500, createErrorResponse({
        statusCode: 500,
        requestId: fallbackContext.requestId,
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : String(error)
      }), fallbackContext.requestId);
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(input.port, input.host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address() as AddressInfo;

  return {
    url: `http://${input.host}:${address.port}`,
    host: input.host,
    port: address.port,
    close: () => new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    })
  };
};
