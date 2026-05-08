---
change_type: minor
scope: server,security,docs
---

# 多用户审计与配额底座

## CLI 行为

无变化。未新增或修改 CLI 命令。

## 模板契约

无变化。未修改 agent prompt、slash command 模板或用户项目初始化模板。

## 生成产物

无变化。未手工修改 `dist/` 或命令生成产物。

## Server / Security

- 新增多用户审计 foundation，记录 actor、project、action、source、diffSummary、jobId 和 timestamp。
- 新增多用户配额 foundation，支持 user/project scope 以及 request/job/token metric 的检查和消耗。
- 当前不是计费系统，也未接 HTTP API、数据库、队列或 runtime。

## 验证

- `npx openspec validate add-multiuser-audit-quota-foundation --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-audit-quota.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
