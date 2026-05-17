---
change_type: minor
scope: web,permissions
---

# 登录/权限 UI 只读切片

## 背景

独立 `apps/web/` shell 已经能展示首批页面与 API 边界，但还缺少用户进入多人平台时最先需要确认的 session、角色和权限状态。多人后端已有 session/project guard 与角色权限模型，本次先把这些状态映射成可测试的前端只读契约。

## 变化

- 在独立 Web shell contract 中新增 `authPanel`。
- 展示 session 绑定状态、当前用户、当前项目、项目角色、允许动作、禁用动作、禁用原因和下一步。
- 在完整 App 前端架构契约中新增 `login-permission` route、`multiuser-context` 只读 endpoint 和登录/权限 UI contract。
- 保持本切片只读：不创建账号、不登录/登出、不邀请成员、不修改角色、不绕过后端权限守卫。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化，未修改 `dist/**`。

## 验证

- `npx openspec validate add-login-permission-ui-slice --strict --json --no-interactive`
- `npx vitest run tests/unit/independent-web-app-shell.test.ts tests/unit/app-frontend-architecture.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
