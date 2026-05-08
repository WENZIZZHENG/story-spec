## Why

多用户 App 不能把长任务同步塞进 HTTP 请求。后续 AI、runtime、OpenHands 和 apply 流程都需要一个统一 `AgentJob` 生命周期。正式 BullMQ/Redis adapter 可以后续接入，但状态机、幂等键、取消和重试语义应先在纯 TypeScript 层固定。

## What Changes

- 新增 `AgentJob` 最小模型和内存 repository。
- 新增 `createAgentJob()`，支持 user/project/runtime/kind/idempotencyKey。
- 新增 `transitionAgentJob()`，限制状态只能按合法路径推进。
- 新增 `cancelAgentJob()` 和 `retryAgentJob()` 基础行为。
- 新增单元测试覆盖创建、运行成功、非法状态转移、取消和重试。

## Non-goals

- 不引入 Redis、BullMQ、worker 或 runtime adapter。
- 不执行真实 agent 命令。
- 不写 StorySpec 项目文件，不触发 preview/apply。
- 不新增 HTTP API 或 UI。

## Impact

影响 `src/server/jobs/*`、相关 unit test、changeset 和 OpenSpec。后续队列 adapter、runtime adapter、审计和 UI 都应复用该状态机。

## Capabilities

- `multiuser-agent-job-foundation`
