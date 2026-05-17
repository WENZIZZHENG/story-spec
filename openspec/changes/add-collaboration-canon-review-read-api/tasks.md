## S. 共享契约

- [x] S.1 审阅读 API 必须聚合 proposal、review、patch 和 apply request。
- [x] S.2 读 API 必须允许按 storyId 过滤。
- [x] S.3 读 API 不得执行 apply 或修改正式故事文件。

## P. 实现任务

- [x] P.1 为内存 repository、数据库 repository 和 server GET 行为补红测试。
  - May edit: `tests/unit/collaboration-canon-merge.test.ts`, `tests/unit/multiuser-database.test.ts`, `tests/unit/multiuser-server.test.ts`, `tests/unit/api-contract.test.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1-S.3
  - Validation: `npx vitest run tests/unit/collaboration-canon-merge.test.ts tests/unit/multiuser-database.test.ts tests/unit/multiuser-server.test.ts tests/unit/api-contract.test.ts`

- [x] P.2 实现协作正典审阅读模型与 repository 查询。
  - May edit: `src/server/collaboration/canon-merge.ts`, `src/server/db/repositories.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/collaboration-canon-merge.test.ts tests/unit/multiuser-database.test.ts`

- [x] P.3 接入多用户 HTTP GET 路由和 API contract。
  - May edit: `src/server/http/multiuser-server.ts`, `src/server/http/api-contract.ts`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts tests/unit/api-contract.test.ts`

- [x] P.4 同步路线图、changeset 和 OpenSpec 状态。
  - May edit: `docs/tech/collaboration-canon-roadmap.md`, `docs/tech/todo-index.md`, `changes/2026-05-14-collaboration-canon-review-read-api.md`, `openspec/changes/add-collaboration-canon-review-read-api/tasks.md`
  - Must not edit: `dist/**`
  - Depends on: P.3
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-collaboration-canon-review-read-api --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/collaboration-canon-merge.test.ts tests/unit/multiuser-database.test.ts tests/unit/multiuser-server.test.ts tests/unit/api-contract.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `npm test`
- [x] V.6 `git diff --check`
- [x] V.7 创建本地中文 commit，不 push。
