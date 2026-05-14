---
change_type: minor
scope: server,docs
---

# 协作正典合并协议首批底座

## CLI 行为

- 无新增 CLI 命令。

## 多用户控制面

- 新增协作正典合并领域模型，覆盖 proposal、comment thread、review decision、apply request、canon patch 和 version snapshot。
- 首批只提供内存 repository 和服务函数，不接 HTTP API。

## 模板契约

- 无模板生成产物变化。

## 生成产物

- 不手工修改 `dist/**`。

## 协作正典协议

- Proposal 必须记录 actor、project、story、target resource version、source refs、summary、risks 和状态。
- Apply request 会检查审批或作者显式确认、target version、blocking risks、source refs、patch 和 rollback hint。
- 冲突或审批不足时保持 blocked，并返回面向 UI 的 blocked reasons。

## 边界

- 不实现实时协同、富文本编辑器、评论/审批 UI 或通知。
- 不接 PostgreSQL migration，不提供 HTTP API。
- 不自动写正式 story、chapter、canon 或 tracking 文件。

## 验证

- `npx openspec validate add-collaboration-canon-merge-protocol --strict --json --no-interactive`
- `npx vitest run tests/unit/collaboration-canon-merge.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
