## Why

`storyspec worker` 已能运行 preview-only runtime，但 OpenHands runner 仍是 PoC adapter，只生成计划和候选引用，不调用真实 headless 进程。继续推进真实 agent 执行前，需要一个显式启用、可测试、可审计边界清晰的 headless executor，而不是默认执行外部命令。

## What Changes

- 扩展 `OpenHandsRunner`，支持可注入 `execute(plan)` headless executor。
- OpenHands execution plan 使用 headless 入口：`openhands --headless --workspace <root> -t <task>`，并保留 `autoApply: false` 的 StorySpec 边界。
- `storyspec worker` 读取 `STORYSPEC_OPENHANDS_HEADLESS=true` 后才启用真实 executor；默认仍使用 PoC preview-only runner。
- 新增 `STORYSPEC_OPENHANDS_COMMAND` 和 `STORYSPEC_OPENHANDS_PROMPT_PREFIX` 配置，用于自托管 worker。
- 文档同步说明：headless 输出仍只作为候选，不自动 apply 正文、正典或 tracking。

## Non-goals

- 不安装 OpenHands。
- 不解析或持久化实时 stdout/stderr。
- 不把 OpenHands 输出直接写入正式故事。
- 不实现 sandbox、Kubernetes、分布式锁或生产 HA。

## Impact

影响 `src/server/agent-runtime/openhands-runner.ts`、`src/cli/commands/multiuser-worker.command.ts`、runtime/worker command unit tests、`.env.example`、README、自托管文档、changeset 和路线图。

## Capabilities

- `openhands-headless-executor`
