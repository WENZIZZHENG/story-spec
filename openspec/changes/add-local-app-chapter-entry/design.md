## 设计

本 change 只把已有章节生产 application 服务接到本机 App。App 负责提供可视化入口和状态反馈，领域事实仍由 `manage-drafts.ts`、`create-scene-card.ts` 和 `review-project.ts` 维护。

## 源文件边界

- 修改 `src/app-server/local-app-server.ts`：为 core 注入并暴露章节草稿、Scene Card 和 review 方法。
- 修改 `src/app-server/local-app-http-server.ts`：新增 `/api/chapters/*` endpoint。
- 修改 `src/cli/commands/app.command.ts`：启动本机工作台时注入真实章节服务。
- 修改 `src/app-server/local-app-html.ts`：新增章节入口 UI 与脚本。
- 修改相关 unit tests，并同步 README、changeset、路线图和待办状态。
- 不手工编辑 `dist/**`。

## API 行为

所有新增 API 都必须：

- 要求 `x-storyspec-app-token`。
- 只作用于当前 App session 已打开或已创建项目，不接受任意 `projectRoot`。
- 领域错误返回 400 blocked response。

方法：

- `core.createChapterDraft({ token, story, chapter, basedOn, contextPack })`
  - 调用 `createDraft({ projectRoot: currentProjectRoot, fileSystem, story, chapter, basedOn, contextPack })`。
  - 不覆盖正式正文。
- `core.listChapterDrafts({ token, story, chapter })`
  - 调用 `listDrafts({ projectRoot: currentProjectRoot, fileSystem, story, chapter })`。
- `core.promoteChapterDraft({ token, story, draftId, yes })`
  - 调用 `promoteDraft(...)`。
  - 页面默认传 `yes: false`，只展示 dry-run 发布目标。
- `core.createChapterSceneCard({ token, story, sceneId })`
  - 调用 `createInitialSceneCard({ projectRoot, packageRoot, fileSystem, story, id: sceneId })`。
- `core.reviewChapter({ token, chapter, panel })`
  - 调用 `reviewProject({ projectRoot, packageRoot, fileSystem, chapter, panel })`。
  - `panel` 可选，默认由 `reviewProject()` 决定。

## 页面行为

页面新增“章节入口”区域：

- 共享故事名输入和章节输入。
- 草稿创建：输入 chapter、可选 basedOn、可选 contextPack；显示 draft id、路径和写作前检查命令提示。
- 草稿列表：按故事和章节读取记录，显示 id、状态、版本、路径。
- 发布预览：输入 draft id，默认 dry-run，显示目标正文路径；不提供默认发布按钮。
- Scene Card 初始化：输入 scene id，调用初始化服务；如果已存在，显示 blocked error。
- 写后自检：按 chapter 运行 reviewer loop，显示 findings 数、任务草稿数和各 reviewer 分数。

## 创作控制和安全

- 草稿是候选，不是正式正文；只有 `promoteDraft({ yes: true })` 才发布。
- 页面第一版只提供 dry-run 发布预览，不把发布确认混入普通读取视图。
- Scene Card 初始化只是模板和候选上下文，不代表新增正典事实已确认。
- 写后自检只读输出 findings 和任务草稿，不自动改 `tasks.md`、正文、tracking 或 canon。
- 所有操作仍受当前 session 项目 allowlist 约束。

## 验证

- Core 单测覆盖 token、未打开项目、create/list/promote dry-run、scene init、chapter review。
- HTTP 单测覆盖 endpoint、token 校验和 dry-run promote。
- HTML 单测覆盖章节入口、API 路径、dry-run 文案和写后自检区域。
- CLI 单测覆盖启动注入真实章节服务。
- 集成验证运行 OpenSpec strict validate、相关 unit、相关 smoke、`npm run build`、`npm run check:changes`、`git diff --check`。
