# Agent-Neutral 重构决策记录

## 状态

Accepted

## 背景

`full-refactor-agent-neutral.md` 将后续方向从 `AIPlatform` 扩展为 `AgentIntegration`。现有 `src/utils/ai-platforms.ts` 已经收敛了 13 个平台的旧 registry，但它仍以 `--ai` 和平台目录为中心，无法表达通用 Markdown agent、能力分级、renderer、project instruction 支持等信息。

第一步需要新增 agent-neutral registry，同时保持旧 CLI 行为不变。

## 决策

- 新增 `src/agent/capabilities.ts` 定义 agent 能力模型。
- 新增 `src/agent/registry.ts` 定义 `AgentIntegration`、`AGENT_INTEGRATIONS` 和 `generic` integration。
- 保留 `src/utils/ai-platforms.ts` 作为兼容 wrapper，旧 `AI_PLATFORM_IDS` 仍只包含原 13 个平台，不提前把 `generic` 暴露给 `--ai`。
- `generic` 先作为 `markdown-command` integration 登记，后续 A2 再接入 `.specify/commands/*.md` 生成与初始化流程。

## 非目标

- 本次不新增 `novel agent:list`。
- 本次不实现 `novel init --agent generic`。
- 本次不改变 `build:commands` 的平台矩阵和现有 slash command 输出。
- 本次不删除或重命名任何旧 `AIPlatform` 导出。

## 验收

- `npm run build` 通过。
- `npm test -- --run tests/unit/agent-registry.test.ts tests/unit/ai-platforms.test.ts` 通过。
- 旧 `AI_PLATFORM_IDS` 顺序和内容保持不变。
- 新 registry 包含 `generic`，并能映射所有旧 AI platform。
