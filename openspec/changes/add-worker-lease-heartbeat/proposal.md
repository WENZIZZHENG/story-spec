## Why

`storyspec worker` 已有队列、失败分类、告警摘要和显式 OpenHands headless executor，但生产化 HA 仍缺一个稳定的 worker lease/heartbeat 模型。没有 lease，后续多 worker 调度、stale worker 回收、dashboard 健康状态和告警都只能依赖队列 readiness 的粗粒度布尔值。

## What Changes

- 新增 worker lease/heartbeat 领域模型，记录 workerId、状态、lastHeartbeatAt、leaseExpiresAt、concurrency、activeJobIds 和 traceId。
- 新增内存 worker lease repository，支持注册/刷新 heartbeat、标记停止、查询活跃 worker 和识别 stale lease。
- 更新 worker 可靠性测试、changeset 和路线图，明确这是 HA 的首批领域契约。

## Non-goals

- 不修改 PostgreSQL schema。
- 不实现分布式锁、抢占、leader election 或 Kubernetes HA。
- 不改变 BullMQ attempts、队列消费语义或现有 job 执行路径。
- 不自动重入队 stale worker 上的 job。

## SDD 分级

standard。该切片新增 worker HA 的可观察领域契约和 repository 行为，但不触碰部署、存储迁移或实际调度策略。

## Impact

影响 `src/server/workers/*`、`tests/unit/multiuser-worker-reliability.test.ts`、OpenSpec、changeset 和 roadmap 文档。

## Capabilities

- `multiuser-worker-lease`
