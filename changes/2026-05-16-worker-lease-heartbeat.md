---
change_type: minor
scope: worker,reliability,ha
---

# Worker Lease 与 Heartbeat 底座

## 背景

Worker 队列已有失败分类、告警摘要和显式 OpenHands headless executor，但多 worker 高可用仍缺少稳定的 lease/heartbeat 领域模型。后续分布式锁、stale worker 回收和 dashboard 健康状态需要先共享同一套 worker lease 契约。

## 变化

- 新增 `WorkerLease`、`WorkerLeaseRepository`、`createMemoryWorkerLeaseRepository()` 和 `refreshWorkerLease()`。
- worker lease 记录 workerId、status、concurrency、activeJobIds、lastHeartbeatAt、leaseExpiresAt、traceId 和 stoppedAt。
- 支持刷新 heartbeat、延长 lease、查询 active lease、识别 stale lease 和标记 worker stopped。

## CLI 行为

无 CLI 行为变化。`storyspec worker` 仍按现有队列路径处理 job，本切片不启动新的 HA 调度进程。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化，未修改 `dist/**`。

## 验证

- `npx openspec validate add-worker-lease-heartbeat --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-worker-reliability.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
