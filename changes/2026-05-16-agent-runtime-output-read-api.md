---
change_type: minor
scope: server,agent-runtime,api
---

# Runtime 输出只读 API

## 背景

Runtime output record 已能保存到内存和 PostgreSQL repository，但多用户控制面还缺少项目级只读接口。任务中心、候选审阅和后续独立前端需要能按 job 读取 preview-only artifacts/logs，同时继续保持不自动 apply。

## 变化

- 新增 `GET /api/projects/:projectId/jobs/:jobId/output`。
- 复用现有 session/project guard 和 job project guard，避免跨项目读取。
- 返回 `projectId`、`jobId` 和该 job 的 runtime output records。
- 未配置 runtime output repository 时返回空列表，保持控制面可启动。
- 该接口只读，不创建、执行、重试、取消、enqueue 或 apply job。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化，未修改 `dist/**`。

## 验证

- `npx openspec validate add-agent-runtime-output-read-api --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-server.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
