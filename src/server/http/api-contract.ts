export type MultiuserContractPermissionState =
  | 'allowed'
  | 'denied'
  | 'disabled'
  | 'requires-confirmation';

export interface MultiuserContractPermissionDecision {
  action: string;
  state: MultiuserContractPermissionState;
  reason: string;
  requiresConfirmation: boolean;
  requestAccessHref?: string;
}

export interface MultiuserContractPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MultiuserContractResponse<TData> {
  requestId: string;
  data: TData;
  permissions: MultiuserContractPermissionDecision[];
  resourceVersion: string;
  warnings: string[];
  pagination?: MultiuserContractPagination;
}

export interface MultiuserContractErrorDetails {
  [key: string]: unknown;
}

export interface MultiuserContractErrorResponse<TDetails = MultiuserContractErrorDetails> {
  statusCode: number;
  requestId: string;
  traceId?: string;
  error: {
    code: MultiuserContractErrorCode;
    message: string;
    details?: TDetails;
  };
}

export interface MultiuserContractPagePermissionAction {
  action: string;
  state: MultiuserContractPermissionState;
  reason: string;
  requiresConfirmation: boolean;
  requestAccessHref?: string;
}

export interface MultiuserContractPageEndpoint {
  pageId: string;
  label: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  description: string;
  successStatus: number;
  permissionActions: MultiuserContractPagePermissionAction[];
  expectedStates: Array<
    'success'
    | 'empty'
    | 'unauthorized'
    | 'forbidden'
    | 'conflict'
    | 'blocked'
    | 'offline'
  >;
}

export const MULTIUSER_CONTRACT_ERROR_CODES = [
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
] as const;

export type MultiuserContractErrorCode = typeof MULTIUSER_CONTRACT_ERROR_CODES[number];

export const MULTIUSER_CONTRACT_PAGE_ENDPOINTS: MultiuserContractPageEndpoint[] = [
  {
    pageId: 'workspace-projects',
    label: '项目列表 / 工作区首页',
    endpoint: '/api/projects',
    method: 'GET',
    description: '列出当前用户可见的项目和工作区入口。',
    successStatus: 200,
    permissionActions: [
      {
        action: 'view-project',
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
        reason: '正典变更必须经过拥有者二次确认。',
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
        action: 'publish-chapter',
        state: 'requires-confirmation',
        reason: '章节发布会改变正式故事，必须二次确认。',
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
        reason: '正典变更必须经过拥有者二次确认。',
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
      },
      {
        action: 'run-agent-job',
        state: 'allowed',
        reason: '拥有者和编辑可以运行 agent job。',
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
        state: 'requires-confirmation',
        reason: '成员权限变更必须二次确认并写入审计。',
        requiresConfirmation: true
      }
    ],
    expectedStates: ['success', 'forbidden', 'offline']
  }
];

export const buildMultiuserPermissionDecision = (
  input: MultiuserContractPermissionDecision
): MultiuserContractPermissionDecision => ({
  action: input.action,
  state: input.state,
  reason: input.reason,
  requiresConfirmation: input.requiresConfirmation,
  ...(input.requestAccessHref ? { requestAccessHref: input.requestAccessHref } : {})
});

export const buildMultiuserContractResponse = <TData>(
  input: MultiuserContractResponse<TData>
): MultiuserContractResponse<TData> => ({
  requestId: input.requestId,
  data: input.data,
  permissions: input.permissions.map(buildMultiuserPermissionDecision),
  resourceVersion: input.resourceVersion,
  warnings: [...input.warnings],
  ...(input.pagination ? { pagination: { ...input.pagination } } : {})
});

export const buildMultiuserContractErrorResponse = <TDetails = MultiuserContractErrorDetails>(
  input: {
    requestId: string;
    statusCode: number;
    code: MultiuserContractErrorCode;
    message: string;
    details?: TDetails;
    traceId?: string;
  }
): MultiuserContractErrorResponse<TDetails> => ({
  statusCode: input.statusCode,
  requestId: input.requestId,
  ...(input.traceId ? { traceId: input.traceId } : {}),
  error: {
    code: input.code,
    message: input.message,
    ...(input.details !== undefined ? { details: input.details } : {})
  }
});
