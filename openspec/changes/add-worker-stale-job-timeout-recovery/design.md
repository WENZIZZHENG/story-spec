## 方案

新增 `recoverStaleWorkerJobs()`。它复用 `buildWorkerLeaseRecoveryPlan()`，遍历 `affectedJobs`，对仍处于 `running` 的 job 调用 `transitionAgentJob(..., status: 'timeout')`，并通过 `recordWorkerFailure()` 写入 `queue-failed` failure record。

## 执行边界

- 仅处理 recovery plan 的 `affectedJobs`，也就是 stale lease 上仍为 `running` 的 job。
- 状态转移只允许 `running -> timeout`，如果 job 已被其他流程处理，transition 会阻断，该项记为 skipped。
- failure record 使用 `decision: retryable/dead-letter` 的既有分类，后续是否 retry 仍由人工或显式 API 决定。

## 取舍

选项 A：timeout 后立即 retry/requeue。风险是重复执行 runtime，可能造成重复候选、重复消耗配额或并发写入。

选项 B：只 timeout 并记录 failure。风险较低，能清除卡住 running 状态，同时保留人工恢复入口。本切片采用选项 B。

## 风险与后续

- 当前没有跨进程数据库锁；并发执行恢复器时可能出现重复 failure record。后续应通过持久化 lease/failure repository 的唯一键和恢复批次 id 收紧。
- 当前不接 server API；后续可以增加受权限保护的显式恢复 API 或 worker 定时扫描。
- 当前不落库 worker lease；生产 HA 仍需要 PostgreSQL lease repository。
