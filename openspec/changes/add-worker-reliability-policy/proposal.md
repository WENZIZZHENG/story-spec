## Why

`storyspec worker` 已能消费队列并执行 preview-only runtime，但失败目前只表现为 queue fail 和 job failed。生产化前需要先让失败可分类、可追踪、可判断是否进入死信，避免后续 dashboard、重试和告警都没有稳定模型。

## What Changes

- 新增 worker failure policy，定义 retryable / dead-letter / ignored 三类决策。
- 新增 worker failure record repository，记录 jobId、attempt、reason、decision、traceId 和 createdAt。
- 将 worker runner 在 job missing、runtime missing、runtime failed 等失败路径写入 failure record。
- 同步路线图和 changeset，明确这只是可靠性策略底座，不实现 dashboard、分布式锁或 HA。

## Non-goals

- 不自动重新入队，不改变现有 retry API。
- 不实现死信 dashboard、告警、分布式锁或高可用调度。
- 不修改 PostgreSQL schema 或 BullMQ job attempts。

## Impact

影响 `src/server/workers/*`、相关 worker unit tests、路线图、changeset 和 OpenSpec 记录。

## Capabilities

- `multiuser-worker-reliability`
