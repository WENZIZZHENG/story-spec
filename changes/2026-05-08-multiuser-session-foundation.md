---
change_type: minor
scope: server,security,docs
---

# 多用户会话安全底座

## CLI 行为

无变化。未新增或修改 CLI 命令。

## 模板契约

无变化。未修改 agent prompt、slash command 模板或用户项目初始化模板。

## 生成产物

无变化。未手工修改 `dist/` 或命令生成产物。

## Server / Security

- 新增多用户 session foundation，提供用户、会话、内存 repository、session 创建、撤销和 `requireUser()`。
- session guard 会拒绝缺失 token、未知 token、过期 session、撤销 session 和已不存在用户。
- 当前不是完整账号系统：没有登录 UI、密码、OAuth、cookie、数据库或 HTTP middleware。

## 验证

- `npx openspec validate add-multiuser-session-foundation --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-session.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
