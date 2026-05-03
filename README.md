# Novel Writer

[![npm version](https://badge.fury.io/js/novel-writer-cn.svg)](https://www.npmjs.com/package/novel-writer-cn)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Novel Writer 是一个面向中文小说创作的 agent-neutral 工作流工具。它把小说创作拆成可维护的项目文件、CLI 检查命令和多 agent 可复用的写作提示入口，而不是只提供一组灵感提示词。

当前版本的重点能力包括：

- 初始化和升级小说项目，生成统一目录、模板、追踪数据和 agent 命令入口。
- 管理 World Bible、Canon Ledger、Entity Graph、Scene Card、VoiceFingerprint 等结构化创作资料。
- 生成写作上下文包、草稿记录、叙事测试、对话计划、剧情分支、伏笔检查和张力曲线。
- 通过 `novel interview` / `novel clarify` 保存创作澄清记录，保护用户未确认的主角、关系线、威胁形态和世界规则。
- 在 `review` / `analyze` 中识别未确认 AI 建议或待确认主题被提前写入规格、计划、任务或正文的漂移风险。
- 离线管理资料来源、正文文风 lint、Markdown manuscript 编译和读者反馈分诊。
- 为 Generic Markdown、Codex CLI、Claude Code、Gemini CLI、Cursor、Continue Check 等 15 个 agent integration 生成命令或提示文件。

## 适合谁用

- 想用 AI 写长篇中文小说，并且需要稳定维护角色、世界观、时间线、伏笔、正文和任务边界。
- 希望多个 AI agent 共用同一套小说项目资料，而不是每个平台单独维护一份提示词。
- 需要把下一次会话、另一个 agent 或人工协作者快速带入当前故事状态。
- 希望把 Spec Kit / SDD 式的结构化流程迁移到小说创作中。

## 安装

```bash
npm install -g novel-writer-cn
```

要求 Node.js `>=18.0.0`。

本仓库开发时可以使用 `npm` 脚本；仓库锁文件是 `bun.lock`，安装依赖时优先保留现有包管理方式。

## 快速开始

```bash
novel init my-novel --agent codex
cd my-novel
mkdir -p stories/idea-demo
printf "# 一句话灵感\n\n异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁。建设流和思想改造只是支撑工具。\n" > stories/idea-demo/idea.md
novel interview idea-demo --premise "异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁" --max-questions 6
novel status
novel validate
```

`novel interview` 会写入 `stories/<story>/clarifications.json` 和 `clarifications.md`，并输出一段可复制到 Codex/Claude/Gemini 的 `/novel-specify` 输入。它不会直接生成完整规格；未回答的 required 问题会继续保留为 `[需要澄清]`。

常见初始化方式：

```bash
# 在当前目录初始化
novel init --here --agent generic

# 生成所有 agent integration 的命令入口
novel init my-novel --all-agents

# 指定写作方法
novel init my-novel --method snowflake --agent claude

# 初始化时安装插件
novel init my-novel --plugins authentic-voice,genre-knowledge

# 为 Codex 生成更具体的 AGENTS.md 写作边界
novel init my-novel --agent codex --agents-profile adult,slow-burn,adventure

# 跳过 Git 初始化
novel init my-novel --no-git
```

## 两类入口

Novel Writer 有两类入口，需要分清：

- 终端 CLI：在 shell 中运行 `novel status`、`novel validate`、`novel context:pack` 等命令。
- Agent 写作入口：在对应 AI 工具中使用 `/specify`、`/plan`、`/write`、`/review` 等生成的提示文件。

斜杠命令不是终端命令。终端里使用 `novel` CLI，AI 工具里使用对应 agent integration 的命令格式。

## 核心工作流

推荐创作流程通常是：

```text
idea -> interview/clarify -> /specify preview -> /plan -> /tasks -> /write -> /review
```

如果你已经在 agent 中，可以使用 `/clarify` 继续创作访谈；如果只想在终端里操作，用 `novel interview [story]` 或 `novel clarify [story]`。低信息量输入会优先进入澄清和预览，不会静默落盘成正典。

根据需要还可以加入：

```text
/scene
/context-pack
/checklist
/track-init
/track
/timeline
/relations
/analyze
/expert
```

这些入口由 `templates/commands/` 生成到不同 agent 的命令目录中。不同 agent 的命令前缀不同，例如 Codex CLI 使用 `/novel-write`，Claude Code 使用 `/novel.write`，Gemini CLI 使用 `/novel:write`，Generic Markdown 使用 `/write`。

## CLI 能力总览

### 项目和 agent

| 命令 | 作用 |
| --- | --- |
| `novel init [name]` | 初始化小说项目 |
| `novel upgrade` | 升级现有项目的命令、脚本、规范或模板 |
| `novel check` | 检查 Node.js、Git 和常见 AI CLI |
| `novel status` | 汇总项目、故事、tracking、Git 状态和下一步 |
| `novel codex-status` | `status` 的兼容别名 |
| `novel validate` | 校验项目结构、任务、tracking、world/canon、模板和写作规则 |
| `novel interview [story]` | 运行 CLI 创作访谈，保存澄清记录并输出 agent handoff prompt |
| `novel clarify [story]` | `interview` 的 CLI 澄清入口，适合非 agent 环境 |
| `novel info` | 查看可用写作方法 |
| `novel agent:list` | 列出支持的 agent integrations |
| `novel agent:add <id>` | 给当前项目添加 agent integration |
| `novel agent:doctor` | 检查已安装的 agent contract、命令和 manifest |
| `novel contract:print` | 输出当前 agent contract |
| `novel contract:sync` | 同步 `.specify/agent-contract.md` 和项目入口说明 |

### 世界观、正典和结构

| 命令 | 作用 |
| --- | --- |
| `novel world:list` | 列出 World Bible 中的 WorldFact |
| `novel world:check` | 检查 WorldFact 的最小 schema |
| `novel canon:list` | 列出 Canon Ledger 中的 CanonFact |
| `novel canon:check` | 检查 CanonFact 的最小 schema |
| `novel entity:list` | 列出 Entity Graph 中的实体 |
| `novel graph:build` | 从显式 graph 文件生成 `spec/graph/indexes.json` |
| `novel graph:check` | 检查 graph edge 证据和 entity 引用 |
| `novel graph:impact <entityId>` | 查看指定 entity 的关联 edge 和 evidencePaths |
| `novel scene:init <story>` | 为故事创建第一张 Scene Card 模板 |
| `novel scene:list [story]` | 列出 Scene Cards |
| `novel scene:check [story]` | 检查 Scene Card 关键字段和 entity 引用 |
| `novel scene:compile [story]` | 按 scene order 输出章节草稿路径清单 |
| `novel voice:list` | 列出 VoiceFingerprint |
| `novel voice:check` | 检查 VoiceFingerprint 必填字段和样本路径 |
| `novel voice:sample <characterId>` | 读取指定角色的声音样本 |
| `novel preset:list` | 列出内置 Genre Preset |
| `novel preset:add <id>` | 安装 Genre Preset 到当前项目 |
| `novel preset:doctor` | 检查当前项目启用的 Genre Preset |

当前内置 preset：

- `xuanhuan-cultivation`：面向玄幻、修仙、升级流的世界观字段、节奏模板和审稿权重。

### 写作工作台

| 命令 | 作用 |
| --- | --- |
| `novel context:pack [story]` | 生成写作上下文包，明确 mustRead reason 和 allowedWrites |
| `novel context:validate <pack>` | 校验 Context Pack 的路径、reason 和过期状态 |
| `novel draft:new [story]` | 创建章节草稿，不覆盖正式正文 |
| `novel draft:list [story]` | 列出章节草稿 |
| `novel draft:promote <draftId>` | 预览或发布章节草稿到正式正文 |
| `novel narrative:test [story]` | 运行叙事测试，检查场景闭环和章节级 fallback |
| `novel dialogue:plan [story]` | 为场景创建待确认 DialogueBeat YAML |
| `novel dialogue:check [story]` | 检查 DialogueBeat speaker、intent、关系变化和 VoiceFingerprint |
| `novel dialogue:extract [story]` | 从场景生成待确认 DialogueBeat YAML，不写入 canon |
| `novel branch:create <title>` | 创建剧情 what-if 分支，只写入 `stories/*/branches/` |
| `novel branch:list [story]` | 列出剧情 what-if 分支 |
| `novel branch:compare <branchId>` | 输出分支影响报告 |
| `novel branch:promote <branchId>` | 生成或确认分支 promote 清单，不静默覆盖 main |
| `novel promise:list` | 列出读者承诺 |
| `novel promise:check` | 检查长期未兑现、payoff 缺 evidence、重复建立不推进的 promise |
| `novel tension:chart` | 输出张力曲线 Markdown 或 JSON |
| `novel review` | 运行 reviewer loop，输出结构化 findings 和任务草稿 |
| `novel handoff [story]` | 生成断点续写上下文包 |
| `novel tasks:board [story]` | 把 `tasks.md` 导出为本地任务看板和 GitHub issue 草稿 |

### 资料、文风、编译和反馈

| 命令 | 作用 |
| --- | --- |
| `novel research:add <title>` | 添加本地 Research Source 或个人 Markdown 笔记 |
| `novel research:list` | 列出 Research Vault 中的资料来源 |
| `novel research:link <sourceId> <targetPath>` | 把资料来源关联到 world/canon/spec/story 目标 |
| `novel research:check` | 检查 Research Source 与 citation 的本地引用关系 |
| `novel style:lint [story]` | 按 `spec/style` 规则检查正文文风 |
| `novel style:explain <ruleId>` | 解释 style rule 的 pattern、severity 和 suggestion |
| `novel compile` | 编译 Markdown manuscript，只写入 `build/` |
| `novel feedback:import <path>` | 导入读者反馈到 `feedback/feedback.json` |
| `novel feedback:list` | 列出结构化反馈 |
| `novel feedback:triage <id>` | 更新反馈状态，不修改正文 |
| `novel feedback:to-tasks` | 把 feedback 转为待确认任务草稿，不写入 `tasks.md` |

### 插件

| 命令 | 作用 |
| --- | --- |
| `novel plugins` | 显示插件帮助 |
| `novel plugins:list` | 列出已安装插件 |
| `novel plugins:add <name>` | 安装内置插件 |
| `novel plugins:remove <name>` | 移除插件 |

内置插件包括：

| 插件 | 作用 |
| --- | --- |
| `authentic-voice` | 真实人声写作辅助 |
| `translate` | 中文小说英译和本地化润色 |
| `book-analysis` | 小说拆解分析 |
| `genre-knowledge` | 类型知识库和商业网文写作知识 |
| `luyao-style` | 路遥风格创作辅助 |
| `wangyu-style` | 忘语风格创作辅助 |
| `shizhangyu-style` | 石章鱼风格创作辅助 |
| `stardust-dreams` | 连接星尘织梦工具市场的高级 AI 创作模板 |

## Agent integrations

当前内置 15 个 agent integration：

| ID | 名称 | 默认目录 |
| --- | --- | --- |
| `generic` | Generic Markdown Agent | `.specify/commands` |
| `continue-check` | Continue Check | `.continue/prompts` |
| `claude` | Claude Code | `.claude/commands` |
| `cursor` | Cursor | `.cursor/commands` |
| `gemini` | Gemini CLI | `.gemini/commands` |
| `windsurf` | Windsurf | `.windsurf/workflows` |
| `roocode` | Roo Code | `.roo/commands` |
| `copilot` | GitHub Copilot | `.github/prompts` |
| `qwen` | Qwen Code | `.qwen/commands` |
| `opencode` | OpenCode | `.opencode/command` |
| `codex` | Codex CLI | `.codex/prompts` |
| `kilocode` | Kilo Code | `.kilocode/workflows` |
| `auggie` | Auggie CLI | `.augment/commands` |
| `codebuddy` | CodeBuddy | `.codebuddy/commands` |
| `q` | Amazon Q Developer | `.amazonq/prompts` |

`continue-check` 是只读检查入口，会生成建议和补丁式说明，不会被提示直接写入正文或任务文件。`generic` 是通用 Markdown 入口，适合不在内置列表里的 agent 复用。

## 项目目录

初始化后的项目大致如下：

```text
my-novel/
|-- .specify/
|   |-- config.json
|   |-- agent-contract.md
|   |-- commands/
|   |-- context-packs/
|   |-- memory/
|   |-- presets/
|   |-- scripts/
|   `-- templates/
|-- .continue/
|   `-- prompts/
|-- .codex/
|   `-- prompts/
|-- AGENTS.md
|-- plugins/
|-- spec/
|   |-- canon/
|   |-- graph/
|   |-- knowledge/
|   |-- presets/
|   |-- style/
|   |-- tracking/
|   |-- voice/
|   `-- world/
|-- research/
|   |-- notes/
|   |-- sources/
|   `-- citations.json
|-- feedback/
|   `-- feedback.json
|-- build/
|   |-- manuscript.md
|   |-- manuscript.frontmatter.json
|   `-- reports/
`-- stories/
    `-- 001-story/
        |-- specification.md
        |-- creative-plan.md
        |-- tasks.md
        |-- task-board.json
        |-- handoff.md
        |-- branches/
        |-- content/
        |-- dialogue/
        |-- drafts/
        |-- revisions/
        `-- scenes/
```

实际生成的 agent 目录取决于 `--agent`、`--all-agents` 和后续 `agent:add`。

## 当前边界

- `research:*` 默认离线管理本地资料和 citation，不抓取网络内容。
- `style:lint` 只输出 findings 和建议，不自动改正文。
- `feedback:to-tasks` 只生成待确认任务草稿，不直接写入 `tasks.md`。
- `compile` 当前支持 Markdown manuscript，输出只写入 `build/`。
- `draft:promote` 和 `branch:promote` 默认偏预览，需要显式确认才会发布或推进。
- `clarifications.json` 中 `source: ai-suggested` 或 `confirmed: false` 的内容不得静默进入 specification、tasks 或正文；`novel review` 会把这类漂移标为 continuity finding。
- 斜杠写作入口由 agent 使用；终端 CLI 当前没有 `novel analyze` 这类同名终端命令。

## 升级现有项目

```bash
npm install -g novel-writer-cn@latest
cd my-novel
novel upgrade
```

常用选项：

```bash
novel upgrade --agent codex
novel upgrade --all-agents
novel upgrade --commands
novel upgrade --scripts
novel upgrade --spec
novel upgrade --dry-run
novel upgrade --interactive
```

新项目和新文档建议使用 `--agent` / `--all-agents`。旧 `--ai` / `--all` 仍处于兼容期，会映射到 legacy AI 平台并输出迁移提示。

## 本仓库开发

```bash
npm install
npm run build
npm test
npm run test:smoke
```

生成各 agent 命令产物：

```bash
npm run build:commands
```

完整验证：

```bash
npm run verify
```

常用检查：

```bash
npm run check:changes
npm run check:command-manifest
```

## 文档

- [安装指南](docs/installation.md)
- [快速开始](docs/quickstart.md)
- [工作流程](docs/workflow.md)
- [创作控制权指南](docs/creative-control.md)
- [斜杠命令详解](docs/commands.md)
- [Agent integrations](docs/agent-integrations.md)
- [Agent contract](docs/agent-contract.md)
- [AI 平台命令对照](docs/ai-platform-commands.md)
- [升级指南](docs/upgrade-guide.md)
- [写作方法](docs/writing-methods.md)
- [本地开发](docs/local-development.md)
- [技术架构](docs/tech/architecture.md)

## 许可证

MIT
