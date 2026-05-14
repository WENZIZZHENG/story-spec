---
change_type: minor
scope: server,docs
---

# 协作正典 PostgreSQL repository

## CLI 行为

- `storyspec server` 在 `STORYSPEC_DATABASE_URL` 启用时会把数据库协作 repository 传入 multiuser server。

## 多用户控制面

- PostgreSQL-backed multiuser server 现在可以持久化协作 proposal、review decision、canon patch 和 apply request。
- `/ready.repositories.collaboration` 可随数据库 repository wiring 报告为 configured。

## 模板契约

- 无模板生成产物变化。

## 生成产物

- 不手工修改 `dist/**`。

## 数据库

- 多用户 migration version 升至 2。
- 新增 `collaboration_proposals`、`collaboration_review_decisions`、`collaboration_canon_patches`、`collaboration_apply_requests` 表。
- 嵌套领域字段使用 `jsonb` 保存，保持现有协作正典领域对象形状。

## 边界

- 不实现真实文件 apply executor。
- 不实现评论线程持久化、通知、活动流或 UI。
- 不引入 ORM 或新的数据库抽象层。

## 验证

- `npx openspec validate add-collaboration-canon-postgres-repository --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-database.test.ts tests/unit/multiuser-postgres-driver.test.ts tests/unit/multiuser-server-command.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
