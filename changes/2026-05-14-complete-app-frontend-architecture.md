---
change_type: minor
scope: app,docs
---

# 完整 App 前端架构首批契约

## CLI 行为

- `storyspec app` 的本机 Web shell 继续保持零依赖本机 fallback，不引入完整独立前端框架。

## 多用户控制面

- 本变更不修改多用户 server API 行为，只把本机 App 首批页面和 endpoint map 抽成前端可复用契约。

## 模板契约

- 无模板生成产物变化。

## 生成产物

- 不手工修改 `dist/**`。

## App 前端契约

- 新增 `CompleteAppFrontendArchitecture`，定义项目与工作区、故事驾驶舱、章节与写作、候选与正典审阅、任务中心的 route、API endpoint、状态语言和写入边界。
- 本机 App shell 从该契约渲染首批页面导航和前端 API 地图，避免页面事实只存在于 HTML 字符串中。

## 部署

- 自托管说明补充：当前完整 App 前端架构只是本机 shell 可复用的 route/API/status contract，不包含独立前端项目、账号产品流、富文本编辑器或实时协作。

## 边界

- 不实现 React/Vite/Next 独立前端项目。
- 不实现富文本编辑器、实时协同、评论/审批/通知或成员权限 UI。
- 不改变 preview / confirm / apply 门禁。

## 验证

- `npx openspec validate add-complete-app-frontend-architecture-slice --strict --json --no-interactive`
- `npx vitest run tests/unit/app-frontend-architecture.test.ts tests/unit/local-app-html.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
