import { describe, expect, it } from 'vitest';
import {
  PROJECT_PERMISSION_ACTIONS,
  PROJECT_ROLE_DEFINITIONS,
  PROJECT_ROLES,
  canProjectRole,
  resolveProjectPermissionDecision
} from '../../src/server/projects/permission-model.js';

describe('multiuser role permission model', () => {
  it('defines first-version product roles with readable boundaries', () => {
    expect(PROJECT_ROLES).toEqual(['owner', 'editor', 'reviewer', 'viewer', 'agent']);
    expect(PROJECT_ROLE_DEFINITIONS.map(role => ({
      role: role.role,
      label: role.label
    }))).toEqual([
      { role: 'owner', label: '拥有者' },
      { role: 'editor', label: '编辑' },
      { role: 'reviewer', label: '审稿者' },
      { role: 'viewer', label: '只读成员' },
      { role: 'agent', label: 'Agent 执行身份' }
    ]);
  });

  it('covers platform actions across project, story, chapter, candidate, comments, jobs, export, and deletion', () => {
    expect(PROJECT_PERMISSION_ACTIONS).toEqual([
      'view-project',
      'view-story',
      'view-chapter',
      'create-candidate',
      'comment',
      'review-canon',
      'apply-canon-change',
      'publish-chapter',
      'run-agent-job',
      'manage-members',
      'export-project',
      'delete-project'
    ]);
  });

  it('requires confirmation for owner high-impact actions', () => {
    for (const action of [
      'apply-canon-change',
      'publish-chapter',
      'manage-members',
      'export-project',
      'delete-project'
    ] as const) {
      expect(resolveProjectPermissionDecision({
        role: 'owner',
        action
      })).toMatchObject({
        action,
        state: 'requires-confirmation',
        requiresConfirmation: true
      });
      expect(canProjectRole('owner', action)).toBe(true);
    }
  });

  it('keeps editor, reviewer, viewer, and agent away from high-impact writes', () => {
    expect(resolveProjectPermissionDecision({
      role: 'editor',
      action: 'apply-canon-change'
    })).toMatchObject({
      state: 'denied',
      requiresConfirmation: false,
      requestAccessHref: '/settings/access'
    });
    expect(resolveProjectPermissionDecision({
      role: 'reviewer',
      action: 'comment'
    })).toMatchObject({
      state: 'allowed',
      requiresConfirmation: false
    });
    expect(resolveProjectPermissionDecision({
      role: 'viewer',
      action: 'comment'
    })).toMatchObject({
      state: 'denied',
      reason: '只读成员不能评论，需要向项目拥有者申请更高权限。'
    });
    expect(resolveProjectPermissionDecision({
      role: 'agent',
      action: 'create-candidate'
    })).toMatchObject({
      state: 'allowed',
      reason: 'Agent 只能提交候选或预览，不能直接写入正典。'
    });
    expect(canProjectRole('agent', 'apply-canon-change')).toBe(false);
  });
});
