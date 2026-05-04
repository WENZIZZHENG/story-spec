# Agent Integrations

StorySpec 的核心是小说项目协议、命令语义和 agent contract。Codex、Claude、Gemini、Continue 等只是 integration，不是产品核心。

## 主路径

新项目优先使用 `--agent`：

```bash
storyspec init my-novel --agent generic
storyspec init my-novel --agent codex
storyspec init my-novel --all-agents
```

旧 `--ai <id>` 和 `--all` 仍处于兼容期：

```bash
storyspec init my-novel --ai codex
storyspec upgrade --all
```

兼容入口会映射到 legacy AI integration。新文档、新脚本和新自动化应使用 `--agent` / `--all-agents`。

## 能力分层

每个 agent integration 都声明能力：

| 能力 | 含义 |
| --- | --- |
| `readFiles` | 可以读取项目文件 |
| `writeFiles` | 可以直接写入项目文件 |
| `runShell` | 可以执行 CLI 或脚本 |
| `supportsSlashCommands` | 可以用 `/command` 形式触发 |
| `supportsProjectInstructions` | 可以读取项目级说明，例如 `AGENTS.md` |

命令 renderer 会按能力降级：

- `runShell=false`：命令中不要求执行 `.specify/scripts/**`，改为人工检查。
- `writeFiles=false`：命令中不要求写文件，只输出目标路径、建议内容和补丁式说明。
- 不支持 slash command：使用 `.specify/commands/*.md` 这类 Markdown 命令文件。

## 内置 integrations

| ID | 类型 | 写文件 | Shell | 目录 |
| --- | --- | --- | --- | --- |
| `generic` | Generic Markdown Agent | 是 | 否 | `.specify/commands` |
| `continue-check` | Continue Check | 否 | 否 | `.continue/prompts` |
| `claude` | Claude Code | 是 | 是 | `.claude/commands` |
| `gemini` | Gemini CLI | 是 | 是 | `.gemini/commands` |
| `codex` | Codex CLI | 是 | 是 | `.codex/prompts` |
| `cursor` | Cursor | 是 | 是 | `.cursor/commands` |
| `windsurf` | Windsurf | 是 | 是 | `.windsurf/workflows` |
| `roocode` | Roo Code | 是 | 是 | `.roo/commands` |
| `copilot` | GitHub Copilot | 是 | 否 | `.github/prompts` |
| `qwen` | Qwen Code | 是 | 是 | `.qwen/commands` |
| `opencode` | OpenCode | 是 | 是 | `.opencode/command` |
| `kilocode` | Kilo Code | 是 | 是 | `.kilocode/workflows` |
| `auggie` | Auggie CLI | 是 | 是 | `.augment/commands` |
| `codebuddy` | CodeBuddy | 是 | 是 | `.codebuddy/commands` |
| `q` | Amazon Q Developer | 是 | 否 | `.amazonq/prompts` |

使用下面命令查看当前版本的完整结构化列表：

```bash
storyspec agent:list --json
```

## Continue Check

`continue-check` 是只读检查入口。它生成 `.continue/prompts/*.md`，适合在 Continue 中做分析、审稿、清单检查和补丁式建议。

用法：

```bash
storyspec init my-novel --agent continue-check
storyspec handoff --target-agent continue-check
```

`continue-check` 不应直接写正文、tracking 或任务文件。需要改动时，它应输出：

- 目标路径
- 建议内容
- 补丁式修改说明
- 无法自动验证的部分

说明来源：Continue 官方文档将 prompt 定义为可通过 `/` 调用的配置项，并支持引用本地文件：

- <https://docs.continue.dev/customize/deep-dives/prompts>

## 检查与修复

```bash
storyspec agent:doctor
storyspec contract:print
storyspec contract:sync
```

`agent:doctor` 会检查 contract、命令目录、manifest 和 renderer 版本；`contract:sync` 用于同步 `.specify/agent-contract.md` 和 `AGENTS.md`。

## 跨工具引导入口

不同工具不一定读取同一个项目说明文件。StorySpec 因此采用“中心协议 + 多入口适配”：

| 工具 | 入口文件 |
| --- | --- |
| Codex | `AGENTS.md` |
| Claude | `CLAUDE.md` |
| Gemini | `.gemini/GEMINI.md` |
| Cursor | `.cursor/rules/story-spec.mdc` |
| Continue | `.continue/rules/story-spec.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| 通用 Markdown agent | `.specify/agent-guides/story-creation-guide.md` |

中心协议是 `.specify/agent-guides/story-creation-guide.md`。当用户提到 story-spec、小说创建、剧情设定、章节规划或如何开始时，各入口都应引导 agent 读取该协议，先带作者创建第一版 StorySpec，而不是停留在概念解释。
