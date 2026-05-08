---
change_type: minor
scope: server,security,docs
---

# 多用户项目安全底座

## CLI 行为

无变化。未新增或修改 CLI 命令。

## 模板契约

无变化。未修改 agent prompt、slash command 模板或用户项目初始化模板。

## 生成产物

无变化。未手工修改 `dist/` 或命令生成产物。

## Server / Security

- 新增多用户项目访问安全 foundation，提供 `requireProjectAccess()` 授权守卫和 `createProjectStorage()` 项目内路径解析。
- 授权守卫要求 `userId + projectId`，拒绝只传文件路径的访问方式。
- 项目存储解析拒绝空路径、绝对路径、`..` 越界和项目 data root 外路径。
- 这不是完整多用户 App：没有新增登录、数据库、HTTP server、队列、UI 或账号系统。当前能力只是后续多用户 server、job 和 runtime 的安全底座。

## 验证

- `npx openspec validate add-multiuser-project-security-foundation --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-project-security.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
