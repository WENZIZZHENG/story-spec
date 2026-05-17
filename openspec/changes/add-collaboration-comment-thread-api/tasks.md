## S. 共享契约

- [x] S.1 proposal 评论必须记录 actor、body 和创建时间。
- [x] S.2 评论线程必须可按 proposal 读取。
- [x] S.3 评论 API 不得修改 proposal apply 状态或正式故事文件。

## P. 实现任务

- [x] P.1 为领域、数据库 schema/repository 和 HTTP API 补红测试。
  - May edit: `tests/unit/collaboration-canon-merge.test.ts`, `tests/unit/multiuser-database.test.ts`, `tests/unit/multiuser-server.test.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1-S.3
  - Validation: `npx vitest run tests/unit/collaboration-canon-merge.test.ts tests/unit/multiuser-database.test.ts tests/unit/multiuser-server.test.ts`

- [x] P.2 实现评论线程领域能力。
  - May edit: `src/server/collaboration/canon-merge.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/collaboration-canon-merge.test.ts`

- [x] P.3 持久化评论线程并升级 migration。
  - May edit: `src/server/db/schema.ts`, `src/server/db/repositories.ts`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npx vitest run tests/unit/multiuser-database.test.ts`

- [x] P.4 接入 HTTP API 与审计。
  - May edit: `src/server/http/multiuser-server.ts`
  - Must not edit: `dist/**`
  - Depends on: P.3
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts`

- [x] P.5 同步路线图、changeset 和 OpenSpec 状态。
  - May edit: `docs/tech/collaboration-canon-roadmap.md`, `docs/tech/todo-index.md`, `changes/2026-05-16-collaboration-comment-thread-api.md`, `openspec/changes/add-collaboration-comment-thread-api/tasks.md`
  - Must not edit: `dist/**`
  - Depends on: P.4
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-collaboration-comment-thread-api --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/collaboration-canon-merge.test.ts tests/unit/multiuser-database.test.ts tests/unit/multiuser-server.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `npm test`
- [x] V.6 `git diff --check`
- [ ] V.7 创建本地中文 commit，不 push。
