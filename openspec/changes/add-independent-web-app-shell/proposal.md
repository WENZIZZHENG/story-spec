## Why

完整 App 已有本机 shell 和前端架构契约，但还没有独立前端项目目录。继续把所有 UI 都放在 `src/app-server/local-app-html.ts` 会让后续登录态、权限 UI、协作审阅和 E2E 难以拆分。需要先建立一个轻量、可测试、不会破坏本机 fallback 的独立 web shell。

## What Changes

- 新增 `apps/web/` 独立前端目录。
- 提供零新增依赖的静态 App shell、TypeScript contract 和 API client skeleton。
- 复用完整 App route/API/status contract 的页面语言，先覆盖项目与工作区、故事驾驶舱、章节与写作、候选与正典审阅、任务中心。
- 新增单元测试保护独立 web shell 的路由、API base、token header、preview/apply 边界和本机 fallback 边界。

## Non-goals

- 不引入 React/Vite/Next/Tailwind 或大型前端框架。
- 不接真实浏览器打包发布流程。
- 不替换 `storyspec app` 本机 shell。
- 不实现登录、权限管理、富文本编辑器、实时协作或 E2E。

## SDD 分级

standard。该切片新增独立前端项目边界和可测试契约，但不改变 server 行为、CLI 行为或构建发布链。

## Impact

影响 `apps/web/*`、unit tests、OpenSpec、changeset 和 roadmap 文档。根 `npm run build` 不编译 `apps/web`，本切片通过专门测试保护契约。

## Capabilities

- `independent-web-app-shell`
