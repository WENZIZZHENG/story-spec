---
change_type: minor
scope: multiuser,worker
---

# 增加 agent job dashboard 读 API

## 背景

多人平台已有 job 控制面、队列底座和 worker 失败策略，但完整 App 的任务中心仍缺少聚合运行态。

## 变化

- 新增项目级 agent job dashboard 聚合模型。
- 新增 `GET /api/projects/:projectId/jobs/dashboard`。
- Dashboard 返回状态计数、active job 数量、retryable job 数量、最新 job、queue readiness 和内存队列快照计数。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

不手工修改 `dist/**`；构建产物由 `npm run build` 生成。

## 验证

- `npx openspec validate add-agent-job-dashboard-read-api --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-server.test.ts`
