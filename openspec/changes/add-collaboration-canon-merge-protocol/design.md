# 协作正典合并协议首批设计

## Context

当前 StorySpec 已经形成“候选先预览，正式写入需要确认”的单人工作流。多人平台需要把这条边界提升为可协作、可审计的对象模型：编辑、审稿者和 agent 都可以提出候选，但只有满足审批和版本检查的 apply request 才能进入后续正式 apply。

## Model

- `CollaborationProposal`
  - 候选内容的统一对象，可来自作者、编辑、审稿者或 agent job。
  - 绑定 project/story/target、source、summary、target version 和 risk list。
- `CommentThread`
  - 锚定 proposal、story、chapter、task 或 canon fact。
  - 只保存评论元数据和摘要，不修改正文。
- `ReviewDecision`
  - reviewer 对 proposal 的 approve/request-changes/reject/defer 决定。
  - 作者决定或足够审批后才能创建可继续的 apply request。
- `ApplyRequest`
  - 把 proposal 转成待应用请求，包含 reviewer ids、blocked reasons、patch ids 和状态。
- `CanonPatch`
  - 描述目标路径、patch kind、diff summary、rollback hint 和 source refs。
- `VersionSnapshot`
  - 描述 target resource version、story stage、canon fact ids 和 task state，用于冲突检测。

## State Machine

- proposal: `draft -> ready-for-review -> changes-requested -> approved -> apply-requested -> applied`
- proposal 可被 `rejected` 或 `deferred` 终止/暂停。
- apply request: `blocked | ready | applied | canceled`
- 首批只允许状态推进，不执行真实文件写入。

## Apply Gate

Apply request 创建时必须检查：

- proposal 已 approved 或 actor 是 author 并显式确认。
- 至少有一个 approval，除非 actor 是 author。
- target version 未变化。
- 没有 blocking risk。
- proposal source refs、patch 和 rollback hint 存在。

任何失败都会创建 blocked apply request，并保留原因，方便 UI 告诉用户下一步。

## Boundary

本切片只建立协议底座。后续 HTTP API、PostgreSQL repository、UI 评论线程、活动流和真实 apply 执行必须另开 OpenSpec。
