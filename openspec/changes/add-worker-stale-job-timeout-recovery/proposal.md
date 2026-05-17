## Why

Stale worker recovery plan 已能识别过期 lease 上仍处于 `running` 的 job，但还不能执行任何恢复动作。为了避免 stale worker 让 job 永久卡在 running，需要一个保守的恢复执行器，把确认受影响的 running job 标记为 timeout 并记录 worker failure，供后续人工 retry 或 dashboard 告警处理。

## What Changes

- 新增 stale worker recovery executor。
- 基于 recovery plan 只处理 affected running jobs。
- 将受影响 job 从 `running` 转为 `timeout`，写入可读 errorMessage/runtimeErrorCode。
- 记录 worker failure，供告警摘要和后续人工处理使用。

## Non-goals

- 不自动 retry 或重入队。
- 不自动 cancel queued job。
- 不执行 runtime、不 apply story/canon/tracking、不创建 proposal。
- 不实现数据库分布式锁或 BullMQ attempts 策略。
- 不新增 UI 或 HTTP API。

## SDD 分级

full。该切片修改 worker 恢复执行路径和 job 状态，属于任务调度/生产可靠性行为；范围保持最小，只做 timeout + failure record，不做自动重试。

## Impact

影响 `src/server/workers/*`、worker reliability tests、OpenSpec、changeset 和 roadmap 文档。

## Capabilities

- `worker-stale-job-timeout-recovery`
