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

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>StorySpec 本机工作台</title>
  <meta name="description" content="StorySpec 本机项目选择和写作状态工作台">
  <style>
    :root {
      color-scheme: light;
      --paper: #f7f2e8;
      --panel: #fffaf0;
      --panel-strong: #f0e5d2;
      --ink: #231f1a;
      --muted: #6f6659;
      --line: #d8cbb7;
      --accent: #5d4a2f;
      --accent-ink: #fffaf0;
      --warn: #8d3d2f;
      --ok: #315d4d;
      --focus: #7a5b2b;
      --radius: 8px;
      --z-focus: 10;
    }

    * {
      box-sizing: border-box;
    }

    html {
      min-height: 100%;
      background: var(--paper);
    }

    body {
      margin: 0;
      min-height: 100dvh;
      color: var(--ink);
      background: var(--paper);
      font-family: ui-serif, Georgia, "Noto Serif SC", "Songti SC", serif;
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
      outline: 3px solid rgba(122, 91, 43, 0.35);
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
      background: rgba(255, 250, 240, 0.72);
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
      background: rgba(255, 250, 240, 0.78);
      min-width: 0;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      background: rgba(240, 229, 210, 0.55);
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
      background: #fffdf8;
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
      background: #493a26;
    }

    button:active {
      transform: translateY(1px);
    }

    .secondary {
      background: transparent;
      color: var(--accent);
    }

    .secondary:hover {
      background: rgba(93, 74, 47, 0.08);
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
      background: #fffdf8;
      color: var(--ink);
      border-radius: 6px;
      padding: 10px;
    }

    .recent-item:hover {
      background: #f8efe0;
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
      background: rgba(255, 253, 248, 0.62);
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
      background: #fffdf8;
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
    .next-list li {
      border-left: 3px solid var(--line);
      padding-left: 10px;
      text-wrap: pretty;
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
      background: #fffdf8;
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
      background: #fffdf8;
      min-height: 42px;
      font-size: 13px;
    }

    @media (max-width: 1080px) {
      .workspace-grid {
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
        <h1>StorySpec 本机工作台</h1>
        <p class="subtitle">编辑台 / 档案控制台：打开本机项目，查看当前故事长成了什么，再决定下一步写入前确认。</p>
      </div>
      <div class="status-pill" id="service-status">本机服务检查中</div>
    </header>

    <main id="main" class="workspace-grid">
      <aside class="panel" aria-labelledby="project-drawer-title">
        <div class="panel-header">
          <h2 id="project-drawer-title">项目抽屉</h2>
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
          <h2 id="story-dossier-title">故事档案</h2>
          <button class="secondary" id="refresh-status" type="button">读取状态</button>
        </div>
        <div class="panel-body stack">
          <div class="empty" id="status-empty">
            <strong>尚未打开项目</strong>
            <p class="muted">选择一个 StorySpec 项目，或创建新项目。首屏会展示故事阶段、创作回声、缺口和文件状态。</p>
          </div>
          <div id="status-content" hidden></div>

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
          <h2 id="confirm-lane-title">确认通道</h2>
          <span class="muted">preview / confirm / apply</span>
        </div>
        <div class="panel-body gate" id="confirm-lane">
          <div class="empty">打开项目后，这里会显示下一步建议、待确认决策、tracking 和 Git 状态。</div>
        </div>
        <div class="panel-body gate" aria-labelledby="planning-panel-title">
          <section class="section-block">
            <div class="dossier-title">
              <h2 id="planning-panel-title">规划面板</h2>
              <button class="secondary" id="refresh-outlines" type="button">刷新候选</button>
            </div>
            <p class="muted">候选大纲不是正典；提升默认 dry-run，只展示覆盖正式计划前需要检查什么。</p>
            <div class="field">
              <label for="outline-story-name">故事名（可选）</label>
              <input id="outline-story-name" name="story" autocomplete="off" placeholder="留空则使用最近故事">
            </div>
            <div class="error" id="outline-list-error" role="status" aria-live="polite"></div>
            <div class="result-box" id="outline-list-result">读取后会列出候选大纲。</div>
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
              <h3>任务板</h3>
              <button class="secondary" id="refresh-task-board" type="button">读取只读任务板</button>
            </div>
            <p class="muted">任务板只读展示，不修改 tasks.md。</p>
            <div class="error" id="task-board-error" role="status" aria-live="polite"></div>
            <div class="result-box" id="task-board-result">读取后会显示任务总数、待办、完成、writeReady 和 planOnly。</div>
          </section>
        </div>
        <div class="panel-body gate" aria-labelledby="chapter-entry-title">
          <section class="section-block">
            <div class="dossier-title">
              <h2 id="chapter-entry-title">章节入口</h2>
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
    const outlineListResult = document.querySelector("#outline-list-result");
    const outlineCompareResult = document.querySelector("#outline-compare-result");
    const outlinePromoteResult = document.querySelector("#outline-promote-result");
    const taskBoardResult = document.querySelector("#task-board-result");
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
      }
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
    })();
  </script>
</body>
</html>`;
};
