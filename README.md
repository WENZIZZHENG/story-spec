# Novel Writer

[![npm version](https://badge.fury.io/js/novel-writer-cn.svg)](https://www.npmjs.com/package/novel-writer-cn)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Novel Writer 是一个面向中文长篇小说的 agent-neutral 创作工作流工具。它的核心不是让 AI 把一句灵感直接扩写成一整套设定，而是先保护作者的创作决定，再把澄清、规格、计划、正文、审稿和交接拆成可维护的项目文件。

你可以把它理解成一套“小说项目工程化工作台”：

- 灵感会先被保存为作者原始输入，不会被静默改写成正典。
- AI 可以给出示例、候选项和下一步建议，但未确认内容会保留为 `[需要澄清]`。
- 角色、世界观、时间线、伏笔、文风、反馈和章节草稿都有稳定文件承载。
- Codex、Claude、Gemini、Cursor、Continue 等 agent 可以共用同一套项目资料。
- 写作前可以先预览 AI 准备写入的规格，再决定是否应用。

## 适合谁

- 你想写长篇中文小说，希望 AI 帮忙推进，但不希望它抢走设定权。
- 你有一句灵感、几条类型偏好或一个模糊主题，需要先被追问，而不是被立即代写。
- 你需要维护世界观、正典、人物关系、伏笔、章节任务和多轮修改记录。
- 你想让不同 AI 工具接力创作，并且每次接手都能读到同一份上下文。
- 你喜欢 Spec Kit / SDD 式的结构化流程，希望把它迁移到小说创作中。

## 不适合谁

- 你只想输入一句话，然后立刻得到完整大纲、人物小传和正文。
- 你希望 AI 自动决定所有设定，作者只负责验收成品。
- 你写的是一次性短文本，不需要长期维护资料、正典和版本。
- 你不想使用命令行，也不希望把小说拆成项目文件管理。

## 安装

```bash
npm install -g novel-writer-cn
```

要求 Node.js `>=18.0.0`。

本仓库开发时可以使用 `npm` 脚本；仓库锁文件是 `bun.lock`，安装依赖时优先保留现有包管理方式。

## 快速开始

下面是一条推荐的新故事路径。重点是：先建项目，再保存灵感，然后进入澄清和预览。

```bash
novel init my-novel --agent codex
cd my-novel

novel story:new 法术编译纪元 --idea "异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁。建设流和思想改造只是支撑工具。"
novel next 法术编译纪元

novel interview 法术编译纪元 --premise "异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁" --max-questions 6
novel creative:report 法术编译纪元

novel preview specify 法术编译纪元
# 从上一条命令输出里复制 preview id 后再应用
novel apply PREVIEW_ID --yes

novel status
novel validate
```

运行后通常会出现这些文件：

| 文件 | 用途 |
| --- | --- |
| `stories/<story>/idea.md` | 保存作者原始灵感，不把 AI 补全混进去 |
| `stories/<story>/clarifications.json` | 记录已确认、未确认、跳过和 AI 建议来源 |
| `stories/<story>/clarifications.md` | 给作者阅读的澄清摘要 |
| `.specify/previews/` | 存放待确认的规格预览 |
| `stories/<story>/specification.md` | 通过 `novel apply` 后才写入的正式规格 |

## 先澄清，而不是抢写

Novel Writer 对低信息量输入的默认态度是：先追问，再创作。比如你只说：

```text
我想写一个异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁。
```

工具应该优先帮助你确认关键问题：

- 主角为什么会把“编程”理解成施法？
- 轻松冒险的喜剧边界在哪里，哪些伤害不能被轻飘飘处理？
- 慢热感情是同伴信任、暧昧拉扯，还是价值观互相改变？
- 文明级威胁是技术污染、神明系统、外敌入侵，还是世界规则崩坏？
- 建设流和思想改造只是工具，那么它们服务于哪条主线冲突？

你可以用“给我示例”“稍后决定”“不知道”回答。Novel Writer 会记录这个状态，但不会把它当作已经确认的正典。

### 可复制的开局示例

这些示例不是标准答案，只是帮助你启动访谈的输入模板。

```bash
novel story:new 星门调试员 --idea "异界穿越、轻松冒险、编程施法、队友情、文明级威胁。主角像调试系统一样修复魔法事故。"
novel interview 星门调试员 --premise "主角穿越到魔法世界，发现法术像旧系统一样有语法、依赖和运行时错误" --max-questions 8
```

```bash
novel story:new 月港补丁师 --idea "海港城冒险、低魔世界、编程施法、慢热恋爱。文明危机来自一段不断自我复制的古代咒文。"
novel interview 月港补丁师 --premise "主角靠写补丁修复咒文漏洞，逐渐卷入城市、商会和旧神遗产的冲突" --max-questions 8
```

```bash
novel story:new 王国异常日志 --idea "轻松群像、冒险调查、编程施法、文明级异常。建设和思想改造只作为解决危机的工具。"
novel interview 王国异常日志 --premise "主角团队用日志、断点和测试用例定位世界规则异常" --max-questions 8
```

## 推荐工作流

```text
init -> story:new -> next -> interview/clarify -> creative:report -> preview specify -> apply -> /plan -> /tasks -> /write -> /review -> validate
```

每一步的职责不同：

| 阶段 | 目标 |
| --- | --- |
| `novel init` | 创建小说项目、目录、模板和 agent 入口 |
| `novel story:new` | 保存作者原始想法，建立故事工作区 |
| `novel next` | 根据当前状态提示下一步该做什么 |
| `novel interview` / `novel clarify` | 访谈式澄清，不把未确认内容写成正典 |
| `novel creative:report` | 查看作者已确认内容、待澄清问题和 AI 建议风险 |
| `novel preview specify` | 生成规格写入预览 |
| `novel apply` | 确认无 blocking 风险后写入正式规格 |
| `/plan` / `/tasks` / `/write` | 在 agent 中继续规划、拆任务和写正文 |
| `/review` / `novel validate` | 检查漂移、结构、任务和写作规则 |

## 两类命令

Novel Writer 有两类入口，容易混淆：

| 入口 | 在哪里用 | 示例 |
| --- | --- | --- |
| 终端 CLI | PowerShell、Terminal、Bash | `novel status`、`novel validate`、`novel context:pack` |
| Agent 写作入口 | Codex、Claude、Gemini、Cursor 等 AI 工具 | `/novel-write`、`/novel.plan`、`/novel:review` |

斜杠命令不是终端命令。终端里运行 `novel ...`；AI 工具里使用初始化时生成的 agent prompt。

不同 agent 的命令前缀不同：

| Agent | 示例 |
| --- | --- |
| Generic Markdown | `/write` |
| Codex CLI | `/novel-write` |
| Claude Code | `/novel.write` |
| Gemini CLI | `/novel:write` |
| Continue Check | 只读检查提示，不直接写正文 |

## 创作控制权规则

Novel Writer 会尽量把“作者确认”和“AI 建议”分开：

- `source: user` 且 `confirmed: true` 的内容，才适合进入正典、规格、计划和正文。
- `source: ai-suggested`、`confirmed: false` 或跳过回答的内容，只能作为候选项。
- `不知道`、`稍后决定`、`给我示例` 会保留在澄清记录里，但不算完成回答。
- `novel review` / `novel validate` 会检查未确认 AI 建议是否被提前写入规格、任务或正文。
- `novel preview specify` 和 `novel apply` 用来把“准备写入”和“确认写入”分开。

这意味着 AI 可以积极帮你提出选项，但不能把选项伪装成你的决定。

## 高频命令

### 项目与导航

| 命令 | 作用 |
| --- | --- |
| `novel init [name]` | 初始化小说项目 |
| `novel upgrade` | 升级现有项目的命令、脚本、规范或模板 |
| `novel check` | 检查 Node.js、Git 和常见 AI CLI |
| `novel status` | 汇总项目、故事、tracking、Git 状态和下一步 |
| `novel next [story]` | 根据故事状态给出下一步建议 |
| `novel validate` | 校验项目结构、任务、tracking、world/canon、模板和写作规则 |

### 新故事与澄清

| 命令 | 作用 |
| --- | --- |
| `novel story:new <name> --idea <text>` | 新建故事工作区并保存原始灵感 |
| `novel interview [story]` | 运行 CLI 创作访谈，保存澄清记录并输出 agent handoff prompt |
| `novel clarify [story]` | `interview` 的 CLI 澄清入口，适合非 agent 环境 |
| `novel creative:report [story]` | 查看作者确认、待澄清、AI 建议和漂移风险 |
| `novel preview specify [story]` | 生成规格预览，不直接写入正式规格 |
| `novel apply <preview-id>` | 默认 dry-run；加 `--yes` 后才应用无 blocking 风险的预览 |

### 世界观、正典和结构

| 命令 | 作用 |
| --- | --- |
| `novel world:list` / `novel world:check` | 列出或校验 World Bible |
| `novel canon:list` / `novel canon:check` | 列出或校验 Canon Ledger |
| `novel entity:list` | 列出 Entity Graph 中的实体 |
| `novel graph:build` / `novel graph:check` | 生成或校验实体关系索引 |
| `novel scene:init <story>` | 为故事创建 Scene Card 模板 |
| `novel scene:list` / `novel scene:check` / `novel scene:compile` | 管理和检查场景卡 |
| `novel voice:list` / `novel voice:check` / `novel voice:sample` | 管理角色声音指纹 |
| `novel preset:list` / `novel preset:add <id>` / `novel preset:doctor` | 管理 Genre Preset |

当前内置 preset：

| Preset | 用途 |
| --- | --- |
| `xuanhuan-cultivation` | 面向玄幻、修仙、升级流的世界观字段、节奏模板和审稿权重 |

### 写作工作台

| 命令 | 作用 |
| --- | --- |
| `novel context:pack [story]` | 生成写作上下文包，明确 mustRead reason 和 allowedWrites |
| `novel context:validate <pack>` | 校验 Context Pack 的路径、reason 和过期状态 |
| `novel draft:new [story]` / `novel draft:list [story]` | 创建或列出章节草稿 |
| `novel draft:promote <draftId>` | 预览或发布章节草稿到正式正文 |
| `novel narrative:test [story]` | 运行叙事测试，检查场景闭环和章节级 fallback |
| `novel dialogue:plan` / `novel dialogue:check` / `novel dialogue:extract` | 管理对话节拍 |
| `novel branch:create` / `novel branch:list` / `novel branch:compare` / `novel branch:promote` | 管理剧情 what-if 分支 |
| `novel promise:list` / `novel promise:check` | 检查读者承诺和 payoff |
| `novel tension:chart` | 输出张力曲线 Markdown 或 JSON |
| `novel review` | 运行 reviewer loop，输出结构化 findings 和任务草稿 |
| `novel handoff [story]` | 生成断点续写上下文包 |
| `novel tasks:board [story]` | 把 `tasks.md` 导出为本地任务看板和 GitHub issue 草稿 |

### 资料、文风、编译和反馈

| 命令 | 作用 |
| --- | --- |
| `novel research:add <title>` / `novel research:list` | 添加或列出本地 Research Source |
| `novel research:link <sourceId> <targetPath>` | 把资料来源关联到 world/canon/spec/story 目标 |
| `novel research:check` | 检查 Research Source 与 citation 的本地引用关系 |
| `novel style:lint [story]` | 按 `spec/style` 规则检查正文文风 |
| `novel style:explain <ruleId>` | 解释 style rule 的 pattern、severity 和 suggestion |
| `novel compile` | 编译 Markdown manuscript，只写入 `build/` |
| `novel feedback:import <path>` / `novel feedback:list` | 导入或列出结构化读者反馈 |
| `novel feedback:triage <id>` | 更新反馈状态，不修改正文 |
| `novel feedback:to-tasks` | 把 feedback 转为待确认任务草稿，不直接写入 `tasks.md` |

### Agent integrations

| 命令 | 作用 |
| --- | --- |
| `novel agent:list` | 列出支持的 agent integrations |
| `novel agent:add <id>` | 给当前项目添加 agent integration |
| `novel agent:doctor` | 检查已安装的 agent contract、命令和 manifest |
| `novel contract:print` | 输出当前 agent contract |
| `novel contract:sync` | 同步 `.specify/agent-contract.md` 和项目入口说明 |

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

### 插件

| 命令 | 作用 |
| --- | --- |
| `novel plugins` | 显示插件帮助 |
| `novel plugins:list` | 列出已安装插件 |
| `novel plugins:add <name>` | 安装内置插件 |
| `novel plugins:remove <name>` | 移除插件 |

内置插件：

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

## 初始化选项

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
|   |-- previews/
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
        |-- idea.md
        |-- clarifications.json
        |-- clarifications.md
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
- `clarifications.json` 中 `source: ai-suggested` 或 `confirmed: false` 的内容不得静默进入 specification、tasks 或正文。
- `novel review` 会把未确认 AI 建议提前落入正文或任务的情况标为 continuity finding。
- 斜杠写作入口由 agent 使用；终端 CLI 当前没有 `novel analyze` 这类同名终端命令。

## 升级已有项目

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
