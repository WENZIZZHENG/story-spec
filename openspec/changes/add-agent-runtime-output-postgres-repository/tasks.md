## S. 共享契约

- [x] S.1 `agent_runtime_outputs` 必须记录 preview-only output record，不保存正式 apply 结果。
- [x] S.2 migration version 必须提升，并包含可重复建表 SQL。
- [x] S.3 database repository 必须支持保存 output record 和按 job 查询。

## P. 实现任务

- [x] P.1 为 schema/migration 增加红灯测试。
  - May edit: `tests/unit/multiuser-database.test.ts`, `tests/unit/multiuser-postgres-driver.test.ts`
  - Validation: `npx vitest run tests/unit/multiuser-database.test.ts tests/unit/multiuser-postgres-driver.test.ts -t "runtime output"`

- [x] P.2 为 database repository 增加红灯测试。
  - May edit: `tests/unit/multiuser-database.test.ts`
  - Validation: `npx vitest run tests/unit/multiuser-database.test.ts -t "runtime output"`

- [x] P.3 实现 schema、migration version 和 repository。
  - May edit: `src/server/db/schema.ts`, `src/server/db/repositories.ts`
  - Validation: `npx vitest run tests/unit/multiuser-database.test.ts tests/unit/multiuser-postgres-driver.test.ts`

- [x] P.4 同步 changeset 和 roadmap。
  - May edit: `changes/2026-05-16-agent-runtime-output-postgres-repository.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-agent-runtime-output-postgres-repository --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-database.test.ts tests/unit/multiuser-postgres-driver.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [x] V.6 创建本地中文 commit，不 push。
