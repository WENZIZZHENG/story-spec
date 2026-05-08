---
change_type: minor
scope: server,auth,docs
---

# 多用户 HTTP 权限守卫

## CLI 行为

- 无新增用户命令；`storyspec server` 的内部 HTTP 入口现在支持受保护上下文端点。

## 模板契约

- 无用户可见模板契约变化。

## 生成产物

- 多用户 server 新增 `GET /api/context?projectId=<id>` 受保护探针端点。
- 端点会读取 `Authorization: Bearer <token>` 或 `x-storyspec-session-token`，先验证 session，再验证 `userId + projectId` membership。
- 未登录返回 `AUTH_REQUIRED`，项目越权返回 `PROJECT_ACCESS_DENIED`。

## 验证

- `npx vitest run tests/unit/multiuser-server.test.ts`
- `npm run build`
