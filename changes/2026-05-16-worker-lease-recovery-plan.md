---
change_type: minor
scope: worker,reliability
---

# Worker Lease 恢复计划底座

## 背景

Worker lease/heartbeat 已能识别 stale worker，但还不能把 stale lease 转换成可审计的恢复判断。后续分布式恢复执行器、dashboard 和人工处理流程需要先知道哪些 running job 受 stale worker 影响。

## 变化

- 新增 `buildWorkerLeaseRecoveryPlan()` 领域函数。
- 基于 stale worker lease 和 job repository 生成只读 recovery plan。
- 报告受影响的 running jobs、missing job refs 和已完成/失败/取消等 ignored refs。
- 保持恢复计划非突变：不重入队、不 retry、不 cancel、不 timeout、不执行 job、不 apply 正文或正典。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化，未修改 `dist/**`。

## 验证

- `npx openspec validate add-worker-lease-recovery-plan --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-worker-reliability.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
