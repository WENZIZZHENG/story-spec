export type IndependentWebRouteId =
  | 'project-workspace'
  | 'story-cockpit'
  | 'chapter-writing'
  | 'canon-review'
  | 'task-center';

export type IndependentWebBoundary = 'read-only' | 'preview' | 'dry-run' | 'apply-confirmed';

export interface IndependentWebRoute {
  id: IndependentWebRouteId;
  label: string;
  purpose: string;
  boundary: IndependentWebBoundary;
}

export interface IndependentWebApiClient {
  baseUrl: '/api';
  tokenHeader: 'x-storyspec-app-token';
  authState: 'session-bound';
}

export interface IndependentWebAppShell {
  projectRoot: 'apps/web';
  title: 'StorySpec Web';
  apiClient: IndependentWebApiClient;
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
  const boundaries = shell.boundaries.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  const nonGoals = shell.nonGoals.map(item => `<li>${escapeHtml(item)}</li>`).join('');

  return [
    '<main id="storyspec-web-root" class="web-shell">',
    `<h1>${escapeHtml(shell.title)}</h1>`,
    '<p>独立前端 shell 首片，复用 StorySpec App route/API/status contract。</p>',
    `<p><strong>API</strong> ${escapeHtml(shell.apiClient.baseUrl)} · ${escapeHtml(shell.apiClient.tokenHeader)} · ${escapeHtml(shell.apiClient.authState)}</p>`,
    `<nav aria-label="StorySpec Web routes"><ul>${routes}</ul></nav>`,
    `<section><h2>写入边界</h2><ul>${boundaries}</ul></section>`,
    `<section><h2>非目标</h2><ul>${nonGoals}</ul></section>`,
    '</main>'
  ].join('');
};
