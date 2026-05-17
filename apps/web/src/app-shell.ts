export type IndependentWebRouteId =
  | 'project-workspace'
  | 'story-cockpit'
  | 'chapter-writing'
  | 'canon-review'
  | 'task-center';

export type IndependentWebBoundary = 'read-only' | 'preview' | 'dry-run' | 'apply-confirmed';

export type IndependentWebAuthState = 'session-bound';

export type IndependentWebRole = 'owner' | 'editor' | 'reviewer' | 'viewer' | 'agent';

export interface IndependentWebRoute {
  id: IndependentWebRouteId;
  label: string;
  purpose: string;
  boundary: IndependentWebBoundary;
}

export interface IndependentWebApiClient {
  baseUrl: '/api';
  tokenHeader: 'x-storyspec-app-token';
  authState: IndependentWebAuthState;
}

export interface IndependentWebAuthSession {
  state: IndependentWebAuthState;
  userLabel: string;
  projectLabel: string;
}

export interface IndependentWebAuthRole {
  role: IndependentWebRole;
  label: string;
  description: string;
}

export interface IndependentWebPermissionAction {
  id: string;
  label: string;
  allowed: boolean;
  boundary: IndependentWebBoundary;
  requiredPermission: string;
  disabledReason?: string;
  nextAction?: string;
}

export interface IndependentWebAuthPanel {
  title: '登录与权限';
  session: IndependentWebAuthSession;
  role: IndependentWebAuthRole;
  actions: IndependentWebPermissionAction[];
  boundaries: string[];
}

export interface IndependentWebAppShell {
  projectRoot: 'apps/web';
  title: 'StorySpec Web';
  apiClient: IndependentWebApiClient;
  authPanel: IndependentWebAuthPanel;
  routes: IndependentWebRoute[];
  boundaries: string[];
  nonGoals: string[];
}

const escapeHtml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const buildIndependentWebAppShell = (): IndependentWebAppShell => ({
  projectRoot: 'apps/web',
  title: 'StorySpec Web',
  apiClient: {
    baseUrl: '/api',
    tokenHeader: 'x-storyspec-app-token',
    authState: 'session-bound'
  },
  authPanel: {
    title: '登录与权限',
    session: {
      state: 'session-bound',
      userLabel: '本机作者',
      projectLabel: '当前项目'
    },
    role: {
      role: 'owner',
      label: '拥有者',
      description: '可以查看项目、运行审阅流程，并在作者确认后应用正典变更。'
    },
    actions: [
      {
        id: 'view-project',
        label: '查看项目',
        allowed: true,
        boundary: 'read-only',
        requiredPermission: 'view-project'
      },
      {
        id: 'review-canon',
        label: '审阅候选',
        allowed: true,
        boundary: 'preview',
        requiredPermission: 'review-canon'
      },
      {
        id: 'apply-canon-change',
        label: '应用正典变更',
        allowed: true,
        boundary: 'apply-confirmed',
        requiredPermission: 'apply-canon-change',
        nextAction: '执行前仍需查看 diff、风险和 rollback。'
      },
      {
        id: 'invite-member',
        label: '邀请成员',
        allowed: false,
        boundary: 'read-only',
        requiredPermission: 'manage-members',
        disabledReason: '邀请成员仍属于后续账号/团队流程，本切片只展示权限状态。',
        nextAction: '等待邀请流程 OpenSpec 落地后再开放。'
      }
    ],
    boundaries: [
      '本面板只展示 session 与权限状态，不创建账号、不邀请成员、不修改角色。',
      '真实访问仍由 storyspec server 的 session、membership 和 action-level guard 判定。',
      '权限不足时必须展示原因和下一步，不能静默隐藏高风险动作。'
    ]
  },
  routes: [
    {
      id: 'project-workspace',
      label: '项目与工作区',
      purpose: '绑定 session 后进入项目列表、最近项目和工作区入口。',
      boundary: 'read-only'
    },
    {
      id: 'story-cockpit',
      label: '故事驾驶舱',
      purpose: '展示当前故事状态、下一步动作和候选边界。',
      boundary: 'read-only'
    },
    {
      id: 'chapter-writing',
      label: '章节与写作',
      purpose: '承载章节草稿、写作通道和写后自检入口。',
      boundary: 'preview'
    },
    {
      id: 'canon-review',
      label: '候选与正典审阅',
      purpose: '承载 proposal、评论、审批、patch、apply 和 rollback 审阅流。',
      boundary: 'apply-confirmed'
    },
    {
      id: 'task-center',
      label: '任务中心',
      purpose: '展示 agent job、runtime output、worker 告警和恢复状态。',
      boundary: 'read-only'
    }
  ],
  boundaries: [
    'candidate、preview、dry-run 和 apply-confirmed 在界面中必须保持可区分。',
    '本机 storyspec app shell 仍保留为 fallback，不由 apps/web 首片替换。',
    'Agent 输出保持 preview-only，不能直接覆盖正文或正典。'
  ],
  nonGoals: [
    '本切片不引入 React、Vite、Next、Tailwind、实时协作或富文本编辑器。',
    '本切片不实现账号产品流、成员权限 UI、通知或 E2E。'
  ]
});

export const renderIndependentWebAppHtml = (shell: IndependentWebAppShell): string => {
  const routes = shell.routes.map(route => (
    `<li data-route-id="${escapeHtml(route.id)}">` +
    `<strong>${escapeHtml(route.label)}</strong>` +
    `<span>${escapeHtml(route.purpose)}</span>` +
    `<code>${escapeHtml(route.boundary)}</code></li>`
  )).join('');
  const permissionActions = shell.authPanel.actions.map(action => {
    const disabled = action.allowed ? '' : ' aria-disabled="true"';
    const status = action.allowed ? '可用' : '暂不可用';
    const details = [
      `<span>${escapeHtml(action.requiredPermission)} · ${escapeHtml(action.boundary)} · ${status}</span>`,
      action.disabledReason ? `<small>${escapeHtml(action.disabledReason)}</small>` : '',
      action.nextAction ? `<small>${escapeHtml(action.nextAction)}</small>` : ''
    ].join('');

    return (
      `<li data-permission-action="${escapeHtml(action.id)}"${disabled}>` +
      `<strong>${escapeHtml(action.label)}</strong>${details}</li>`
    );
  }).join('');
  const authBoundaries = shell.authPanel.boundaries.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  const boundaries = shell.boundaries.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  const nonGoals = shell.nonGoals.map(item => `<li>${escapeHtml(item)}</li>`).join('');

  return [
    '<main id="storyspec-web-root" class="web-shell">',
    `<h1>${escapeHtml(shell.title)}</h1>`,
    '<p>独立前端 shell 首片，复用 StorySpec App route/API/status contract。</p>',
    `<p><strong>API</strong> ${escapeHtml(shell.apiClient.baseUrl)} · ${escapeHtml(shell.apiClient.tokenHeader)} · ${escapeHtml(shell.apiClient.authState)}</p>`,
    `<section aria-labelledby="auth-panel-title"><h2 id="auth-panel-title">${escapeHtml(shell.authPanel.title)}</h2>`,
    `<p><strong>${escapeHtml(shell.authPanel.session.userLabel)}</strong> · ${escapeHtml(shell.authPanel.session.projectLabel)} · ${escapeHtml(shell.authPanel.session.state)}</p>`,
    `<p><strong>${escapeHtml(shell.authPanel.role.label)}</strong> · ${escapeHtml(shell.authPanel.role.description)}</p>`,
    `<ul>${permissionActions}</ul><ul>${authBoundaries}</ul></section>`,
    `<nav aria-label="StorySpec Web routes"><ul>${routes}</ul></nav>`,
    `<section><h2>写入边界</h2><ul>${boundaries}</ul></section>`,
    `<section><h2>非目标</h2><ul>${nonGoals}</ul></section>`,
    '</main>'
  ].join('');
};
