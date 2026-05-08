## Why

StorySpec 已经完成本机单人 Web 工作台和启动体验收口。下一阶段如果要支持多人使用，必须先把用户、项目、作业、审计、配额和执行引擎边界冻结下来，而不是把 `storyspec app` 直接扩成临时 SaaS。若不先建立控制平面基线，后续实现很容易把单机 CLI 语义直接搬进多租户后端，导致路径越权、状态污染和成本失控。

## What Changes

- 定义多用户控制平面最小模型：`User`、`Session`、`Project`、`Membership`、`AgentJob`、`AuditLog`、`QuotaBucket`。
- 明确多用户 server 与本机 `storyspec app` 的边界：前者负责账号、授权、项目隔离和作业控制，后者继续保留本机单人工作台语义。
- 规定所有项目读写都必须经过 `userId + projectId` 授权和 `ProjectStorage` 路径规范化，不接受客户端直通路径。
- 引入 `AgentRuntimeAdapter` 抽象，先 `LocalStorySpecRunner`，再 `OpenHandsRunner`；Cline/Aider 只作为客户端或 handoff 目标，不作为控制平面核心。
- 规定长任务必须进入 `AgentJob` 状态机，写入仍保留 candidate / preview / confirm / apply 门禁。
- 为后续 `MU-01` 到 `MU-14` 的实现批次提供统一 OpenSpec 基线。

## Non-goals

- 不实现认证、数据库迁移、HTTP server、UI、队列 worker 或实际 runtime 代码。
- 不做多人实时协作、共享链接、公开社区或商业计费。
- 不改变当前本机 `storyspec app` 的单人工作台语义。
- 不把 `OpenHands`、`Cline` 或 `Aider` 直接做成多租户控制平面。

## Impact

影响 `docs/tech/app-multiuser-roadmap.md`、`docs/tech/app-multiuser-development-tasks.md`、后续 `src/server/*` 模块、`tests/security/*`、`tests/smoke/*multiuser*`、changeset 和后续实现任务。这个 change 只冻结边界，不新增运行时代码。

## Capabilities

- `multiuser-control-plane-and-agent-runtime`
