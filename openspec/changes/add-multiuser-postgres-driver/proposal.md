## Why

多人平台已有 PostgreSQL schema、migration plan 和 executor-based repository adapter，但 server 仍没有真实 PostgreSQL driver、连接池、migration runner 或数据库 readiness。继续只依赖内存 repository 会让 P1-4 worker 和 P1-5 前端权限态缺少可靠持久化边界。

## What Changes

- 接入 `pg` 作为真实 PostgreSQL driver，提供 connection pool 到 `MultiuserDatabaseExecutor` 的适配。
- 新增可重复 migration runner，按现有 migration plan 执行 schema 语句，并记录 migration version。
- 新增数据库 readiness probe，让 `/ready` 能区分 repository 配置状态和真实 PostgreSQL 连接状态。
- 让 `storyspec server` 在配置 `STORYSPEC_DATABASE_URL` 时使用真实数据库 repository，可选执行 migration。
- 更新 compose、自托管说明、changeset 和路线图状态。

## Non-goals

- 不引入复杂 ORM 或 schema generation 链。
- 不实现生产级 migration rollback。
- 不启动真实 PostgreSQL integration test 容器；本变更用 fake pool/client 验证 driver 边界，真实库验证留给自托管 compose。
- 不实现 Redis/BullMQ worker 或完整前端。

## Impact

影响 `package.json`、`bun.lock`、`src/server/db/*`、`src/server/http/*`、`src/cli/commands/multiuser-server.command.ts`、部署文档、unit tests 和 changeset。该变更让多用户 server 可配置为 PostgreSQL-backed 控制面，但仍不是完整 SaaS。

## Capabilities

- `multiuser-postgres-driver`
