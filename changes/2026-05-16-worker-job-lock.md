---
change_type: minor
scope: worker,reliability
---

# Worker Job 锁底座

## 背景

Worker lease 和 stale job timeout recovery 已能处理 worker 失联后的恢复判断，但同一 job 在生产 worker 并发消费时还缺少独占所有权底座。后续接入 BullMQ attempts、高可用调度或持久化锁前，需要先冻结最小领域契约。

## 变化

- 新增 worker job lock 领域类型和内存 repository。
- 同一 job 的 active 且未过期 lock 同时只能归一个 worker。
- 支持 owner heartbeat 延长 lock，支持过期 lock 被新 worker takeover。
- 非 owner worker heartbeat 或 release 会被拒绝并返回可读原因。
- 本切片只改变 lock 状态，不执行 runtime、不改变 job 状态、不 enqueue/retry/cancel/apply。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化，未修改 `dist/**`。

## 验证

- `npx openspec validate add-worker-job-lock --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-worker-reliability.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
