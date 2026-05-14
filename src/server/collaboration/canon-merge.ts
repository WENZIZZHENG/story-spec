export type CollaborationProposalStatus =
  | 'draft'
  | 'ready-for-review'
  | 'changes-requested'
  | 'approved'
  | 'apply-requested'
  | 'applied'
  | 'rejected'
  | 'deferred';

export type CollaborationTargetKind =
  | 'specification'
  | 'creative-plan'
  | 'chapter'
  | 'canon'
  | 'task';

export type CollaborationSourceKind = 'preview' | 'draft' | 'agent-job' | 'comment' | 'manual';

export type ReviewDecisionValue = 'approve' | 'request-changes' | 'reject' | 'defer';

export type ApplyRequestStatus = 'blocked' | 'ready' | 'applied' | 'canceled';

export type CanonPatchKind =
  | 'spec-section'
  | 'plan-section'
  | 'chapter-content'
  | 'canon-fact'
  | 'task-state';

export interface CollaborationTarget {
  kind: CollaborationTargetKind;
  path: string;
  resourceVersion: string;
}

export interface CollaborationSourceRef {
  kind: CollaborationSourceKind;
  id: string;
  label: string;
}

export interface CollaborationRisk {
  severity: 'blocking' | 'warning';
  message: string;
}

export interface VersionSnapshot {
  resourceVersion: string;
  storyStage: string;
  canonFactIds: string[];
  taskState: string;
}

export interface CollaborationProposal {
  id: string;
  actorUserId: string;
  projectId: string;
  storyId: string;
  status: CollaborationProposalStatus;
  target: CollaborationTarget;
  sourceRefs: CollaborationSourceRef[];
  summary: string;
  risks: CollaborationRisk[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentThread {
  id: string;
  projectId: string;
  storyId: string;
  anchorKind: 'proposal' | 'story' | 'chapter' | 'task' | 'canon-fact';
  anchorId: string;
  comments: Array<{
    id: string;
    actorUserId: string;
    body: string;
    createdAt: string;
  }>;
}

export interface ReviewDecision {
  id: string;
  proposalId: string;
  reviewerUserId: string;
  decision: ReviewDecisionValue;
  note?: string;
  createdAt: string;
}

export interface CanonPatch {
  id: string;
  proposalId: string;
  targetPath: string;
  kind: CanonPatchKind;
  diffSummary: string;
  rollbackHint: string;
  sourceRefs: string[];
}

export interface ApplyRequest {
  id: string;
  proposalId: string;
  actorUserId: string;
  status: ApplyRequestStatus;
  currentVersion: VersionSnapshot;
  patchIds: string[];
  reviewerIds: string[];
  blockedReasons: string[];
  createdAt: string;
}

export interface CollaborationCanonRepositorySnapshot {
  proposals: CollaborationProposal[];
  reviewDecisions: ReviewDecision[];
  patches: CanonPatch[];
  applyRequests: ApplyRequest[];
  commentThreads: CommentThread[];
}

export interface CollaborationCanonRepository {
  findProposalById(proposalId: string): Promise<CollaborationProposal | undefined>;
  listProposalsByProject?(input: { projectId: string; storyId?: string }): Promise<CollaborationProposal[]>;
  saveProposal(proposal: CollaborationProposal): Promise<void>;
  listReviewDecisions(proposalId: string): Promise<ReviewDecision[]>;
  saveReviewDecision(decision: ReviewDecision): Promise<void>;
  listPatches(proposalId: string): Promise<CanonPatch[]>;
  savePatch(patch: CanonPatch): Promise<void>;
  listApplyRequests?(proposalId: string): Promise<ApplyRequest[]>;
  saveApplyRequest(request: ApplyRequest): Promise<void>;
  saveCommentThread?(thread: CommentThread): Promise<void>;
  snapshot(): CollaborationCanonRepositorySnapshot;
}

export interface CollaborationCanonReviewEntry {
  proposal: CollaborationProposal;
  reviews: ReviewDecision[];
  patches: CanonPatch[];
  applyRequests: ApplyRequest[];
  nextActions: string[];
}

export interface CollaborationCanonReviewPanel {
  projectId: string;
  storyId?: string;
  totals: {
    proposals: number;
    reviews: number;
    patches: number;
    applyRequests: number;
  };
  entries: CollaborationCanonReviewEntry[];
}

export interface CreateCollaborationProposalInput {
  repository: CollaborationCanonRepository;
  actorUserId: string;
  projectId: string;
  storyId: string;
  target: CollaborationTarget;
  sourceRefs: CollaborationSourceRef[];
  summary: string;
  risks?: CollaborationRisk[];
  now?: () => string;
  idGenerator?: () => string;
}

export interface SubmitReviewDecisionInput {
  repository: CollaborationCanonRepository;
  proposalId: string;
  reviewerUserId: string;
  decision: ReviewDecisionValue;
  note?: string;
  now?: () => string;
  idGenerator?: () => string;
}

export interface CreateCanonPatchInput {
  repository: CollaborationCanonRepository;
  proposalId: string;
  targetPath: string;
  kind: CanonPatchKind;
  diffSummary: string;
  rollbackHint: string;
  sourceRefs: string[];
  idGenerator?: () => string;
}

export interface CreateApplyRequestInput {
  repository: CollaborationCanonRepository;
  proposalId: string;
  actorUserId: string;
  currentVersion: VersionSnapshot;
  authorConfirmed?: boolean;
  now?: () => string;
  idGenerator?: () => string;
}

const currentTimestamp = (): string => new Date().toISOString();
const defaultProposalId = (): string => `proposal-${Math.random().toString(36).slice(2, 12)}`;
const defaultReviewId = (): string => `review-${Math.random().toString(36).slice(2, 12)}`;
const defaultPatchId = (): string => `patch-${Math.random().toString(36).slice(2, 12)}`;
const defaultApplyId = (): string => `apply-${Math.random().toString(36).slice(2, 12)}`;

export const createMemoryCollaborationCanonRepository = (): CollaborationCanonRepository => {
  const proposals = new Map<string, CollaborationProposal>();
  const reviewDecisions: ReviewDecision[] = [];
  const patches: CanonPatch[] = [];
  const applyRequests: ApplyRequest[] = [];
  const commentThreads: CommentThread[] = [];

  return {
    async findProposalById(proposalId) {
      return proposals.get(proposalId);
    },
    async listProposalsByProject(input) {
      return [...proposals.values()].filter(proposal =>
        proposal.projectId === input.projectId
        && (input.storyId === undefined || proposal.storyId === input.storyId)
      );
    },
    async saveProposal(proposal) {
      proposals.set(proposal.id, proposal);
    },
    async listReviewDecisions(proposalId) {
      return reviewDecisions.filter(decision => decision.proposalId === proposalId);
    },
    async saveReviewDecision(decision) {
      reviewDecisions.push(decision);
    },
    async listPatches(proposalId) {
      return patches.filter(patch => patch.proposalId === proposalId);
    },
    async savePatch(patch) {
      patches.push(patch);
    },
    async listApplyRequests(proposalId) {
      return applyRequests.filter(request => request.proposalId === proposalId);
    },
    async saveApplyRequest(request) {
      applyRequests.push(request);
    },
    async saveCommentThread(thread) {
      commentThreads.push(thread);
    },
    snapshot() {
      return {
        proposals: [...proposals.values()],
        reviewDecisions: [...reviewDecisions],
        patches: [...patches],
        applyRequests: [...applyRequests],
        commentThreads: [...commentThreads]
      };
    }
  };
};

const fallbackListProposalsByProject = (
  repository: CollaborationCanonRepository,
  input: { projectId: string; storyId?: string }
): CollaborationProposal[] =>
  repository.snapshot().proposals.filter(proposal =>
    proposal.projectId === input.projectId
    && (input.storyId === undefined || proposal.storyId === input.storyId)
  );

const fallbackListApplyRequests = (
  repository: CollaborationCanonRepository,
  proposalId: string
): ApplyRequest[] =>
  repository.snapshot().applyRequests.filter(request => request.proposalId === proposalId);

const buildNextActions = (entry: {
  proposal: CollaborationProposal;
  reviews: ReviewDecision[];
  patches: CanonPatch[];
  applyRequests: ApplyRequest[];
}): string[] => {
  const latestApplyRequest = entry.applyRequests.at(-1);
  if (latestApplyRequest?.status === 'ready') {
    return ['等待作者确认 apply；正式故事仍未写入。'];
  }
  if (latestApplyRequest?.status === 'blocked') {
    return latestApplyRequest.blockedReasons.length > 0
      ? latestApplyRequest.blockedReasons.map(reason => `处理阻塞：${reason}`)
      : ['处理 apply 阻塞后再请求作者确认。'];
  }
  if (entry.patches.length === 0) {
    return ['生成可审阅 canon patch，并附回滚入口。'];
  }
  if (!entry.reviews.some(review => review.decision === 'approve')) {
    return ['等待 reviewer 审批或作者显式确认。'];
  }
  if (entry.proposal.status === 'rejected') {
    return ['候选已拒绝，可保留审计记录或重新提交候选。'];
  }
  if (entry.proposal.status === 'deferred') {
    return ['候选已稍后决定，保留未确认状态。'];
  }
  return ['可以创建 apply request；正式故事仍需二次确认。'];
};

export const buildCollaborationCanonReviewPanel = async (
  input: {
    repository: CollaborationCanonRepository;
    projectId: string;
    storyId?: string;
  }
): Promise<CollaborationCanonReviewPanel> => {
  const proposals = input.repository.listProposalsByProject
    ? await input.repository.listProposalsByProject({
      projectId: input.projectId,
      storyId: input.storyId
    })
    : fallbackListProposalsByProject(input.repository, {
      projectId: input.projectId,
      storyId: input.storyId
    });

  const entries: CollaborationCanonReviewEntry[] = [];
  for (const proposal of proposals.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))) {
    const reviews = await input.repository.listReviewDecisions(proposal.id);
    const patches = await input.repository.listPatches(proposal.id);
    const applyRequests = input.repository.listApplyRequests
      ? await input.repository.listApplyRequests(proposal.id)
      : fallbackListApplyRequests(input.repository, proposal.id);
    const entry = {
      proposal,
      reviews,
      patches,
      applyRequests,
      nextActions: [] as string[]
    };
    entries.push({
      ...entry,
      nextActions: buildNextActions(entry)
    });
  }

  return {
    projectId: input.projectId,
    ...(input.storyId ? { storyId: input.storyId } : {}),
    totals: {
      proposals: entries.length,
      reviews: entries.reduce((total, entry) => total + entry.reviews.length, 0),
      patches: entries.reduce((total, entry) => total + entry.patches.length, 0),
      applyRequests: entries.reduce((total, entry) => total + entry.applyRequests.length, 0)
    },
    entries
  };
};

export const createCollaborationProposal = async (
  input: CreateCollaborationProposalInput
): Promise<CollaborationProposal> => {
  const now = input.now?.() ?? currentTimestamp();
  const proposal: CollaborationProposal = {
    id: input.idGenerator?.() ?? defaultProposalId(),
    actorUserId: input.actorUserId,
    projectId: input.projectId,
    storyId: input.storyId,
    status: 'draft',
    target: input.target,
    sourceRefs: input.sourceRefs,
    summary: input.summary,
    risks: input.risks ?? [],
    createdAt: now,
    updatedAt: now
  };

  await input.repository.saveProposal(proposal);
  return proposal;
};

const nextProposalStatusForDecision = (decision: ReviewDecisionValue): CollaborationProposalStatus => {
  if (decision === 'approve') return 'approved';
  if (decision === 'request-changes') return 'changes-requested';
  if (decision === 'reject') return 'rejected';
  return 'deferred';
};

export const submitReviewDecision = async (
  input: SubmitReviewDecisionInput
): Promise<ReviewDecision> => {
  const proposal = await input.repository.findProposalById(input.proposalId);
  if (!proposal) {
    throw new Error(`PROPOSAL_NOT_FOUND:${input.proposalId}`);
  }

  const now = input.now?.() ?? currentTimestamp();
  const decision: ReviewDecision = {
    id: input.idGenerator?.() ?? defaultReviewId(),
    proposalId: input.proposalId,
    reviewerUserId: input.reviewerUserId,
    decision: input.decision,
    note: input.note,
    createdAt: now
  };

  await input.repository.saveReviewDecision(decision);
  await input.repository.saveProposal({
    ...proposal,
    status: nextProposalStatusForDecision(input.decision),
    updatedAt: now
  });
  return decision;
};

export const createCanonPatch = async (
  input: CreateCanonPatchInput
): Promise<CanonPatch> => {
  const proposal = await input.repository.findProposalById(input.proposalId);
  if (!proposal) {
    throw new Error(`PROPOSAL_NOT_FOUND:${input.proposalId}`);
  }

  const patch: CanonPatch = {
    id: input.idGenerator?.() ?? defaultPatchId(),
    proposalId: input.proposalId,
    targetPath: input.targetPath,
    kind: input.kind,
    diffSummary: input.diffSummary,
    rollbackHint: input.rollbackHint,
    sourceRefs: input.sourceRefs
  };

  await input.repository.savePatch(patch);
  return patch;
};

const collectApplyGateReasons = (
  proposal: CollaborationProposal,
  decisions: ReviewDecision[],
  patches: CanonPatch[],
  input: CreateApplyRequestInput
): string[] => {
  const reasons: string[] = [];
  const approvals = decisions.filter(decision => decision.decision === 'approve');
  if (approvals.length === 0 && !input.authorConfirmed) {
    reasons.push('缺少审批：需要 reviewer approve 或作者显式确认。');
  }

  if (proposal.target.resourceVersion !== input.currentVersion.resourceVersion) {
    reasons.push(`目标版本已变化：proposal=${proposal.target.resourceVersion} current=${input.currentVersion.resourceVersion}。`);
  }

  for (const risk of proposal.risks.filter(risk => risk.severity === 'blocking')) {
    reasons.push(risk.message);
  }

  if (proposal.sourceRefs.length === 0) {
    reasons.push('缺少来源：proposal 必须追踪 preview、draft、agent job 或人工来源。');
  }

  if (patches.length === 0) {
    reasons.push('缺少 canon patch：需要先生成可审阅 patch。');
  }

  const patchWithoutRollback = patches.find(patch => patch.rollbackHint.trim().length === 0);
  if (patchWithoutRollback) {
    reasons.push(`缺少回滚入口：${patchWithoutRollback.id} 未提供 rollbackHint。`);
  }

  return reasons;
};

export const createApplyRequest = async (
  input: CreateApplyRequestInput
): Promise<ApplyRequest> => {
  const proposal = await input.repository.findProposalById(input.proposalId);
  if (!proposal) {
    throw new Error(`PROPOSAL_NOT_FOUND:${input.proposalId}`);
  }

  const decisions = await input.repository.listReviewDecisions(input.proposalId);
  const patches = await input.repository.listPatches(input.proposalId);
  const approvals = decisions.filter(decision => decision.decision === 'approve');
  const blockedReasons = collectApplyGateReasons(proposal, decisions, patches, input);
  const request: ApplyRequest = {
    id: input.idGenerator?.() ?? defaultApplyId(),
    proposalId: input.proposalId,
    actorUserId: input.actorUserId,
    status: blockedReasons.length > 0 ? 'blocked' : 'ready',
    currentVersion: input.currentVersion,
    patchIds: patches.map(patch => patch.id),
    reviewerIds: approvals.map(decision => decision.reviewerUserId),
    blockedReasons,
    createdAt: input.now?.() ?? currentTimestamp()
  };

  await input.repository.saveApplyRequest(request);
  if (request.status === 'ready') {
    await input.repository.saveProposal({
      ...proposal,
      status: 'apply-requested',
      updatedAt: request.createdAt
    });
  }
  return request;
};
