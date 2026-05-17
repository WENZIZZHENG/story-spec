## API Shape

新增路径均位于项目边界内：

- `POST /api/projects/:projectId/collaboration/proposals`
- `POST /api/projects/:projectId/collaboration/proposals/:proposalId/reviews`
- `POST /api/projects/:projectId/collaboration/proposals/:proposalId/patches`
- `POST /api/projects/:projectId/collaboration/proposals/:proposalId/apply-requests`

请求体沿用 `src/server/collaboration/canon-merge.ts` 的领域类型。server 只做轻量 JSON 组装和权限守卫，复杂 apply gate 仍由领域服务负责。

## Permission Mapping

- 创建 proposal：`create-candidate`
- 提交 review decision：`review-canon`
- 创建 canon patch：`create-candidate`
- 创建 apply request：`apply-canon-change`

`apply-canon-change` 对 owner 是 `requires-confirmation`，因此 API 必须继续要求请求体传入 `authorConfirmed`，并交给 apply gate 判断是否 ready。非 owner 被权限模型拒绝。

## Audit

成功 mutation 写入 `multiuser-server` 来源的审计事件：

- `collaboration.proposal.create`
- `collaboration.review.submit`
- `collaboration.patch.create`
- `collaboration.apply_request.create`

审计事件记录 actor、project、action 和 diff summary；当前 audit event 结构没有 proposalId 字段，因此 proposal/patch/request id 先写入 `diffSummary`。

## Error Boundaries

- repository 未配置时返回 `503 MULTIUSER_REPOSITORY_NOT_CONFIGURED`。
- proposal 不存在等领域错误返回 `400 COLLABORATION_MUTATION_BLOCKED`。
- 认证或项目权限失败沿用现有 `AUTH_REQUIRED` / `PROJECT_ACCESS_DENIED`。
