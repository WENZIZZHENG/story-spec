---
change_type: minor
scope: server,deploy
---

# 多人平台 PostgreSQL Driver 与迁移执行

## CLI 行为

- `storyspec server` 现在会在配置 `STORYSPEC_DATABASE_URL` 时创建 PostgreSQL connection pool，并把 session/project/job/audit/quota repository 接到真实数据库 executor。
- 新增 `STORYSPEC_DATABASE_MIGRATE` 开关，默认执行多人平台 schema migration；设置为 `false` 时只连接数据库，不自动迁移。
- `/ready` 新增 `database.configured`、`database.connected`、`database.migrated` 字段，用于区分进程存活和数据库 readiness。

## 模板契约

- 无 agent prompt、slash command 模板或用户项目初始化模板变化。

## 生成产物

- 新增 `pg` runtime dependency 和 `@types/pg` dev dependency。
- 新增 PostgreSQL executor、migration runner、readiness probe 和 CLI wiring 单测。
- 更新自托管说明，明确 PostgreSQL-backed server 已可配置，但 Redis/BullMQ worker 和完整前端仍未完成。

## 验证

- `npx openspec validate add-multiuser-postgres-driver --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-postgres-driver.test.ts tests/unit/multiuser-server.test.ts tests/unit/multiuser-server-command.test.ts tests/unit/multiuser-database.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
