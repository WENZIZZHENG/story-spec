# Novel Writer Agent-Neutral 重构路线图

## 状态

Active planning。本文是后续开发的路线图，只记录设计、任务顺序、验收口径和历史归档；当前阶段不立即进入代码实现。

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

## 写作与世界观参考项目

| 项目 | 已核对事实 | 对 Novel Writer 的启发 |
|------|------------|------------------------|
| [novelWriter](https://github.com/vkbo/novelWriter) | GitHub README 说明它用 human readable text files 存储，适合版本控制和同步；官方功能强调多文档拆分、notes、synopsis、metadata、tags/references。 | Novel Writer 应坚持本地 Markdown/JSON 可读文件，同时强化 synopsis、metadata、tags/references，让世界观和正文互相可追溯。 |
| [Manuskript](https://github.com/olivierkes/manuskript) | README 将其定位为 open-source writer tool，并展示 story line、plot、character、频率分析、自动保存、开放纯文本格式等能力。 | 需要补齐“故事线/角色/世界/情节”工作台，而不是只有章节生成；频率/重复/用词分析可进入质量检查。 |
| [Longform](https://github.com/kevboh/longform) | README 描述它把 notes/scenes 组织成有序 manuscript，支持 Scenes/Project/Compile、场景列表、draft/project word counts 和 compile workflow。 | Novel Writer 应引入 Scene Card、Draft/Revision、Compile/Export 工作流，把章节拆成可重排、可验证的场景单元。 |
| [NousResearch/autonovel](https://github.com/NousResearch/autonovel) | README 的 pipeline 第一阶段构建 world、characters、outline、voice、canon；后续顺序写章节，并有 revise/typeset/illustrate/narrate 等流程。 | 最值得借鉴的是 foundation-first：World Bible、Characters、Voice、Canon 必须成为写作前的基础资产，并随正文反向更新。 |
| [KazKozDev/NovelGenerator](https://github.com/KazKozDev/NovelGenerator) | README 描述 coordinated multi-agent system、Story Context Database、persistent tracking of character states、plot threads、world facts，以及 consistency checking。 | Novel Writer 需要 Story Context DB/Canon Ledger，把角色状态、世界事实、情节线、时间线做成可查询、可校验的持久上下文。 |
| [Plot Bunni](https://plotbunni.com/) | 项目站点说明其组织 characters、locations、lore 等 story building blocks，并支持 hierarchical story planning（acts、chapters、scenes）。 | 需要把“设定资料”升级成 typed building blocks，并把 act/chapter/scene 的层级结构显式化。 |

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
- `plugins:add` 保留兼容，但文档逐步迁移到 `extension:add` 或 `preset:add` 是否另行决策。

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

## 世界观与写作质量能力设计

本节是后续让 Novel Writer 真正帮助“建立完整小说世界观、写出更好正文”的核心路线。它与 agent-neutral 重构并行：agent-neutral 解决“谁来触发”，本节解决“写什么、怎么保持世界一致、怎么持续变好”。

### 设计原则

- 世界观不是百科，而是剧情约束系统。每条设定都必须说明剧情功能、适用范围、边界和修改影响。
- 章节不是孤立正文，而是 scene cards 的渲染结果。每个场景都应知道 POV、地点、时间、目标、冲突、结果和承担的揭示/伏笔职责。
- Canon 是已经生效的事实，不等同于草稿设定。正文一旦写入读者可见事实，就需要进入 Canon Ledger。
- 任何世界观修改都要产生 propagation debt：哪些章节、任务、角色状态、关系、伏笔需要重新检查。
- 质量检查要从单点一致性升级为 reviewer loop：普通读者、类型读者、编辑、世界观审稿人、角色审稿人分别给出不同维度反馈。

### World Bible

目标：把 `spec/knowledge/world-setting.md` 升级为结构化 World Bible，同时保留 Markdown 可读性。

建议目录：

```text
spec/world/
  world-bible.md
  rules.yaml
  factions.yaml
  locations.yaml
  history.yaml
  systems.yaml
  artifacts.yaml
  glossary.yaml
```

核心对象：

```ts
interface WorldFact {
  id: string;
  type: 'rule' | 'location' | 'faction' | 'history' | 'system' | 'artifact' | 'custom';
  name: string;
  summary: string;
  storyFunction: string;
  constraints: string[];
  firstMention?: string;
  relatedEntities: string[];
  visibility: 'author-only' | 'reader-known' | 'partial-reveal';
  mutable: boolean;
  source: string;
}
```

命令规划：

```bash
novel world:init
novel world:add --type faction
novel world:list --type location
novel world:check
novel world:impact "修改灵气体系"
```

验收标准：

- 新项目初始化时可生成最小 `spec/world/world-bible.md` 和 typed YAML/JSON 模板。
- `novel validate` 能检查 WorldFact 是否缺少 `storyFunction` 或 `constraints`。
- `/write` 或 generic `write.md` 必须把相关 WorldFact 作为写作前上下文。
- `world:impact` 能列出受影响的章节、任务、角色和 canon facts，即使第一版只是基于显式引用。

### Canon Ledger

目标：记录“已经成为小说事实”的内容，并追踪修改影响。

建议目录：

```text
spec/canon/
  facts.md
  facts.json
  contradictions.md
  propagation-debt.json
```

核心对象：

```ts
interface CanonFact {
  id: string;
  statement: string;
  category: 'character' | 'world' | 'plot' | 'relationship' | 'timeline' | 'style';
  evidence: CanonEvidence[];
  firstChapter?: string;
  readerVisibility: 'known' | 'hidden' | 'misdirection' | 'revealed-later';
  reversible: boolean;
  affectedEntities: string[];
  supersedes?: string[];
}

interface CanonEvidence {
  path: string;
  quote?: string;
  chapter?: string;
  sceneId?: string;
}

interface PropagationDebt {
  id: string;
  reason: string;
  changedFactId: string;
  affectedPaths: string[];
  requiredActions: Array<'review' | 'rewrite' | 'update-tracking' | 'update-world' | 'update-task'>;
  severity: 'error' | 'warning' | 'info';
  status: 'open' | 'resolved';
}
```

命令规划：

```bash
novel canon:add
novel canon:list
novel canon:check
novel canon:diff
novel canon:impact <fact-id>
novel canon:resolve <debt-id>
```

AI slash/generic 命令规划：

```text
/canon-update     # 从新章节提取新增事实，更新 canon
/canon-check      # 检查正文与 canon 冲突
/impact           # 评估修改某设定/事实的影响范围
```

验收标准：

- 写完章节后，`handoff` 或 `/write` 完成步骤提示更新 Canon Ledger。
- `canon:check` 能发现同一实体互斥事实，例如角色年龄、地点归属、能力边界冲突。
- `canon:diff` 能比较章节新增事实与已有 canon，并输出新增、冲突、待确认三类。
- 修改 WorldFact 或 CanonFact 时生成 propagation debt，不直接自动重写正文。

### Entity Graph

目标：把角色、地点、组织、物品、事件、线索、世界规则做成可查询图谱，支持长篇一致性和影响分析。

建议目录：

```text
spec/graph/
  entities.json
  edges.json
  indexes.json
```

核心对象：

```ts
interface StoryEntity {
  id: string;
  type: 'character' | 'location' | 'faction' | 'item' | 'event' | 'concept' | 'clue' | 'rule';
  name: string;
  aliases: string[];
  status: 'active' | 'inactive' | 'dead' | 'unknown' | 'retired';
  sourcePaths: string[];
  tags: string[];
}

interface StoryEdge {
  id: string;
  from: string;
  to: string;
  relation: string;
  evidencePaths: string[];
  timeRange?: {
    start?: string;
    end?: string;
  };
  confidence: 'explicit' | 'inferred' | 'draft';
}
```

命令规划：

```bash
novel entity:list --type character
novel entity:show <id>
novel graph:build
novel graph:query "沈玉卿知道哪些秘密"
novel graph:impact <entity-id>
```

验收标准：

- 第一版可以从 `character-profiles.md`、`relationships.json`、`timeline.json`、`plot-tracker.json` 和 Canon Ledger 构建图谱。
- graph 需要记录 evidencePaths，不能只有 AI 推断。
- `validate` 能检查 edge 引用不存在 entity 的错误。
- `handoff` 能把下一任务相关 entity 子图写入上下文包。

### Scene Cards

目标：把章节正文背后的结构显式化，支持重排、审稿、节奏分析和编译导出。

建议目录：

```text
stories/001-story/
  scenes/
    scene-001.yaml
    scene-002.yaml
  content/
    chapter-001.md
```

核心对象：

```ts
interface SceneCard {
  id: string;
  chapter: string;
  order: number;
  pov: string;
  location: string;
  time: string;
  sceneGoal: string;
  conflict: string;
  outcome: string;
  emotionalTurn: string;
  worldElements: string[];
  canonFacts: string[];
  reveals: string[];
  foreshadowing: {
    planted: string[];
    paidOff: string[];
  };
  requiredReads: string[];
  allowedWrites: string[];
  draftPath?: string;
}
```

命令规划：

```bash
novel scene:init
novel scene:list
novel scene:check
novel scene:compile
novel scene:move <scene-id> --after <scene-id>
```

AI 命令规划：

```text
/scene-plan       # 从 creative-plan/tasks 生成 scene cards
/scene-write      # 按 scene card 写正文
/scene-review     # 检查场景目标、冲突、结果是否成立
```

验收标准：

- `/tasks` 后可以选择生成 scene cards。
- `/write` 可按章节任务或 scene card 写作；若 scene card 存在，优先使用 scene card。
- `scene:check` 能发现缺 POV、缺冲突、缺 outcome、scene order 重复、scene 引用不存在 entity。
- `scene:compile` 第一版只需按顺序拼接正文路径或输出章节草稿清单。

### Reveal Pacing 与 World Density

目标：检查设定揭示节奏和世界观密度，避免设定堆砌或设定断裂。

检查维度：

- 每章新增 WorldFact/CanonFact 数量。
- 每章设定解释字数占比。
- 新设定是否有场景承载。
- 是否存在“先用后解释”或“解释后长期不用”的悬空设定。
- 关键规则是否首次出现太晚。
- 伏笔、线索、反转是否有足够提前量。

命令规划：

```bash
novel analyze --focus=world-density
novel analyze --focus=reveal-pacing
novel analyze --focus=foreshadowing
```

验收标准：

- 输出按 chapter/scene 分组，而不是只给总评。
- 每条问题必须引用 WorldFact/CanonFact/SceneCard 或正文路径。
- severity 遵循现有 `error|warning|info`。
- 第一版可采用启发式统计，后续再接 AI reviewer。

### Character Voice Fingerprint

目标：让角色对白更稳定，避免所有人物说话都像同一个 AI。

建议目录：

```text
spec/voice/
  character-voices.yaml
  narrator-voice.md
  samples/
    character-001.md
```

核心对象：

```ts
interface VoiceFingerprint {
  characterId: string;
  sentenceLength: 'short' | 'mixed' | 'long';
  diction: string[];
  forbiddenWords: string[];
  addressRules: Record<string, string>;
  emotionalExpression: string;
  conflictStyle: 'avoidant' | 'direct' | 'sarcastic' | 'silent' | 'performative';
  lieMarkers: string[];
  samplePaths: string[];
}
```

命令规划：

```bash
novel voice:init
novel voice:check
novel voice:sample <character-id>
```

AI 命令规划：

```text
/voice-fingerprint     # 从已有正文提取角色声音指纹
/voice-rewrite         # 按角色声音重写指定对话
```

验收标准：

- `voice:check` 能检查禁用词、称呼错误、角色声音样本缺失。
- `/write` 写对话前必须读取相关 `VoiceFingerprint`。
- reviewer loop 中加入“角色声音审稿人”。

### Reviewer Loop

目标：把 `/analyze` 从单一评价升级为多角色审稿循环。

建议 reviewer：

- 普通读者：是否看懂、是否想读下一章。
- 类型读者：是否满足类型承诺，例如玄幻爽点、权谋博弈、恋爱张力。
- 编辑：节奏、重复、结构松散、信息密度。
- 世界观审稿人：规则是否自洽、设定是否突然。
- 角色审稿人：动机、对白、关系变化是否可信。
- Continuity 审稿人：canon、timeline、relationship、scene card 是否冲突。

建议输出：

```json
{
  "reviewers": [
    {
      "id": "worldbuilding",
      "score": 82,
      "findings": [
        {
          "severity": "warning",
          "path": "stories/001/content/chapter-003.md",
          "message": "灵气规则首次用于战斗，但 WorldFact 中没有代价约束"
        }
      ]
    }
  ],
  "nextActions": []
}
```

命令规划：

```bash
novel review
novel review --panel world,character,editor
novel review --chapter 003
novel review --json
```

AI 命令规划：

```text
/review-panel
/review-world
/review-character
/review-reader
```

验收标准：

- reviewer findings 可进入 `novel validate` 或单独 `novel review --json`。
- 每条 finding 必须有路径、严重级别、依据和建议动作。
- reviewer loop 不直接改正文，只生成建议和任务草稿。

### 类型 Preset 包

目标：把“玄幻、权谋、恋爱、悬疑”等类型的世界观字段、节奏模板、检查规则沉淀为 preset。

建议内置 preset：

```text
presets/
  xuanhuan-cultivation/
  court-intrigue/
  urban-fantasy/
  mystery/
  romance-slow-burn/
  realism/
```

每个 preset 包含：

- World Bible 必填字段。
- 角色功能位。
- 常见场景类型。
- 节奏模板。
- 常见错误清单。
- reviewer 权重。
- validate 规则增强。

命令规划：

```bash
novel preset:list
novel preset:add xuanhuan-cultivation
novel preset:doctor
```

验收标准：

- preset 不覆盖用户正文，只新增/增强模板、规则和 reviewer 配置。
- `/specify`、`/plan`、`/tasks` 能读取当前 preset。
- `validate` 能按 preset 检查必填世界观字段。

## 分阶段任务

## 阶段 A0：基线与决策记录

目标：只整理现状，不改行为。

- [ ] A0-T001：新增架构决策记录 `docs/tech/agent-neutral-refactor.md`，说明 `AIPlatform` → `AgentIntegration` 的原因、非目标和兼容策略。
- [ ] A0-T002：盘点现有平台输出目录、命令格式、renderer、测试覆盖，形成表格。
- [ ] A0-T003：确定命名：`--agent`、`--integration` 二选一作为主命令参数；另一个可作为别名或暂不引入。
- [ ] A0-T004：确定 `AGENTS.md` 与 `.specify/agent-contract.md` 的主从关系。
- [ ] A0-T005：更新测试计划，但不改源码。

验收：

- 无运行时行为变化。
- `docs/tech/full-refactor-todo.md` 与 ADR 一致。
- 本阶段只允许文档变更。

## 阶段 A1：AgentIntegration Registry

目标：建立新模型，但保持旧 API 兼容。

- [ ] A1-T001：新增 `src/agent/capabilities.ts`。
- [ ] A1-T002：新增 `src/agent/registry.ts`，迁移当前 13 个平台，并加入 `generic`。
- [ ] A1-T003：保留 `src/utils/ai-platforms.ts` 作为兼容 wrapper。
- [ ] A1-T004：新增 `novel agent:list`，输出 id、displayName、commandSurface、capabilities、installTargets。
- [ ] A1-T005：为 registry 增加单元测试，覆盖旧 id 与新 id 一致性。

验收：

- `npm run build` 通过。
- 旧 `init --ai codex`、`init --all` smoke 不变。
- `agent:list --json` 可被自动化读取。

## 阶段 A2：Agent Contract 与 Generic Commands

目标：让无 slash command 的任意 agent 也能使用 Novel Writer。

- [ ] A2-T001：新增 `templates/agent/agent-contract.md`。
- [ ] A2-T002：初始化时生成 `.specify/agent-contract.md`。
- [ ] A2-T003：初始化时生成通用 `AGENTS.md`，Codex profile 作为可选增强段。
- [ ] A2-T004：新增 `generic` renderer，输出 `.specify/commands/*.md`。
- [ ] A2-T005：新增 `novel contract:print` 与 `novel contract:sync`。
- [ ] A2-T006：`validate` 增加 contract/commands 缺失检查。

验收：

- `novel init smoke --agent generic --no-git` 后不存在平台特定目录，但存在 `AGENTS.md`、`.specify/agent-contract.md`、`.specify/commands/write.md`。
- 任意 generic command 文档包含目的、必须读取、允许写入、执行步骤、验证和降级方案。
- `novel validate --json` 能识别 generic 项目为合法。

## 阶段 A3：CLI 参数兼容与项目升级

目标：将用户主路径从 `--ai` 迁移到 `--agent`，但不中断旧项目。

- [ ] A3-T001：`init` 支持 `--agent <id>`、`--all-agents`。
- [ ] A3-T002：`upgrade` 支持 `--agent <id>`、`--all-agents`。
- [ ] A3-T003：旧 `--ai`、`--all` 输出简短兼容提示。
- [ ] A3-T004：新增 `novel agent:add <id>`。
- [ ] A3-T005：新增 `novel agent:doctor`，检查 contract、平台命令目录、manifest、renderer 版本。
- [ ] A3-T006：升级旧项目时推断并写入 `.specify/config.json.integrations`。

验收：

- 旧命令测试继续通过。
- 新命令 smoke 覆盖 `--agent codex`、`--agent generic`、`agent:add gemini`。
- README 和 docs 使用新主路径。

## 阶段 A4：Command Spec 拆分

目标：命令语义和平台格式解耦。

- [ ] A4-T001：定义 `CommandSpec` 类型。
- [ ] A4-T002：选 2 个命令试点迁移：`write`、`analyze`。
- [ ] A4-T003：renderer 兼容旧 Markdown 模板和新 CommandSpec。
- [ ] A4-T004：`build:commands` manifest 标记命令来源。
- [ ] A4-T005：编写迁移指南：如何把旧 `templates/commands/*.md` 拆成 `.command.yaml` + `.prompt.md`。

验收：

- `write`、`analyze` 的 Codex/Claude/Gemini/generic 输出均可生成。
- 输出变化通过 manifest 审核。
- 未迁移命令仍走旧模板路径。

## 阶段 A5：插件、预设、扩展统一

目标：插件接入新 registry 和 resolution stack。

- [ ] A5-T001：扩展 `PluginManifest`，增加 `kind`、`priority`、`provides`、`overrides`。
- [ ] A5-T002：插件命令先注册到 command spec registry，再由 agent renderer 输出。
- [ ] A5-T003：实现 project override / preset / extension / core 的最终来源诊断。
- [ ] A5-T004：`plugins:add --dry-run` 显示对所有 agent integration 的影响。
- [ ] A5-T005：评估是否新增 `preset:add`、`extension:add`，或继续复用 `plugins:add`。

验收：

- 内置插件安装行为不退化。
- 同名命令冲突能解释来源和解决结果。
- `agent:doctor` 可显示插件命令是否已同步到所有已安装 agent。

## 阶段 A6：Agent 能力感知执行

目标：让 prompt/contract 能根据 agent 能力降级。

- [ ] A6-T001：renderer 根据 `capabilities.runShell` 决定是否写入 CLI/脚本步骤。
- [ ] A6-T002：renderer 根据 `capabilities.writeFiles` 决定写入“只读建议”或“可执行修改”模式。
- [ ] A6-T003：对 `generic`、`continue-check` 这类偏只读入口，生成 read-only analyze/checklist 版本。
- [ ] A6-T004：`handoff` 增加 `targetAgent` 可选参数，输出适配目标 agent 的继续步骤。

验收：

- `generic` 不要求 slash command。
- 只读 agent 不会被提示直接写正文。
- 支持 shell 的 agent 才看到脚本执行作为主路径。

## 阶段 A7：文档、发布与弃用节奏

目标：用户知道为什么迁移、如何迁移、旧入口什么时候还可用。

- [ ] A7-T001：README 改为 agent-neutral 主叙事。
- [ ] A7-T002：新增 `docs/agent-integrations.md`。
- [ ] A7-T003：新增 `docs/agent-contract.md`。
- [ ] A7-T004：更新 `docs/migration-guide.md`，加入 `--ai` 到 `--agent` 的迁移说明。
- [ ] A7-T005：CHANGELOG 记录兼容期和弃用策略。

验收：

- 新用户 5 分钟路径包含 `--agent generic` 和一个具体平台示例。
- 旧用户能找到 `--ai` 的兼容说明。
- 所有“Codex 接手”表述改为“agent 接手”，Codex 只在平台章节出现。

## 阶段 B0：世界观基线与 ADR

目标：确定 World Bible、Canon Ledger、Scene Cards 的最小可交付边界，避免一次性做成大型写作软件。

- [ ] B0-T001：新增 ADR `docs/tech/worldbuilding-quality-roadmap.md`，说明为什么引入 World Bible、Canon Ledger、Entity Graph、Scene Cards。
- [ ] B0-T002：盘点现有 `spec/knowledge/*`、`spec/tracking/*`、`stories/*` 与新模型的映射关系。
- [ ] B0-T003：决定第一版结构化格式：YAML、JSON、Markdown frontmatter 的边界。
- [ ] B0-T004：定义最小 schema：`WorldFact`、`CanonFact`、`StoryEntity`、`StoryEdge`、`SceneCard`、`VoiceFingerprint`。
- [ ] B0-T005：补充迁移策略：已有项目如何从 `world-setting.md`、`character-profiles.md`、`relationships.json` 迁移。

验收：

- 本阶段只允许文档和 schema 草案，不改生成行为。
- ADR 明确第一版不做数据库、不做复杂可视化、不做自动全文重写。

## 阶段 B1：World Bible MVP

目标：让世界观从松散笔记升级为可校验的剧情约束。

- [ ] B1-T001：新增 `templates/world/`，包含 `world-bible.md`、`rules.yaml`、`factions.yaml`、`locations.yaml`、`history.yaml`、`systems.yaml`、`artifacts.yaml`。
- [ ] B1-T002：`init` 生成 `spec/world/` 模板；`upgrade` 可选择补齐缺失模板。
- [ ] B1-T003：新增 `src/domain/world-fact.ts` 与 parser/validator。
- [ ] B1-T004：`novel validate` 检查 WorldFact 缺 `storyFunction`、缺 `constraints`、引用不存在 entity。
- [ ] B1-T005：新增 `novel world:list`、`novel world:check`。
- [ ] B1-T006：`/write` 和 generic `write.md` 加入 World Bible 读取顺序。

验收：

- 新项目有 `spec/world/`。
- `novel validate --json` 输出 world issue。
- 没有 World Bible 的旧项目只给 warning，不阻断写作。

## 阶段 B2：Canon Ledger 与传播债务

目标：把“正文已经写成事实”的内容记录下来，并在设定变更时产生可追踪的影响清单。

- [ ] B2-T001：新增 `templates/canon/facts.md`、`facts.json`、`contradictions.md`、`propagation-debt.json`。
- [ ] B2-T002：新增 `src/domain/canon.ts`，定义 `CanonFact`、`CanonEvidence`、`PropagationDebt`。
- [ ] B2-T003：新增 `novel canon:list`、`novel canon:check`、`novel canon:diff`、`novel canon:impact`。
- [ ] B2-T004：`handoff` 增加 canon 摘要、open propagation debt 数量、下一任务相关 canon facts。
- [ ] B2-T005：`/write` 完成步骤新增 canon update checklist。
- [ ] B2-T006：新增 `/canon-update`、`/canon-check` 或 generic command 文档。

验收：

- `canon:check` 能发现明显互斥事实和 evidence 缺失。
- `canon:impact` 能基于 evidencePaths/affectedEntities 输出受影响路径。
- 写作流程不会自动重写正文，只生成 debt 和建议动作。

## 阶段 B3：Entity Graph

目标：将角色、地点、组织、物品、事件、线索、规则连接成可查询图谱。

- [ ] B3-T001：新增 `spec/graph/entities.json`、`edges.json` 模板。
- [ ] B3-T002：新增 `src/domain/story-entity.ts` 与 graph builder。
- [ ] B3-T003：从 `character-profiles.md`、`relationships.json`、`timeline.json`、`plot-tracker.json`、Canon Ledger 构建第一版 entity graph。
- [ ] B3-T004：新增 `novel graph:build`、`novel entity:list`、`novel entity:show`、`novel graph:impact`。
- [ ] B3-T005：`validate` 检查 edge 引用不存在 entity、alias 重复、entity 无 sourcePaths。
- [ ] B3-T006：`handoff` 为下一任务输出相关 entity 子图。

验收：

- graph builder 不依赖 AI 推断也能从显式文件构建基础图谱。
- 每条 edge 都保留 evidencePaths。
- `graph:impact` 可辅助 Canon/World impact。

## 阶段 B4：Scene Cards 与编译工作流

目标：让章节写作基于场景卡，支持场景级规划、校验、重排和编译。

- [ ] B4-T001：新增 `templates/scenes/scene-template.yaml`。
- [ ] B4-T002：新增 `src/domain/scene-card.ts` 与 parser/validator。
- [ ] B4-T003：新增 `novel scene:init`、`novel scene:list`、`novel scene:check`、`novel scene:compile`。
- [ ] B4-T004：新增 `/scene-plan`、`/scene-write`、`/scene-review` generic/slash command。
- [ ] B4-T005：`/write` 检测到 scene card 时优先按 scene card 写作。
- [ ] B4-T006：`tasks:board` 显示任务关联 scene card。

验收：

- scene 缺 POV、location、time、sceneGoal、conflict、outcome 时 validate 给 warning/error。
- `scene:compile` 可按 scene order 输出章节草稿索引。
- 不强制所有旧章节立即补 scene cards。

## 阶段 B5：世界观密度、揭示节奏与伏笔检查

目标：减少设定堆砌、设定断裂、伏笔无回收等长篇常见问题。

- [ ] B5-T001：新增 `src/validation/rules/world-density-rules.ts`。
- [ ] B5-T002：新增 `src/validation/rules/reveal-pacing-rules.ts`。
- [ ] B5-T003：`novel analyze --focus=world-density` 输出每章/每场设定密度。
- [ ] B5-T004：`novel analyze --focus=reveal-pacing` 输出设定首次出现、再次使用、悬空设定。
- [ ] B5-T005：`novel analyze --focus=foreshadowing` 对伏笔埋设/回收做检查。
- [ ] B5-T006：将严重问题接入 `novel validate` 或 reviewer findings。

验收：

- 所有 finding 必须引用 chapter/scene/world/canon 路径。
- 第一版允许启发式统计，但输出必须可解释。
- 不因为没有 scene card 就完全失效，应能 fallback 到章节正文。

## 阶段 B6：角色声音指纹

目标：提升对白质量，减少角色声音同质化。

- [ ] B6-T001：新增 `spec/voice/character-voices.yaml` 与 `narrator-voice.md` 模板。
- [ ] B6-T002：新增 `VoiceFingerprint` schema 和 validator。
- [ ] B6-T003：新增 `novel voice:check`、`novel voice:sample`。
- [ ] B6-T004：新增 `/voice-fingerprint`，从已有正文提取角色声音草案。
- [ ] B6-T005：新增 `/voice-rewrite`，只针对对话片段生成 rewrite 建议，不直接覆盖正文。
- [ ] B6-T006：`/write` 读取当前 POV/参与角色的 voice fingerprint。

验收：

- `voice:check` 能发现称呼错误、禁用词、主要角色缺 voice fingerprint。
- voice reviewer 可进入 reviewer loop。
- 任何自动 rewrite 必须默认输出建议，不直接覆盖正文。

## 阶段 B7：Reviewer Loop

目标：把 `/analyze` 升级为多审稿人面板，输出结构化 findings 和下一步任务草稿。

- [ ] B7-T001：定义 reviewer registry：reader、genre、editor、worldbuilding、character、continuity。
- [ ] B7-T002：新增 `novel review`、`novel review --panel`、`novel review --chapter`、`novel review --json`。
- [ ] B7-T003：新增 `/review-panel`、`/review-world`、`/review-character`、`/review-reader`。
- [ ] B7-T004：review findings 输出 path、severity、evidence、suggestedAction。
- [ ] B7-T005：review 可生成 `tasks.md` 草稿项，但不直接写入，除非用户确认。
- [ ] B7-T006：`handoff` 可包含最近 reviewer findings 摘要。

验收：

- reviewer findings 与 validate issue 结构兼容或可转换。
- `review --json` 可被自动化消费。
- reviewer loop 不直接改正文。

## 阶段 B8：类型 Preset 包

目标：将类型小说知识沉淀为可安装 preset。

- [ ] B8-T001：定义 `PresetManifest`，复用插件 resolution stack。
- [ ] B8-T002：新增 `presets/xuanhuan-cultivation`，作为首个完整样板。
- [ ] B8-T003：样板包含 World Bible 必填字段、角色功能位、节奏模板、常见错误、reviewer 权重、validate 规则。
- [ ] B8-T004：新增 `novel preset:list`、`novel preset:add`、`novel preset:doctor`。
- [ ] B8-T005：`/specify`、`/plan`、`/tasks` 读取当前 preset。
- [ ] B8-T006：README/docs 增加 preset 使用示例。

验收：

- preset 不覆盖用户正文。
- `validate` 能按 preset 检查必填世界观字段。
- 后续可以按同一结构新增 court-intrigue、urban-fantasy、mystery、romance-slow-burn。

## 验证矩阵

| 场景 | 命令 |
|------|------|
| 类型检查 | `npm run build` |
| 单元测试 | `npm test` |
| CLI smoke | `npm run test:smoke` |
| 生成产物 | `npm run build:commands` |
| 生成产物一致性 | `npm run check:command-manifest` |
| 完整验证 | `npm run verify` |
| generic 初始化 | `node dist/cli.js init smoke --agent generic --no-git` |
| Codex 兼容初始化 | `node dist/cli.js init smoke --ai codex --no-git` |
| agent doctor | `node dist/cli.js agent:doctor --json` |
| 世界观校验 | `node dist/cli.js world:check --json` |
| Canon 校验 | `node dist/cli.js canon:check --json` |
| 场景校验 | `node dist/cli.js scene:check --json` |
| 审稿面板 | `node dist/cli.js review --json` |

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| 术语迁移导致用户困惑 | `--ai` 保留兼容；README 给出“agent/integration 是新名称”的说明 |
| `AGENTS.md` 泛化后 Codex 体验变弱 | 通用 contract + Codex profile 增强分层输出 |
| generic command 与 slash command 漂移 | 单一 CommandSpec，多 renderer 输出 |
| 插件系统再次分裂 | 插件先注册 command/template 能力，再由 renderer 输出 |
| 旧项目 upgrade 覆盖用户内容 | plan/apply、backup、dry-run、validate、只覆盖生成产物 |
| 支持任意 agent 范围过大 | 分层能力支持，不承诺所有 agent 都有同等自动化体验 |
| World Bible 变成无用百科 | 每条 WorldFact 必填 storyFunction 和 constraints |
| Canon 维护成本过高 | 写作完成只生成待确认事实和 debt，人工确认后入账 |
| Entity Graph 误推断 | 第一版只用显式 evidencePaths，不把 AI 推断当事实 |
| Scene Cards 增加写作摩擦 | 旧项目可选启用，章节任务仍可直接写作 |
| Reviewer Loop 变成泛泛而谈 | findings 必须带 path、evidence、severity、suggestedAction |

## 建议第一批开发任务

- [ ] N001：新增 ADR `docs/tech/agent-neutral-refactor.md`。
- [ ] N002：新增 `src/agent/capabilities.ts` 和 `src/agent/registry.ts`，但保持旧 `ai-platforms.ts` wrapper。
- [ ] N003：新增 `generic` integration 和 registry 测试。
- [ ] N004：新增 `novel agent:list --json`。
- [ ] N005：新增 `templates/agent/agent-contract.md` 初版。
- [ ] N006：新增 `novel init --agent generic` 的 smoke fixture。
- [ ] N007：README 改主叙事：agent-neutral，Codex 为示例 integration。
- [ ] N008：新增 ADR `docs/tech/worldbuilding-quality-roadmap.md`。
- [ ] N009：定义 `WorldFact`、`CanonFact`、`SceneCard` 最小 schema 草案。
- [ ] N010：新增 `spec/world/` 和 `spec/canon/` 初始化模板草案。
- [ ] N011：为 `novel validate` 设计 world/canon/scene issue 输出格式。

## 历史归档

上一轮全面重构已完成，归档信息见 [full-refactor-archive.md](full-refactor-archive.md)。本文件只保留当前 agent-neutral 重构的活跃计划。

## 参考链接

- Spec Kit：<https://github.com/github/spec-kit>
- Spec Kit integrations：<https://github.com/github/spec-kit/blob/main/docs/reference/integrations.md>
- AGENTS.md：<https://github.com/agentsmd/agents.md>
- Continue：<https://github.com/continuedev/continue>
- OpenHands：<https://github.com/OpenHands/OpenHands>
- Cline：<https://github.com/cline/cline>
- Aider：<https://github.com/Aider-AI/aider>
