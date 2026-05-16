import { buildCompleteAppFrontendArchitecture } from './app-frontend-architecture.js';

export interface RenderLocalAppHtmlInput {
  token: string;
}

const escapeHtml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const renderLocalAppHtml = (input: RenderLocalAppHtmlInput): string => {
  const token = escapeHtml(input.token);
  const frontendArchitecture = buildCompleteAppFrontendArchitecture();
  const collaborationReview = frontendArchitecture.collaborationCanonReview;
  const runtimeOutput = frontendArchitecture.runtimeOutput;
  const endpointById = new Map(frontendArchitecture.apiClient.endpoints.map(endpoint => [endpoint.id, endpoint]));
  const routeNavigation = frontendArchitecture.routes.map(route => (
    `<a class="route-link" href="${escapeHtml(route.route)}" data-route-id="${escapeHtml(route.id)}">` +
    `<strong>${escapeHtml(route.label)}</strong><span>${escapeHtml(route.purpose)}</span></a>`
  )).join('');
  const routeMap = frontendArchitecture.routes.map(route => (
    `<li data-route-id="${escapeHtml(route.id)}"><strong>${escapeHtml(route.label)}</strong>` +
    `：${escapeHtml(route.purpose)}<br><span class="muted">${escapeHtml(route.emptyState)}</span></li>`
  )).join('');
  const endpointMap = frontendArchitecture.apiClient.endpoints.map(endpoint => (
    `<li class="endpoint-card" data-endpoint-id="${escapeHtml(endpoint.id)}">` +
    `<strong>${escapeHtml(endpoint.method)} ${escapeHtml(endpoint.path)}</strong>` +
    `<span>${escapeHtml(endpoint.description)}</span>` +
    `<span class="mono">${escapeHtml(endpoint.routeId)} · ${escapeHtml(endpoint.boundary)}</span></li>`
  )).join('');
  const collaborationColumns = collaborationReview.columns.map(column => (
    `<li data-collaboration-column-id="${escapeHtml(column.id)}"><strong>${escapeHtml(column.label)}</strong>` +
    `：${escapeHtml(column.purpose)}</li>`
  )).join('');
  const collaborationStatuses = collaborationReview.statusLanguage.map(status => (
    `<li data-collaboration-status="${escapeHtml(status.status)}"><strong>${escapeHtml(status.label)}</strong>` +
    `：${escapeHtml(status.nextAction)}</li>`
  )).join('');
  const collaborationActions = collaborationReview.actions.map(action => {
    const endpoint = endpointById.get(action.endpointId);
    const endpointLabel = endpoint
      ? `${endpoint.method} ${endpoint.path}`
      : action.endpointId;

    return (
      `<li class="endpoint-card" data-collaboration-endpoint-id="${escapeHtml(action.endpointId)}">` +
      `<strong>${escapeHtml(action.label)}</strong>` +
      `<span>${escapeHtml(endpointLabel)}</span>` +
      `<span>${escapeHtml(action.confirmationCopy)}</span>` +
      `<span class="mono">${escapeHtml(action.requiredPermission)} · ${escapeHtml(action.boundary)}</span></li>`
    );
  }).join('');
  const runtimeOutputEndpoint = endpointById.get(runtimeOutput.endpointId);
  const runtimeOutputEndpointLabel = runtimeOutputEndpoint
    ? `${runtimeOutputEndpoint.method} ${runtimeOutputEndpoint.path}`
    : runtimeOutput.endpointId;
  const runtimeOutputPanes = runtimeOutput.panes.map(pane => (
    `<li data-runtime-output-pane-id="${escapeHtml(pane.id)}"><strong>${escapeHtml(pane.label)}</strong>` +
    `：${escapeHtml(pane.purpose)}<br><span class="muted">${escapeHtml(pane.emptyState)}</span></li>`
  )).join('');

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>StorySpec 工作室</title>
  <meta name="description" content="StorySpec 本机工作室控制台">
  <style>
    :root {
      color-scheme: light;
      --app-bg: #f8fafc;
      --panel: #ffffff;
      --panel-strong: #eff6ff;
      --ink: #0f172a;
      --muted: #64748b;
      --line: #dbe3ef;
      --accent: #2563eb;
      --attention: #f97316;
      --accent-ink: #ffffff;
      --warn: #b45309;
      --ok: #047857;
      --focus: #2563eb;
      --radius: 8px;
      --z-focus: 10;
    }

    * {
      box-sizing: border-box;
    }

    html {
      min-height: 100%;
      background: var(--app-bg);
    }

    body {
      margin: 0;
      min-height: 100dvh;
      color: var(--ink);
      background: var(--app-bg);
      font-family: Inter, "Noto Sans SC", "Microsoft YaHei", Arial, sans-serif;
      line-height: 1.5;
    }

    button,
    input,
    select,
    textarea {
      font: inherit;
    }

    button:focus-visible,
    input:focus-visible,
    select:focus-visible,
    textarea:focus-visible {
      outline: 3px solid rgba(37, 99, 235, 0.28);
      outline-offset: 2px;
      position: relative;
      z-index: var(--z-focus);
    }

    .skip-link {
      position: absolute;
      left: 16px;
      top: -48px;
      background: var(--ink);
      color: var(--accent-ink);
      padding: 8px 12px;
      border-radius: 4px;
    }

    .skip-link:focus {
      top: 16px;
    }

    .shell {
      width: min(1480px, calc(100% - 32px));
      margin: 0 auto;
      padding: 20px 0 28px;
    }

    .topbar {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      align-items: end;
      padding: 14px 0 18px;
      border-bottom: 1px solid var(--line);
    }

    h1,
    h2,
    h3,
    p {
      margin: 0;
    }

    h1 {
      font-size: clamp(28px, 4vw, 46px);
      line-height: 1.05;
      text-wrap: balance;
      letter-spacing: 0;
    }

    h2 {
      font-size: 18px;
      text-wrap: balance;
      letter-spacing: 0;
    }

    h3 {
      font-size: 15px;
      text-wrap: balance;
      letter-spacing: 0;
    }

    .subtitle,
    .muted {
      color: var(--muted);
      text-wrap: pretty;
    }

    .subtitle {
      max-width: 72ch;
      margin-top: 6px;
      font-size: 15px;
    }

    .status-pill {
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 6px 10px;
      color: var(--muted);
      font-size: 13px;
      white-space: nowrap;
      background: #ffffff;
    }

    .guide-strip {
      display: grid;
      gap: 12px;
      padding: 14px 0 2px;
    }

    .guide-header {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: baseline;
      justify-content: space-between;
    }

    .guide-steps {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .guide-step {
      display: grid;
      gap: 8px;
      min-height: 132px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #ffffff;
      padding: 12px;
    }

    .guide-step strong {
      display: block;
      color: var(--ink);
    }

    .guide-step p {
      color: var(--muted);
      font-size: 13px;
    }

    .guide-action {
      align-self: end;
      width: fit-content;
      border: 1px solid var(--accent);
      border-radius: 6px;
      color: var(--accent);
      padding: 7px 10px;
      text-decoration: none;
      font-size: 13px;
    }

    .guide-action:hover,
    .guide-action:focus-visible {
      background: #eff6ff;
    }

    .route-nav {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 8px;
      padding: 12px 0 0;
    }

    .route-link {
      display: grid;
      gap: 4px;
      min-height: 76px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #ffffff;
      color: var(--ink);
      padding: 10px;
      text-decoration: none;
    }

    .route-link:hover,
    .route-link:focus-visible {
      border-color: var(--accent);
      background: #eff6ff;
    }

    .route-link span {
      color: var(--muted);
      font-size: 12px;
      text-wrap: pretty;
    }

    .workspace-grid {
      display: grid;
      grid-template-columns: minmax(280px, 0.92fr) minmax(380px, 1.5fr) minmax(300px, 1fr);
      gap: 14px;
      align-items: start;
      padding-top: 16px;
    }

    .panel {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--panel);
      min-width: 0;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      background: var(--panel-strong);
    }

    .panel-body {
      padding: 14px;
    }

    .stack {
      display: grid;
      gap: 12px;
    }

    .field {
      display: grid;
      gap: 6px;
    }

    label {
      font-size: 13px;
      color: var(--muted);
    }

    input,
    select,
    textarea {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #ffffff;
      color: var(--ink);
      padding: 9px 10px;
    }

    textarea {
      min-height: 112px;
      resize: vertical;
    }

    .button-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    button {
      min-height: 40px;
      border: 1px solid var(--accent);
      border-radius: 6px;
      background: var(--accent);
      color: var(--accent-ink);
      padding: 8px 12px;
      cursor: pointer;
      transition: transform 160ms ease-out, background-color 160ms ease-out;
    }

    button:hover {
      background: #1d4ed8;
    }

    button:active {
      transform: translateY(1px);
    }

    .secondary {
      background: transparent;
      color: var(--accent);
    }

    .secondary:hover {
      background: #eff6ff;
    }

    .error {
      min-height: 20px;
      color: var(--warn);
      font-size: 13px;
    }

    .recent-list,
    .next-list,
    .fact-list {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .recent-item {
      display: grid;
      gap: 3px;
      width: 100%;
      text-align: left;
      border: 1px solid var(--line);
      background: #ffffff;
      color: var(--ink);
      border-radius: 6px;
      padding: 10px;
    }

    .recent-item:hover {
      background: #eff6ff;
    }

    .item-title {
      font-weight: 700;
    }

    .item-path,
    .mono {
      font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
      font-size: 12px;
      color: var(--muted);
      overflow-wrap: anywhere;
    }

    .empty {
      border: 1px dashed var(--line);
      border-radius: 6px;
      padding: 12px;
      background: #f8fafc;
    }

    .dossier-title {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: baseline;
      justify-content: space-between;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--line);
      margin-bottom: 12px;
    }

    .stage {
      color: var(--ok);
      font-variant-numeric: tabular-nums;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin: 12px 0;
    }

    .metric {
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 10px;
      background: #ffffff;
    }

    .metric-value {
      display: block;
      font-size: 22px;
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
    }

    .metric-label {
      color: var(--muted);
      font-size: 12px;
    }

    .section-block {
      display: grid;
      gap: 8px;
      padding: 12px 0;
      border-top: 1px solid var(--line);
    }

    .section-block:first-child {
      border-top: 0;
      padding-top: 0;
    }

    .fact-list li,
    .next-list li,
    .endpoint-card {
      border-left: 3px solid var(--line);
      padding-left: 10px;
      text-wrap: pretty;
    }

    .endpoint-map {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .endpoint-card {
      display: grid;
      gap: 3px;
      min-width: 0;
    }

    .gate {
      display: grid;
      gap: 10px;
    }

    .gate-line {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--line);
    }

    .gate-line strong {
      font-variant-numeric: tabular-nums;
    }

    .command {
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 10px;
      background: #ffffff;
      font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .checkbox-line {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      color: var(--muted);
      font-size: 13px;
    }

    .checkbox-line input {
      width: auto;
      margin-top: 3px;
    }

    .result-box {
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 10px;
      background: #ffffff;
      min-height: 42px;
      font-size: 13px;
    }

    @media (max-width: 1080px) {
      .workspace-grid {
        grid-template-columns: 1fr;
      }

      .route-nav,
      .guide-steps,
      .endpoint-map {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .shell {
        width: min(100% - 20px, 1480px);
        padding-top: 12px;
      }

      .topbar {
        grid-template-columns: 1fr;
      }

      .metric-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#main">跳到工作台内容</a>
  <div class="shell">
    <header class="topbar">
      <div>
        <h1>StorySpec 工作室</h1>
        <p class="subtitle">工作室控制台：在本机项目里查看故事状态、候选、章节、任务和协作边界。Agent 不能直接写入正典，所有进入正式故事的内容都需要作者最终确认。</p>
      </div>
      <div class="status-pill" id="service-status">本机服务检查中</div>
    </header>
    <section class="guide-strip" id="guided-first-run" aria-labelledby="guided-first-run-title">
      <div class="guide-header">
        <div>
          <h2 id="guided-first-run-title">开始路径</h2>
          <p class="muted">先把故事放进工作室，再决定继续写作、审阅候选或处理任务。候选和预览不会自动写入正式故事，进入正典前仍需要作者确认。</p>
        </div>
        <span class="status-pill">候选和预览不会自动写入正式故事</span>
      </div>
      <ol class="guide-steps" aria-label="StorySpec 使用路径">
        <li class="guide-step" data-guide-step="project">
          <strong>1. 打开或创建项目</strong>
          <p>选择已有 StorySpec 项目，或创建一个新项目作为工作区入口。</p>
          <a class="guide-action" href="#open-project-form">去打开项目</a>
        </li>
        <li class="guide-step" data-guide-step="story">
          <strong>2. 创建或选择故事</strong>
          <p>用一句灵感或长文资料开始；资料默认先变成候选和待确认项。</p>
          <a class="guide-action" href="#story-idea-form">去创建故事</a>
        </li>
        <li class="guide-step" data-guide-step="review">
          <strong>3. 继续写作或审阅候选</strong>
          <p>从故事驾驶舱进入章节、任务或候选与正典审阅，先预览再确认。</p>
          <a class="guide-action" href="#confirm-lane-title">去审阅候选</a>
        </li>
      </ol>
    </section>
    <nav class="route-nav" aria-label="完整 App 首批页面导航">
      ${routeNavigation}
    </nav>

    <main id="main" class="workspace-grid">
      <aside class="panel" aria-labelledby="project-drawer-title">
        <div class="panel-header">
          <h2 id="project-drawer-title">项目与故事</h2>
          <button class="secondary" id="refresh-recent" type="button">刷新</button>
        </div>
        <div class="panel-body stack">
          <section class="stack" aria-labelledby="recent-title">
            <h3 id="recent-title">最近项目</h3>
            <div class="empty" id="recent-empty">暂无最近项目。选择一个 StorySpec 项目，或创建新项目。</div>
            <ul class="recent-list" id="recent-projects"></ul>
          </section>

          <form class="stack" id="open-project-form">
            <h3>打开项目</h3>
            <div class="field">
              <label for="open-project-root">项目根目录</label>
              <input id="open-project-root" name="projectRoot" autocomplete="off" placeholder="D:\\project\\my-story">
            </div>
            <div class="error" id="open-project-error" role="status" aria-live="polite"></div>
            <div class="button-row">
              <button type="submit">打开</button>
            </div>
          </form>

          <form class="stack" id="create-project-form">
            <h3>创建项目</h3>
            <div class="field">
              <label for="create-project-name">故事项目名</label>
              <input id="create-project-name" name="name" autocomplete="off" placeholder="法术编译纪元">
            </div>
            <div class="field">
              <label for="create-workspace-path">保存位置</label>
              <input id="create-workspace-path" name="workspacePath" autocomplete="off" placeholder="D:\\project\\novels\\spell-era">
            </div>
            <div class="field">
              <label for="create-method">写作方法</label>
              <select id="create-method" name="method">
                <option value="three-act">three-act</option>
                <option value="snowflake">snowflake</option>
              </select>
            </div>
            <div class="error" id="create-project-error" role="status" aria-live="polite"></div>
            <div class="button-row">
              <button type="submit">创建并打开</button>
            </div>
          </form>
        </div>
      </aside>

      <section class="panel" aria-labelledby="story-dossier-title">
        <div class="panel-header">
          <h2 id="story-dossier-title">故事驾驶舱</h2>
          <button class="secondary" id="refresh-status" type="button">读取状态</button>
        </div>
        <div class="panel-body stack">
          <div class="empty" id="status-empty">
            <strong>尚未打开项目</strong>
            <p class="muted">选择一个 StorySpec 项目，或创建新项目。打开或创建项目后，首屏会展示故事阶段、当前卡点、待确认项、阻塞项和章节文件。</p>
          </div>
          <div id="status-content" hidden></div>

          <section class="section-block" id="app-state-root" aria-labelledby="app-state-title">
            <div class="dossier-title">
              <h2 id="app-state-title">故事驾驶舱</h2>
              <span class="mono">/api/projects/current/app-state</span>
            </div>
            <div class="result-box" id="story-cockpit-panel">打开或创建项目后，工作室会读取当前故事状态、主行动、待确认项、阻塞项和章节文件。</div>
          </section>

          <section class="section-block" aria-labelledby="studio-map-title">
            <h2 id="studio-map-title">工作室控制台</h2>
            <ul class="fact-list">
              ${routeMap}
              <li><strong>协作侧栏</strong>：显示评论、边界、阻塞和稍后决定，提醒 Agent 不能直接写入正典。</li>
            </ul>
          </section>

          <section class="section-block" aria-labelledby="frontend-api-map-title">
            <h2 id="frontend-api-map-title">前端 API 地图</h2>
            <p class="muted">本机 shell 使用 ${frontendArchitecture.apiClient.tokenHeader} 调用这些端点；后续独立前端应复用同一页面和边界契约。</p>
            <ul class="endpoint-map">
              ${endpointMap}
            </ul>
          </section>

          <section class="section-block" aria-labelledby="resume-lane-title">
            <div class="dossier-title">
              <h2 id="resume-lane-title">继续创作</h2>
              <button class="secondary" id="refresh-resume" type="button">刷新回流</button>
            </div>
            <div class="result-box" id="resume-lane">打开项目后，会显示当前状态、推荐下一步和写入边界。</div>
            <div class="command" id="resume-action-command">storyspec status</div>
            <div class="section-block">
              <h3>状态词</h3>
              <div class="result-box" id="resume-glossary">候选方案 / 预览变更 / 试运行 / 应用到正式故事 / 暂时无法继续 / 稍后决定 / 正典 / 已确认事实 / 草稿 / 评论</div>
            </div>
          </section>

          <section class="section-block" aria-labelledby="intake-title">
            <h2 id="intake-title">创作入口</h2>
            <form class="stack" id="story-idea-form">
              <h3>一句灵感</h3>
              <div class="field">
                <label for="story-idea-name">故事名</label>
                <input id="story-idea-name" name="name" autocomplete="off" placeholder="法术编译纪元">
              </div>
              <div class="field">
                <label for="story-idea-text">原始灵感</label>
                <textarea id="story-idea-text" name="idea" placeholder="主角是谁，在哪里遇到什么变化。"></textarea>
              </div>
              <div class="error" id="story-idea-error" role="status" aria-live="polite"></div>
              <div class="button-row">
                <button type="submit">保存灵感</button>
              </div>
              <div class="result-box" id="story-intake-result">打开项目后，可以先保存作者原始灵感，不扩写成正典。</div>
            </form>

            <form class="stack" id="source-intake-form">
              <h3>长文资料</h3>
              <p class="muted">默认只预览：先拆成明确表达、保留候选和仍需确认，不自动进入正典。</p>
              <div class="field">
                <label for="source-story-name">故事名（可选）</label>
                <input id="source-story-name" name="story" autocomplete="off" placeholder="留空则使用最近故事">
              </div>
              <div class="field">
                <label for="source-text">资料文本</label>
                <textarea id="source-text" name="text" placeholder="粘贴设定片段、人物小传、旧稿摘要或 Markdown 表格。"></textarea>
              </div>
              <label class="checkbox-line" for="source-apply-confirmed">
                <input id="source-apply-confirmed" name="applyConfirmed" type="checkbox">
                <span>写入明确表达字段；AI 候选和关键词归类仍保留为候选。</span>
              </label>
              <div class="error" id="source-intake-error" role="status" aria-live="polite"></div>
              <div class="button-row">
                <button type="submit">吸收资料</button>
              </div>
              <div class="result-box" id="source-intake-result">结果会显示素材类型、建议写入、保留候选和仍需确认。</div>
            </form>

            <section class="stack" aria-labelledby="core-gaps-title">
              <div class="dossier-title">
                <h3 id="core-gaps-title">核心缺口</h3>
                <button class="secondary" id="refresh-core-gaps" type="button">刷新缺口</button>
              </div>
              <div class="field">
                <label for="core-gaps-story">故事名（可选）</label>
                <input id="core-gaps-story" name="story" autocomplete="off" placeholder="留空则使用最近故事">
              </div>
              <div class="error" id="core-gaps-error" role="status" aria-live="polite"></div>
              <div class="result-box" id="core-gaps-result">读取后会列出缺失或未完成的核心信息。</div>
            </section>
          </section>
        </div>
      </section>

      <aside class="panel" aria-labelledby="confirm-lane-title">
        <div class="panel-header">
          <h2 id="confirm-lane-title">协作侧栏</h2>
          <span class="muted">Preview / Confirm / Apply</span>
        </div>
        <div class="panel-body gate" id="confirm-lane">
          <div class="empty">打开项目后，这里会显示下一步建议、待确认决策、评论、tracking 和 Git 状态。作者最终确认前，Agent 不能直接写入正典。</div>
        </div>
        <div class="panel-body gate" aria-labelledby="planning-panel-title">
          <section class="section-block">
            <div class="dossier-title">
              <h2 id="planning-panel-title">候选与正典</h2>
              <button class="secondary" id="refresh-outlines" type="button">刷新候选</button>
            </div>
            <p class="muted">候选大纲不是正典；提升默认 dry-run，只展示覆盖正式计划前需要检查什么。应用到正式故事必须经过作者最终确认。</p>
            <div class="field">
              <label for="outline-story-name">故事名（可选）</label>
              <input id="outline-story-name" name="story" autocomplete="off" placeholder="留空则使用最近故事">
            </div>
            <div class="error" id="outline-list-error" role="status" aria-live="polite"></div>
            <div class="result-box" id="outline-list-result">读取后会列出候选大纲。</div>
          </section>

          <section class="section-block" id="collaboration-canon-review-desk" aria-labelledby="collaboration-canon-review-title">
            <div class="dossier-title">
              <h2 id="collaboration-canon-review-title">${escapeHtml(collaborationReview.title)}</h2>
              <span class="mono">canon-review · proposal · apply · rollback</span>
            </div>
            <p class="muted">${escapeHtml(collaborationReview.localShellBoundary)} 这不是最终实时协作 UI；本机工作室只提供 contract、状态列和导航入口。</p>
            <div class="field">
              <label for="collaboration-project-id">项目 ID</label>
              <input id="collaboration-project-id" autocomplete="off" placeholder="project-1">
            </div>
            <div class="field">
              <label for="collaboration-story-id">故事 ID</label>
              <input id="collaboration-story-id" autocomplete="off" placeholder="story-main">
            </div>
            <div class="empty">${escapeHtml(collaborationReview.emptyState)}</div>
            <div class="section-block">
              <h3>审阅状态列</h3>
              <ul class="fact-list">
                ${collaborationColumns}
              </ul>
            </div>
            <div class="section-block">
              <h3>状态语言</h3>
              <ul class="fact-list">
                ${collaborationStatuses}
              </ul>
            </div>
            <div class="section-block">
              <h3>协作 API 入口</h3>
              <ul class="endpoint-map">
                ${collaborationActions}
              </ul>
            </div>
            <div class="result-box">apply / rollback 会写入项目 dataRoot，必须具备 apply-canon-change 权限、作者二次确认，并进入 audit log。</div>
          </section>

          <form class="section-block" id="outline-create-form">
            <h3>创建候选</h3>
            <div class="field">
              <label for="outline-title">候选标题</label>
              <input id="outline-title" name="title" autocomplete="off" placeholder="学院线加强版">
            </div>
            <div class="field">
              <label for="outline-text">候选大纲文本</label>
              <textarea id="outline-text" name="text" placeholder="主线目标、人物弧线、节奏、风险、读者承诺。"></textarea>
            </div>
            <div class="error" id="outline-create-error" role="status" aria-live="polite"></div>
            <div class="button-row">
              <button type="submit">保存候选大纲</button>
            </div>
          </form>

          <form class="section-block" id="outline-compare-form">
            <h3>比较候选</h3>
            <div class="field">
              <label for="outline-left-id">左侧候选 ID</label>
              <input id="outline-left-id" name="leftId" autocomplete="off" placeholder="academy">
            </div>
            <div class="field">
              <label for="outline-right-id">右侧候选 ID</label>
              <input id="outline-right-id" name="rightId" autocomplete="off" placeholder="border">
            </div>
            <div class="error" id="outline-compare-error" role="status" aria-live="polite"></div>
            <div class="button-row">
              <button type="submit">比较</button>
            </div>
            <div class="result-box" id="outline-compare-result">比较会展示主线目标、人物弧线、节奏、风险和读者承诺。</div>
          </form>

          <form class="section-block" id="outline-promote-form">
            <h3>提升预览</h3>
            <div class="field">
              <label for="outline-promote-id">候选 ID</label>
              <input id="outline-promote-id" name="outlineId" autocomplete="off" placeholder="border">
            </div>
            <div class="error" id="outline-promote-error" role="status" aria-live="polite"></div>
            <div class="button-row">
              <button type="submit">查看 dry-run</button>
            </div>
            <div class="result-box" id="outline-promote-result">默认 dry-run，不覆盖正式 creative-plan.md。</div>
          </form>

          <section class="section-block">
            <div class="dossier-title">
              <h3>任务中心</h3>
              <button class="secondary" id="refresh-task-board" type="button">读取只读任务板</button>
            </div>
            <p class="muted">任务板只读展示，不修改 tasks.md。</p>
            <div class="error" id="task-board-error" role="status" aria-live="polite"></div>
            <div class="result-box" id="task-board-result">读取后会显示任务总数、待办、完成、writeReady 和 planOnly。</div>
          </section>

          <section class="section-block" data-endpoint-id="${escapeHtml(runtimeOutput.endpointId)}">
            <div class="dossier-title">
              <h3>${escapeHtml(runtimeOutput.title)}</h3>
              <button class="secondary" id="refresh-runtime-output" type="button">读取 output</button>
            </div>
            <p class="muted">${escapeHtml(runtimeOutput.previewOnlyBoundary)}</p>
            <p class="mono">${escapeHtml(runtimeOutputEndpointLabel)}</p>
            <div class="field">
              <label for="runtime-output-project-id">项目 ID</label>
              <input id="runtime-output-project-id" name="projectId" autocomplete="off" placeholder="project-1">
            </div>
            <div class="field">
              <label for="runtime-output-job-id">Job ID</label>
              <input id="runtime-output-job-id" name="jobId" autocomplete="off" placeholder="job-output">
            </div>
            <ul class="fact-list">${runtimeOutputPanes}</ul>
            <div class="error" id="runtime-output-error" role="status" aria-live="polite"></div>
            <div class="result-box" id="runtime-output-result">${escapeHtml(runtimeOutput.emptyState)}</div>
          </section>
        </div>
        <div class="panel-body gate" aria-labelledby="chapter-entry-title">
          <section class="section-block">
            <div class="dossier-title">
              <h2 id="chapter-entry-title">章节与写作</h2>
              <div class="button-row">
                <button class="secondary" id="refresh-chapter-lane" type="button">写作通道</button>
                <button class="secondary" id="refresh-chapter-drafts" type="button">草稿列表</button>
              </div>
            </div>
            <p class="muted">章节草稿是候选文件；发布预览默认 dry-run，不覆盖正式正文。正文仍在草稿文件或 agent 写作流程里完成。</p>
            <div class="field">
              <label for="chapter-story-name">故事名（可选）</label>
              <input id="chapter-story-name" name="story" autocomplete="off" placeholder="留空则使用最近故事">
            </div>
            <div class="field">
              <label for="chapter-id">章节</label>
              <input id="chapter-id" name="chapter" autocomplete="off" placeholder="001 或 chapter-001">
            </div>
            <div class="error" id="chapter-lane-error" role="status" aria-live="polite"></div>
            <div class="result-box" id="chapter-lane-result">写作通道按 outline -> tasks -> scene -> sample -> draft -> review 展示当前卡点；章节小样只做确认预览，不写入正文、tracking、canon 或 tasks。</div>
            <div class="error" id="chapter-draft-list-error" role="status" aria-live="polite"></div>
            <div class="result-box" id="chapter-draft-list-result">读取后会列出章节草稿记录。</div>
          </section>

          <form class="section-block" id="chapter-draft-form">
            <h3>创建草稿</h3>
            <div class="field">
              <label for="chapter-based-on">基于文件（可选）</label>
              <input id="chapter-based-on" name="basedOn" autocomplete="off" placeholder="stories/法术编译纪元/content/chapter-001.md">
            </div>
            <div class="field">
              <label for="chapter-context-pack">Context Pack（可选）</label>
              <input id="chapter-context-pack" name="contextPack" autocomplete="off" placeholder=".specify/context-packs/write-001.json">
            </div>
            <div class="error" id="chapter-draft-error" role="status" aria-live="polite"></div>
            <div class="button-row">
              <button type="submit">创建章节草稿</button>
            </div>
            <div class="result-box" id="chapter-draft-result">创建草稿不会覆盖 content 正文。</div>
          </form>

          <form class="section-block" id="chapter-promote-form">
            <h3>发布预览</h3>
            <div class="field">
              <label for="chapter-draft-id">Draft ID</label>
              <input id="chapter-draft-id" name="draftId" autocomplete="off" placeholder="chapter-001.v1">
            </div>
            <div class="error" id="chapter-promote-error" role="status" aria-live="polite"></div>
            <div class="button-row">
              <button type="submit">查看 dry-run</button>
            </div>
            <div class="result-box" id="chapter-promote-result">默认 dry-run，不发布到正式 content。</div>
          </form>

          <form class="section-block" id="chapter-scene-form">
            <h3>Scene Card 初始化</h3>
            <div class="field">
              <label for="chapter-scene-id">Scene ID</label>
              <input id="chapter-scene-id" name="sceneId" autocomplete="off" placeholder="scene-001">
            </div>
            <div class="error" id="chapter-scene-error" role="status" aria-live="polite"></div>
            <div class="button-row">
              <button type="submit">初始化 Scene Card</button>
            </div>
            <div class="result-box" id="chapter-scene-result">Scene Card 只是写作门禁和上下文卡，不自动确认新增事实。</div>
          </form>

          <form class="section-block" id="chapter-review-form">
            <h3>写后自检</h3>
            <div class="field">
              <label for="chapter-review-panel">审稿人（可选，逗号分隔）</label>
              <input id="chapter-review-panel" name="panel" autocomplete="off" placeholder="editor,continuity,voice">
            </div>
            <div class="error" id="chapter-review-error" role="status" aria-live="polite"></div>
            <div class="button-row">
              <button type="submit">运行章节自检</button>
            </div>
            <div class="result-box" id="chapter-review-result">自检只读输出 findings 和任务草稿，不改 tasks.md。</div>
          </form>
        </div>
      </aside>
    </main>
  </div>

  <script>
    window.__STORYSPEC_APP__ = { token: "${token}" };
  </script>
  <script>
    const token = window.__STORYSPEC_APP__.token;
    const headers = { "content-type": "application/json", "x-storyspec-app-token": token };
    const serviceStatus = document.querySelector("#service-status");
    const recentList = document.querySelector("#recent-projects");
    const recentEmpty = document.querySelector("#recent-empty");
    const statusEmpty = document.querySelector("#status-empty");
    const statusContent = document.querySelector("#status-content");
    const storyCockpitPanel = document.querySelector("#story-cockpit-panel");
    const resumeLane = document.querySelector("#resume-lane");
    const resumeActionCommand = document.querySelector("#resume-action-command");
    const resumeGlossary = document.querySelector("#resume-glossary");
    const confirmLane = document.querySelector("#confirm-lane");
    const openError = document.querySelector("#open-project-error");
    const createError = document.querySelector("#create-project-error");
    const storyIdeaError = document.querySelector("#story-idea-error");
    const sourceIntakeError = document.querySelector("#source-intake-error");
    const coreGapsError = document.querySelector("#core-gaps-error");
    const storyIntakeResult = document.querySelector("#story-intake-result");
    const sourceIntakeResult = document.querySelector("#source-intake-result");
    const coreGapsResult = document.querySelector("#core-gaps-result");
    const outlineListError = document.querySelector("#outline-list-error");
    const outlineCreateError = document.querySelector("#outline-create-error");
    const outlineCompareError = document.querySelector("#outline-compare-error");
    const outlinePromoteError = document.querySelector("#outline-promote-error");
    const taskBoardError = document.querySelector("#task-board-error");
    const runtimeOutputError = document.querySelector("#runtime-output-error");
    const outlineListResult = document.querySelector("#outline-list-result");
    const outlineCompareResult = document.querySelector("#outline-compare-result");
    const outlinePromoteResult = document.querySelector("#outline-promote-result");
    const taskBoardResult = document.querySelector("#task-board-result");
    const runtimeOutputResult = document.querySelector("#runtime-output-result");
    const chapterLaneError = document.querySelector("#chapter-lane-error");
    const chapterDraftListError = document.querySelector("#chapter-draft-list-error");
    const chapterDraftError = document.querySelector("#chapter-draft-error");
    const chapterPromoteError = document.querySelector("#chapter-promote-error");
    const chapterSceneError = document.querySelector("#chapter-scene-error");
    const chapterReviewError = document.querySelector("#chapter-review-error");
    const chapterLaneResult = document.querySelector("#chapter-lane-result");
    const chapterDraftListResult = document.querySelector("#chapter-draft-list-result");
    const chapterDraftResult = document.querySelector("#chapter-draft-result");
    const chapterPromoteResult = document.querySelector("#chapter-promote-result");
    const chapterSceneResult = document.querySelector("#chapter-scene-result");
    const chapterReviewResult = document.querySelector("#chapter-review-result");

    const api = async (url, options = {}) => {
      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const reasons = body.blockedReasons || body.blocked?.blockedReasons || ["请求失败"];
        throw new Error(reasons.join("；"));
      }
      return body;
    };

    const text = (value, fallback = "未记录") => {
      if (value === undefined || value === null || value === "") return fallback;
      return String(value);
    };

    const listItems = (items, fallback) => {
      if (!items || items.length === 0) return "<li>" + fallback + "</li>";
      return items.map(item => "<li>" + escapeHtml(String(item)) + "</li>").join("");
    };

    const commandBlocks = commands => {
      if (!commands || commands.length === 0) return '<div class="command">storyspec next &lt;故事名&gt;</div>';
      return commands.map(command => '<div class="command">' + escapeHtml(command) + '</div>').join("");
    };

    const renderIngestItems = items => {
      if (!items || items.length === 0) return '<li>暂无。</li>';
      return items.map(item => '<li><strong>' + escapeHtml(item.label || item.questionId || "候选") + '</strong>：' + escapeHtml(item.answer || item.summary || "") + '</li>').join("");
    };

    const renderAppStateItems = (items, fallback) => {
      const safeItems = Array.isArray(items) ? items : [];
      const rendered = safeItems.map(item => {
        if (!item) return "";
        if (typeof item !== "object") return "<li>" + escapeHtml(String(item)) + "</li>";
        const title = item.label || item.title || item.id || item.path || item.file || "未命名";
        const detail = item.value || item.reason || item.summary || item.status || item.stage || item.blocker || item.description || "";
        return '<li><strong>' + escapeHtml(title) + '</strong>' + (detail ? '：' + escapeHtml(detail) : '') + '</li>';
      }).filter(Boolean);
      return rendered.length ? rendered.join("") : "<li>" + fallback + "</li>";
    };

    const renderAppStatePages = (pages, fallback) => {
      const safeItems = Array.isArray(pages) ? pages : [];
      const rendered = safeItems.map(page => {
        if (!page) return "";
        if (typeof page !== "object") return "<li>" + escapeHtml(String(page)) + "</li>";
        const title = page.label || page.title || page.name || page.id || page.href || "工作区页面";
        const detail = page.description || page.summary || page.status || page.href || "";
        return '<li><strong>' + escapeHtml(title) + '</strong>' + (detail ? '：' + escapeHtml(detail) : '') + '</li>';
      }).filter(Boolean);
      return rendered.length ? rendered.join("") : "<li>" + fallback + "</li>";
    };

    const renderWriteModeLanguage = entries => {
      const safeItems = Array.isArray(entries) ? entries : [];
      const rendered = safeItems.map(entry => {
        if (!entry) return "";
        if (typeof entry !== "object") return escapeHtml(String(entry));
        const label = entry.label || entry.term || entry.primaryAction || "写入模式";
        const meaning = entry.meaning || entry.description || entry.summary || "";
        return escapeHtml(label) + (meaning ? "：" + escapeHtml(meaning) : "");
      }).filter(Boolean);
      return rendered.length ? rendered.join(" · ") : "预览变更 / 作者最终确认 / 应用到正式故事";
    };

    const outlineStoryQuery = () => {
      const story = document.querySelector("#outline-story-name").value;
      return story ? "?story=" + encodeURIComponent(story) : "";
    };

    const outlineStoryValue = () => document.querySelector("#outline-story-name").value || undefined;

    const chapterStoryValue = () => document.querySelector("#chapter-story-name").value || undefined;
    const chapterValue = () => document.querySelector("#chapter-id").value || undefined;
    const chapterDraftQuery = () => {
      const params = new URLSearchParams();
      const story = chapterStoryValue();
      const chapter = chapterValue();
      if (story) params.set("story", story);
      if (chapter) params.set("chapter", chapter);
      const query = params.toString();
      return query ? "?" + query : "";
    };

    const escapeHtml = value => String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

    const renderRecent = projects => {
      recentList.innerHTML = "";
      recentEmpty.hidden = projects.length > 0;
      projects.forEach(project => {
        const li = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "recent-item";
        button.innerHTML = '<span class="item-title">' + escapeHtml(project.name) + '</span><span class="item-path">' + escapeHtml(project.path) + '</span><span class="muted">' + escapeHtml(project.lastOpenedAt || "") + '</span>';
        button.addEventListener("click", () => openProject(project.path));
        li.appendChild(button);
        recentList.appendChild(li);
      });
    };

    const renderStatus = status => {
      statusEmpty.hidden = true;
      statusContent.hidden = false;
      const story = status.story;
      const storyHtml = story ? \`
        <div class="dossier-title">
          <div>
            <h2>\${escapeHtml(story.name)}</h2>
            <p class="muted">\${escapeHtml(status.projectName)} · \${escapeHtml(status.projectRoot)}</p>
          </div>
          <strong class="stage">\${escapeHtml(story.stage)}</strong>
        </div>
        <div class="metric-grid">
          <div class="metric"><span class="metric-value">\${story.contentFiles}</span><span class="metric-label">正文文件</span></div>
          <div class="metric"><span class="metric-value">\${story.contentChars}</span><span class="metric-label">正文字符</span></div>
          <div class="metric"><span class="metric-value">\${story.creativeControl.pendingDecisions}</span><span class="metric-label">待确认</span></div>
        </div>
        <div class="section-block">
          <h3>当前故事长成了什么</h3>
          <p>\${escapeHtml(story.creationEcho.flavor)}</p>
          <p class="muted">\${escapeHtml(story.creationEcho.maturityNote)}</p>
        </div>
        <div class="section-block">
          <h3>已长出的关键部件</h3>
          <ul class="fact-list">\${listItems(story.creationEcho.strongestParts, "暂无明显积累。")}</ul>
        </div>
        <div class="section-block">
          <h3>还差的关键部件</h3>
          <ul class="fact-list">\${listItems(story.creationEcho.missingPieces, "暂无明显缺口。")}</ul>
        </div>
      \` : \`
        <div class="dossier-title">
          <div>
            <h2>\${escapeHtml(status.projectName)}</h2>
            <p class="muted">\${escapeHtml(status.projectRoot)}</p>
          </div>
          <strong class="stage">no story</strong>
        </div>
        <div class="empty">这个项目还没有故事。先保存一句灵感，再进入低负担共创。</div>
      \`;
      statusContent.innerHTML = storyHtml;
      renderConfirmLane(status);
    };

    const renderConfirmLane = status => {
      const story = status.story;
      const gateRows = story ? \`
        <div class="gate-line"><span>已确认决策</span><strong>\${story.creativeControl.confirmedDecisions}</strong></div>
        <div class="gate-line"><span>待确认决策</span><strong>\${story.creativeControl.pendingDecisions}</strong></div>
        <div class="gate-line"><span>AI 建议未确认</span><strong>\${story.creativeControl.unconfirmedAiSuggestions}</strong></div>
      \` : "";
      confirmLane.innerHTML = \`
        \${gateRows}
        <section class="section-block">
          <h3>下一步建议</h3>
          <ul class="next-list">\${listItems(status.nextActions, "暂无建议。")}</ul>
        </section>
        <section class="section-block">
          <h3>可复制入口</h3>
          \${status.navigationEntries && status.navigationEntries.length
            ? status.navigationEntries.map(entry => '<div class="command">' + escapeHtml(entry.copyableCommand) + '</div>').join("")
            : '<div class="command">storyspec status</div>'}
        </section>
        <section class="section-block">
          <h3>项目健康</h3>
          <p>Tracking：\${status.tracking.every(item => item.valid) ? "可读取" : "存在错误"}</p>
          <p>Git：\${status.git.available ? (status.git.dirty ? status.git.changedFiles + " 个改动" : "干净") : "不可用"}</p>
        </section>
      \`;
    };

    const renderAppState = appState => {
      appState = appState || {};
      const cockpit = appState.cockpit || {};
      const metrics = cockpit.metrics || {};
      const primaryAction = cockpit.primaryAction || {};
      const collaborationItems = appState.collaborationRail?.items || [];
      const pages = appState.pages || [];
      const writeModeLanguage = Array.isArray(appState.writeModeLanguage) ? appState.writeModeLanguage : [];
      storyCockpitPanel.innerHTML = \`
        <div class="metric-grid">
          <div class="metric"><span class="metric-value">\${escapeHtml(cockpit.storyName || "未选择")}</span><span class="metric-label">storyName</span></div>
          <div class="metric"><span class="metric-value">\${escapeHtml(cockpit.stageLabel || "未开始")}</span><span class="metric-label">stageLabel</span></div>
          <div class="metric"><span class="metric-value">\${escapeHtml(cockpit.currentBlocker || "暂无")}</span><span class="metric-label">currentBlocker</span></div>
        </div>
        <div class="metric-grid">
          <div class="metric"><span class="metric-value">\${escapeHtml(metrics.pendingConfirmations ?? 0)}</span><span class="metric-label">待确认</span></div>
          <div class="metric"><span class="metric-value">\${escapeHtml(metrics.blockers ?? 0)}</span><span class="metric-label">阻塞项</span></div>
          <div class="metric"><span class="metric-value">\${escapeHtml(metrics.agentCandidates ?? 0)}</span><span class="metric-label">Agent 候选</span></div>
          <div class="metric"><span class="metric-value">\${escapeHtml(metrics.chapterFiles ?? 0)}</span><span class="metric-label">章节文件</span></div>
          <div class="metric"><span class="metric-value">\${escapeHtml(metrics.contentFiles ?? 0)}</span><span class="metric-label">正文文件</span></div>
          <div class="metric"><span class="metric-value">\${escapeHtml(metrics.contentChars ?? 0)}</span><span class="metric-label">正文字符</span></div>
        </div>
        <div class="section-block">
          <h3>下一步建议</h3>
          <p><strong>\${escapeHtml(primaryAction.label || "稍后决定")}</strong></p>
          <p>\${escapeHtml(primaryAction.reason || "打开或创建项目后，工作室会给出下一步理由。")}</p>
          <p class="muted">writeMode：\${escapeHtml(primaryAction.writeMode || "read-only")}</p>
        </div>
        <div class="section-block">
          <h3>协作侧栏</h3>
          <ul class="fact-list">\${renderAppStateItems(collaborationItems, "暂无协作侧栏项目。")}</ul>
        </div>
        <div class="section-block">
          <h3>工作区页面</h3>
          <ul class="fact-list">\${renderAppStatePages(pages, "暂无工作区页面。")}</ul>
        </div>
        <div class="section-block">
          <h3>写入边界</h3>
          <ul class="fact-list">\${renderAppStateItems(cockpit.boundaries, "Agent 不能直接写入正典；应用到正式故事需要作者最终确认。")}</ul>
          <p class="muted">\${renderWriteModeLanguage(writeModeLanguage)}</p>
        </div>
      \`;
    };

    const loadAppState = async () => {
      try {
        const appState = await api("/api/projects/current/app-state", { method: "GET" });
        renderAppState(appState);
      } catch (error) {
        storyCockpitPanel.innerHTML = '<div class="empty">打开或创建项目后，工作室会读取故事驾驶舱状态。' + escapeHtml(error.message ? " " + error.message : "") + '</div>';
      }
    };

    const renderResumeLane = resume => {
      const glossary = resume.statusGlossary || [];
      resumeLane.innerHTML = \`
        <p><strong>\${escapeHtml(resume.stateLabel || "继续创作")}</strong></p>
        <p class="muted">\${escapeHtml(resume.projectName || "")}\${resume.storyName ? " · " + escapeHtml(resume.storyName) : ""}</p>
        <div class="section-block">
          <h3>\${escapeHtml(resume.primaryAction?.label || "下一步")}</h3>
          <p>\${escapeHtml(resume.primaryAction?.reason || "读取当前状态后继续。")}</p>
          <p class="muted">写入模式：\${escapeHtml(resume.primaryAction?.writeMode || "read-only")} · \${resume.primaryAction?.writesFiles ? "会写入文件" : "不写入文件"}</p>
          <p class="muted">\${escapeHtml(resume.primaryAction?.boundary || "")}</p>
        </div>
        <div class="section-block">
          <h3>写入边界</h3>
          <ul class="fact-list">\${listItems(resume.boundaries, "不会绕过 preview / confirm / apply。")}</ul>
        </div>
      \`;
      resumeActionCommand.textContent = resume.primaryAction?.copyableCommand || "storyspec status";
      resumeGlossary.innerHTML = glossary.length
        ? '<ul class="fact-list">' + glossary.map(item => '<li><strong>' + escapeHtml(item.term) + '</strong>：' + escapeHtml(item.meaning) + '</li>').join("") + '</ul>'
        : 'candidate / preview / apply / dry-run / blocked / read-only / active / planned';
    };

    const loadResume = async () => {
      try {
        const resume = await api("/api/projects/current/resume", { method: "GET" });
        renderResumeLane(resume);
      } catch (error) {
        resumeLane.innerHTML = '<div class="empty">' + escapeHtml(error.message) + '</div>';
        resumeActionCommand.textContent = "storyspec status";
      }
    };

    const loadRecent = async () => {
      const projects = await api("/api/projects/recent");
      renderRecent(projects);
    };

    const loadStatus = async () => {
      try {
        const status = await api("/api/projects/current/status", { method: "GET" });
        renderStatus(status);
      } catch (error) {
        statusContent.hidden = true;
        statusEmpty.hidden = false;
        confirmLane.innerHTML = '<div class="empty">' + escapeHtml(error.message) + '</div>';
        await loadResume();
      }
      await loadAppState();
    };

    const openProject = async projectRoot => {
      openError.textContent = "";
      try {
        await api("/api/projects/open", {
          method: "POST",
          body: JSON.stringify({ projectRoot })
        });
        await loadRecent();
        await loadStatus();
        await loadResume();
      } catch (error) {
        openError.textContent = error.message;
      }
    };

    document.querySelector("#open-project-form").addEventListener("submit", async event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      await openProject(String(form.get("projectRoot") || ""));
    });

    document.querySelector("#create-project-form").addEventListener("submit", async event => {
      event.preventDefault();
      createError.textContent = "";
      const form = new FormData(event.currentTarget);
      try {
        await api("/api/projects/create", {
          method: "POST",
          body: JSON.stringify({
            name: String(form.get("name") || ""),
            workspacePath: String(form.get("workspacePath") || ""),
            method: String(form.get("method") || "three-act"),
            git: false,
            withExperts: false
          })
        });
        await loadRecent();
        await loadStatus();
        await loadResume();
      } catch (error) {
        createError.textContent = error.message;
      }
    });

    document.querySelector("#story-idea-form").addEventListener("submit", async event => {
      event.preventDefault();
      storyIdeaError.textContent = "";
      const form = new FormData(event.currentTarget);
      try {
        const result = await api("/api/stories/create", {
          method: "POST",
          body: JSON.stringify({
            name: String(form.get("name") || ""),
            idea: String(form.get("idea") || "")
          })
        });
        storyIntakeResult.innerHTML = '<strong>' + escapeHtml(result.story || "故事") + '</strong><p class="muted">' + escapeHtml(result.ideaPath || "已保存灵感") + '</p>' + commandBlocks(result.nextCommands);
        await loadStatus();
        await loadResume();
      } catch (error) {
        storyIdeaError.textContent = error.message;
      }
    });

    document.querySelector("#source-intake-form").addEventListener("submit", async event => {
      event.preventDefault();
      sourceIntakeError.textContent = "";
      const form = new FormData(event.currentTarget);
      try {
        const result = await api("/api/stories/ingest", {
          method: "POST",
          body: JSON.stringify({
            story: String(form.get("story") || "") || undefined,
            text: String(form.get("text") || ""),
            applyConfirmed: form.get("applyConfirmed") === "on"
          })
        });
        sourceIntakeResult.innerHTML = \`
          <p><strong>\${escapeHtml(result.inputProfile?.label || "资料预览")}</strong> · 写入状态：\${result.written ? "已写入明确表达字段" : "预览未写入"}</p>
          <div class="section-block"><h3>建议写入</h3><ul class="fact-list">\${renderIngestItems(result.confirmedItems)}</ul></div>
          <div class="section-block"><h3>保留候选</h3><ul class="fact-list">\${renderIngestItems(result.candidateItems)}</ul></div>
          <div class="section-block"><h3>仍需确认</h3><ul class="fact-list">\${listItems(result.pendingQuestions, "暂无。")}</ul></div>
        \`;
        await loadStatus();
        await loadResume();
      } catch (error) {
        sourceIntakeError.textContent = error.message;
      }
    });

    document.querySelector("#refresh-core-gaps").addEventListener("click", async () => {
      coreGapsError.textContent = "";
      const story = document.querySelector("#core-gaps-story").value;
      try {
        const query = story ? "?story=" + encodeURIComponent(story) : "";
        const result = await api("/api/stories/core/missing" + query, { method: "GET" });
        coreGapsResult.innerHTML = result.items && result.items.length
          ? '<ul class="fact-list">' + result.items.map(item => '<li><strong>' + escapeHtml(item.label) + '</strong>：' + escapeHtml(item.status) + ' [' + escapeHtml(item.sourceLabel || "未标注") + ']。' + escapeHtml(item.summary || "") + (item.nextPrompt ? '<br><span class="muted">下一步：' + escapeHtml(item.nextPrompt) + '</span>' : '') + '</li>').join("") + '</ul>'
          : '<div class="empty">暂无需要补齐的核心信息。</div>';
      } catch (error) {
        coreGapsError.textContent = error.message;
      }
    });

    const loadOutlines = async () => {
      outlineListError.textContent = "";
      try {
        const result = await api("/api/outlines/list" + outlineStoryQuery(), { method: "GET" });
        outlineListResult.innerHTML = result.outlines && result.outlines.length
          ? '<ul class="fact-list">' + result.outlines.map(outline => '<li><strong>' + escapeHtml(outline.id) + '</strong>：' + escapeHtml(outline.title) + ' · ' + escapeHtml(outline.status) + ' · ' + escapeHtml(outline.source || "unknown") + '<br><span class="muted">' + escapeHtml(outline.summary || outline.updatedAt || "") + '</span></li>').join("") + '</ul>'
          : '<div class="empty">暂无候选大纲。</div>';
      } catch (error) {
        outlineListError.textContent = error.message;
      }
    };

    document.querySelector("#refresh-outlines").addEventListener("click", loadOutlines);

    document.querySelector("#outline-create-form").addEventListener("submit", async event => {
      event.preventDefault();
      outlineCreateError.textContent = "";
      const form = new FormData(event.currentTarget);
      try {
        const result = await api("/api/outlines/create", {
          method: "POST",
          body: JSON.stringify({
            story: outlineStoryValue(),
            title: String(form.get("title") || ""),
            text: String(form.get("text") || "")
          })
        });
        outlineListResult.innerHTML = '<div class="empty">已保存候选大纲：' + escapeHtml(result.outline?.id || result.outline?.title || "candidate") + '</div>';
        await loadOutlines();
      } catch (error) {
        outlineCreateError.textContent = error.message;
      }
    });

    document.querySelector("#outline-compare-form").addEventListener("submit", async event => {
      event.preventDefault();
      outlineCompareError.textContent = "";
      const form = new FormData(event.currentTarget);
      try {
        const result = await api("/api/outlines/compare", {
          method: "POST",
          body: JSON.stringify({
            story: outlineStoryValue(),
            leftId: String(form.get("leftId") || ""),
            rightId: String(form.get("rightId") || "")
          })
        });
        outlineCompareResult.innerHTML = '<ul class="fact-list">' + (result.dimensions || []).map(item => '<li><strong>' + escapeHtml(item.dimension) + '</strong>：' + (item.changed ? "有变化" : "无变化") + '<br><span class="muted">左：' + escapeHtml(item.left) + '</span><br><span class="muted">右：' + escapeHtml(item.right) + '</span></li>').join("") + '</ul>';
      } catch (error) {
        outlineCompareError.textContent = error.message;
      }
    });

    document.querySelector("#outline-promote-form").addEventListener("submit", async event => {
      event.preventDefault();
      outlinePromoteError.textContent = "";
      const form = new FormData(event.currentTarget);
      try {
        const result = await api("/api/outlines/promote", {
          method: "POST",
          body: JSON.stringify({
            story: outlineStoryValue(),
            outlineId: String(form.get("outlineId") || ""),
            yes: false
          })
        });
        outlinePromoteResult.innerHTML = '<p><strong>' + (result.dryRun ? "dry-run 预览" : "已提升") + '</strong></p><p class="muted">目标：' + escapeHtml(result.targetPlanPath || "creative-plan.md") + '</p><ul class="fact-list">' + listItems(result.reminders, "暂无提醒。") + '</ul>';
      } catch (error) {
        outlinePromoteError.textContent = error.message;
      }
    });

    document.querySelector("#refresh-task-board").addEventListener("click", async () => {
      taskBoardError.textContent = "";
      try {
        const result = await api("/api/tasks/board" + outlineStoryQuery(), { method: "GET" });
        const summary = result.board?.summary || {};
        const tasks = result.board?.tasks || [];
        taskBoardResult.innerHTML = \`
          <div class="metric-grid">
            <div class="metric"><span class="metric-value">\${summary.total || 0}</span><span class="metric-label">任务总数</span></div>
            <div class="metric"><span class="metric-value">\${summary.writeReady || 0}</span><span class="metric-label">writeReady</span></div>
            <div class="metric"><span class="metric-value">\${summary.planOnly || 0}</span><span class="metric-label">planOnly</span></div>
          </div>
          <ul class="fact-list">\${tasks.slice(0, 5).map(task => '<li><strong>' + escapeHtml(task.id) + '</strong>：' + escapeHtml(task.title) + ' · ' + escapeHtml(task.status) + '</li>').join("") || '<li>暂无任务。</li>'}</ul>
        \`;
      } catch (error) {
        taskBoardError.textContent = error.message;
      }
    });

    document.querySelector("#refresh-runtime-output").addEventListener("click", async () => {
      runtimeOutputError.textContent = "";
      const projectId = document.querySelector("#runtime-output-project-id").value.trim();
      const jobId = document.querySelector("#runtime-output-job-id").value.trim();
      if (!projectId || !jobId) {
        runtimeOutputError.textContent = "请先填写项目 ID 和 Job ID。";
        return;
      }
      try {
        const result = await api("/api/projects/" + encodeURIComponent(projectId) + "/jobs/" + encodeURIComponent(jobId) + "/output", { method: "GET" });
        const outputs = result.outputs || [];
        runtimeOutputResult.innerHTML = outputs.length
          ? outputs.map(output => {
            const artifacts = output.artifacts || [];
            const logs = output.logs || [];
            const artifactItems = artifacts.map(artifact => '<li><strong>' + escapeHtml(artifact.label || artifact.id || "artifact") + '</strong>：' + escapeHtml(artifact.kind || "") + '<br><span class="muted">' + escapeHtml(artifact.previewText || "") + '</span></li>').join("") || '<li>这个 job 还没有可展示的 artifact。</li>';
            const logItems = logs.map(log => '<li><strong>' + escapeHtml(log.level || "info") + '</strong>：' + escapeHtml(log.message || "") + '<br><span class="muted">' + escapeHtml(log.createdAt || "") + '</span></li>').join("") || '<li>这个 job 还没有 runtime log。</li>';
            return '<div class="section-block">'
              + '<h3>' + escapeHtml(output.summary || output.candidateRef || "runtime output") + '</h3>'
              + '<p class="muted">preview-only：' + (output.previewOnly ? "是" : "否") + ' · ' + escapeHtml(output.createdAt || "") + '</p>'
              + '<div class="section-block"><h3>Artifacts</h3><ul class="fact-list">' + artifactItems + '</ul></div>'
              + '<div class="section-block"><h3>Logs</h3><ul class="fact-list">' + logItems + '</ul></div>'
              + '</div>';
          }).join("")
          : '<div class="empty">这个 job 还没有 runtime output record。</div>';
      } catch (error) {
        runtimeOutputError.textContent = error.message;
      }
    });

    const renderChapterLane = result => {
      const lane = result.lane || [];
      const boundaries = result.boundaries || [];
      chapterLaneResult.innerHTML = \`
        <p><strong>当前阶段：\${escapeHtml(result.currentStep || "sample")}</strong></p>
        <p class="muted">写作通道：outline -> tasks -> scene -> sample -> draft -> review</p>
        <ul class="fact-list">\${lane.map(step => '<li><strong>' + escapeHtml(step.id || step.label || "step") + '</strong>：' + escapeHtml(step.status || "unknown") + '<br><span class="muted">' + escapeHtml(step.summary || "") + '</span>' + (step.nextAction ? '<br><span class="muted">下一步：' + escapeHtml(step.nextAction) + '</span>' : '') + (step.commands && step.commands.length ? '<br>' + step.commands.map(command => '<div class="command">' + escapeHtml(command) + '</div>').join("") : '') + '</li>').join("") || '<li>暂无通道状态。</li>'}</ul>
        <div class="section-block"><h3>章节小样</h3><p class="muted">阶段 1.5 会先生成像缩略正文而不是纯大纲的小样；完整正文仍需作者确认小样后再扩写。</p></div>
        <div class="section-block"><h3>写入边界</h3><ul class="fact-list">\${listItems(boundaries, "写作通道只读展示，不自动修改正文。")}</ul></div>
      \`;
    };

    const loadChapterLane = async () => {
      chapterLaneError.textContent = "";
      try {
        const result = await api("/api/chapters/lane" + chapterDraftQuery(), { method: "GET" });
        renderChapterLane(result);
      } catch (error) {
        chapterLaneError.textContent = error.message;
      }
    };

    const loadChapterDrafts = async () => {
      chapterDraftListError.textContent = "";
      try {
        const result = await api("/api/chapters/drafts/list" + chapterDraftQuery(), { method: "GET" });
        const records = result.records || [];
        chapterDraftListResult.innerHTML = records.length
          ? '<ul class="fact-list">' + records.map(record => '<li><strong>' + escapeHtml(record.id) + '</strong>：' + escapeHtml(record.status) + ' · v' + escapeHtml(record.version || "") + '<br><span class="muted">' + escapeHtml(record.path || "") + '</span></li>').join("") + '</ul>'
          : '<div class="empty">暂无章节草稿。</div>';
      } catch (error) {
        chapterDraftListError.textContent = error.message;
      }
    };

    document.querySelector("#refresh-chapter-lane").addEventListener("click", loadChapterLane);
    document.querySelector("#refresh-chapter-drafts").addEventListener("click", loadChapterDrafts);

    document.querySelector("#chapter-draft-form").addEventListener("submit", async event => {
      event.preventDefault();
      chapterDraftError.textContent = "";
      const form = new FormData(event.currentTarget);
      try {
        const result = await api("/api/chapters/drafts/create", {
          method: "POST",
          body: JSON.stringify({
            story: chapterStoryValue(),
            chapter: chapterValue(),
            basedOn: String(form.get("basedOn") || "") || undefined,
            contextPack: String(form.get("contextPack") || "") || undefined
          })
        });
        chapterDraftResult.innerHTML = '<p><strong>' + escapeHtml(result.record?.id || "draft") + '</strong> · ' + escapeHtml(result.record?.status || "draft") + '</p><p class="muted">' + escapeHtml(result.record?.path || result.draftPath || "") + '</p><div class="command">storyspec context:pack ' + escapeHtml(result.story || chapterStoryValue() || "<story>") + ' --chapter ' + escapeHtml(result.record?.chapter || chapterValue() || "<chapter>") + '</div>';
        await loadChapterDrafts();
      } catch (error) {
        chapterDraftError.textContent = error.message;
      }
    });

    document.querySelector("#chapter-promote-form").addEventListener("submit", async event => {
      event.preventDefault();
      chapterPromoteError.textContent = "";
      const form = new FormData(event.currentTarget);
      try {
        const result = await api("/api/chapters/drafts/promote", {
          method: "POST",
          body: JSON.stringify({
            story: chapterStoryValue(),
            draftId: String(form.get("draftId") || ""),
            yes: false
          })
        });
        chapterPromoteResult.innerHTML = '<p><strong>' + (result.dryRun ? "dry-run 预览" : "已发布") + '</strong> · ' + escapeHtml(result.record?.id || result.draftId || "") + '</p><p class="muted">目标：' + escapeHtml(result.targetPath || "content/<chapter>.md") + '</p>';
      } catch (error) {
        chapterPromoteError.textContent = error.message;
      }
    });

    document.querySelector("#chapter-scene-form").addEventListener("submit", async event => {
      event.preventDefault();
      chapterSceneError.textContent = "";
      const form = new FormData(event.currentTarget);
      try {
        const result = await api("/api/chapters/scene/init", {
          method: "POST",
          body: JSON.stringify({
            story: chapterStoryValue(),
            sceneId: String(form.get("sceneId") || "") || undefined
          })
        });
        chapterSceneResult.innerHTML = '<p><strong>' + escapeHtml(result.sceneId || "scene") + '</strong></p><p class="muted">' + escapeHtml(result.outputPath || "") + '</p><p class="muted">候选上下文：' + escapeHtml(result.contextItems?.length || 0) + '</p>';
      } catch (error) {
        chapterSceneError.textContent = error.message;
      }
    });

    document.querySelector("#chapter-review-form").addEventListener("submit", async event => {
      event.preventDefault();
      chapterReviewError.textContent = "";
      const form = new FormData(event.currentTarget);
      const panel = String(form.get("panel") || "").split(",").map(item => item.trim()).filter(Boolean);
      try {
        const result = await api("/api/chapters/review", {
          method: "POST",
          body: JSON.stringify({
            chapter: chapterValue(),
            panel: panel.length ? panel : undefined
          })
        });
        const reviewers = result.reviewers || [];
        chapterReviewResult.innerHTML = \`
          <div class="metric-grid">
            <div class="metric"><span class="metric-value">\${(result.findings || []).length}</span><span class="metric-label">Findings</span></div>
            <div class="metric"><span class="metric-value">\${(result.taskDrafts || []).length}</span><span class="metric-label">任务草稿</span></div>
            <div class="metric"><span class="metric-value">\${reviewers.length}</span><span class="metric-label">审稿人</span></div>
          </div>
          <ul class="fact-list">\${reviewers.map(reviewer => '<li><strong>' + escapeHtml(reviewer.title || reviewer.id) + '</strong>：' + escapeHtml(reviewer.score ?? "") + '/100</li>').join("") || '<li>暂无 reviewer 结果。</li>'}</ul>
        \`;
      } catch (error) {
        chapterReviewError.textContent = error.message;
      }
    });

    document.querySelector("#refresh-recent").addEventListener("click", loadRecent);
    document.querySelector("#refresh-status").addEventListener("click", loadStatus);
    document.querySelector("#refresh-resume").addEventListener("click", loadResume);

    (async () => {
      try {
        const health = await fetch("/api/app/health").then(response => response.json());
        serviceStatus.textContent = health.ok ? "本机服务就绪" : "本机服务异常";
      } catch {
        serviceStatus.textContent = "本机服务异常";
      }
      await loadRecent().catch(error => {
        recentEmpty.textContent = error.message;
        recentEmpty.hidden = false;
      });
      await loadStatus();
      await loadResume();
    })();
  </script>
</body>
</html>`;
};
