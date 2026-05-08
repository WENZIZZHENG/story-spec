---
change_type: minor
scope: server,runtime,api,docs
---

# 多用户 Runtime、App 回流 API 与可观测性基础

## CLI 行为

- 无新增用户命令；`storyspec server` 内部 HTTP/API 和 runtime foundation 增强。

## 模板契约

- 无用户可见模板契约变化。

## 生成产物

- 新增 `AgentRuntimeAdapter`、`LocalStorySpecRunner` 与 `OpenHandsRunner` PoC，runtime 输出保持 preview-only。
- 新增受保护 `GET /api/projects`、`GET /api/projects/:projectId/members`、`GET /api/projects/:projectId/jobs`。
- 新增 `/ready` readiness endpoint。
- `AgentJob` 增加 `traceId` 与 `runtimeErrorCode`，错误响应支持可选 `traceId`。

## 验证

- `npx vitest run tests/unit/multiuser-agent-runtime.test.ts`
- `npx vitest run tests/unit/multiuser-server-core.test.ts tests/unit/multiuser-server.test.ts tests/unit/multiuser-database.test.ts`
- `npm run build`
