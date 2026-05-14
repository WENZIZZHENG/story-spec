import { describe, expect, it } from 'vitest';
import {
  buildCollaborationCanonReviewPanel,
  createApplyRequest,
  createCanonPatch,
  createCollaborationProposal,
  createMemoryCollaborationCanonRepository,
  submitReviewDecision
} from '../../src/server/collaboration/canon-merge.js';

describe('collaboration canon merge protocol', () => {
  it('creates proposals with source refs and target version without applying files', async () => {
    const repository = createMemoryCollaborationCanonRepository();

    const proposal = await createCollaborationProposal({
      repository,
      actorUserId: 'editor-1',
      projectId: 'project-1',
      storyId: 'story-1',
      target: {
        kind: 'chapter',
        path: 'stories/demo/content/chapter-001.md',
        resourceVersion: 'chapter-v1'
      },
      sourceRefs: [
        {
          kind: 'agent-job',
          id: 'job-1',
          label: 'local-storyspec preview'
        }
      ],
      summary: '补强第一章结尾',
      risks: [],
      now: () => '2026-05-14T08:00:00.000Z',
      idGenerator: () => 'proposal-1'
    });

    expect(proposal).toMatchObject({
      id: 'proposal-1',
      status: 'draft',
      actorUserId: 'editor-1',
      projectId: 'project-1',
      storyId: 'story-1',
      target: {
        kind: 'chapter',
        resourceVersion: 'chapter-v1'
      },
      sourceRefs: [
        {
          kind: 'agent-job',
          id: 'job-1'
        }
      ]
    });
    expect(repository.snapshot()).toMatchObject({
      proposals: [proposal],
      applyRequests: []
    });
  });

  it('blocks apply requests without approval for non-author actors', async () => {
    const repository = createMemoryCollaborationCanonRepository();
    await createCollaborationProposal({
      repository,
      actorUserId: 'editor-1',
      projectId: 'project-1',
      storyId: 'story-1',
      target: {
        kind: 'canon',
        path: 'spec/canon/facts.json',
        resourceVersion: 'canon-v1'
      },
      sourceRefs: [{ kind: 'preview', id: 'preview-1', label: 'specify preview' }],
      summary: '新增正典事实',
      risks: [],
      now: () => '2026-05-14T08:00:00.000Z',
      idGenerator: () => 'proposal-1'
    });
    await createCanonPatch({
      repository,
      proposalId: 'proposal-1',
      targetPath: 'spec/canon/facts.json',
      kind: 'canon-fact',
      diffSummary: '新增 canon.fact.magic-cost',
      rollbackHint: '删除 canon.fact.magic-cost',
      sourceRefs: ['preview-1'],
      idGenerator: () => 'patch-1'
    });

    const request = await createApplyRequest({
      repository,
      proposalId: 'proposal-1',
      actorUserId: 'editor-1',
      currentVersion: {
        resourceVersion: 'canon-v1',
        storyStage: 'tasked',
        canonFactIds: ['canon.fact.existing'],
        taskState: 'ready'
      },
      now: () => '2026-05-14T08:05:00.000Z',
      idGenerator: () => 'apply-1'
    });

    expect(request).toMatchObject({
      id: 'apply-1',
      status: 'blocked',
      proposalId: 'proposal-1',
      patchIds: ['patch-1'],
      reviewerIds: [],
      blockedReasons: ['缺少审批：需要 reviewer approve 或作者显式确认。']
    });
  });

  it('creates ready apply requests when approval, version, source refs, and rollback hints are valid', async () => {
    const repository = createMemoryCollaborationCanonRepository();
    await createCollaborationProposal({
      repository,
      actorUserId: 'agent',
      projectId: 'project-1',
      storyId: 'story-1',
      target: {
        kind: 'creative-plan',
        path: 'stories/demo/creative-plan.md',
        resourceVersion: 'plan-v1'
      },
      sourceRefs: [{ kind: 'agent-job', id: 'job-1', label: 'agent candidate' }],
      summary: '调整第二幕节奏',
      risks: [{ severity: 'warning', message: '需要作者确认角色动机。' }],
      now: () => '2026-05-14T08:00:00.000Z',
      idGenerator: () => 'proposal-1'
    });
    await submitReviewDecision({
      repository,
      proposalId: 'proposal-1',
      reviewerUserId: 'reviewer-1',
      decision: 'approve',
      note: '节奏调整可进入作者确认。',
      now: () => '2026-05-14T08:02:00.000Z',
      idGenerator: () => 'review-1'
    });
    await createCanonPatch({
      repository,
      proposalId: 'proposal-1',
      targetPath: 'stories/demo/creative-plan.md',
      kind: 'plan-section',
      diffSummary: '替换第二幕节奏段落',
      rollbackHint: '恢复 plan-v1 的第二幕段落',
      sourceRefs: ['job-1'],
      idGenerator: () => 'patch-1'
    });

    const request = await createApplyRequest({
      repository,
      proposalId: 'proposal-1',
      actorUserId: 'editor-1',
      currentVersion: {
        resourceVersion: 'plan-v1',
        storyStage: 'tasked',
        canonFactIds: [],
        taskState: 'ready'
      },
      now: () => '2026-05-14T08:05:00.000Z',
      idGenerator: () => 'apply-1'
    });

    expect(request).toMatchObject({
      id: 'apply-1',
      status: 'ready',
      proposalId: 'proposal-1',
      patchIds: ['patch-1'],
      reviewerIds: ['reviewer-1'],
      blockedReasons: []
    });
    await expect(repository.findProposalById('proposal-1')).resolves.toMatchObject({
      status: 'apply-requested'
    });
  });

  it('blocks version conflicts and blocking proposal risks even with author confirmation', async () => {
    const repository = createMemoryCollaborationCanonRepository();
    await createCollaborationProposal({
      repository,
      actorUserId: 'author-1',
      projectId: 'project-1',
      storyId: 'story-1',
      target: {
        kind: 'chapter',
        path: 'stories/demo/content/chapter-002.md',
        resourceVersion: 'chapter-v1'
      },
      sourceRefs: [{ kind: 'draft', id: 'chapter-002.v2', label: '章节草稿' }],
      summary: '发布第二章草稿',
      risks: [{ severity: 'blocking', message: '伏笔 payoff 未确认。' }],
      now: () => '2026-05-14T08:00:00.000Z',
      idGenerator: () => 'proposal-1'
    });
    await createCanonPatch({
      repository,
      proposalId: 'proposal-1',
      targetPath: 'stories/demo/content/chapter-002.md',
      kind: 'chapter-content',
      diffSummary: '发布 chapter-002.v2',
      rollbackHint: '恢复 chapter-v1',
      sourceRefs: ['chapter-002.v2'],
      idGenerator: () => 'patch-1'
    });

    const request = await createApplyRequest({
      repository,
      proposalId: 'proposal-1',
      actorUserId: 'author-1',
      authorConfirmed: true,
      currentVersion: {
        resourceVersion: 'chapter-v2',
        storyStage: 'tasked',
        canonFactIds: [],
        taskState: 'ready'
      },
      now: () => '2026-05-14T08:05:00.000Z',
      idGenerator: () => 'apply-1'
    });

    expect(request.status).toBe('blocked');
    expect(request.blockedReasons).toEqual([
      '目标版本已变化：proposal=chapter-v1 current=chapter-v2。',
      '伏笔 payoff 未确认。'
    ]);
  });

  it('builds a read-only canon review panel filtered by project and story', async () => {
    const repository = createMemoryCollaborationCanonRepository();
    await createCollaborationProposal({
      repository,
      actorUserId: 'editor-1',
      projectId: 'project-1',
      storyId: 'story-main',
      target: {
        kind: 'canon',
        path: 'stories/main/canon.md',
        resourceVersion: 'canon-v1'
      },
      sourceRefs: [{ kind: 'manual', id: 'note-1', label: '人工记录' }],
      summary: '新增正典事实。',
      now: () => '2026-05-14T08:00:00.000Z',
      idGenerator: () => 'proposal-1'
    });
    await submitReviewDecision({
      repository,
      proposalId: 'proposal-1',
      reviewerUserId: 'reviewer-1',
      decision: 'approve',
      now: () => '2026-05-14T08:01:00.000Z',
      idGenerator: () => 'review-1'
    });
    await createCanonPatch({
      repository,
      proposalId: 'proposal-1',
      targetPath: 'stories/main/canon.md',
      kind: 'canon-fact',
      diffSummary: '新增 fact-1。',
      rollbackHint: '删除 fact-1。',
      sourceRefs: ['note-1'],
      idGenerator: () => 'patch-1'
    });
    await createApplyRequest({
      repository,
      proposalId: 'proposal-1',
      actorUserId: 'owner-1',
      authorConfirmed: true,
      currentVersion: {
        resourceVersion: 'canon-v1',
        storyStage: 'drafting',
        canonFactIds: [],
        taskState: 'open'
      },
      now: () => '2026-05-14T08:02:00.000Z',
      idGenerator: () => 'apply-1'
    });
    await createCollaborationProposal({
      repository,
      actorUserId: 'editor-1',
      projectId: 'project-1',
      storyId: 'other-story',
      target: {
        kind: 'chapter',
        path: 'stories/other/content/chapter-001.md',
        resourceVersion: 'chapter-v1'
      },
      sourceRefs: [{ kind: 'draft', id: 'draft-1', label: '其他故事草稿' }],
      summary: '其他故事候选。',
      now: () => '2026-05-14T08:03:00.000Z',
      idGenerator: () => 'proposal-other'
    });

    await expect(buildCollaborationCanonReviewPanel({
      repository,
      projectId: 'project-1',
      storyId: 'story-main'
    })).resolves.toMatchObject({
      projectId: 'project-1',
      storyId: 'story-main',
      totals: {
        proposals: 1,
        reviews: 1,
        patches: 1,
        applyRequests: 1
      },
      entries: [
        {
          proposal: {
            id: 'proposal-1',
            status: 'apply-requested'
          },
          reviews: [
            { id: 'review-1' }
          ],
          patches: [
            { id: 'patch-1' }
          ],
          applyRequests: [
            { id: 'apply-1', status: 'ready' }
          ],
          nextActions: [
            '等待作者确认 apply；正式故事仍未写入。'
          ]
        }
      ]
    });
  });
});
