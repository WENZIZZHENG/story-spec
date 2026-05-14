# add-agent-job-dashboard-read-api

## 背景

多人平台已具备 job 创建、取消、重试、Redis/BullMQ 队列底座和 worker 失败策略，但完整 App 的任务中心还缺少一个聚合读模型来展示当前任务运行态。只列出 job 明细不足以支撑 dashboard、告警和后续 HA 设计。

## 目标

- 增加项目级 agent job dashboard 读模型。
- 聚合 job 状态计数、active/retryable 数量、最新 job、队列 readiness 和本地队列快照摘要。
- 提供 `GET /api/projects/:projectId/jobs/dashboard`，供完整 App 任务中心读取。

## 非目标

- 不实现真实 OpenHands headless 执行。
- 不实现告警、分布式锁或 HA 调度。
- 不修改 job 写入和 retry/cancel 语义。

## 影响范围

- `src/server/jobs/agent-job.ts`
- `src/server/http/multiuser-server.ts`
- `tests/unit/*`
- `docs/tech/*`
