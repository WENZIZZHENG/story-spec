## Why

`storyspec app` 已有工作室控制台 shell，但页面入口、API 调用、权限/错误状态和前端承载层仍散落在一个巨大 HTML 字符串里。继续往多人在线写作平台推进时，如果不先抽出前端架构契约，后续独立前端、E2E、权限 UI 和视觉重设计都会重复理解同一批页面。

## What Changes

- 新增完整 App 前端架构契约，定义首批页面路由、导航分组、API client 端点、token header、加载/空/错误/权限状态和 preview/confirm/apply 文案边界。
- 让本机 App shell 从该契约渲染主要页面导航和 API endpoint map，避免页面事实只存在于手写 HTML。
- 为契约和 shell 增加单元测试，保护项目列表、故事驾驶舱、章节写作、候选与正典、任务中心这批页面入口。
- 同步路线图、README/部署边界和 changeset，继续说明这只是完整 App 前端承载层第一步，不是完整 SaaS、富文本或实时协作。

## Non-goals

- 不在本切片引入 React/Vite/Next 或完整独立前端项目。
- 不实现富文本编辑器、实时协同、评论流、通知中心或成员权限 UI。
- 不改变 preview / confirm / apply 门禁，不让候选自动写入正式故事。
- 不把本机 App 宣称为完整多人在线 SaaS。

## Impact

影响 `src/app-server/*`、本机 App HTML 单元测试、前端架构契约测试、路线图、README/部署文档、changeset 和 OpenSpec 记录。该变更为 P1-5 后续独立前端和视觉重设计提供稳定输入。

## Capabilities

- `complete-app-frontend-architecture`
