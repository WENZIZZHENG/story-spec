## 设计

本 change 实现审计与配额的最小核心，不接数据库和计费。它提供可替换 repository 接口和内存实现，便于后续迁移到 PostgreSQL。

## Audit

`AuditEvent` 字段：

- `id`
- `actorUserId`
- `projectId`
- `action`
- `source`
- `diffSummary`
- `jobId`
- `createdAt`

`recordAuditEvent()` 负责生成事件、保存并返回事件。第一版只保证结构和可追踪性，不实现不可篡改存储。

## Quota

`QuotaBucket` 字段：

- `id`
- `scopeType`: `user` / `project`
- `scopeId`
- `metric`: `request` / `job` / `token`
- `limit`
- `used`

`checkQuota()` 返回 allowed / blocked；`consumeQuota()` 在未超限时增加 used。超限时返回 blocked 和可读原因。

## 源文件边界

- 新增 `src/server/audit/audit-log.ts`。
- 新增 `src/server/quota/quota.ts`。
- 新增 `tests/unit/multiuser-audit-quota.test.ts`。
- 新增 changeset。
- 不修改 `src/app-server/**`、`dist/**`、package 依赖。
