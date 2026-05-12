## Why

P1-0 已确认完整 App 首版采用“故事驾驶舱居中”，但当前 `storyspec app` 仍是实验性本机工作台，界面仍偏功能堆叠，缺少稳定 App shell、首批页面入口和统一状态语言。后续 API contract 与页面开发需要一个 typed App state 作为共享契约。

## What Changes

- 新增 complete App state contract，把 `ProjectStatus` 映射成故事驾驶舱、页面入口、状态语言、角色能力、空状态和协作侧栏摘要。
- 新增 token-protected `/api/projects/current/app-state` endpoint。
- 重设计本机 App shell 为“工作室控制台”，首批入口包含项目/工作区、故事驾驶舱、章节与写作、候选与正典、任务中心。
- 保留现有本机项目打开/创建、章节、候选和任务 API，不新增绕过 preview / confirm / apply 的写入能力。

## Non-goals

- 不实现云端账号、真实多人实时协作、富文本编辑器、计费、公开社区或完整 SaaS。
- 不引入 Vite/React/Tailwind 构建链。
- 不修改 `dist/**`。
- 不把 Agent 或团队建议直接写入正典。

## Impact

影响 `src/app-server`、local app 单元测试、产品路线图、changeset 和 OpenSpec 记录。`storyspec app` 的本机体验会更接近完整 App 的首版结构，但仍不是云端多人平台。

## Capabilities

- `complete-app-story-cockpit-first-slice`
