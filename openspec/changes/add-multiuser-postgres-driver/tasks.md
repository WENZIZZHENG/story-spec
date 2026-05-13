## S. 共享契约

- [x] S.1 使用 `pg` 薄 driver，不引入 ORM。
- [x] S.2 repository 继续依赖 `MultiuserDatabaseExecutor`。
- [x] S.3 migration runner 必须可重复执行。
- [x] S.4 `/ready` 必须区分数据库 configured/connected/migrated 状态。
- [x] S.5 保持边界：不实现 Redis worker、完整前端或生产 rollback。

## P. 实现任务

- [x] P.1 新增 PostgreSQL executor、migration runner 和 readiness 测试。
  - May edit: `tests/unit/multiuser-postgres-driver.test.ts`, `src/server/db/postgres.ts`, `src/server/db/migrations.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1-S.4
  - Validation: `npx vitest run tests/unit/multiuser-postgres-driver.test.ts`

- [x] P.2 更新 multiuser server readiness contract。
  - May edit: `src/server/http/multiuser-server.ts`, `tests/unit/multiuser-server.test.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts`

- [x] P.3 将 `storyspec server` 接到 PostgreSQL repository 配置。
  - May edit: `src/cli/commands/multiuser-server.command.ts`, `tests/unit/multiuser-server-command.test.ts`, `package.json`, `bun.lock`
  - Must not edit: `dist/**`
  - Depends on: P.1-P.2
  - Validation: `npm run build && npx vitest run tests/unit/multiuser-server-command.test.ts`

- [x] P.4 同步部署文档、changeset 和路线图状态。
  - May edit: `docker-compose.yml`, `.env.example`, `docs/deploy/self-hosted.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `changes/2026-05-13-multiuser-postgres-driver.md`, `openspec/changes/add-multiuser-postgres-driver/tasks.md`
  - Must not edit: `README.md`, `dist/**`
  - Depends on: P.1-P.3
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-multiuser-postgres-driver --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-postgres-driver.test.ts tests/unit/multiuser-server.test.ts tests/unit/multiuser-server-command.test.ts tests/unit/multiuser-database.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [ ] V.6 创建本地中文 commit，不 push。
