---
change_type: minor
scope: web,ux
---

# Web 错误边界 UI 首片

## 背景

独立 Web shell 已具备页面、权限、构建和本地预览入口，但还缺少统一错误边界。多人 App 中的会话失效、权限不足、服务离线、流程阻塞和内容冲突需要展示清晰原因与下一步。

## 变化

- 在 `apps/web` shell contract 中新增 `errorBoundary`。
- 覆盖 `unauthorized`、`forbidden`、`offline`、`blocked` 和 `conflict` 错误状态。
- 每个状态包含 label、message、nextAction、severity 和 retryable。
- HTML 渲染新增错误边界 section，只展示状态和下一步，不自动 retry、logout、apply 或修改权限。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

`apps/web/dist/**` 仍是生成物，不手工编辑，不提交。

## 验证

- `npx openspec validate add-web-error-boundary --strict --json --no-interactive`
- `npx vitest run tests/unit/independent-web-app-shell.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
