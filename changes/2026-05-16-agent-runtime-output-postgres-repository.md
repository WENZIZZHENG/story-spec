---
change_type: minor
scope: database,agent-runtime,worker
---

# Runtime 输出记录 PostgreSQL Repository

## 背景

Runtime output record 已有内存底座，但自托管 worker 还不能把 preview-only 输出记录落到 PostgreSQL。后续 job output API、前端审阅和长期可观测性需要真实 database repository。

## 变化

- 新增 `agent_runtime_outputs` migration table。
- 将多用户 migration version 提升到 6。
- `createMultiuserDatabaseRepositories()` 新增 `runtimeOutputs` repository，支持保存 output record 和按 job 查询。
- artifacts/logs 以 `jsonb` 保存，保持 preview-only，不自动 apply。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化，未修改 `dist/**`。

## 验证

- `npx openspec validate add-agent-runtime-output-postgres-repository --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-database.test.ts tests/unit/multiuser-postgres-driver.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
