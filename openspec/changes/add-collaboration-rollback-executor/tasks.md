## S. 共享契约

- [x] S.1 Rollback executor 只能执行 `applied` 状态的 apply request。
- [x] S.2 每个被回滚的 patch 必须有 targetPath、rollbackContent 和 rollbackHint。
- [x] S.3 Rollback executor 必须通过项目 storage 解析路径，禁止绝对路径和 `..` 越界。
- [x] S.4 执行成功后 apply request 与 proposal 必须标记为 `rolled-back`。
- [x] S.5 HTTP rollback 必须要求 `apply-canon-change` 权限并写 audit log。

## P. 实现任务

- [x] P.1 为领域 rollback executor、数据库 rollbackContent 和 HTTP rollback 补红测试。
  - May edit: `tests/unit/collaboration-canon-merge.test.ts`, `tests/unit/multiuser-database.test.ts`, `tests/unit/multiuser-postgres-driver.test.ts`, `tests/unit/multiuser-server.test.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1-S.5
  - Validation: `npx vitest run tests/unit/collaboration-canon-merge.test.ts tests/unit/multiuser-database.test.ts tests/unit/multiuser-postgres-driver.test.ts tests/unit/multiuser-server.test.ts`

- [x] P.2 实现协作 rollback executor 领域能力。
  - May edit: `src/server/collaboration/canon-merge.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/collaboration-canon-merge.test.ts`

- [x] P.3 持久化 patch rollbackContent 并升级 migration。
  - May edit: `src/server/db/schema.ts`, `src/server/db/repositories.ts`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npx vitest run tests/unit/multiuser-database.test.ts tests/unit/multiuser-postgres-driver.test.ts`

- [x] P.4 接入 HTTP rollback 路由、项目路径解析和审计。
  - May edit: `src/server/http/multiuser-server.ts`
  - Must not edit: `dist/**`
  - Depends on: P.3
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts`

- [x] P.5 同步路线图、changeset 和 OpenSpec 状态。
  - May edit: `docs/tech/collaboration-canon-roadmap.md`, `docs/tech/todo-index.md`, `changes/2026-05-16-collaboration-rollback-executor.md`, `openspec/changes/add-collaboration-rollback-executor/tasks.md`
  - Must not edit: `dist/**`
  - Depends on: P.4
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-collaboration-rollback-executor --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/collaboration-canon-merge.test.ts tests/unit/multiuser-database.test.ts tests/unit/multiuser-postgres-driver.test.ts tests/unit/multiuser-server.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `npm test`
- [x] V.6 `git diff --check`
- [x] V.7 创建本地中文 commit，不 push。
