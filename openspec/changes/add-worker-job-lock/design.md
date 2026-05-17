## 方案

在 `worker-reliability.ts` 中新增 `WorkerJobLock`、`WorkerJobLockRepository` 和内存实现：

- `acquire(input)`：当 job 无锁、锁已释放、或锁已过期时获得锁；否则返回 blocked。
- `heartbeat(input)`：只有当前 owner worker 能延长锁。
- `release(input)`：只有当前 owner worker 能释放锁。
- `snapshot()`：供测试和未来 dashboard 使用。

## 锁语义

锁包含 `jobId`、`workerId`、`acquiredAt`、`expiresAt`、`lastHeartbeatAt`、`status`、`traceId`。过期锁允许 takeover，但旧 worker 再 heartbeat/release 会被拒绝。

## 取舍

选项 A：直接接 PostgreSQL/Redis 分布式锁。风险是提前绑定部署形态，且当前 worker lease repository 仍是内存底座。

选项 B：先冻结领域语义和内存 repository。风险低，后续可将 repository 替换为 PostgreSQL/Redis 实现。本切片采用选项 B。

## 后续

- 在 `runNextAgentJob()` 执行 runtime 前接入 lock acquire/release。
- 增加 PostgreSQL 或 Redis lock repository。
- 将 lock 状态纳入 worker alert/dashboard。
