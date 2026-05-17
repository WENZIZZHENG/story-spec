## S. 共享契约

- [x] S.1 定义协作正典 PostgreSQL 表和 migration version 2。
- [x] S.2 保持 repository executor 边界，不引入 ORM。
- [x] S.3 将 PostgreSQL-backed server 接入 collaboration repository。

## P. 实现任务

- [x] P.1 先补 schema/repository/server wiring 单元测试。
  - May edit: `tests/unit/multiuser-database.test.ts`, `tests/unit/multiuser-server-command.test.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1-S.3
  - Validation: `npx vitest run tests/unit/multiuser-database.test.ts tests/unit/multiuser-server-command.test.ts`

- [x] P.2 实现数据库 schema、migration version 和 collaboration repository。
  - May edit: `src/server/db/schema.ts`, `src/server/db/repositories.ts`, `src/server/db/postgres.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-database.test.ts tests/unit/multiuser-postgres-driver.test.ts`

- [x] P.3 接入 server command wiring，并同步路线图和 changeset。
  - May edit: `src/cli/commands/multiuser-server.command.ts`, `docs/tech/collaboration-canon-roadmap.md`, `docs/tech/todo-index.md`, `changes/2026-05-14-collaboration-canon-postgres-repository.md`, `openspec/changes/add-collaboration-canon-postgres-repository/tasks.md`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-collaboration-canon-postgres-repository --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-database.test.ts tests/unit/multiuser-postgres-driver.test.ts tests/unit/multiuser-server-command.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [x] V.6 创建本地中文 commit，不 push。
