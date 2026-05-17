## 方案

本切片复用现有 `WorkerLeaseRepository.listStale()` 和 `AgentJobRepository.findById()`，新增一个纯领域函数 `buildWorkerLeaseRecoveryPlan()`。输入为 lease repository、job repository、当前时间和可选 projectId；输出为只读 recovery plan。

## 输出边界

Recovery plan 记录：

- `generatedAt`：计划生成时间。
- `staleLeases`：所有匹配的 stale worker lease。
- `affectedJobs`：仍处于 `running` 的 activeJobIds，包含 job、workerId、leaseExpiresAt、recommendedAction。
- `missingJobRefs`：lease 中引用但 repository 找不到的 jobId。
- `ignoredJobRefs`：找到但不是 running 的 job，避免误报已完成、取消或失败的任务。

## 取舍

选项 A：直接把 stale running job 标记为 timeout 并重入队。风险高，会改变 job lifecycle，且还没有分布式锁/幂等执行保障。

选项 B：只生成 recovery plan。风险低，可先支持 dashboard、人工恢复和后续恢复执行器，是本次采用方案。

## 风险与后续

- 当前只覆盖内存/领域层，不落库；生产可恢复性仍需要 PostgreSQL lease repository 或队列状态协调。
- 当前不解决多个 worker 同时处理同一 job 的锁竞争；后续应在 recovery executor 前补 acquire/release 语义或数据库唯一约束。
- 当前不重试 job；后续可基于 recovery plan 增加显式、受权限保护的恢复 API。
