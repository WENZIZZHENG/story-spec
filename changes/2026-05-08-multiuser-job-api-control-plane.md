---
change_type: minor
scope: server,jobs,docs
---

# 多用户 AgentJob API 控制面

## CLI 行为

- 无新增用户命令；`storyspec server` 内部 HTTP 入口新增项目级作业控制 API。

## 模板契约

- 无用户可见模板契约变化。

## 生成产物

- 新增受保护 `POST /api/projects/:projectId/jobs`，创建 queued `AgentJob`。
- 新增受保护 `GET /api/projects/:projectId/jobs/:jobId`，查询项目内 job 状态。
- 新增受保护 cancel / retry 端点，仍不接真实 worker 或 runtime。
- 所有 job 端点都复用 session、project membership 和 job.projectId 校验。

## 验证

- `npx vitest run tests/unit/multiuser-server.test.ts`
- `npm run build`
