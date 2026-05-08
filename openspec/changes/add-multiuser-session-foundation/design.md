## 设计

本 change 只实现框架无关 session foundation。会话 token 暂由调用方传入或由默认 generator 生成；repository 使用接口抽象，第一版提供内存实现供测试和后续 adapter 复用。

## 源文件边界

- 新增 `src/server/auth/session.ts`：用户、会话、repository、创建、撤销和 requireUser。
- 新增 `tests/unit/multiuser-session.test.ts`。
- 新增 changeset。
- 不修改 `src/app-server/**`、`src/cli/**`、`dist/**`、`package.json` 或 `bun.lock`。

## 行为

`createUserSession()`：

- 要求 user 存在。
- 生成或接收 token。
- 写入 `expiresAt`。
- 返回 session 和 user context。

`requireUser()`：

- 缺少 token 返回 blocked。
- token 不存在返回 blocked。
- token 已撤销返回 blocked。
- token 过期返回 blocked。
- user 不存在返回 blocked。
- 成功时返回 user context。

`revokeSession()`：

- 标记 session 为 revoked，不删除记录，方便后续审计。

## 后续

后续 HTTP adapter 可把 session token 放进 httpOnly cookie 或 Authorization header，但不能绕过 `requireUser()`。
