## 设计

本 change 把已实现的大纲候选和任务板 application 服务接入本机 App。核心原则是：App 只提供更容易扫描和操作的页面入口，领域事实仍由现有 `manage-outline-candidates.ts` 与 `export-task-board.ts` 维护。

## 源文件边界

- 修改 `src/app-server/local-app-server.ts`：为 core 注入并暴露 outline/task 方法。
- 修改 `src/app-server/local-app-http-server.ts`：新增 `/api/outlines/list`, `/api/outlines/create`, `/api/outlines/compare`, `/api/outlines/promote`, `/api/tasks/board`。
- 修改 `src/cli/commands/app.command.ts`：启动本机工作台时注入真实 outline/task application 服务。
- 修改 `src/app-server/local-app-html.ts`：新增规划面板。
- 修改相关 unit tests，并同步 README、changeset、路线图和待办状态。
- 不手工编辑 `dist/**`。

## API 行为

所有新增 API 都必须：

- 要求 `x-storyspec-app-token`。
- 只作用于当前 App session 已打开或已创建项目，不接受任意 projectRoot。
- 领域错误返回 400 blocked response。

方法：

- `core.listOutlineCandidates({ token, story })`
  - 调用 `listOutlineCandidates({ projectRoot: currentProjectRoot, story })`。
- `core.createOutlineCandidate({ token, story, title, text })`
  - 调用 `createOutlineCandidate({ projectRoot: currentProjectRoot, story, title, text })`。
  - 第一版页面只支持作者文本，不支持本地 file path 上传。
- `core.compareOutlineCandidates({ token, story, leftId, rightId })`
  - 调用 `compareOutlineCandidates(...)`。
- `core.promoteOutlineCandidate({ token, story, outlineId, yes })`
  - 调用 `promoteOutlineCandidate(...)`。
  - 页面默认传 `yes: false`，展示 dry-run 和提醒；显式确认写入可以后续单独加强。
- `core.getTaskBoard({ token, story })`
  - 调用 `exportTaskBoard({ projectRoot: currentProjectRoot, story, write: false })`。

## 页面行为

页面新增“规划面板”区域：

- 大纲候选列表：显示 id、标题、状态、来源、更新时间和摘要。
- 创建候选：故事名可选、候选标题、候选大纲文本；提交后刷新列表。
- 比较候选：输入两个 id，展示主线目标、人物弧线、节奏、风险、读者承诺的差异。
- 提升预览：输入 outline id，默认 dry-run 展示目标路径和后续检查提醒；不默认覆盖正式计划。
- 任务板：读取任务总数、待办、完成、writeReady、planOnly 和前几条任务。

## 创作控制和安全

- 候选大纲不是正典；只有 `promote --yes` 才覆盖正式 `creative-plan.md`。
- 页面文案必须说明提升默认预览，不自动改正文、tracking、tasks 或 canon。
- 任务板第一版只读，不修改任务状态。
- 所有操作仍受当前 session 项目 allowlist 约束。

## 验证

- Core 单测覆盖 token、未打开项目、list/create/compare/promote dry-run/task board。
- HTTP 单测覆盖 endpoint、token 校验和 dry-run promote。
- HTML 单测覆盖规划面板、API 路径、dry-run 文案和任务板区域。
- CLI 单测覆盖启动注入真实 outline/task 服务。
- 集成验证运行 OpenSpec strict validate、相关 unit、相关 smoke、`npm run build`、`npm run check:changes`、`git diff --check`。
