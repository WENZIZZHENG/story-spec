---
change_type: minor
scope: server,db,docs
---

# 多用户数据库基础

## CLI 行为

- 无用户可见 CLI 行为变化；本批次只新增 server 端数据库基础模块。

## 模板契约

- 无用户可见模板契约变化。

## 生成产物

- 新增 `src/server/db/schema.ts`，定义多用户元数据表：users、sessions、projects、memberships、agent_jobs、audit_logs、quota_buckets。
- 新增 `src/server/db/migrations.ts`，导出可重复执行的多用户 migration 计划。
- 新增 `src/server/db/repositories.ts`，提供现有 session、project、job、audit、quota repository 接口的数据库 executor 适配层。

## 验证

- `npx vitest run tests/unit/multiuser-database.test.ts`
- `npm run build`
