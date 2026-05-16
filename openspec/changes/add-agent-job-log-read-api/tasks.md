## S. 共享契约

- [x] S.1 Job log 必须包含 projectId、jobId 和按时间排序的 entries。
- [x] S.2 Log entry 必须表达 job 创建、当前状态和失败原因。
- [x] S.3 Log API 必须校验项目成员权限和 job/project 归属。
- [x] S.4 Log API 是只读接口，不修改 job、queue 或 runtime。

## P. 实现任务

- [x] P.1 为 job log read model 和 HTTP GET 补红测试。
  - May edit: `tests/unit/multiuser-agent-job.test.ts`, `tests/unit/multiuser-server.test.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1-S.4
  - Validation: `npx vitest run tests/unit/multiuser-agent-job.test.ts tests/unit/multiuser-server.test.ts`

- [x] P.2 实现 job log read model。
  - May edit: `src/server/jobs/agent-job.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-agent-job.test.ts`

- [x] P.3 接入 HTTP GET 路由。
  - May edit: `src/server/http/multiuser-server.ts`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts`

- [x] P.4 同步路线图、changeset 和 OpenSpec 状态。
  - May edit: `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `changes/2026-05-16-agent-job-log-read-api.md`, `openspec/changes/add-agent-job-log-read-api/tasks.md`
  - Must not edit: `dist/**`
  - Depends on: P.3
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-agent-job-log-read-api --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-agent-job.test.ts tests/unit/multiuser-server.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `npm test`
- [x] V.6 `git diff --check`
- [x] V.7 创建本地中文 commit，不 push。
