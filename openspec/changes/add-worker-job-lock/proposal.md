## Why

Worker lease 和 stale job timeout recovery 已能发现和处理过期 worker，但还没有“同一 job 同时只能被一个 worker 处理”的锁契约。后续把 worker 恢复接入真实队列和多进程部署前，需要先有可测试的 job lock 领域模型，避免重复 runtime 执行。

## What Changes

- 新增 worker job lock 领域模型。
- 新增内存 job lock repository，支持 acquire、heartbeat/extend、release 和 expired takeover。
- 锁只保护执行权，不自动执行 runtime、不改变 job 状态、不写故事文件。

## Non-goals

- 不实现 PostgreSQL advisory lock 或 Redis lock。
- 不修改 BullMQ adapter 或 worker 消费循环。
- 不自动 retry/requeue，不改变 job lifecycle。
- 不新增 UI/API。

## SDD 分级

full。该切片属于任务调度/并发控制底座，会影响后续生产可靠性；本次只做领域模型和内存 repository，保持可回退。

## Impact

影响 `src/server/workers/*`、worker reliability tests、OpenSpec、changeset 和 roadmap 文档。

## Capabilities

- `worker-job-lock`
