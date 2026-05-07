## 设计

本 change 用一张“继续创作”摘要卡收口状态语义和项目回流，不改变现有写入门禁。它把 `status` 的事实、`next` 的下一步意图和 App 最近项目入口连成一条可读路径。

## 继续创作模型

新增 application 级 resume summary，输入为 `ProjectStatus` 或 `getProjectStatus` 的输出，输出包含：

- `projectRoot`、`projectName`。
- `storyName`、`stage`，无故事时为空。
- `stateLabel`：面向作者的当前状态，例如“尚未创建故事”“共创澄清中”“规格已确认，等待规划”“任务已生成，准备写作”。
- `primaryAction`：下一步标题、原因、可复制命令、是否写入、写入模式和边界说明。
- `statusGlossary`：固定状态词表，说明 candidate、preview、apply、dry-run、blocked、read-only、active、planned 的含义。
- `recentProjectHint`：说明 App 会记住最近项目，但不做云端同步。
- `boundaries`：不会自动写入正典、正文、tracking、tasks；不会绕过用户确认。

第一版不直接调用 `getStoryNext`，避免在 status 请求里重复扫描和引入更多失败路径；下一步命令直接从 `ProjectStatus.nextActions` 和 story stage 推导。

## App 和 HTTP

- Core：新增 `getCurrentProjectResume({ token })`，只允许当前会话已打开或创建的项目。
- HTTP：新增 `GET /api/projects/current/resume`，沿用 `x-storyspec-app-token`。
- UI：项目状态区域附近新增“继续创作”卡，打开项目或刷新状态后自动读取 resume。卡片展示：
  - 当前状态。
  - 推荐下一步。
  - 可复制命令。
  - 写入边界和状态词解释。

## 状态语义

统一口径只做展示，不改行为：

- `candidate`：候选，不是正典。
- `preview`：写入前预览，不覆盖正式文件。
- `apply`：作者显式确认后写入。
- `dry-run`：只展示将发生什么。
- `blocked`：缺少必要输入或存在风险，不能继续自动写入。
- `read-only`：只读检查或看板。
- `active`：当前可继续处理的路线或阶段。
- `planned`：已登记但未激活的后续路线。

## 验证

- Unit：
  - application resume summary：不同故事阶段输出稳定状态标签、下一步命令和边界。
  - App core：token、未打开项目、当前项目 resume。
  - HTTP：`/api/projects/current/resume` token 和返回。
  - HTML：继续创作区域、API wiring 和状态词说明。
- 集成：OpenSpec strict validate、相关 unit、`npm run build`、`npm run check:changes`、`git diff --check`。
