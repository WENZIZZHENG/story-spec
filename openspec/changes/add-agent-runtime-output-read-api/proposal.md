## Why

Runtime output records 已能保存在 PostgreSQL repository 中，但多用户控制面还没有项目级只读 API 让前端查看 job 的 preview artifacts/logs。任务中心和后续独立前端需要先能读取这些候选产物。

## What Changes

- 新增 `GET /api/projects/:projectId/jobs/:jobId/output`。
- 复用 session/project guard 和 job project guard。
- 返回 jobId、projectId 和 preview-only output records。

## Non-goals

- 不新增 mutation API。
- 不自动 apply runtime output。
- 不新增独立前端 UI。
- 不改变 worker 执行路径。

## SDD 分级

standard。该切片新增公共 HTTP 只读接口和可观察响应契约，但不修改数据库 schema 或调度架构。

## Impact

影响 `src/server/http/multiuser-server.ts`、server unit tests、OpenSpec、changeset 和 roadmap 文档。

## Capabilities

- `agent-runtime-output-read-api`
