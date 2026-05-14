export type CompleteAppFrontendRouteId =
  | 'project-workspace'
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

export interface CompleteAppFrontendArchitecture {
  routes: CompleteAppFrontendRoute[];
  apiClient: {
    tokenHeader: 'x-storyspec-app-token';
    endpoints: CompleteAppFrontendEndpoint[];
  };
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
    primaryEndpoints: ['task-board'],
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
    id: 'task-board',
    method: 'GET',
    path: '/api/tasks/board',
    routeId: 'task-center',
    boundary: 'read-only',
    description: '读取只读任务板。'
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

export const buildCompleteAppFrontendArchitecture = (): CompleteAppFrontendArchitecture => ({
  routes,
  apiClient: {
    tokenHeader: 'x-storyspec-app-token',
    endpoints
  },
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
