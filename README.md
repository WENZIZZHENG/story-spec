# Novel Writer

[![npm version](https://badge.fury.io/js/novel-writer-cn.svg)](https://www.npmjs.com/package/novel-writer-cn)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Novel Writer 是一个面向中文小说创作的 agent-neutral 工作流工具。它不是单纯的灵感提示词集合，而是把“创作宪法、故事规格、创作计划、任务清单、章节正文、追踪数据、交接上下文”组织成一个可维护的小说项目。

安装后你会得到两类能力：

- `novel` CLI：初始化/升级项目，检查环境，汇总项目状态，校验故事产物，导出任务看板，生成断点续写上下文包，管理插件。
- Agent integrations：为 Generic Markdown、Claude Code、Gemini CLI、Codex CLI、Cursor、Windsurf、Roo Code、GitHub Copilot、Continue Check 等入口生成结构化写作命令或只读检查提示词。

## 适合谁用

- 想用 AI 写长篇中文小说，但需要稳定维护角色、时间线、伏笔和任务边界。
- 已经习惯在 AI 编程工具中用斜杠命令推进工作流，希望把类似 Spec Kit / SDD 的方法迁移到小说创作。
- 需要多个 agent 共用同一套小说项目文件，而不是每个平台各写一份提示词。
- 需要让另一个 agent 或下一次会话快速接手当前故事进度。

## 核心功能

### 项目脚手架

`novel init` 会创建标准小说项目目录，并写入：

- `.specify/config.json`：项目名称、写作方法、agent integrations 和版本信息。
- `.specify/memory/`：创作宪法、个人声音等长期记忆。
- `.specify/templates/`：故事、提纲、检查清单、知识库等模板。
- `stories/`：每个故事的规格、计划、任务和正文。
- `spec/tracking/`：角色状态、关系、时间线、情节追踪、校验规则等 JSON。
- `spec/knowledge/`：世界观、角色档案、角色声音、地点资料等知识库。
- 对应 agent integration 的命令目录，例如 `.specify/commands/`、`.continue/prompts/`、`.codex/prompts/`、`.claude/commands/`、`.gemini/commands/`。

### 七步写作流

Novel Writer 的主流程来自规格驱动创作法：

1. `/constitution`：建立创作宪法，定义不可违背的原则、风格和边界。
2. `/specify`：生成故事规格，明确作品定位、核心冲突、角色、世界观、需求优先级和验收标准。
3. `/clarify`：围绕规格中的模糊点做结构化澄清，记录关键决策。
4. `/plan`：把“要写什么”转成章节结构、叙事方案、人物弧线、节奏和伏笔计划。
5. `/tasks`：把创作计划拆成可执行任务，标注优先级、依赖、读写边界和验收标准。
6. `/write`：按任务清单写章节，自动加载宪法、规格、计划、任务、追踪数据、知识库和前文。
7. `/analyze`：根据阶段自动执行框架一致性分析或内容质量分析，也支持 `--type` 和 `--focus` 指定分析模式。

### 追踪与交接

- `/track-init`：初始化追踪数据。
- `/track`：汇总写作进度、情节、时间线、角色状态、伏笔和一致性问题。
- `/timeline`：管理和验证故事时间线。
- `/relations`：管理角色关系变化。
- `/checklist`：生成或执行规格验证、内容扫描相关检查清单。
- `novel status`：在终端汇总当前故事、下一任务、正文数量、tracking JSON、Git 状态和建议下一步。
- `novel validate`：校验项目结构、故事产物、任务字段、tracking JSON、模板和写作规则。
- `novel handoff`：生成 `handoff.md`，列出下一任务、必须读取、允许修改、风险边界和阻塞项。
- `novel tasks:board`：把 `tasks.md` 转成 `task-board.json`，并生成 GitHub issue 草稿字段。

### Agent integration 命令生成

当前内置支持 15 个 agent integration，其中 `generic` 是通用 Markdown 命令入口，`continue-check` 是只读检查入口，其余 13 个是 legacy AI 平台兼容入口：

| Agent ID | Agent integration | 命令目录 | 命令格式示例 |
| --- | --- | --- | --- |
| `generic` | Generic Markdown Agent | `.specify/commands` | `/write` |
| `continue-check` | Continue Check | `.continue/prompts` | `/write` |
| `claude` | Claude Code | `.claude/commands` | `/novel.write` |
| `gemini` | Gemini CLI | `.gemini/commands` | `/novel:write` |
| `codex` | Codex CLI | `.codex/prompts` | `/novel-write` |
| `cursor` | Cursor | `.cursor/commands` | `/write` |
| `windsurf` | Windsurf | `.windsurf/workflows` | `/write` |
| `roocode` | Roo Code | `.roo/commands` | `/write` |
| `copilot` | GitHub Copilot | `.github/prompts` | `/write` |
| `qwen` | Qwen Code | `.qwen/commands` | `/write` |
| `opencode` | OpenCode | `.opencode/command` | `/write` |
| `kilocode` | Kilo Code | `.kilocode/workflows` | `/write` |
| `auggie` | Auggie CLI | `.augment/commands` | `/write` |
| `codebuddy` | CodeBuddy | `.codebuddy/commands` | `/write` |
| `q` | Amazon Q Developer | `.amazonq/prompts` | `/write` |

使用 `novel init --all-agents` 或 `novel upgrade --all-agents` 可以为所有 agent integration 生成或升级命令文件。旧 `--ai`、`--all` 仍处于兼容期，会映射到 legacy AI 平台并输出迁移提示。

### 写作方法预设

初始化时可以通过 `--method` 选择方法：

- `three-act`：三幕结构。
- `hero-journey`：英雄之旅。
- `story-circle`：故事圈。
- `seven-point`：七点结构。
- `pixar`：皮克斯公式。
- `snowflake`：雪花十步。

终端中也可以运行 `novel info` 查看方法说明。

### 插件系统

`novel plugins:add <name>` 会把内置插件复制到项目，并把插件命令注入已配置的 AI 平台命令目录。支持 `--dry-run` 预览写入计划，支持 `--force` 覆盖冲突文件。

当前仓库内置插件包括：

| 插件 | 功能 |
| --- | --- |
| `authentic-voice` | 真实人声写作，提升生活质感和个体声音一致性 |
| `translate` | 中文小说英译与本地化润色 |
| `book-analysis` | 小说拆解分析 |
| `genre-knowledge` | 类型知识库和商业网文写作知识 |
| `luyao-style` | 路遥风格创作辅助 |
| `wangyu-style` | 忘语风格创作辅助 |
| `shizhangyu-style` | 石章鱼风格创作辅助 |
| `stardust-dreams` | 连接星尘织梦工具市场的高级 AI 创作模板 |

## 快速开始

### 1. 安装

```bash
npm install -g novel-writer-cn
```

要求 Node.js `>=18.0.0`。

### 2. 创建小说项目

```bash
novel init my-novel --agent generic
cd my-novel
```

也可以直接选择具体平台，例如：

```bash
novel init my-novel --agent codex
```

常用初始化方式：

```bash
# 在当前目录初始化
novel init --here --agent claude

# 为所有 agent integration 生成命令
novel init my-novel --all-agents

# 指定写作方法
novel init my-novel --method snowflake --agent gemini

# 初始化时预装插件
novel init my-novel --plugins authentic-voice,genre-knowledge

# 为 Codex 生成带写作边界画像的 AGENTS.md
novel init my-novel --agent codex --agents-profile adult,slow-burn,adventure

# 跳过 Git 初始化
novel init my-novel --no-git
```

### 3. 检查项目状态

```bash
novel status
novel validate
```

如果需要结构化输出：

```bash
novel status --json
novel validate --json
novel validate --severity error
```

### 4. 在 agent 中开始写作

按你选择的 agent integration 使用对应命令。通用 Markdown 入口使用：

```text
/constitution
/specify
/clarify
/plan
/tasks
/write
/analyze
```

Codex CLI 对应：

```text
/novel-constitution
/novel-specify
/novel-clarify
/novel-plan
/novel-tasks
/novel-write
/novel-analyze
```

Claude Code 对应 `/novel.write`，Gemini CLI 对应 `/novel:write`，多数其他平台直接使用 `/write`。

### 5. 交接或导出任务

```bash
# 生成最近故事的 handoff.md
novel handoff

# 指定故事并输出 JSON
novel handoff stories/001-demo --json

# 为只读 agent 生成检查式交接步骤
novel handoff --target-agent continue-check

# 把 tasks.md 转成任务看板 JSON
novel tasks:board

# 只输出 JSON，不写文件
novel tasks:board 001-demo --json
```

## CLI 命令

| 命令 | 作用 |
| --- | --- |
| `novel init [name]` | 初始化小说项目 |
| `novel check` | 检查 Node.js、Git 和常见 AI CLI 是否可用 |
| `novel agent:list` | 列出支持的 agent integration 和能力 |
| `novel agent:add <id>` | 给现有项目添加 agent integration |
| `novel agent:doctor` | 检查已安装 agent contract、命令和 manifest |
| `novel contract:print` | 输出当前 agent contract |
| `novel contract:sync` | 同步 `.specify/agent-contract.md` 和 `AGENTS.md` |
| `novel status` | 汇总项目、故事、追踪数据、Git 状态和下一步 |
| `novel codex-status` | `status` 的兼容别名 |
| `novel validate` | 校验项目结构、任务、tracking、模板和写作规则 |
| `novel handoff [story]` | 生成断点续写上下文包 |
| `novel tasks:board [story]` | 从 `tasks.md` 导出本地任务看板和 GitHub issue 草稿 |
| `novel plugins` | 显示插件帮助 |
| `novel plugins:list` | 列出已安装插件 |
| `novel plugins:add <name>` | 安装内置插件 |
| `novel plugins:remove <name>` | 移除插件 |
| `novel upgrade` | 升级现有项目的命令、脚本、规范、模板或记忆文件 |
| `novel info` | 查看可用写作方法 |

## 斜杠命令

| 通用命令 | 作用 | 主要产物或数据 |
| --- | --- | --- |
| `/constitution` | 创建或更新创作宪法 | `.specify/memory/constitution.md` |
| `/specify` | 定义故事规格 | `stories/*/specification.md` |
| `/clarify` | 澄清规格模糊点 | 规格补充和决策记录 |
| `/plan` | 制定创作计划 | `stories/*/creative-plan.md` |
| `/tasks` | 分解任务清单 | `stories/*/tasks.md` |
| `/write` | 写章节正文 | `stories/*/content/` |
| `/analyze` | 框架或内容分析 | `stories/*/analysis-report.md` |
| `/checklist` | 质量检查清单 | 检查清单或扫描结果 |
| `/track-init` | 初始化追踪系统 | `spec/tracking/*.json` |
| `/track` | 综合追踪进度和一致性 | 终端/会话报告 |
| `/timeline` | 管理时间线 | `spec/tracking/timeline.json` |
| `/relations` | 管理角色关系 | `spec/tracking/relationships.json` |
| `/expert` | 专家模式入口 | `.specify/experts/core/` 和插件专家提示词 |

> 注意：斜杠命令在 AI 助手内部使用，不是在终端中执行。终端里使用的是 `novel` CLI。

## 项目目录

```text
my-novel/
├── .specify/
│   ├── config.json
│   ├── memory/
│   ├── scripts/
│   └── templates/
├── .specify/commands/     # generic agent 命令
├── .continue/prompts/     # continue-check 只读检查提示词
├── .codex/                # 取决于 --agent，可替换为 .claude/.gemini 等
│   └── prompts/
├── AGENTS.md              # agent 项目说明
├── plugins/
├── spec/
│   ├── knowledge/
│   └── tracking/
└── stories/
    └── 001-story/
        ├── specification.md
        ├── creative-plan.md
        ├── tasks.md
        ├── task-board.json
        ├── handoff.md
        └── content/
```

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

默认升级命令、脚本和写作规范；模板、记忆文件、专家模式需要显式选择，避免覆盖用户项目内容。

旧 `novel upgrade --ai <id>` 和 `novel upgrade --all` 仍可用，但建议新文档和新项目使用 `--agent` / `--all-agents`。

## 本仓库开发

```bash
npm install
npm run build
npm test
npm run test:smoke
```

生成各平台命令产物：

```bash
npm run build:commands
```

完整验证：

```bash
npm run verify
```

## 文档

- [安装指南](docs/installation.md)
- [快速开始](docs/quickstart.md)
- [工作流程](docs/workflow.md)
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
