## S. 共享契约

- [x] S.1 Dashboard 必须显示 job 状态计数、active 数量和 retryable 数量。
- [x] S.2 Dashboard 必须显示 queue readiness；内存队列可额外显示 pending/ack/failed 数量。
- [x] S.3 Dashboard 是只读 API，不修改 job、queue 或正式故事文件。

## P. 实现任务

- [x] P.1 为 dashboard 聚合和 HTTP GET 补红测试。
  - May edit: `tests/unit/multiuser-server.test.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1-S.3
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts`

- [x] P.2 实现 dashboard 聚合模型。
  - May edit: `src/server/jobs/agent-job.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts`

- [x] P.3 接入多用户 HTTP GET 路由。
  - May edit: `src/server/http/multiuser-server.ts`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts`

- [x] P.4 同步路线图、changeset 和 OpenSpec 状态。
  - May edit: `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `changes/2026-05-14-agent-job-dashboard-read-api.md`, `openspec/changes/add-agent-job-dashboard-read-api/tasks.md`
  - Must not edit: `dist/**`
  - Depends on: P.3
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-agent-job-dashboard-read-api --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-server.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `npm test`
- [x] V.6 `git diff --check`
- [x] V.7 创建本地中文 commit，不 push。
