# add-collaboration-apply-executor

## 背景

协作正典已经具备 proposal、review、patch、apply request、评论线程、审阅面板和活动流，但 ready apply request 目前仍停留在“等待作者确认 apply”的状态。完整多人在线写作平台需要一个最小真实 apply executor，让作者确认后的候选能够可审计地写入项目文件，同时继续守住项目路径、权限和来源追踪边界。

## 目标

- 为 ready apply request 增加真实执行能力。
- Canon patch 增加明确 `content`，executor 只写入 patch 提供的内容，不推断 diff。
- 执行成功后把 apply request 标记为 `applied`，proposal 标记为 `applied`。
- 提供 HTTP `POST /api/projects/:projectId/collaboration/proposals/:proposalId/apply-requests/:applyRequestId/apply`。
- HTTP executor 使用项目 `dataRoot` 做路径解析，禁止越界写入，并记录 audit log。

## 非目标

- 不实现三方 merge、行级 patch、CRDT 合并或部分应用。
- 不实现 rollback 执行；本批只要求每个 patch 有 rollback hint。
- 不允许 agent job 自动触发 apply；仍需要有 `apply-canon-change` 权限的用户调用。

## 影响范围

- `src/server/collaboration/canon-merge.ts`
- `src/server/db/schema.ts`
- `src/server/db/repositories.ts`
- `src/server/http/multiuser-server.ts`
- `tests/unit/*`
- `docs/tech/*`
