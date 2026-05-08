## Why

多用户路线已经有 session、安全、项目隔离、job、审计、配额和 server 入口底座，但这些能力现在还停留在内存 repository 级别。要让后续 HTTP API、权限守卫、作业控制面和审计追溯真正可用，必须先固定 PostgreSQL 元数据模型和迁移入口。

## What Changes

- 新增多用户数据库 schema 的最小模型：用户、会话、项目、成员、作业、审计、配额。
- 新增 migration 目录和初始化脚本骨架。
- 新增 repository 接口的数据库实现边界定义。
- 新增 unit test 和迁移 smoke，锁定 schema 字段和初始化行为。

## Non-goals

- 不接真实登录 UI。
- 不接 Fastify / HTTP middleware。
- 不引入业务层直接拼 SQL。
- 不做复杂多租户组织模型，第一版只保留 owner/member 基础角色。

## Impact

影响 `src/server/db/*`、`migrations/*`、`tests/unit/*db*`、`tests/smoke/*db*`、changeset 和多用户路线图。

## Capabilities

- `multiuser-database-foundation`
