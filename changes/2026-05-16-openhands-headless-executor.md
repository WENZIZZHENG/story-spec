---
change_type: minor
scope: worker,agent-runtime,deploy
---

# OpenHands Headless 执行器

## 背景

`storyspec worker` 已能消费 Redis/BullMQ job 队列，但 OpenHands runtime 默认只生成 preview-only 候选，不调用真实外部进程。为了继续推进真实 agent 执行，需要先提供显式开启、可测试、不会自动 apply 的 headless executor 边界。

## 变化

- `OpenHandsRunner` 支持注入 headless executor，并生成 `openhands --headless --workspace <root> -t <task>` 执行计划。
- `storyspec worker` 默认保持 OpenHands PoC preview-only adapter；只有 `STORYSPEC_OPENHANDS_HEADLESS=true` 时才创建真实 headless executor。
- 新增 `STORYSPEC_OPENHANDS_COMMAND` 和 `STORYSPEC_OPENHANDS_PROMPT_PREFIX`，用于自托管环境覆盖命令名和任务提示前缀。
- OpenHands 成功输出仍返回 preview-only candidate；非零 exit code 会进入现有 worker failure 记录路径。

## CLI 行为

`storyspec worker [--once]` 继续连接 PostgreSQL repository 和 Redis/BullMQ queue。默认不会启动 OpenHands 外部进程；设置 `STORYSPEC_OPENHANDS_HEADLESS=true` 后才会调用配置的 OpenHands headless 命令。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化，未修改 `dist/**`。

## 验证

- `npx openspec validate add-openhands-headless-executor --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-agent-runtime.test.ts tests/unit/multiuser-worker-command.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
