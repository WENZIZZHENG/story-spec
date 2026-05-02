# Novel Writer - AI 驱动的中文小说创作工具

[![npm version](https://badge.fury.io/js/novel-writer-cn.svg)](https://www.npmjs.com/package/novel-writer-cn)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 🚀 基于规格驱动开发（SDD）的 AI 智能小说创作助手
>
> 在 Claude、Cursor、Gemini 等 AI 助手中直接使用斜杠命令，系统化创作高质量小说

## ✨ 核心特性

- 📚 **斜杠命令** - 在 Claude、Gemini、Codex、Cursor、Windsurf、Roo Code 等 AI 助手中直接使用
- 🎯 **七步方法论** - 基于规格驱动开发（SDD）的系统化创作流程
- 🤖 **智能辅助** - AI 理解上下文，提供针对性创作建议
- 📝 **中文优化** - 专为中文小说创作设计，支持字数统计、多线索管理
- 🔄 **跨平台** - 支持 13 个 AI 工具，Windows/Mac/Linux 全平台
- 🔌 **插件系统** - 可扩展功能，如真实人声、翻译、风格模仿等
- ✅ **质量保障** - 情节追踪、时间线管理、角色一致性验证

> 📖 **详细特性说明**：查看 [CHANGELOG.md](CHANGELOG.md) 了解各版本的完整更新

## 🚀 快速开始

### 1. 安装

```bash
npm install -g novel-writer-cn
```

### 2. 初始化项目

```bash
# 基本用法
novel init my-novel

# 推荐：预装真实人声插件
novel init my-novel --plugins authentic-voice

# 指定 AI 平台
novel init my-novel --ai claude    # Claude Code
novel init my-novel --ai gemini    # Gemini CLI
novel init my-novel --ai codex     # Codex CLI
novel init my-novel --ai cursor    # Cursor
```

### 3. 开始创作

在 AI 助手中使用斜杠命令：

```
/novel.constitution    # Claude Code 格式
/novel:constitution    # Gemini CLI 格式
/novel-constitution    # Codex CLI 格式
/constitution          # 其他平台格式
```

**七步方法论流程**：
1. `/constitution` → 2. `/specify` → 3. `/clarify` →
4. `/plan` → 5. `/tasks` → 6. `/write` → 7. `/analyze`

> 📚 **详细安装说明**：[docs/installation.md](docs/installation.md)
> 📖 **完整工作流程**：[docs/workflow.md](docs/workflow.md)
> 🎯 **AI 平台命令对照**：[docs/ai-platform-commands.md](docs/ai-platform-commands.md) ⭐ **必读**

### Codex 推荐检查

Codex 项目初始化后，可先运行状态检查再决定是否进入写作：

```bash
cd my-novel
novel codex-status
novel codex-status --json
novel validate
novel validate --json
```

`codex-status` 会汇总当前故事、规格/计划/任务、追踪 JSON、Codex prompts、`AGENTS.md` 和 Git 改动，帮助判断是否已经可以直接执行 `/novel-write`。`validate` 会检查项目结构、tracking JSON、任务字段和模板缺失，适合在生成计划后或写作前做硬校验。

## 📦 升级现有项目

```bash
# 升级到最新版本
npm install -g novel-writer-cn@latest
cd my-novel
novel upgrade

# 或指定 AI 平台
novel upgrade --ai claude
```

> 📚 **完整升级指南**：[docs/upgrade-guide.md](docs/upgrade-guide.md) - 包含版本兼容性、迁移说明、回滚方法

## 📚 斜杠命令

### 命名空间说明

| AI 平台 | 命令格式 | 示例 |
|---------|----------|------|
| **Claude Code** | `/novel.命令名` | `/novel.write` |
| **Gemini CLI** | `/novel:命令名` | `/novel:write` |
| **Codex CLI** | `/novel-命令名` | `/novel-write` |
| **其他平台** | `/命令名` | `/write` |

> 💡 下表使用通用格式，实际使用时请根据您的 AI 平台添加相应前缀
> 📖 **详细命令对照**：[docs/ai-platform-commands.md](docs/ai-platform-commands.md)

### 七步方法论

| 命令 | 描述 | 何时使用 |
|------|------|----------|
| `/constitution` | 创作宪法 | 项目开始，定义核心创作原则 |
| `/specify` | 故事规格 | 像 PRD 一样定义故事需求 |
| `/clarify` | 澄清决策 | 通过 5 个问题明确模糊点 |
| `/plan` | 创作计划 | 制定章节结构和技术方案 |
| `/tasks` | 任务分解 | 生成可执行的任务清单 |
| `/write` | 章节写作 | 基于任务清单进行创作 |
| `/analyze` | 综合验证 | 智能双模式：框架分析/内容分析 |

### 追踪与验证

| 命令 | 描述 | 何时使用 |
|------|------|----------|
| `/track-init` | 初始化追踪 | 首次使用（只需一次） |
| `/checklist` | 质量检查清单 ⭐ | 规格验证（写作前）+ 内容扫描（写作后） |
| `/track` | 综合追踪 | 每完成一章后 |
| `/plot-check` | 情节检查 | 每 5-10 章定期检查 |
| `/timeline` | 时间线管理 | 重要事件后 |
| `/relations` | 关系追踪 | 角色关系变化时 |
| `/world-check` | 世界观检查 | 新设定出现后 |

> 📖 **详细命令说明**：[docs/commands.md](docs/commands.md) - 包含每个命令的详细用法、参数和最佳实践

<details>
<summary>📁 项目结构（点击展开）</summary>

```
my-novel/
├── .specify/          # Spec Kit 配置
│   ├── memory/        # 创作记忆（constitution.md等）
│   └── scripts/       # 支持脚本
├── .claude/           # Claude 命令（或 .cursor/.gemini 等）
│   └── commands/      # 斜杠命令文件
├── spec/              # 小说规格数据
│   ├── tracking/      # 追踪数据（plot-tracker.json等）
│   └── knowledge/     # 知识库（world-setting.md等）
├── stories/           # 故事内容
│   └── 001-故事名/
│       ├── specification.md    # 故事规格
│       ├── creative-plan.md    # 创作计划
│       ├── tasks.md            # 任务清单
│       └── content/            # 章节内容
└── scripts/           # 支持脚本
    ├── bash/          # Unix/Linux/Mac
    └── powershell/    # Windows
```

</details>

## 🤖 支持的 AI 助手

| AI 工具 | 说明 | 状态 |
|---------|------|------|
| **Claude Code** | Anthropic 的 AI 助手 | ✅ 推荐 |
| **Cursor** | AI 代码编辑器 | ✅ 完整支持 |
| **Gemini CLI** | Google 的 AI 助手 | ✅ TOML 格式 |
| **Windsurf** | Codeium 的 AI 编辑器 | ✅ 完整支持 |
| **Roo Code** | AI 编程助手 | ✅ 完整支持 |
| **GitHub Copilot** | GitHub 的 AI 编程助手 | ✅ 完整支持 |
| **Qwen Code** | 阿里通义千问代码助手 | ✅ TOML 格式 |
| **OpenCode** | 开源 AI 编程工具 | ✅ 完整支持 |
| **Codex CLI** | AI 编程助手 | ✅ 完整支持 |
| **Kilo Code** | AI 编程工具 | ✅ 完整支持 |
| **Auggie CLI** | AI 开发助手 | ✅ 完整支持 |
| **CodeBuddy** | AI 编程伙伴 | ✅ 完整支持 |
| **Amazon Q Developer** | AWS 的 AI 开发助手 | ✅ 完整支持 |

> 💡 使用 `novel init --all` 可以同时为所有 AI 工具生成配置

## 🛠️ CLI 命令

<details>
<summary>详细选项（点击展开）</summary>

### `novel init [name]`

```bash
novel init my-novel [选项]
```

**常用选项**：
- `--here` - 在当前目录初始化
- `--ai <type>` - 选择 AI 平台（claude/gemini/cursor等）
- `--with-experts` - 包含专家模式
- `--plugins <names>` - 预装插件（逗号分隔）
- `--all` - 生成所有 AI 平台配置

### `novel plugins`

```bash
novel plugins list                # 列出已安装插件
novel plugins add <name>          # 安装插件
novel plugins remove <name>       # 移除插件
```

### `novel upgrade`

```bash
novel upgrade [--ai <type>]       # 升级项目到最新版本
```

### `novel check`

```bash
novel check                       # 检查项目配置和状态
```

### `novel codex-status`

```bash
novel codex-status                # 查看 Codex 接手项目所需状态摘要
novel codex-status --json         # 输出结构化状态
```

### `novel validate`

```bash
novel validate                    # 校验项目结构、tracking、任务和模板
novel validate --json             # 输出结构化校验结果
```

</details>

## 📖 文档索引

### 核心文档
- **[命令详解](docs/commands.md)** - 所有斜杠命令的详细用法、参数和最佳实践
- **[工作流程](docs/workflow.md)** - 完整的创作流程说明
- **[写作方法](docs/writing-methods.md)** - 6种经典写作方法详解
- **[最佳实践](docs/best-practices.md)** - 实战经验和高级技巧

### 进阶文档
- **[实战指南](docs/writing/practical-guide.md)** - 基于真实案例的 SDD 应用
- **[升级指南](docs/upgrade-guide.md)** - 版本升级说明和迁移指南
- **[安装指南](docs/installation.md)** - 详细安装步骤
- **[字数统计](docs/word-count-guide.md)** - 中文字数统计最佳实践

### 插件与扩展
- **真实人声插件** - `novel plugins add authentic-voice`
  - 编辑 `.specify/memory/personal-voice.md` 配置个人语料
  - 使用 `/authentic-voice` 创作，`/authenticity-audit` 自查
- **翻译插件** - `novel plugins add translate`
- **风格模仿插件** - 路遥、王钰等作家风格

> 💡 使用 `novel plugins list` 查看所有可用插件

## 📈 版本历史

查看完整的更新日志：**[CHANGELOG.md](CHANGELOG.md)**

**最新版本亮点**：
- v0.15.0 - 多平台命令格式优化
- v0.14.2 - 中文字数统计修复
- v0.12.2 - Claude Code 增强层
- v0.12.0 - 多线索管理系统
- v0.10.0 - 七步方法论体系

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

项目地址：[https://github.com/wordflowlab/novel-writer](https://github.com/wordflowlab/novel-writer)

## 📄 许可证

MIT License

## 🌐 项目矩阵

WordFlowLab 围绕 AI 辅助小说创作展开多维度探索，采用不同方法论和技术栈的开源项目组合：

### 方法论探索系列

| 项目 | 方法论 | 技术特点 | 适用场景 |
|------|--------|----------|----------|
| **[Novel-Writer](https://github.com/wordflowlab/novel-writer)** ⭐ | Spec-Kit | 寄生斜杠命令，七步方法论 | 适合多平台用户，跨 13 个 AI 工具 |
| **[Article-Writer](https://github.com/wordflowlab/article-writer)** 🆕 | Spec-Kit | 九步写作流程，工作区管理 | 公众号/自媒体文章创作，降低 AI 味 |
| **[Novel-Writer-OpenSpec](https://github.com/wordflowlab/novel-writer-openspec)** | OpenSpec | 寄生斜杠命令，规格分离管理（specs/ + changes/） | 适合需要 OpenSpec 规格化管理 |
| **[Novel-Writer-Skills](https://github.com/wordflowlab/novel-writer-skills)** | Spec-Kit + Agent Skills | 寄生斜杠命令，支持 Claude Code Agent Skills | 专为 Claude Code 优化 |

### 工具实现系列

| 项目 | 类型 | 技术基础 | 说明 |
|------|------|----------|------|
| **[WriteFlow](https://github.com/wordflowlab/writeflow)** | CLI 工具 | 模仿 Claude Code 架构 | 独立 CLI，为技术型作家设计 |
| **[NovelWeave](https://github.com/wordflowlab/novelweave)** | VSCode 扩展 | Fork: Cline → Roo Code → Kilo Code → NovelWeave | 可视化小说编辑器，星尘织梦 |

### 技术演进路径

```
Spec-Kit 方法论分支:
  Novel-Writer (主线) ──┬─→ Novel-Writer-Skills (Claude Code 专版)
                       └─→ WriteFlow (CLI 独立版)

OpenSpec 方法论分支:
  Novel-Writer-OpenSpec (探索版)

VSCode 扩展分支:
  Cline → Roo Code → Kilo Code → NovelWeave (小说定制版)
```

### 选择建议

根据您的经验背景选择合适的工具：

| 用户类型 | 推荐项目 | 理由 |
|---------|---------|------|
| 🌟 **新手入门** | [NovelWeave](https://github.com/wordflowlab/novelweave) | 可视化编辑器，VSCode 扩展，最易上手 |
| 💻 **有编程基础<br>无小说经验** | [Novel-Writer](https://github.com/wordflowlab/novel-writer) <br> [Novel-Writer-Skills](https://github.com/wordflowlab/novel-writer-skills) | 七步方法论引导创作流程<br>Skills 版适合 Claude Code 用户 |
| 📚 **有编程基础<br>有小说经验** | [Novel-Writer-OpenSpec](https://github.com/wordflowlab/novel-writer-openspec) | OpenSpec 规格化管理<br>适合系统化创作和团队协作 |
| 🚀 **技术探索者<br>可贡献 PR** | [WriteFlow](https://github.com/wordflowlab/writeflow) | CLI 工具开发探索<br>欢迎贡献代码和想法 |

**快速决策**：
- **完全新手** → NovelWeave（可视化最友好）
- **用 Claude Code** → Novel-Writer-Skills（深度集成 Agent Skills）
- **跨多个 AI 工具** → Novel-Writer（支持 13 个平台）
- **追求规格化** → Novel-Writer-OpenSpec（OpenSpec 方法论）
- **喜欢命令行** → WriteFlow（纯 CLI 体验）

> 💡 **多矩阵、多方法论组合开源**：探索 AI 写作的不同可能性，欢迎根据需求选择合适的工具！

## 🙏 致谢

本项目基于 [Spec Kit](https://github.com/sublayerapp/spec-kit) 架构设计，特此感谢！

---

**Novel Writer** - 让 AI 成为你的创作伙伴！ ✨📚
