# add-agent-job-log-read-api

## 背景

任务中心已有 job dashboard，但仍缺少单个 job 的运行时间线。完整 App 需要让用户看到 job 何时创建、当前状态、失败原因和 trace id；真实 OpenHands headless 接入前，可以先基于现有 job 状态生成只读日志视图。

## 目标

- 增加 job log read model，从现有 `AgentJob` 字段生成稳定时间线。
- 提供 `GET /api/projects/:projectId/jobs/:jobId/logs`。
- 日志项包含 level、message、createdAt，以及可选 traceId/runtimeErrorCode。
- 保持只读，不新增日志表，不修改 job 状态。

## 非目标

- 不采集实时 stdout/stderr。
- 不实现 WebSocket streaming。
- 不新增数据库表；后续真实 runtime 输出落库另起变更。

## 影响范围

- `src/server/jobs/agent-job.ts`
- `src/server/http/multiuser-server.ts`
- `tests/unit/*`
- `docs/tech/*`
