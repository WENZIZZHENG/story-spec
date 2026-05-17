export type CompleteAppFrontendRouteId =
  | 'project-workspace'
  | 'login-permission'
  | 'story-cockpit'
  | 'chapter-writing'
  | 'canon-review'
  | 'task-center';

export type CompleteAppFrontendHttpMethod = 'GET' | 'POST';

export type CompleteAppFrontendEndpointBoundary =
  | 'read-only'
  | 'preview'
  | 'dry-run'
  | 'apply-confirmed';

export type CollaborationCanonReviewColumnId =
  | 'proposals'
  | 'reviews'
  | 'patches'
  | 'apply-requests'
  | 'comments'
  | 'activity';

export type CollaborationCanonReviewActionId =
  | 'view-canon-review'
  | 'create-proposal'
  | 'comment-on-proposal'
  | 'submit-review'
  | 'create-canon-patch'
  | 'create-apply-request'
  | 'execute-apply-request'
  | 'execute-rollback-request'
  | 'view-project-activity';

export type CollaborationCanonReviewStatus =
  | 'ready-for-review'
  | 'changes-requested'
  | 'approved'
  | 'apply-requested'
  | 'applied'
  | 'rolled-back'
  | 'blocked'
  | 'deferred';

export type RuntimeOutputPaneId = 'artifacts' | 'logs';

export interface CompleteAppFrontendRoute {
  id: CompleteAppFrontendRouteId;
  label: string;
  route: string;
  purpose: string;
  primaryEndpoints: string[];
  requiredPermission: string;
  emptyState: string;
}

export interface CompleteAppFrontendEndpoint {
  id: string;
  method: CompleteAppFrontendHttpMethod;
  path: string;
  routeId: CompleteAppFrontendRouteId;
  boundary: CompleteAppFrontendEndpointBoundary;
  description: string;
}

export interface CompleteAppFrontendErrorState {
  id: 'unauthorized' | 'forbidden' | 'not-found' | 'conflict' | 'blocked' | 'offline';
  label: string;
  nextAction: string;
}

export interface CollaborationCanonReviewColumn {
  id: CollaborationCanonReviewColumnId;
  label: string;
  purpose: string;
}

export interface CollaborationCanonReviewAction {
  id: CollaborationCanonReviewActionId;
  label: string;
  endpointId: string;
  boundary: CompleteAppFrontendEndpointBoundary;
  requiredPermission: string;
  confirmationCopy: string;
}

export interface CollaborationCanonReviewStatusLanguage {
  status: CollaborationCanonReviewStatus;
  label: string;
  nextAction: string;
}

export interface CollaborationCanonReviewUiContract {
  routeId: 'canon-review';
  title: string;
  emptyState: string;
  localShellBoundary: string;
  columns: CollaborationCanonReviewColumn[];
  actions: CollaborationCanonReviewAction[];
  statusLanguage: CollaborationCanonReviewStatusLanguage[];
}

export interface RuntimeOutputPane {
  id: RuntimeOutputPaneId;
  label: string;
  purpose: string;
  emptyState: string;
}

export interface RuntimeOutputUiContract {
  routeId: 'task-center';
  title: string;
  endpointId: 'agent-runtime-output';
  previewOnlyBoundary: string;
  panes: RuntimeOutputPane[];
  emptyState: string;
  errorState: string;
}

export interface LoginPermissionUiContract {
  routeId: 'login-permission';
  title: string;
  endpointId: 'multiuser-context';
  readonlyBoundary: string;
  visibleStates: string[];
  disabledActionState: string;
  nonGoals: string[];
}

export interface CompleteAppFrontendArchitecture {
  routes: CompleteAppFrontendRoute[];
  apiClient: {
    tokenHeader: 'x-storyspec-app-token';
    endpoints: CompleteAppFrontendEndpoint[];
  };
  loginPermission: LoginPermissionUiContract;
  collaborationCanonReview: CollaborationCanonReviewUiContract;
  runtimeOutput: RuntimeOutputUiContract;
  stateLanguage: {
    loading: string;
    empty: string;
    errorStates: CompleteAppFrontendErrorState[];
  };
  writeBoundary: string[];
  implementationBoundary: string[];
}

const routes: CompleteAppFrontendRoute[] = [
  {
    id: 'project-workspace',
    label: '项目与工作区',
    route: '#project-workspace',
    purpose: '打开、创建或回到最近的 StorySpec 项目。',
    primaryEndpoints: ['recent-projects', 'open-project', 'create-project'],
    requiredPermission: '本机 session token 可访问；多人权限由 server 项目成员关系决定。',
    emptyState: '选择一个 StorySpec 项目，或创建新项目。'
  },
  {
    id: 'login-permission',
    label: '登录与权限',
    route: '#login-permission',
    purpose: '展示当前 session、项目角色、允许动作、禁用动作和权限不足下一步。',
    primaryEndpoints: ['multiuser-context'],
    requiredPermission: '本机 session token 或多人 server bearer token 有效；项目角色决定动作状态。',
    emptyState: '绑定 session 并打开项目后，权限面板会展示当前角色和可执行动作。'
  },
  {
    id: 'story-cockpit',
    label: '故事驾驶舱',
    route: '#story-cockpit',
    purpose: '让作者知道当前故事卡在哪里、下一步做什么、哪些内容仍是候选。',
    primaryEndpoints: ['current-app-state', 'current-resume', 'current-status', 'story-create', 'story-ingest', 'core-gaps'],
    requiredPermission: '可以查看故事驾驶舱；高影响内容仍需作者确认。',
    emptyState: '打开或创建项目后，故事驾驶舱会显示主行动、待确认项和阻塞项。'
  },
  {
    id: 'chapter-writing',
    label: '章节与写作',
    route: '#chapter-writing',
    purpose: '进入章节小样、章节草稿、Scene Card 和写后自检。',
    primaryEndpoints: ['chapter-lane', 'chapter-draft-create', 'chapter-draft-list', 'chapter-draft-promote', 'chapter-scene-init', 'chapter-review'],
    requiredPermission: '可以查看章节写作入口；发布仍需作者确认。',
    emptyState: '选择故事和章节后，写作通道会展示可继续的草稿与自检入口。'
  },
  {
    id: 'canon-review',
    label: '候选与正典审阅',
    route: '#canon-review',
    purpose: '审阅候选、比较大纲、预览提升影响，并把候选与正典清楚区分。',
    primaryEndpoints: ['outline-list', 'outline-create', 'outline-compare', 'outline-promote'],
    requiredPermission: '可以创建或审阅候选；应用到正典必须经过确认。',
    emptyState: '还没有候选时，先从一句灵感、长文资料或候选大纲开始。'
  },
  {
    id: 'task-center',
    label: '任务中心',
    route: '#task-center',
    purpose: '查看只读任务板、下一步任务和 agent job 的 preview-only 边界。',
    primaryEndpoints: ['task-board', 'agent-runtime-output'],
    requiredPermission: '可以查看任务；执行 agent job 受配额和权限守卫限制。',
    emptyState: '生成任务后，任务中心会展示只读任务板和推荐下一步。'
  }
];

const endpoints: CompleteAppFrontendEndpoint[] = [
  {
    id: 'recent-projects',
    method: 'GET',
    path: '/api/projects/recent',
    routeId: 'project-workspace',
    boundary: 'read-only',
    description: '读取最近项目列表。'
  },
  {
    id: 'open-project',
    method: 'POST',
    path: '/api/projects/open',
    routeId: 'project-workspace',
    boundary: 'read-only',
    description: '打开本机 StorySpec 项目。'
  },
  {
    id: 'create-project',
    method: 'POST',
    path: '/api/projects/create',
    routeId: 'project-workspace',
    boundary: 'apply-confirmed',
    description: '创建并打开本机 StorySpec 项目。'
  },
  {
    id: 'current-app-state',
    method: 'GET',
    path: '/api/projects/current/app-state',
    routeId: 'story-cockpit',
    boundary: 'read-only',
    description: '读取完整 App 状态契约。'
  },
  {
    id: 'multiuser-context',
    method: 'GET',
    path: '/api/context?projectId=:projectId',
    routeId: 'login-permission',
    boundary: 'read-only',
    description: '读取当前 session、项目 membership 和权限上下文。'
  },
  {
    id: 'current-resume',
    method: 'GET',
    path: '/api/projects/current/resume',
    routeId: 'story-cockpit',
    boundary: 'read-only',
    description: '读取继续创作回流 lane。'
  },
  {
    id: 'current-status',
    method: 'GET',
    path: '/api/projects/current/status',
    routeId: 'story-cockpit',
    boundary: 'read-only',
    description: '读取项目状态。'
  },
  {
    id: 'story-create',
    method: 'POST',
    path: '/api/stories/create',
    routeId: 'story-cockpit',
    boundary: 'apply-confirmed',
    description: '保存作者明确输入的一句灵感。'
  },
  {
    id: 'story-ingest',
    method: 'POST',
    path: '/api/stories/ingest',
    routeId: 'story-cockpit',
    boundary: 'preview',
    description: '吸收长文资料，默认只生成候选和待确认项。'
  },
  {
    id: 'core-gaps',
    method: 'GET',
    path: '/api/stories/core/missing',
    routeId: 'story-cockpit',
    boundary: 'read-only',
    description: '查看故事核心缺口。'
  },
  {
    id: 'outline-list',
    method: 'GET',
    path: '/api/outlines/list',
    routeId: 'canon-review',
    boundary: 'read-only',
    description: '读取候选大纲列表。'
  },
  {
    id: 'outline-create',
    method: 'POST',
    path: '/api/outlines/create',
    routeId: 'canon-review',
    boundary: 'preview',
    description: '保存候选大纲，不覆盖正式大纲。'
  },
  {
    id: 'outline-compare',
    method: 'POST',
    path: '/api/outlines/compare',
    routeId: 'canon-review',
    boundary: 'read-only',
    description: '比较两个候选大纲。'
  },
  {
    id: 'outline-promote',
    method: 'POST',
    path: '/api/outlines/promote',
    routeId: 'canon-review',
    boundary: 'dry-run',
    description: '预览候选提升影响。'
  },
  {
    id: 'collaboration-canon-review-panel',
    method: 'GET',
    path: '/api/projects/:projectId/stories/:storyId/canon-review',
    routeId: 'canon-review',
    boundary: 'read-only',
    description: '读取协作正典 proposal、review、patch 和 apply request 审阅面板。'
  },
  {
    id: 'collaboration-proposal-create',
    method: 'POST',
    path: '/api/projects/:projectId/collaboration/proposals',
    routeId: 'canon-review',
    boundary: 'preview',
    description: '从候选、草稿、评论或 agent job 输出创建协作正典 proposal。'
  },
  {
    id: 'collaboration-proposal-comments',
    method: 'POST',
    path: '/api/projects/:projectId/collaboration/proposals/:proposalId/comments',
    routeId: 'canon-review',
    boundary: 'preview',
    description: '为 proposal 创建评论线程，不写入正式正典。'
  },
  {
    id: 'collaboration-proposal-reviews',
    method: 'POST',
    path: '/api/projects/:projectId/collaboration/proposals/:proposalId/reviews',
    routeId: 'canon-review',
    boundary: 'preview',
    description: '提交 reviewer 审批决定，仍需作者确认才能进入 apply。'
  },
  {
    id: 'collaboration-canon-patches',
    method: 'POST',
    path: '/api/projects/:projectId/collaboration/proposals/:proposalId/patches',
    routeId: 'canon-review',
    boundary: 'preview',
    description: '创建可审阅 canon patch 和 rollback 提示。'
  },
  {
    id: 'collaboration-apply-requests',
    method: 'POST',
    path: '/api/projects/:projectId/collaboration/proposals/:proposalId/apply-requests',
    routeId: 'canon-review',
    boundary: 'apply-confirmed',
    description: '创建 apply request；正式写入仍需显式执行。'
  },
  {
    id: 'collaboration-apply-execute',
    method: 'POST',
    path: '/api/projects/:projectId/collaboration/proposals/:proposalId/apply-requests/:applyRequestId/apply',
    routeId: 'canon-review',
    boundary: 'apply-confirmed',
    description: '执行 ready apply request，写入项受 apply-canon-change 权限和审计保护。'
  },
  {
    id: 'collaboration-rollback-execute',
    method: 'POST',
    path: '/api/projects/:projectId/collaboration/proposals/:proposalId/apply-requests/:applyRequestId/rollback',
    routeId: 'canon-review',
    boundary: 'apply-confirmed',
    description: '执行 applied apply request 的回滚内容写回，受权限和审计保护。'
  },
  {
    id: 'project-activity-feed',
    method: 'GET',
    path: '/api/projects/:projectId/activity',
    routeId: 'canon-review',
    boundary: 'read-only',
    description: '读取项目活动流，展示评论、审批、apply、rollback 和 agent job 事件。'
  },
  {
    id: 'task-board',
    method: 'GET',
    path: '/api/tasks/board',
    routeId: 'task-center',
    boundary: 'read-only',
    description: '读取只读任务板。'
  },
  {
    id: 'agent-runtime-output',
    method: 'GET',
    path: '/api/projects/:projectId/jobs/:jobId/output',
    routeId: 'task-center',
    boundary: 'read-only',
    description: '读取 agent job 的 preview-only runtime artifacts 和 logs。'
  },
  {
    id: 'chapter-lane',
    method: 'GET',
    path: '/api/chapters/lane',
    routeId: 'chapter-writing',
    boundary: 'read-only',
    description: '读取章节写作通道。'
  },
  {
    id: 'chapter-draft-create',
    method: 'POST',
    path: '/api/chapters/drafts/create',
    routeId: 'chapter-writing',
    boundary: 'preview',
    description: '创建章节草稿，不发布正式正文。'
  },
  {
    id: 'chapter-draft-list',
    method: 'GET',
    path: '/api/chapters/drafts/list',
    routeId: 'chapter-writing',
    boundary: 'read-only',
    description: '读取章节草稿列表。'
  },
  {
    id: 'chapter-draft-promote',
    method: 'POST',
    path: '/api/chapters/drafts/promote',
    routeId: 'chapter-writing',
    boundary: 'dry-run',
    description: '预览章节草稿发布影响。'
  },
  {
    id: 'chapter-scene-init',
    method: 'POST',
    path: '/api/chapters/scene/init',
    routeId: 'chapter-writing',
    boundary: 'preview',
    description: '初始化 Scene Card。'
  },
  {
    id: 'chapter-review',
    method: 'POST',
    path: '/api/chapters/review',
    routeId: 'chapter-writing',
    boundary: 'read-only',
    description: '运行写后自检并返回 findings。'
  }
];

const collaborationCanonReview: CollaborationCanonReviewUiContract = {
  routeId: 'canon-review',
  title: '协作正典审阅台',
  emptyState: '还没有协作 proposal 时，先从候选、草稿、评论或 agent job 输出创建 proposal。',
  localShellBoundary: '本机 shell 只展示协作正典 UI contract 和导航语言；真实评论、审批、apply 与 rollback 仍由 storyspec server 权限和审计保护。',
  columns: [
    {
      id: 'proposals',
      label: '候选 Proposal',
      purpose: '展示来源、目标文件、风险摘要和当前状态。'
    },
    {
      id: 'reviews',
      label: '审批',
      purpose: '展示 reviewer approve / request-changes / reject 决策。'
    },
    {
      id: 'patches',
      label: 'Canon Patch',
      purpose: '展示目标路径、diff 摘要、来源追踪和 rollbackHint。'
    },
    {
      id: 'apply-requests',
      label: 'Apply Request',
      purpose: '展示 apply gate 结果、阻塞原因和作者确认状态。'
    },
    {
      id: 'comments',
      label: '评论线程',
      purpose: '围绕 proposal 留下审阅意见，不直接改正典。'
    },
    {
      id: 'activity',
      label: '活动流',
      purpose: '按时间线追踪评论、审批、apply、rollback 和 agent job。'
    }
  ],
  actions: [
    {
      id: 'view-canon-review',
      label: '读取审阅面板',
      endpointId: 'collaboration-canon-review-panel',
      boundary: 'read-only',
      requiredPermission: 'view-canon-review',
      confirmationCopy: '只读查看，不写入故事文件。'
    },
    {
      id: 'create-proposal',
      label: '创建 proposal',
      endpointId: 'collaboration-proposal-create',
      boundary: 'preview',
      requiredPermission: 'review-canon',
      confirmationCopy: '创建候选审阅对象，不代表正典已改变。'
    },
    {
      id: 'comment-on-proposal',
      label: '评论 proposal',
      endpointId: 'collaboration-proposal-comments',
      boundary: 'preview',
      requiredPermission: 'review-canon',
      confirmationCopy: '评论用于审阅讨论，不直接写入正典。'
    },
    {
      id: 'submit-review',
      label: '提交审批',
      endpointId: 'collaboration-proposal-reviews',
      boundary: 'preview',
      requiredPermission: 'review-canon',
      confirmationCopy: '审批只是进入 apply gate 的证据，仍需作者确认。'
    },
    {
      id: 'create-canon-patch',
      label: '生成 canon patch',
      endpointId: 'collaboration-canon-patches',
      boundary: 'preview',
      requiredPermission: 'review-canon',
      confirmationCopy: 'patch 必须包含来源追踪和回滚入口。'
    },
    {
      id: 'create-apply-request',
      label: '请求 apply',
      endpointId: 'collaboration-apply-requests',
      boundary: 'apply-confirmed',
      requiredPermission: 'apply-canon-change',
      confirmationCopy: '创建 apply request 需要作者确认当前版本和风险。'
    },
    {
      id: 'execute-apply-request',
      label: '执行 apply',
      endpointId: 'collaboration-apply-execute',
      boundary: 'apply-confirmed',
      requiredPermission: 'apply-canon-change',
      confirmationCopy: '执行后会写入项目 dataRoot，必须二次确认并记录审计。'
    },
    {
      id: 'execute-rollback-request',
      label: '执行 rollback',
      endpointId: 'collaboration-rollback-execute',
      boundary: 'apply-confirmed',
      requiredPermission: 'apply-canon-change',
      confirmationCopy: '回滚会写回明确 rollbackContent，必须二次确认并记录审计。'
    },
    {
      id: 'view-project-activity',
      label: '读取活动流',
      endpointId: 'project-activity-feed',
      boundary: 'read-only',
      requiredPermission: 'view-project',
      confirmationCopy: '只读查看项目协作时间线。'
    }
  ],
  statusLanguage: [
    {
      status: 'ready-for-review',
      label: '等待审阅',
      nextAction: '请 reviewer 评论或提交审批。'
    },
    {
      status: 'changes-requested',
      label: '请求修改',
      nextAction: '先处理审阅意见，再重新提交 proposal。'
    },
    {
      status: 'approved',
      label: '已审批',
      nextAction: '可以生成 patch 或创建 apply request。'
    },
    {
      status: 'apply-requested',
      label: '等待作者确认 apply',
      nextAction: '作者检查 diff、风险和 rollback 后再执行。'
    },
    {
      status: 'applied',
      label: '已应用',
      nextAction: '正式故事已写入；保留活动和回滚入口。'
    },
    {
      status: 'rolled-back',
      label: '已回滚',
      nextAction: '可重新提交修订候选或关闭 proposal。'
    },
    {
      status: 'blocked',
      label: '暂时阻塞',
      nextAction: '先处理 apply gate 阻塞原因。'
    },
    {
      status: 'deferred',
      label: '稍后决定',
      nextAction: '保留候选，不把它视为已完成。'
    }
  ]
};

const runtimeOutput: RuntimeOutputUiContract = {
  routeId: 'task-center',
  title: 'Runtime 输出预览',
  endpointId: 'agent-runtime-output',
  previewOnlyBoundary: 'Artifacts 和 logs 只用于审阅，不自动写入正文、正典、tracking 或 proposal。',
  emptyState: '选择一个 job 后，任务中心会展示 runtime output records。',
  errorState: '读取失败时只显示错误状态，不触发 retry、cancel、enqueue 或 apply。',
  panes: [
    {
      id: 'artifacts',
      label: 'Artifacts',
      purpose: '展示 stdout/stderr、候选摘要或其他 bounded preview artifact。',
      emptyState: '这个 job 还没有可展示的 artifact。'
    },
    {
      id: 'logs',
      label: 'Logs',
      purpose: '展示 runtime log entry，辅助判断候选是否值得进入审阅。',
      emptyState: '这个 job 还没有 runtime log。'
    }
  ]
};

const loginPermission: LoginPermissionUiContract = {
  routeId: 'login-permission',
  title: '登录与权限',
  endpointId: 'multiuser-context',
  readonlyBoundary: '登录/权限 UI 只读展示 session、角色和 action-level 权限状态，不创建账号、不邀请成员、不修改角色。',
  visibleStates: [
    'session-bound：当前 session 可用于读取项目上下文。',
    'forbidden：当前角色缺少动作权限，需要 owner/editor 调整。',
    'disabled：功能尚未接入账号/团队流程，只展示后续入口语言。'
  ],
  disabledActionState: '禁用动作必须显示 disabledReason 和 nextAction，不能只隐藏按钮。',
  nonGoals: [
    '不实现注册、登录、登出或 session revoke。',
    '不实现邀请成员、角色变更或团队管理 mutation。',
    '不绕过 storyspec server 的 session、membership 和 action-level guard。'
  ]
};

export const buildCompleteAppFrontendArchitecture = (): CompleteAppFrontendArchitecture => ({
  routes,
  apiClient: {
    tokenHeader: 'x-storyspec-app-token',
    endpoints
  },
  loginPermission,
  collaborationCanonReview,
  runtimeOutput,
  stateLanguage: {
    loading: '正在读取工作室状态。',
    empty: '还没有可展示内容，请先打开项目或创建故事。',
    errorStates: [
      {
        id: 'unauthorized',
        label: '会话已失效',
        nextAction: '请重新启动 storyspec app 并使用新的本机 session token。'
      },
      {
        id: 'forbidden',
        label: '权限不足',
        nextAction: '请检查成员权限，或让项目 owner/editor 调整访问范围。'
      },
      {
        id: 'not-found',
        label: '资源不存在',
        nextAction: '请确认项目、故事、章节或候选仍然存在。'
      },
      {
        id: 'conflict',
        label: '内容有冲突',
        nextAction: '请先查看 diff 或冲突说明，再决定是否继续。'
      },
      {
        id: 'blocked',
        label: '暂时无法继续',
        nextAction: '请处理阻塞原因，或把决定保留为稍后处理。'
      },
      {
        id: 'offline',
        label: '服务暂时不可用',
        nextAction: '请检查本机 App server、数据库或 worker 状态。'
      }
    ]
  },
  writeBoundary: [
    '候选方案不会自动写入正式故事。',
    '预览和 dry-run 只展示影响，应用到正式故事必须经过作者确认。',
    'Agent 任务输出保持 preview-only，不能直接覆盖正文或正典。'
  ],
  implementationBoundary: [
    '本切片不包含富文本编辑器或实时协作。',
    '本切片不引入完整独立前端框架。',
    '本切片不提供计费、公开社区或完整 SaaS 能力。'
  ]
});
