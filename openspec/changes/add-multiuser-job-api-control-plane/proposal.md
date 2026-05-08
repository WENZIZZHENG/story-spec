## Why

AgentJob 状态机已经有纯 TypeScript foundation，但多用户 server 还不能通过 API 创建、查询、取消或重试作业。长任务如果继续同步执行，会导致请求阻塞、失败不可追踪和重复 apply 风险。第一步先提供作业控制面，不接真实 worker。

## What Changes

- 新增多用户作业 API：创建、查询、取消、重试。
- 所有作业 API 复用 session 和 project guard。
- 作业创建保留 idempotency key，输出 queued job。

## Non-goals

- 不接 BullMQ、Redis 或 worker。
- 不执行真实 agent runtime。
- 不自动 apply 作业结果。

## Impact

影响 `src/server/http/multiuser-server.ts`、`tests/unit/multiuser-server.test.ts`、changeset 和多用户路线图。

## Capabilities

- `multiuser-job-api-control-plane`
