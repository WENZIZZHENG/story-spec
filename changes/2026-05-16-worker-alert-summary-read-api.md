---
change_type: minor
scope: multiuser,worker,observability
---

# Worker 告警摘要只读接口

## 背景

任务中心已有 job dashboard 和单 job 日志，worker failure 也已有 retryable / dead-letter 分类记录，但完整 App 仍缺少一个项目级告警摘要来说明哪些失败需要人工处理、哪些可以手动 retry、队列是否可用。

## 变化

- 新增 `buildWorkerAlertSummary()`，基于项目 jobs、worker failure records、queue readiness 和 queue snapshot 生成只读告警摘要。
- 新增 `GET /api/projects/:projectId/jobs/alerts`，复用 session 和项目访问守卫。
- 告警项包含 severity、category、jobId、failureId、reason、recommendedAction、traceId 和 createdAt。
- 该接口不会创建、取消、重试、入队或执行 job。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化，未修改 `dist/**`。

## 验证

- `npx openspec validate add-worker-alert-summary-read-api --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-worker-reliability.test.ts tests/unit/multiuser-server.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
