## Why

多用户项目安全底座已经要求 `userId + projectId`，但还缺少“请求如何得到可信 userId”的最小会话层。后续 HTTP adapter、项目 API 和作业 API 都需要统一的 session 校验、过期和撤销语义。先做纯 TypeScript session foundation，可以在不引入数据库和登录 UI 的情况下固定安全行为。

## What Changes

- 新增 `User`、`Session`、session repository 和 session service 的最小模型。
- 新增 `createUserSession()`，创建带过期时间的会话。
- 新增 `requireUser()`，根据 session token 返回用户上下文或 blocked 结果。
- 新增 `revokeSession()`，支持显式撤销会话。
- 新增单元测试覆盖有效 session、过期 session、撤销 session 和缺失 token。

## Non-goals

- 不实现密码登录、注册、OAuth、SSO 或账号 UI。
- 不引入数据库 schema、迁移、cookie 或 HTTP middleware。
- 不接真实项目 API 或 job API。

## Impact

影响 `src/server/auth/*`、对应 unit test、changeset 和多用户 OpenSpec。后续 `MU-03` HTTP middleware、`MU-02` database repository 和 `MU-09` UI 可复用该 foundation。

## Capabilities

- `multiuser-session-foundation`
