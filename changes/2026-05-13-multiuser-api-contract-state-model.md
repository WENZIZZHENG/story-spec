---
change_type: minor
scope: server,docs
---

# 多人平台 API Contract 与状态模型底座

## CLI 行为

- 新增多人平台 API contract state model，统一 response envelope、错误码、权限决策、resourceVersion、warnings 和分页字段。
- 新增首批完整 App 页面 endpoint map 的契约表达，用于未来 server 与 web client 共享。

## 模板契约

- 无 agent prompt、slash command 模板或用户项目初始化模板变化。

## 生成产物

- 新增 contract fixtures，覆盖 success、empty、unauthorized、forbidden、conflict、blocked 和 offline 状态。
- 新增 API contract 单测，保护共享字段和错误形状。
- 该变更只是在为后续多人前端、数据库和 worker 提供共享契约，不表示完整多人平台已经完成。

## 验证

- `npx vitest run tests/unit/api-contract.test.ts tests/unit/api-contract-fixtures.test.ts tests/unit/multiuser-server-core.test.ts`
- `npm run check:changes`
- `git diff --check`
