---
change_type: minor
scope: app-ui,agent-runtime
---

# Runtime 输出 UI 首批切片

## 背景

Runtime output 已有 preview-only record、PostgreSQL repository 和项目级只读 API，但任务中心 UI 契约还没有展示 artifacts/logs。后续独立前端需要先共享任务中心 output endpoint、preview-only 边界和空/错误状态语言。

## 变化

- 扩展完整 App 前端架构契约，新增 `agent-runtime-output` 只读 endpoint。
- 新增 `runtimeOutput` UI contract，覆盖 Artifacts、Logs、empty state、error state 和 preview-only 边界。
- 本机 shell 的任务中心新增 Runtime 输出预览面板，可按 projectId/jobId 读取 output。
- 保持只读展示，不新增 retry、cancel、enqueue、proposal 创建或 apply 动作。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化，未修改 `dist/**`。

## 验证

- `npx openspec validate add-runtime-output-ui-slice --strict --json --no-interactive`
- `npx vitest run tests/unit/app-frontend-architecture.test.ts tests/unit/local-app-html.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
