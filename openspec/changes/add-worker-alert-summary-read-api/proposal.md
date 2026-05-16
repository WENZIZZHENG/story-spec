## Why

任务中心已有 job dashboard 和单 job 日志，worker failure 也已有 retryable / dead-letter 分类记录。但完整 App 仍缺少一个只读告警摘要，无法在任务中心快速判断“哪些失败需要人工处理、哪些可以走现有 retry、队列是否处于可运行状态”。如果直接进入 HA 或真实 OpenHands headless，会缺少稳定可观测性输入。

## What Changes

- 新增 worker alert summary 读模型，基于 project jobs、queue readiness 和 worker failure records 聚合 retryable、dead-letter、queue unavailable 等告警。
- 新增 token-protected `GET /api/projects/:projectId/jobs/alerts`。
- 告警摘要提供 severity、category、jobId、failureId、reason、recommendedAction 和 queue readiness，不创建、取消、重试或执行 job。
- 同步路线图和 changeset，明确这不是 HA、自动告警推送或真实 OpenHands headless。

## Non-goals

- 不实现邮件/短信/Webhook/外部告警。
- 不自动 retry、requeue 或执行 job。
- 不实现分布式锁、BullMQ attempts 策略或 HA 调度。
- 不落库 stdout/stderr 或 runtime artifacts。

## Impact

影响 `src/server/workers/worker-reliability.ts`、`src/server/http/multiuser-server.ts`、worker/server 单元测试、changeset、路线图和 OpenSpec 记录。

## Capabilities

- `worker-alert-summary-read-api`
