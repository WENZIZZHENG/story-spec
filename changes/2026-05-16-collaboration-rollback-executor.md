---
change_type: minor
scope: multiuser,collaboration,database
---

# 协作正典 rollback executor

## 背景

协作正典 apply executor 已能把 ready apply request 写入项目文件，但原先只有 `rollbackHint` 文案，缺少可执行回滚路径。多人在线写作平台需要让高影响内容既可应用，也能在作者确认后可审计地撤回。

## 变化

- 新增 `executeRollbackRequest`，仅允许回滚 `applied` 状态的 apply request。
- `CanonPatch` 新增 `rollbackContent`，rollback executor 只写入明确提供的回滚内容，不从 diff 或 hint 推断旧内容。
- `ApplyRequest` 和 proposal 新增 `rolled-back` 状态；apply request 记录 `rolledBackAt`。
- 新增 HTTP `POST /api/projects/:projectId/collaboration/proposals/:proposalId/apply-requests/:applyRequestId/rollback`，复用 `apply-canon-change` 权限、项目 storage 路径防越界和 audit log。
- PostgreSQL migration 升级到 v5，patch 表新增 `rollback_content`，apply request 表新增 `applied_at` 和 `rolled_back_at`。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化，未修改 `dist/**`。

## 验证

- `npx.cmd openspec validate add-collaboration-rollback-executor --strict --json --no-interactive`
- `npx.cmd vitest run tests/unit/collaboration-canon-merge.test.ts tests/unit/multiuser-database.test.ts tests/unit/multiuser-postgres-driver.test.ts tests/unit/multiuser-server.test.ts`
