---
change_type: minor
scope: multiuser,worker
---

# Agent job 日志读取接口

## 背景

多人在线写作平台的任务中心已经有 job dashboard，但用户仍缺少进入单个任务后查看“它发生了什么”的只读时间线。首批实现先从 `AgentJob` 状态生成日志，避免提前引入独立日志表或 runner 输出持久化。

## 变化

- 新增 `buildAgentJobLog` 读模型，返回 `projectId`、`jobId` 和按时间排序的 `entries`。
- 新增 `GET /api/projects/:projectId/jobs/:jobId/logs`，复用 session、project membership 和 job/project 归属校验。
- 日志条目表达 job 创建、当前状态、失败原因、`traceId` 和 `runtimeErrorCode`。
- 该接口只读，不修改 job、queue 或 runtime 状态。

## CLI 行为

无 CLI 行为变化。`storyspec worker`、`storyspec server` 的启动参数不变。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化，未修改 `dist/**`。

## 验证

- `npx.cmd openspec validate add-agent-job-log-read-api --strict --json --no-interactive`
- `npx.cmd vitest run tests/unit/multiuser-agent-job.test.ts tests/unit/multiuser-server.test.ts`
