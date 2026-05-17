## Why

协作正典协议、只读审阅面板、评论线程、项目活动流、apply executor 和 rollback executor 已经完成首批后端底座，但完整 App 的本机 shell 仍只展示候选大纲级别的“候选与正典”。作者和审稿者还缺一个稳定 UI contract 来理解 proposal、review、patch、apply request、评论和活动流之间的关系。

## What Changes

- 新增协作正典审阅 UI contract，定义候选、审批、patch、apply request、评论、活动流和回滚的首批可见区块。
- 扩展 complete App frontend architecture，把已存在的协作正典 HTTP endpoints 加入 `canon-review` route 的 API map，并标注 read-only、preview、apply-confirmed 等边界。
- 更新本机 App shell 的“候选与正典”区域，展示协作正典审阅台、状态列和 apply / rollback 二次确认边界。

## Non-goals

- 不实现独立 React/Vite 前端项目。
- 不实现实时协作、通知偏好、富文本编辑器或评论行内锚点 UI。
- 不让本机 shell 直接执行多用户 server 的 apply / rollback；本切片只暴露可读 UI contract 和入口语言。

## Impact

影响 `src/app-server/app-frontend-architecture.ts`、`src/app-server/local-app-html.ts`、相关 unit tests、路线图、changeset 和 OpenSpec 记录。后续独立前端可以复用本 contract 继续实现真实页面。

## Capabilities

- `collaboration-canon-review-ui`
