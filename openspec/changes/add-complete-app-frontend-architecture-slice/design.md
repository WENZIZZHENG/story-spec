# 完整 App 前端架构首批切片设计

## Context

P1-0 已确认“作者 + 团队平衡”和“故事驾驶舱居中”。P1-2 已冻结 API contract，P1-3/P1-4 已补 PostgreSQL 与 worker 底座。当前最大前端风险不是缺少视觉调色，而是缺少可复用的页面/端点/状态契约：`local-app-html.ts` 同时承担样式、结构、脚本和产品事实，后续独立前端很难复用。

## Scope

本切片建立 `CompleteAppFrontendArchitecture` 契约，先覆盖首批页面：

- 项目与工作区
- 故事驾驶舱
- 章节与写作
- 候选与正典审阅
- 任务中心

契约描述每个页面的 route、label、purpose、primary API endpoints、required permission language 和 empty/error states。shell 可以从契约渲染导航与 endpoint map，未来独立前端可以直接复用同一事实源。

## Architecture

- `src/app-server/app-frontend-architecture.ts`
  - 纯函数 `buildCompleteAppFrontendArchitecture()`，不读写文件。
  - 输出 routes、apiClient、stateLanguage、writeBoundary 和 implementationBoundary。
  - 保持中文用户文案，技术字段稳定。
- `src/app-server/local-app-html.ts`
  - 继续作为零依赖本机 fallback。
  - 引入架构契约，用于渲染页面导航、页面地图和 endpoint map。
  - 保留现有 API wiring，不引入大型前端框架。
- Tests
  - 新增契约测试，校验首批页面、token header、状态语言和边界。
  - 扩展 HTML 测试，确保 shell 从契约暴露页面导航和 API map。

## UX Rules

- 页面入口必须是任务导向，不用技术词解释用户该做什么。
- 错误状态必须说明下一步：未打开项目、权限不足、离线、流程阻塞、冲突。
- 候选、预览、dry-run、apply、canon 必须继续可区分。
- 控件保持可键盘访问、按钮和输入保持可读尺寸，不引入装饰性营销 hero。

## Risks

- 只抽契约不重构 HTML，短期仍会保留大文件。
- 独立前端栈仍需后续 OpenSpec 决策。
- 当前切片不解决实时协作或富文本编辑器。
