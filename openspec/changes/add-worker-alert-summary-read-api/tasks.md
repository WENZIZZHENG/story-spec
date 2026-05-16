## S. 共享契约

- [x] S.1 定义 worker alert summary 读模型。
- [x] S.2 新增 `GET /api/projects/:projectId/jobs/alerts` 只读接口。
- [x] S.3 保持边界：不自动 retry、不推送外部告警、不实现 HA。

## P. 实现任务

- [x] P.1 为 worker alert summary 补红测试。
  - May edit: `tests/unit/multiuser-worker-reliability.test.ts`
  - Validation: `npx vitest run tests/unit/multiuser-worker-reliability.test.ts -t "alert summary"`

- [x] P.2 实现 `buildWorkerAlertSummary()`。
  - May edit: `src/server/workers/worker-reliability.ts`
  - Validation: `npx vitest run tests/unit/multiuser-worker-reliability.test.ts`

- [x] P.3 为 HTTP alerts endpoint 补红测试。
  - May edit: `tests/unit/multiuser-server.test.ts`
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts -t "worker alerts"`

- [x] P.4 接入多用户 server 只读接口。
  - May edit: `src/server/http/multiuser-server.ts`
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts -t "worker alerts"`

- [x] P.5 同步 changeset、roadmap 和 tasks 状态。
  - May edit: `changes/2026-05-16-worker-alert-summary-read-api.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-worker-alert-summary-read-api --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-worker-reliability.test.ts tests/unit/multiuser-server.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [x] V.6 创建本地中文 commit，不 push。
