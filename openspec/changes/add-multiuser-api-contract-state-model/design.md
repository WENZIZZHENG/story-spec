# 多人平台 API Contract 与前端状态模型设计

## Contract Shape

所有新契约对象使用同一个 envelope 模型：

- `requestId`：每次请求的追踪 ID。
- `data`：成功响应数据，错误响应中不存在。
- `error`：错误响应对象，包含稳定 `code`、中文 `message` 和可选 `details`。
- `permissions`：当前用户对该资源或页面的权限决策。
- `resourceVersion`：资源版本或快照版本，用于前端冲突提示和未来 optimistic update。
- `warnings`：非阻断提示，例如只读、离线、需要确认。
- `pagination`：列表接口分页信息。

## Permission State

权限状态不只返回 boolean。前端需要知道按钮为什么禁用、能否申请权限、是否需要二次确认：

- `allowed`
- `denied`
- `disabled`
- `requires-confirmation`

每条权限决策都包含 `action`、`state`、`reason`、`requiresConfirmation` 和可选 `requestAccessHref`。

## First Page Endpoint Map

本 change 先定义首批页面契约，不要求所有 endpoint 已经接真实数据：

- 项目列表 / 工作区首页：`GET /api/projects`
- 故事驾驶舱：`GET /api/projects/:projectId/stories/:storyId/cockpit`
- 章节与写作：`GET /api/projects/:projectId/stories/:storyId/chapters`
- 候选与正典：`GET /api/projects/:projectId/stories/:storyId/canon-review`
- 任务中心：`GET /api/projects/:projectId/tasks`
- 成员权限：`GET /api/projects/:projectId/members`

## Fixtures

Contract fixtures 位于 `tests/fixtures/api-contract/`，按状态命名。它们不是后端假数据源，而是未来 UX、前端和 contract tests 的共享样例。fixtures 必须覆盖 success、empty、unauthorized、forbidden、conflict、blocked 和 offline。

## Boundaries

该设计只冻结字段和前端状态模型，不新增真实多人协作、富文本编辑器、数据库连接或 worker 执行。任何高影响写入仍必须保留 Preview / Confirm / Apply 和作者确认边界。
