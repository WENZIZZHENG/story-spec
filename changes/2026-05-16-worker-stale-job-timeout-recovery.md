---
change_type: minor
scope: worker,reliability
---

# Stale Worker Job Timeout 恢复执行器

## 背景

Worker lease recovery plan 已能识别 stale worker 上仍处于 `running` 的 job，但这些 job 仍可能长期卡住。需要一个保守恢复执行器，把受影响 job 转为 `timeout` 并记录 failure，供 dashboard 和人工 retry 使用。

## 变化

- 新增 `recoverStaleWorkerJobs()`。
- 复用 stale worker recovery plan，只处理 affected running jobs。
- 将受影响 job 从 `running` 转为 `timeout`，写入 `WORKER_LEASE_EXPIRED`。
- 记录 `queue-failed` worker failure record，保留 retryable/dead-letter 分类。
- 不自动 retry、不重入队、不执行 runtime、不 apply 正文或正典。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化，未修改 `dist/**`。

## 验证

- `npx openspec validate add-worker-stale-job-timeout-recovery --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-worker-reliability.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
