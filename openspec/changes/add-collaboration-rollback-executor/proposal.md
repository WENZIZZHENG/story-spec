# add-collaboration-rollback-executor

## 背景

协作正典 apply executor 已经能把 ready apply request 写入项目文件，并留下 audit 记录。但一旦作者发现应用后的内容需要撤回，目前只有 `rollbackHint` 文案，没有可执行的回滚路径。完整多人在线写作平台需要把“可应用”补成“可回退”，让高影响内容仍可追溯、可阻断、可恢复。

## 目标

- 为已应用的 apply request 增加首批 rollback executor。
- Canon patch 增加明确 `rollbackContent`，executor 只写入 patch 提供的回滚内容，不推断 diff。
- 执行成功后把 apply request 标记为 `rolled-back`，proposal 标记为 `rolled-back`。
- 提供 HTTP `POST /api/projects/:projectId/collaboration/proposals/:proposalId/apply-requests/:applyRequestId/rollback`。
- HTTP rollback 使用项目 `dataRoot` 做路径解析，禁止越界写入，并记录 audit log。

## 非目标

- 不实现三方 merge、行级 patch、部分回滚或自动冲突解决。
- 不从 git、文件历史或 `rollbackHint` 自动推导旧内容。
- 不允许 agent job 自动触发 rollback；仍需要有 `apply-canon-change` 权限的用户调用。

## 影响范围

- `src/server/collaboration/canon-merge.ts`
- `src/server/db/schema.ts`
- `src/server/db/repositories.ts`
- `src/server/http/multiuser-server.ts`
- `tests/unit/*`
- `docs/tech/*`
