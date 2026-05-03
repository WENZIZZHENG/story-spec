# StorySpec Gemini 入口

这是 Gemini CLI 的项目级入口文件。通用规则以项目根目录的 `AGENTS.md` 和 `.specify/agent-contract.md` 为准；本文只保留 Gemini 需要的命令格式提示。

## 读取顺序

1. 先读取项目根目录 `AGENTS.md`。
2. 再读取 `.specify/agent-contract.md`。
3. 按当前命令要求读取 `stories/`、`spec/knowledge/`、`spec/tracking/` 中的上下文。

## Gemini 命令格式

Gemini 使用 `storyspec:` 命名空间：

```text
/storyspec:命令名 [参数]
```

常用命令：

```text
/storyspec:constitution
/storyspec:specify
/storyspec:clarify
/storyspec:plan
/storyspec:tasks
/storyspec:write
/storyspec:analyze
```

命令文件位于 `.gemini/commands/storyspec/`，例如 `.gemini/commands/storyspec/write.toml` 对应 `/storyspec:write`。

## 协作边界

- 用户只给出题材、风格或模糊设想时，优先进入澄清，不要直接替用户生成完整设定。
- 写正文前确认 `specification.md`、`creative-plan.md` 和 `tasks.md` 已足够明确。
- 用户要求规划时，只更新规划与任务文件，不直接写章节正文。
- 高风险、边界不清或可能改变核心设定的内容，先提出澄清问题。

更多 agent 命令差异见 `docs/agent-commands.md`。
