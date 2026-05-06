## 设计

本 change 将 `storyspec app` 做成可浏览的本机 Web 工作台首屏。它不是完整前端应用重写，而是先用服务端托管的静态 HTML/CSS/JS 接上现有 API，建立真实可用的项目选择和状态面板。

## 已归档 UI skill 取舍

已读取 `D:\project\skills_all\baseline-ui\SKILL.md`、`frontend-design\SKILL.md`、`redesign-existing-projects\SKILL.md` 和 `ui-a11y\SKILL.md`。

采纳：

- `baseline-ui`：少动画、清晰 focus、错误靠近操作位置、空状态有一个明确下一步、避免渐变和装饰性动效。
- `frontend-design`：明确设计方向和差异化锚点。
- `ui-a11y`：语义 HTML、按钮/输入 label、可键盘操作和可见 focus。

不采纳：

- `antigravity-design-expert` 的玻璃拟态、漂浮卡片和重动效不适合 StorySpec 工作台。
- `high-end-visual-design` 的大留白、agency 风和复杂动效不适合本地写作控制台。

## 视觉方向

设计方向：编辑台 / 档案控制台。

差异化锚点：页面像一张打开的创作档案桌，左侧是项目抽屉，中间是当前故事档案和成熟度，右侧是确认门禁与下一步命令。不是 SaaS hero，不是三卡营销页，也不是紫蓝 AI 渐变。

UI 结构：

- 左侧：最近项目、打开路径、创建项目。
- 中间：当前项目名称、故事阶段、创作回声、创作缺口、正文/任务统计。
- 右侧：下一步建议、确认门禁、跟踪和 Git 状态。

颜色和排版：

- 使用系统字体栈，不远程加载字体，避免本地工具联网依赖。
- 背景使用纸白和墨色中性，不使用紫色/蓝色渐变。
- 信息面板用细线、浅底色和紧凑层级；卡片只用于工具面板，不嵌套卡片。

## 源文件边界

- 新增 `src/app-server/local-app-html.ts`：渲染 HTML、CSS 和浏览器脚本。
- 修改 `src/app-server/local-app-http-server.ts`：服务 `/` 页面；API 维持现有 token 校验。
- 修改 `src/cli/commands/app.command.ts`：启动时生成 HTML token，`--project` 时预打开项目；`--json --no-open` 仍保持不启动长驻服务。
- 修改或新增 `tests/unit/local-app-html.test.ts`、`tests/unit/local-app-http-server.test.ts`、`tests/unit/local-app-command.test.ts`。
- 同步 README、changeset、App 路线图和 OpenSpec tasks。
- 不手工编辑 `dist/**`。

## 页面行为

HTML 通过 `renderLocalAppHtml({ token })` 生成，浏览器脚本用该 token 调用现有 API：

- 初次加载：`GET /api/app/health`、`GET /api/projects/recent`、`GET /api/projects/current/status`。
- 打开项目：`POST /api/projects/open`，成功后刷新最近项目和状态。
- 创建项目：`POST /api/projects/create`，成功后刷新最近项目和状态。
- 错误显示在对应表单或状态区域，不用 `alert()`。

`--project <path>` 行为：

- 服务启动后用 core.openProject 预打开项目。
- 打开失败时不阻止服务启动，但 CLI 输出提示项目未打开，页面仍可手动选择项目。
- 成功时当前状态 API 可直接返回该项目状态。

## 安全边界

- 本地服务仍默认绑定 `127.0.0.1`。
- API 仍要求 session token。
- 页面内联 token 只用于当前本机页面调用，不在 `--json --no-open` 预览输出中暴露。
- 页面不能访问 allowlist 外项目；打开或创建项目仍走现有 core 校验。

## 验证

- HTML 单测检查设计锚点、表单、空状态、token 注入和不出现营销 hero / 紫蓝渐变。
- HTTP 单测检查 `/` 返回 HTML，API token 校验仍有效。
- CLI 单测检查启动渲染信息不泄露 token，并在 `--project` 预打开成功后 current status 可用。
