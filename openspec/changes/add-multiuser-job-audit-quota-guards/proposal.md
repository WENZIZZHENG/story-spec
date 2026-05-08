## Why

多用户 job API 已能创建、查询、取消和重试作业，但还没有把审计与配额 foundation 接入请求链路。这样无法回答“谁创建/取消/重试了哪个 job”，也无法在创建作业前阻止项目或用户超额消耗。

## What Changes

- `POST /api/projects/:projectId/jobs` 在创建 job 前检查并消耗 project/user 级 `job` 配额。
- job 创建、取消、重试成功后记录审计事件，包含 actor、project、action、source、jobId 和 diffSummary。
- 配额不足时返回稳定错误码和可读原因，不创建 job、不消耗额外状态。
- job API 可选注入 audit/quota repository；未配置时保持已有基础 API 能力。

## Non-goals

- 不实现商业计费、套餐、支付或 token 账单。
- 不接真实 Redis/BullMQ 限流器。
- 不把审计记录做成不可篡改账本。
- 不改本机 `storyspec app`。

## Impact

影响 `src/server/http/multiuser-server.ts`、`tests/unit/multiuser-server.test.ts`、changeset 和多用户路线图。该 change 对应 `MU-06` 的最小可用接入层。

## Capabilities

- `multiuser-job-audit-quota-guards`
