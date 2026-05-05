# Agent 命令对照

StorySpec 的命令语义是统一的，但不同 agent 的斜杠命令格式不同。

## 快速对照

| Agent | 命令格式 | 示例 | 命令目录 |
| --- | --- | --- | --- |
| Codex CLI | `/storyspec-命令名` | `/storyspec-write` | `.codex/prompts/` |
| Claude Code | `/storyspec.命令名` | `/storyspec.write` | `.claude/commands/` |
| Gemini CLI | `/storyspec:命令名` | `/storyspec:write` | `.gemini/commands/storyspec/` |
| Cursor | `/命令名` | `/write` | `.cursor/commands/` |
| Windsurf | `/命令名` | `/write` | `.windsurf/workflows/` |
| Roo Code | `/命令名` | `/write` | `.roo/commands/` |
| GitHub Copilot | prompt 文件 | `write.md` | `.github/prompts/` |
| Qwen Code | `/命令名` | `/write` | `.qwen/commands/` |
| OpenCode | `/命令名` | `/write` | `.opencode/command/` |
| Kilo Code | `/命令名` | `/write` | `.kilocode/workflows/` |
| Auggie CLI | `/命令名` | `/write` | `.auggie/commands/` |
| CodeBuddy | `/命令名` | `/write` | `.codebuddy/commands/` |
| Amazon Q | prompt 文件 | `write.md` | `.amazonq/prompts/` |

## 常用命令

| 语义 | Codex | Claude | Gemini |
| --- | --- | --- | --- |
| 创作宪法 | `/storyspec-constitution` | `/storyspec.constitution` | `/storyspec:constitution` |
| 故事规格 | `/storyspec-specify` | `/storyspec.specify` | `/storyspec:specify` |
| 澄清 | `/storyspec-clarify` | `/storyspec.clarify` | `/storyspec:clarify` |
| 计划 | `/storyspec-plan` | `/storyspec.plan` | `/storyspec:plan` |
| 任务 | `/storyspec-tasks` | `/storyspec.tasks` | `/storyspec:tasks` |
| 写作 | `/storyspec-write` | `/storyspec.write` | `/storyspec:write` |
| 分析 | `/storyspec-analyze` | `/storyspec.analyze` | `/storyspec:analyze` |

其他 agent 通常直接使用 `/constitution`、`/specify`、`/write` 等无前缀命令。

## 初始化

```bash
storyspec init --workspace 我的小说 --agent codex
storyspec init --workspace 我的小说 --agent gemini
storyspec init --workspace 我的小说 --all-agents
```

旧入口 `--ai` 和 `--all` 仍处于兼容期，但新文档建议使用 `--agent` 和 `--all-agents`。

Copilot 和 Amazon Q 当前安装的是 prompt 文件入口，不承诺 slash command 语义；使用时打开对应 prompt 文件或按工具支持的 prompt 调用方式执行。

## Gemini 说明

Gemini CLI 会把子目录转换为冒号命名空间：

```text
.gemini/commands/storyspec/write.toml -> /storyspec:write
```

Gemini 项目的 `.gemini/GEMINI.md` 只保留薄适配说明。通用工作规则仍以 `AGENTS.md` 和 `.specify/agent-contract.md` 为准。

## 更新命令产物

开发本仓库时：

```bash
npm run build:commands
npm run check:command-manifest
```

已有小说项目中：

```bash
storyspec upgrade --agent gemini --commands
storyspec agent:add codex
storyspec agent:doctor
```

## 相关文档

- [命令语义速查](commands.md)
- [Agent integrations](agent-integrations.md)
- [Agent contract](agent-contract.md)
