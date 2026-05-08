## 设计

第一版把 HTTP guard 接在现有 Node `http` 多用户入口上，不引入 Fastify middleware。`startMultiuserServer()` 增加可选 repositories：`sessionRepository` 和 `projectRepository`。当请求访问受保护端点时，server 先从 `Authorization: Bearer <token>` 或 `x-storyspec-session-token` 取 token，再调用 `requireUser()`，最后用 `projectId` 调用 `requireProjectAccess()`。

## 行为

- `GET /api/context?projectId=<id>` 是第一条受保护端点。
- 未提供 session token 返回 401 / `AUTH_REQUIRED`。
- token 无效、过期或撤销返回 401 / `AUTH_REQUIRED`。
- 项目不存在、缺少 membership 或角色不足返回 403 / `PROJECT_ACCESS_DENIED`。
- 成功时返回 `userId`、`projectId`、`role` 和 `requestId`。

## 边界

- 不实现登录接口。
- 不设置 cookie。
- 不接真实项目读写 API。
- 不改变本机单人工作台。
