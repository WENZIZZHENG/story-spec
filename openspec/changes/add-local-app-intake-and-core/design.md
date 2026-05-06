## 设计

本 change 在现有零依赖本机工作台 shell 上接入核心创作入口。设计目标是“把 CLI 已经成熟的第一步能力以受保护 API 形式暴露给页面”，而不是另起一套前端应用或重做创作领域逻辑。

## 源文件边界

- 修改 `src/app-server/local-app-server.ts`：为 core 注入 `createStoryIdea`、`ingestStoryInput`、`createStoryCoreSummary` 适配函数，并提供当前项目 API 方法。
- 修改 `src/app-server/local-app-http-server.ts`：新增 `/api/stories/create`, `/api/stories/ingest`, `/api/stories/core/missing`。
- 修改 `src/cli/commands/app.command.ts`：启动本机工作台时注入真实 application 服务。
- 修改 `src/app-server/local-app-html.ts`：新增“创作入口”区域和浏览器脚本调用。
- 新增或扩展 `tests/unit/local-app-server.test.ts`、`tests/unit/local-app-http-server.test.ts`、`tests/unit/local-app-html.test.ts`、`tests/unit/local-app-command.test.ts`。
- 同步 README、changeset、路线图和待办入口。

## API 行为

所有新增 API 都必须满足：

- 请求带 `x-storyspec-app-token`。
- 当前 session 已打开或创建项目，否则返回 403。
- 只对当前项目根目录操作，不接受任意项目路径。
- 领域错误转为 400 blocked response，避免页面把堆栈当正文展示。

拟新增方法：

- `core.createStoryIdea({ token, name, idea })`
  - 调用注入的 `createStoryIdea({ projectRoot: currentProjectRoot, ... })`。
  - 成功后返回 story、ideaPath、nextCommands、firstRunFlow，并刷新状态。
- `core.ingestStoryInput({ token, story, text, applyConfirmed })`
  - 调用注入的 `ingestStoryInput({ projectRoot: currentProjectRoot, ... })`。
  - `applyConfirmed` 默认 `false`；页面文案必须说明默认只预览。
- `core.getStoryCoreMissing({ token, story })`
  - 调用注入的 `createStoryCoreSummary({ projectRoot: currentProjectRoot, missingOnly: true })`。
  - 返回缺失或未完成核心项，供页面展示。

## 页面行为

页面新增中栏“创作入口”或等价区域：

- 一句灵感表单：故事名 + 灵感文本，提交后展示创建结果、下一步命令，并刷新状态。
- 长文资料表单：故事名可选 + 文本框 + “写入明确表达字段”勾选框，默认不勾选；提交后展示素材类型、建议写入、保留候选、仍需确认和写入状态。
- 核心缺口按钮：读取当前故事缺失项，展示 label、状态、sourceLabel、summary 和 nextPrompt。

错误显示在对应区域，不使用 `alert()`。页面不需要做复杂状态管理；维持现有 inline JS 即可。

## 安全和创作控制

- 页面不能传项目根目录给新增创作 API；项目由 server 当前 session 决定。
- 创建故事会写入 `stories/<story>/idea.md`，这是作者显式输入的一句话灵感，不是 AI 候选。
- 长文吸收默认 preview-only；即使 `applyConfirmed=true`，也只复用现有“作者明确字段标签”写入逻辑，不写入 AI 候选。
- 核心缺口 API 只读。

## 验证

- Core 单测覆盖 token、未打开项目、创建故事、长文 preview-only、核心缺口。
- HTTP 单测覆盖新增 endpoint 和 token 校验。
- HTML 单测覆盖表单、checkbox、结果区域、API 路径和不出现营销 hero / 渐变。
- CLI 单测覆盖启动注入真实创作入口服务。
- 集成验证运行 OpenSpec strict validate、相关 unit、相关 smoke、`npm run build`、`npm run check:changes`、`git diff --check`。
