---
change_type: minor
scope: collaboration,multiuser
---

# 增加协作正典 apply executor

## 背景

协作正典已有候选、审批、patch 和 apply request，但 ready apply request 仍不能真实写入项目文件。完整多人在线写作平台需要一个受权限、路径和审计保护的最小执行器。

## 变化

- `CanonPatch` 新增 `content`，用于存放 executor 可写入的明确内容。
- `collaboration_canon_patches` 新增 `content` 字段，multiuser migration 升级到 v4。
- 新增 `executeApplyRequest`，只执行 `ready` apply request，并要求 patch 具备 content 与 rollback hint。
- 新增 `POST /api/projects/:projectId/collaboration/proposals/:proposalId/apply-requests/:applyRequestId/apply`。
- HTTP apply 使用项目 `dataRoot` 解析 patch target path，禁止越界，并记录 `collaboration.apply.execute` audit。
- 更新协作正典路线图和待办入口，标记真实 apply executor 首批切片已完成。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化；未修改 `dist/**`。

## 验证

- `npx.cmd openspec validate add-collaboration-apply-executor --strict --json --no-interactive`
- `npx.cmd vitest run tests/unit/collaboration-canon-merge.test.ts tests/unit/multiuser-database.test.ts tests/unit/multiuser-postgres-driver.test.ts tests/unit/multiuser-server.test.ts`
- `npm.cmd run build`
- `npm.cmd run check:changes`
- `npm.cmd test`
- `git diff --check`
