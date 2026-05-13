import { describe, expect, it } from 'vitest';
import {
  buildMultiuserContractErrorResponse,
  buildMultiuserContractResponse,
  buildMultiuserPermissionDecision,
  MULTIUSER_CONTRACT_ERROR_CODES,
  MULTIUSER_CONTRACT_PAGE_ENDPOINTS
} from '../../src/server/http/api-contract.js';

describe('multiuser api contract', () => {
  it('builds a shared success envelope with permissions, resource version, warnings, and pagination', () => {
    const response = buildMultiuserContractResponse({
      requestId: 'req-contract-success',
      data: {
        projectId: 'project-1',
        items: [{ id: 'story-1' }]
      },
      permissions: [
        buildMultiuserPermissionDecision({
          action: 'view-projects',
          state: 'allowed',
          reason: '用户已登录并拥有可见项目。',
          requiresConfirmation: false
        })
      ],
      resourceVersion: 'rv-projects-1',
      warnings: ['只读视图'],
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }
    });

    expect(response).toEqual({
      requestId: 'req-contract-success',
      data: {
        projectId: 'project-1',
        items: [{ id: 'story-1' }]
      },
      permissions: [
        {
          action: 'view-projects',
          state: 'allowed',
          reason: '用户已登录并拥有可见项目。',
          requiresConfirmation: false
        }
      ],
      resourceVersion: 'rv-projects-1',
      warnings: ['只读视图'],
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }
    });
    expect(response).not.toHaveProperty('error');
  });

  it('builds a stable error envelope with contract error codes', () => {
    const response = buildMultiuserContractErrorResponse({
      requestId: 'req-contract-error',
      statusCode: 403,
      code: 'PROJECT_ACCESS_DENIED',
      message: '用户无权访问该项目',
      details: {
        projectId: 'project-1'
      },
      traceId: 'trace-project-1'
    });

    expect(response).toEqual({
      statusCode: 403,
      requestId: 'req-contract-error',
      traceId: 'trace-project-1',
      error: {
        code: 'PROJECT_ACCESS_DENIED',
        message: '用户无权访问该项目',
        details: {
          projectId: 'project-1'
        }
      }
    });
    expect(MULTIUSER_CONTRACT_ERROR_CODES).toEqual([
      'AUTH_REQUIRED',
      'BLOCKED',
      'CONFLICT',
      'FORBIDDEN',
      'INTERNAL_SERVER_ERROR',
      'JOB_CANCEL_BLOCKED',
      'JOB_CREATE_BLOCKED',
      'JOB_NOT_FOUND',
      'JOB_PROJECT_MISMATCH',
      'JOB_RETRY_BLOCKED',
      'MULTIUSER_REPOSITORY_NOT_CONFIGURED',
      'OFFLINE',
      'PROJECT_ACCESS_DENIED',
      'PROJECT_NOT_FOUND',
      'PROJECT_PATH_INVALID',
      'QUOTA_EXCEEDED',
      'RESOURCE_CONFLICT',
      'ROUTE_NOT_FOUND',
      'VALIDATION_FAILED'
    ]);
  });

  it('maps the first-batch app pages to endpoint metadata and permission actions', () => {
    expect(MULTIUSER_CONTRACT_PAGE_ENDPOINTS).toEqual([
      {
        pageId: 'workspace-projects',
        label: '项目列表 / 工作区首页',
        endpoint: '/api/projects',
        method: 'GET',
        description: '列出当前用户可见的项目和工作区入口。',
        successStatus: 200,
        permissionActions: [
          {
            action: 'view-projects',
            state: 'allowed',
            reason: '登录后可以查看可见项目。',
            requiresConfirmation: false
          }
        ],
        expectedStates: ['success', 'empty', 'unauthorized', 'offline']
      },
      {
        pageId: 'story-cockpit',
        label: '故事驾驶舱',
        endpoint: '/api/projects/:projectId/stories/:storyId/cockpit',
        method: 'GET',
        description: '读取故事阶段、下一步动作、阻塞和控制权摘要。',
        successStatus: 200,
        permissionActions: [
          {
            action: 'view-story-cockpit',
            state: 'allowed',
            reason: '项目成员可以读取故事驾驶舱。',
            requiresConfirmation: false
          },
          {
            action: 'apply-story-cockpit-change',
            state: 'requires-confirmation',
            reason: '高影响操作需要作者二次确认。',
            requiresConfirmation: true
          }
        ],
        expectedStates: ['success', 'empty', 'forbidden', 'conflict', 'blocked', 'offline']
      },
      {
        pageId: 'chapter-writing',
        label: '章节与写作',
        endpoint: '/api/projects/:projectId/stories/:storyId/chapters',
        method: 'GET',
        description: '读取章节草稿、写作通道和小样入口。',
        successStatus: 200,
        permissionActions: [
          {
            action: 'view-chapters',
            state: 'allowed',
            reason: '项目成员可以查看章节写作入口。',
            requiresConfirmation: false
          },
          {
            action: 'publish-chapter-draft',
            state: 'requires-confirmation',
            reason: '发布章节草稿前必须确认。',
            requiresConfirmation: true
          }
        ],
        expectedStates: ['success', 'empty', 'blocked', 'conflict', 'offline']
      },
      {
        pageId: 'canon-review',
        label: '候选与正典',
        endpoint: '/api/projects/:projectId/stories/:storyId/canon-review',
        method: 'GET',
        description: '审阅候选、正典冲突和评论结果。',
        successStatus: 200,
        permissionActions: [
          {
            action: 'view-canon-review',
            state: 'allowed',
            reason: '项目成员可以复核候选和正典。',
            requiresConfirmation: false
          },
          {
            action: 'apply-canon-change',
            state: 'requires-confirmation',
            reason: '正典变更必须经过作者确认。',
            requiresConfirmation: true
          }
        ],
        expectedStates: ['success', 'empty', 'forbidden', 'conflict', 'blocked', 'offline']
      },
      {
        pageId: 'task-center',
        label: '任务中心',
        endpoint: '/api/projects/:projectId/tasks',
        method: 'GET',
        description: '查看任务列表、写作优先级和阻塞状态。',
        successStatus: 200,
        permissionActions: [
          {
            action: 'view-tasks',
            state: 'allowed',
            reason: '项目成员可以查看任务中心。',
            requiresConfirmation: false
          }
        ],
        expectedStates: ['success', 'empty', 'blocked', 'offline']
      },
      {
        pageId: 'members-permissions',
        label: '成员权限',
        endpoint: '/api/projects/:projectId/members',
        method: 'GET',
        description: '查看成员、角色和访问权限摘要。',
        successStatus: 200,
        permissionActions: [
          {
            action: 'view-members',
            state: 'allowed',
            reason: '管理员和项目成员可以查看成员权限。',
            requiresConfirmation: false
          },
          {
            action: 'manage-members',
            state: 'denied',
            reason: '普通成员不能管理成员权限。',
            requiresConfirmation: false,
            requestAccessHref: '/settings/access'
          }
        ],
        expectedStates: ['success', 'forbidden', 'offline']
      }
    ]);
  });
});
