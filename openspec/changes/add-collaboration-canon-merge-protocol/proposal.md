## Why

多人在线写作平台的核心风险不是多人同时编辑，而是候选内容、agent 输出、评论和审批如何进入正典。当前已有 preview/apply、draft promote dry-run、audit 和 agent job preview-only，但缺少统一的 collaboration object 模型来表达 proposal、comment thread、review decision、apply request、canon patch 和 version snapshot。

## What Changes

- 新增协作正典合并领域模型，定义候选 proposal、评论线程、review decision、apply request、canon patch、version snapshot 和状态机。
- 新增内存 repository 与服务函数，用于创建 proposal、追加评论、提交审批决定、创建 apply request、执行 apply gate 校验。
- 增加冲突检测输入：target resource version、canon fact ids、story stage 和 blocking risks；冲突或审批不足时只能保持 blocked，不写正式故事文件。
- 同步路线图和 changeset，明确这只是协议底座，不实现实时编辑、HTTP API、UI 或真实文件 apply。

## Non-goals

- 不实现 Yjs/CRDT、富文本编辑器或实时协同编辑。
- 不把 CRDT 文档或 agent 输出直接当作正典。
- 不接 HTTP API、不写 PostgreSQL migration、不修改正式 story/content/canon 文件。
- 不实现通知、活动流 UI 或完整评论产品。

## Impact

影响 `src/server/collaboration/*`、unit tests、路线图、changeset 和 OpenSpec 记录。该变更为后续评论审批 UI、apply request API 和正典 patch 执行器提供最小稳定模型。

## Capabilities

- `collaboration-canon-merge`
