## Why

Worker lease/heartbeat 已能识别 stale worker，但多人平台还没有把 stale lease 转换为可审计的恢复计划。没有恢复计划，后续分布式锁、失败恢复执行器和 dashboard 只能看到 worker 过期，不能知道哪些 running job 受影响、是否仍在当前 project 内、推荐下一步是什么。

## What Changes

- 新增基于 stale worker lease 和当前 job repository 的 recovery plan 领域模型。
- recovery plan 只读汇总 stale leases、受影响的 running jobs、缺失 job 引用和推荐动作。
- 保持恢复计划不自动重入队、不自动 retry、不自动 cancel、不自动 apply。

## Non-goals

- 不修改 PostgreSQL schema。
- 不实现真正的分布式锁、leader election、抢占执行或 BullMQ attempts 策略。
- 不把 stale job 自动转为 failed/timeout，也不自动调用 retry API。
- 不新增 UI 或 HTTP API。

## SDD 分级

full。该切片属于 worker 调度/恢复路径，影响后续生产可靠性设计；本次选择最小可回退实现，只新增只读 recovery plan，不改变实际 job lifecycle。

## Impact

影响 `src/server/workers/*`、worker reliability tests、OpenSpec、changeset 和路线图文档。

## Capabilities

- `multiuser-worker-lease-recovery`
