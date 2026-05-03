# Agent-Neutral 重构路线

## 状态

Completed。本文保存 Agent-neutral 重构路线的设计、批次顺序和验收口径。Batch A0-A2 已完成，后续新增 agent integration 或命令渲染能力应作为独立增强批次推进。

上一次“全面重构”阶段 0-10 已完成，归档信息已移至 [full-refactor-archive.md](full-refactor-archive.md)。新的重构目标是把 Novel Writer 从“支持多 AI 平台的小说 prompt/CLI 工具”进一步升级为“任意 agent 都能接手的小说创作协议 + 平台适配器”。

## 一句话目标

Novel Writer 的核心不绑定 Codex、Claude、Gemini 或任意单一工具；它应提供稳定的小说项目协议、agent contract、命令语义、校验规则和生成器，让不同 agent 只作为触发入口或渲染目标。

## 关键判断

- `novel` CLI 是项目管理器，不是写作 agent。
- `.specify/`、`stories/`、`spec/tracking/`、`spec/knowledge/` 是 agent-neutral 数据协议。
- slash command 是增强入口，不是唯一入口。
- `AGENTS.md` 应是通用 agent contract 的一种输出，不应只为 Codex 服务。
- `codex`、`claude`、`gemini`、`cursor` 等应该被建模为 integration/adapter，而不是产品中心概念。
- 不同 agent 的能力差异很大，需要分层支持：只读 Markdown、读写文件、slash command、脚本/CLI、MCP/自动化。

## 非目标

- 不在第一轮删除 `--ai`、`codex-status`、现有平台目录或现有 slash command 命名。
- 不在第一轮实现“直接调用 LLM 自动写小说”的运行引擎。
- 不把 Novel Writer 变成只支持某个 IDE、某个 CLI 或某个模型供应商的工具。
- 不破坏旧项目的 `.specify/`、`stories/`、`spec/` 数据布局。
- 不把成人向、高风险题材策略写死到程序；仍通过 contract、任务边界、tracking 和 validate 约束。

## 参考项目与借鉴点

| 项目 | 已核对事实 | 对 Novel Writer 的启发 |
|------|------------|------------------------|
| [github/spec-kit](https://github.com/github/spec-kit) | README 明确支持 30+ AI coding agent integrations，并用 `specify init --integration <agent>` 初始化；还提供 slash command / skills 两类安装形态。 | 把 `--ai` 演进为 `--integration`/`--agent`，把平台差异收敛到 registry 和 renderer。 |
| [Spec Kit extensions/presets](https://github.com/github/spec-kit) | 采用 project-local overrides → presets → extensions → core 的模板优先级；extensions 增加能力，presets 改造既有工作流。 | Novel Writer 的插件、风格包、类型知识、项目本地改写应共享一套 resolution stack。 |
| [agentsmd/agents.md](https://github.com/agentsmd/agents.md) | 将 `AGENTS.md` 定义为给 coding agents 的简单开放格式，是“agent 的 README”。 | 建立通用 `AGENTS.md`/agent contract，不再让 `AGENTS.md` 只承载 Codex 语义。 |
| [continuedev/continue](https://github.com/continuedev/continue) | README 描述每个 AI check 是仓库中的 Markdown 文件，位于 `.continue/checks/`，并可在 CI 中运行。 | 命令/检查/分析能力应可被普通 Markdown 表达，便于无 slash command 的 agent 手动执行，也便于未来做 CI 化质量检查。 |
| [OpenHands](https://github.com/OpenHands/OpenHands) | README 将 SDK、CLI、Local GUI、Cloud/Enterprise 分层；CLI 可由 Claude、GPT 或其他 LLM 驱动。 | Novel Writer 应拆清“核心协议/应用层”和“触发入口/界面/agent 适配”，避免入口反向污染核心模型。 |
| [Cline](https://github.com/cline/cline) | README 强调 IDE 内 agent 可创建/编辑文件、执行命令、使用浏览器，并通过 diff/checkpoint 管理改动。 | 将 agent 能力分级纳入 integration metadata：文件读写、命令执行、浏览器、checkpoint、用户确认模式。 |
| [Aider](https://github.com/Aider-AI/aider) | README 将 aider 定位为 terminal 中的 AI pair programming，可在现有代码库上协作。 | 对“已有小说项目接手”优化：contract、handoff、status、validate 必须比 init 更重要。 |

## 目标形态

### 用户视角

```bash
novel init my-novel --agent codex
novel init my-novel --agent claude
novel init my-novel --agent generic
novel init my-novel --all-agents

novel agent:list
novel agent:add gemini
novel agent:doctor
novel contract:print
novel contract:sync
```

兼容旧入口：

```bash
novel init my-novel --ai codex
novel upgrade --ai claude
novel codex-status --json
```

### 项目协议视角

```text
my-novel/
├── AGENTS.md                         # 通用 agent contract 输出
├── .specify/
│   ├── config.json
│   ├── agent-contract.md             # contract 源文件或同步副本
│   ├── commands/                     # generic agent 可直接读取的命令说明
│   ├── integrations/                 # 已安装 agent/integration 状态
│   ├── memory/
│   ├── templates/
│   └── scripts/
├── .codex/prompts/                   # Codex adapter 输出
├── .claude/commands/                 # Claude adapter 输出
├── .gemini/commands/                 # Gemini adapter 输出
├── stories/
└── spec/
```

### 代码视角

```text
src/
  agent/
    contract.ts                       # agent-neutral contract model
    capabilities.ts                   # 能力分层：read/write/shell/slash/mcp/browser
    registry.ts                       # AgentIntegration registry
    compatibility.ts                  # --ai 兼容映射与迁移提示
  prompt/
    command-spec.ts                   # 命令语义，不含平台格式
    compiler.ts
    renderers/
      generic-markdown.ts
      agents-md.ts
      claude.ts
      gemini.ts
      codex.ts
  application/
    install-agent-integration.ts
    sync-agent-contract.ts
    get-project-status.ts
    validate-project.ts
  validation/
    agent-contract-rules.ts
```

## 概念模型重构

### 从 AIPlatform 到 AgentIntegration

当前事实源是 `src/utils/ai-platforms.ts`。重构后建议迁移为：

```ts
type AgentIntegrationId =
  | 'generic'
  | 'codex'
  | 'claude'
  | 'gemini'
  | 'cursor'
  | 'windsurf'
  | 'roocode'
  | 'copilot'
  | 'qwen'
  | 'opencode'
  | 'kilocode'
  | 'auggie'
  | 'codebuddy'
  | 'q'
  | string;

interface AgentIntegration {
  id: AgentIntegrationId;
  displayName: string;
  kind: 'cli' | 'ide' | 'web' | 'generic' | 'ci' | 'mcp';
  commandSurface: 'slash-command' | 'skill' | 'markdown-command' | 'manual';
  capabilities: AgentCapabilities;
  installTargets: InstallTarget[];
  renderer: RendererId;
  slashPrefix?: string;
  legacyAiId?: string;
}
```

能力模型：

```ts
interface AgentCapabilities {
  readFiles: boolean;
  writeFiles: boolean;
  runShell: boolean;
  supportsSlashCommands: boolean;
  supportsSkills: boolean;
  supportsProjectInstructions: boolean;
  supportsMcp: boolean;
  supportsBrowser: boolean;
  supportsCheckpoints: boolean;
  requiresHumanApproval?: boolean;
}
```

验收标准：

- `AI_PLATFORM_IDS` 继续作为兼容导出，但内部使用 `AGENT_INTEGRATION_IDS`。
- `formatAICommand` 增加兼容 wrapper，核心调用改用 `formatAgentCommand`。
- `novel init --ai codex` 输出 deprecation warning，但行为不变。
- `novel init --agent codex` 成为文档主路径。

## Agent Contract 设计

### Contract 源文件

建议新增源模板：

```text
templates/agent/agent-contract.md
```

初始化后输出：

```text
.specify/agent-contract.md
AGENTS.md
```

`AGENTS.md` 是给支持该约定的 agent 直接读取的入口；`.specify/agent-contract.md` 是 Novel Writer 自己的协议源，便于 `contract:sync` 和 validate 对比。

`novel contract:sync` 默认以项目内 `.specify/agent-contract.md` 为源，同步根目录 `AGENTS.md`；当项目 contract 缺失，或用户显式传入 `--from-template` 时，才从包模板 `templates/agent/agent-contract.md` 渲染并重建两份 contract 文件。

### Contract 必须包含

- 项目身份：这是 Novel Writer 小说项目，而不是代码开发项目。
- 读取顺序：
  1. `AGENTS.md`
  2. `.specify/agent-contract.md`
  3. `.specify/memory/constitution.md`
  4. `stories/*/specification.md`
  5. `stories/*/creative-plan.md`
  6. `stories/*/tasks.md`
  7. `spec/tracking/*.json`
  8. `spec/knowledge/*`
  9. `stories/*/content/*`
- 写入边界：默认只写当前任务允许修改的文件。
- 任务状态规则：`todo`、`in_progress`、`done` 的更新时机。
- tracking 更新规则：写章节后必须同步角色、关系、时间线、情节数据。
- handoff 规则：长会话结束前生成或更新 `handoff.md`。
- validate 规则：阶段完成前运行 `novel validate` 或说明无法运行。
- 高风险内容边界：只处理剧情功能、人物动机、同意边界、后果和任务标注，不扩写未授权内容。
- agent 能力降级策略：不能执行 CLI 时如何手动读取 `.specify/commands/*.md`。

### Contract renderer

| 输出 | 用途 |
|------|------|
| `AGENTS.md` | 通用 agent 指令入口 |
| `.specify/agent-contract.md` | Novel Writer 协议源文件 |
| `.codex/AGENTS.md` 或项目根 `AGENTS.md` profile 段 | Codex 特定增强 |
| `.gemini/GEMINI.md` | Gemini 特定 project instruction |
| `.continue/checks/novel-*.md`（后续可选） | Continue 风格 CI/PR 检查 |

## 命令语义与渲染拆分

### 当前问题

`templates/commands/*.md` 同时承担：

- 命令元数据。
- 平台 frontmatter。
- 脚本路径。
- agent 行为提示。
- 小说领域逻辑。

这会导致新增平台或无 slash command agent 时，需要在同一份模板里塞入越来越多适配逻辑。

### 目标结构

```text
templates/
  commands/
    write.command.yaml          # command spec
    write.prompt.md             # agent-neutral prompt body
    write.examples.md           # 可选示例
  agent/
    agent-contract.md
  renderers/
    codex.prompt.hbs
    claude.command.hbs
    gemini.toml.hbs
    generic.command.hbs
```

`command.yaml` 示例：

```yaml
id: write
title: 章节写作
stage: drafting
description: 基于任务清单执行章节写作
arguments:
  hint: "[章节编号或任务ID]"
requiredReads:
  - .specify/memory/constitution.md
  - stories/*/specification.md
  - stories/*/creative-plan.md
  - stories/*/tasks.md
  - spec/tracking/*.json
allowedWrites:
  - stories/*/content/**
  - spec/tracking/**
scripts:
  check:
    capability: check-writing-state
    sh: .specify/scripts/bash/check-writing-state.sh
    ps: .specify/scripts/powershell/check-writing-state.ps1
risk:
  requiresTaskBoundary: true
  highRiskContentPolicy: use-task-boundary
```

验收标准：

- 每个命令语义只定义一次。
- generic Markdown、Codex prompt、Claude command、Gemini TOML 都由 renderer 生成。
- 旧 `templates/commands/*.md` 可在第一阶段继续作为 source，后续再迁移到 YAML + prompt body。
- `build:commands` 结果与旧 manifest 变化可解释、可审查。

## Generic Integration

### 为什么需要 generic

任意 agent 不一定支持 slash command，但多数 agent 至少能读 Markdown。`generic` integration 的目标是让用户可以说：

```text
请读取 .specify/commands/write.md 并按其中流程执行。
```

### 输出内容

```text
.specify/commands/
  constitution.md
  specify.md
  clarify.md
  plan.md
  tasks.md
  write.md
  analyze.md
  track-init.md
  track.md
  timeline.md
  relations.md
  checklist.md
  expert.md
```

每个 generic command 应包含：

- 目的。
- 前置条件。
- 必须读取。
- 允许写入。
- 执行步骤。
- 输出位置。
- 完成后验证。
- 无法执行 shell/CLI 时的降级方案。

验收标准：

- `novel init my-novel --agent generic` 不生成任何特定平台目录，但项目可被任意 agent 手动使用。
- `novel validate` 能检查 `.specify/commands/*.md` 是否存在。
- README 主路径同时给出 `--agent codex` 和 `--agent generic`。

## CLI 命令规划

### 新增命令

| 命令 | 作用 | 阶段 |
|------|------|------|
| `novel agent:list` | 列出支持的 agent integrations、能力和安装目标 | A1 |
| `novel agent:add <id>` | 给现有项目添加 agent integration | A2 |
| `novel agent:remove <id>` | 移除 agent integration 产物，保留项目数据 | A3 |
| `novel agent:doctor` | 检查已安装 agent integration 是否缺文件或过期 | A2 |
| `novel contract:print` | 输出当前 agent contract | A1 |
| `novel contract:sync` | 从源模板同步 `AGENTS.md` 和平台说明文件 | A2 |
| `novel commands:build` | 用户可显式重建当前项目命令产物 | A3 |

### 兼容命令

| 旧入口 | 新入口 | 策略 |
|--------|--------|------|
| `--ai <type>` | `--agent <id>` | 继续支持，输出提示 |
| `--all` | `--all-agents` | 继续支持，内部映射 |
| `codex-status` | `status` | 保留别名 |
| `src/utils/ai-platforms.ts` | `src/agent/registry.ts` | 先 wrapper，后迁移 |

## 插件/扩展/预设重构

### 目标

沿用 Spec Kit 的思想，但使用 Novel Writer 术语：

- Extension：新增能力，例如翻译、拆书、类型知识库、外部平台同步。
- Preset：改造既有流程，例如玄幻网文、现实主义、慢热恋爱、成人向边界、出版审稿。
- Project override：单个小说项目的本地修改。
- Core：Novel Writer 默认命令、模板、schema、规则。

### Resolution stack

```text
1. project-local overrides   .specify/templates/overrides/
2. presets                   .specify/presets/*/
3. extensions                .specify/extensions/*/
4. core                      .specify/templates/
```

### 需要调整

- 现有 `plugins/*/config.yaml` 增加 `kind: extension | preset | style-pack | market-bridge`。
- 插件命令安装不再直接复制到平台目录，而是先进入 command spec registry，再由 renderer 输出。
- 同名命令冲突按 stack 解决，并在 `agent:doctor` 中显示最终来源。
- `plugins:add` 保留为当前统一入口；`extension:add` / `preset:add` 延后到领域包成型后作为薄 alias 评估。

## 数据与迁移策略

### `.specify/config.json` 建议新增

```json
{
  "name": "my-novel",
  "type": "novel",
  "version": "0.x.x",
  "method": "three-act",
  "integrations": [
    {
      "id": "codex",
      "installedAt": "2026-05-02T00:00:00.000Z",
      "renderer": "codex",
      "commandSurface": "slash-command"
    }
  ],
  "legacy": {
    "ai": "codex"
  }
}
```

### 迁移策略

1. 读取旧 `ai` 字段。
2. 如果存在平台目录，自动推断 integrations。
3. 写入 `integrations`，保留 `ai`。
4. 生成 `.specify/agent-contract.md`。
5. 同步 `AGENTS.md` 和 generic commands。
6. 不覆盖用户 `stories/`、`spec/tracking/`、`spec/knowledge/`。

## 批次化开发计划

后续执行以 Batch 为单位。旧 A0-A7 细项已合并为下列批次；细项只作为覆盖范围说明，不再作为独立开发门槛。

## 已完成批次

- [x] Batch A0：Agent-neutral 基线与入口。覆盖原 A0-A3 与 shared N001-N006，详情见 [full-refactor-completed.md](full-refactor-completed.md)。
- [x] Batch A1：CommandSpec 与插件统一。覆盖原 A4-A5，详情见 [full-refactor-completed.md](full-refactor-completed.md)。
- [x] Batch A2a：脚本能力降级。覆盖原 A6-T001，详情见 [full-refactor-completed.md](full-refactor-completed.md)。
- [x] Batch A2：Agent 能力与文档收口。覆盖原 A6-T002、A6-T003、A6-T004、A7-T001 至 A7-T005，以及 shared N007，详情见 [full-refactor-completed.md](full-refactor-completed.md)。

## 后续批次

Agent-neutral 路线当前主批次已完成。后续如实现 `agent:remove`、`commands:build`、CommandSpec YAML 全量迁移或 Continue checks，应作为新增增强批次推进，不回滚 A0-A2 完成状态。
