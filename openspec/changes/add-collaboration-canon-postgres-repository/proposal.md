## Why

协作正典 HTTP 控制面已经可以创建 proposal、review decision、canon patch 和 apply request，但当前 server wiring 只能接收外部传入的 repository；PostgreSQL-backed `storyspec server` 还没有协作 repository，导致真实多用户部署中协作候选无法跨进程或重启保留。

## What Changes

- 扩展多用户数据库 schema 和 migration plan，新增协作 proposal、review decision、canon patch、apply request 表。
- 在 `createMultiuserDatabaseRepositories` 中新增 `collaboration` repository，实现现有 `CollaborationCanonRepository` 接口。
- 将 `storyspec server` PostgreSQL wiring 接入 collaboration repository，让 `/ready.repositories.collaboration` 在数据库连接启用时为 true。
- 补充单元测试、OpenSpec、changeset 和路线图状态。

## Non-goals

- 不实现真实文件 apply executor。
- 不实现评论线程持久化、通知、活动流或 UI。
- 不引入 ORM 或改变现有 repository executor 边界。
- 不做真实 PostgreSQL 容器集成测试；本切片用 executor 边界单测覆盖 SQL 和映射。

## Impact

影响 `src/server/db/*`、`src/cli/commands/multiuser-server.command.ts`、数据库相关单元测试、server command 测试、changeset 和路线图。该变更让协作正典 API 可以被 PostgreSQL-backed server 使用。

## Capabilities

- `collaboration-canon-postgres-repository`
