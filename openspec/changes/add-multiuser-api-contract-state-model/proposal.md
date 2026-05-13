## Why

P1-0 已经把完整 App 首批页面和本机故事驾驶舱状态落成，但多人在线平台仍缺少给未来前端、server 和测试共同使用的 API contract。若直接进入真实 PostgreSQL、worker 或完整前端开发，项目列表、故事工作台、章节入口、候选审阅、任务中心和成员权限页面会继续临时拼字段，后续返工成本高。

## What Changes

- 新增多人平台 API contract state model，定义统一响应 envelope、错误码、权限决策对象、资源版本、分页和 warning 字段。
- 定义首批完整 App 页面到 API endpoint 的契约映射，覆盖项目列表、故事驾驶舱、章节与写作、候选与正典、任务中心和成员权限。
- 新增 contract fixtures，覆盖 success、empty、unauthorized、forbidden、conflict、blocked、offline 等前端关键状态。
- 增加 API contract tests，保护 server 和未来 web client 的共享字段。

## Non-goals

- 不实现完整前端 App。
- 不接真实 PostgreSQL driver、Redis/BullMQ worker 或 OpenHands 真实执行。
- 不引入 OpenAPI generator、大型 API framework 或新构建链。
- 不改变 `storyspec app` 本机工作室 shell 的运行行为。

## Impact

影响 `src/server/http/*`、contract fixtures、unit tests、changeset 和路线图状态。该变更为后续 P1-3 真实数据库、P1-4 worker、P1-5 完整前端架构提供字段契约，但不表示多人在线平台已经完成。

## Capabilities

- `multiuser-api-contract-state-model`
