## Why

多用户 App 必须能回答“谁在什么时候对哪个项目做了什么”，也必须防止单个用户或项目无限制造作业。AgentJob 状态机已经存在，但还缺审计记录和配额检查。先做纯 TypeScript foundation，可以让后续 apply、job、runtime 和 API 共享同一审计/配额语义。

## What Changes

- 新增 `AuditEvent` 模型和内存 repository。
- 新增 `recordAuditEvent()`，记录 actor、project、action、source、diffSummary、jobId、timestamp。
- 新增 `QuotaBucket` 模型和内存 repository。
- 新增 `checkQuota()` 与 `consumeQuota()`，支持用户/项目级 limit 与 used 检查。
- 新增单元测试覆盖审计记录、未超限、超限拒绝和消耗后更新。

## Non-goals

- 不实现商业计费、支付、套餐或发票。
- 不接 HTTP API、数据库、队列或 runtime。
- 不让审计记录替代 Git 历史或文件 diff。
- 不改本机 `storyspec app`。

## Impact

影响 `src/server/audit/*`、`src/server/quota/*`、对应 unit tests、changeset 和 OpenSpec。后续 job worker、apply API、runtime adapter 和 UI 应复用该 foundation。

## Capabilities

- `multiuser-audit-quota-foundation`
