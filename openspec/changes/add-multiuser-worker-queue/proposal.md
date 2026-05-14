## Why

多人平台已经具备 job 控制面、权限/配额/审计守卫、runtime adapter 和 PostgreSQL-backed repository，但 `storyspec server` 创建 job 后仍只停留在 `queued` 状态。Redis 也还只是 compose 占位，无法证明 agent job 会由独立 worker 异步消费、失败可恢复、输出保持 preview-only。

## What Changes

- 新增可测试的 agent job queue 边界，提供内存队列和 BullMQ/Redis adapter 的配置入口。
- 新增 worker runner，消费 queued job 后调用现有 `AgentRuntimeAdapter`，把 job 推进到 `running/succeeded/failed`，并保存 preview-only 运行结果。
- 让 `storyspec server` 在配置队列时创建 job 后自动入列，并在 `/ready` 暴露 queue configured/connected/worker 状态。
- 新增 `storyspec worker` 入口，用同一套 PostgreSQL repository 与 Redis queue 配置运行独立 worker。
- 更新 compose、自托管说明、changeset 和路线图状态。

## Non-goals

- 不让 agent job 自动 apply 正文、正典或正式故事文件。
- 不实现真实 OpenHands headless 进程调用；`OpenHandsRunner` 仍是 preview-only PoC adapter。
- 不实现生产级分布式锁、死信队列、队列 dashboard 或 Kubernetes 高可用。
- 不实现完整前端任务中心 UI。

## Impact

影响 `src/server/queue/*`、`src/server/workers/*`、`src/server/http/multiuser-server.ts`、`src/cli/*`、`package.json`、部署文档、路线图、unit tests 和 changeset。该变更让多用户控制面具备首批真实 worker 队列底座，但仍不是完整 SaaS。

## Capabilities

- `multiuser-worker-queue`
