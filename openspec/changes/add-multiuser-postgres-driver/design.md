## Driver Boundary

P1-3 只在 `src/server/db/postgres.ts` 增加薄适配层：

- `createPostgresPool(config)`：从 `connectionString` 创建 `pg.Pool`。
- `createPostgresExecutor(pool)`：把 `queryOne/queryMany/execute` 映射到 pool query。
- `runMultiuserMigrations(executor)`：先创建 `schema_migrations`，再按 `MULTIUSER_MIGRATION_VERSION` 执行现有 migration plan，重复运行时跳过已完成版本。
- `checkPostgresReady(executor)`：执行轻量 `select 1 as ok`，返回 `{ configured, connected, migrated, error }`。

业务 repository 继续只依赖 `MultiuserDatabaseExecutor`，不直接导入 `pg`。这样后续集成测试、事务封装或 ORM 评估都不会要求重写 auth/project/job/audit/quota 模块。

## Server Startup

`storyspec server` 读取环境变量：

- `STORYSPEC_DATABASE_URL`：存在时创建 PostgreSQL-backed repository。
- `STORYSPEC_DATABASE_MIGRATE`：默认 `true`；设置为 `false` 时只连接不执行 migration。

如果没有配置数据库，server 保持当前控制面基础能力，`/ready` 显示 database 未配置。配置数据库但连接失败时，启动应失败，避免服务假装 ready。

## Readiness

`/ready` 保留已有 repository 布尔字段，并新增 `database`：

```json
{
  "database": {
    "configured": true,
    "connected": true,
    "migrated": true
  }
}
```

未配置数据库时 `configured=false`；连接或 migration 失败时 `connected=false` 或 `migrated=false`，并提供可读 error。`/health` 仍只代表进程存活。
