# 待办统一归档

## 状态

Archive。本文统一索引 Novel Writer 已完成或已关闭的待办、路线图和 changeset 记录。旧文件保留原位，本文只做归档入口和状态收口。

## 归档规则

- 已完成路线不再作为活跃开发入口。
- 历史文件不移动、不重命名，避免破坏链接和验证脚本。
- 归档只表示“当前批次已完成或关闭”，不表示未来不能新增增强路线。
- 新增强路线必须回到 [todo-index.md](todo-index.md) 登记。

## full-refactor 主路线

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 |
| --- | --- | --- | --- | --- |
| [full-refactor-todo.md](full-refactor-todo.md) | Completed | Agent-neutral、Worldbuilding、Workbench 三条主路线的大阶段索引 | [full-refactor-completed.md](full-refactor-completed.md) | `npm run verify` |
| [full-refactor-agent-neutral.md](full-refactor-agent-neutral.md) | Completed | A0、A1、A2a、A2 | [full-refactor-completed.md](full-refactor-completed.md#2026-05-02) | build、unit、smoke、commands、manifest、diff check |
| [full-refactor-worldbuilding.md](full-refactor-worldbuilding.md) | Completed | B0、B1、B2、B3 | [full-refactor-completed.md](full-refactor-completed.md#2026-05-02) | build、unit、smoke、commands、manifest、diff check |
| [full-refactor-workbench.md](full-refactor-workbench.md) | Completed | C0、C1、C2 | [full-refactor-completed.md](full-refactor-completed.md#2026-05-02) | build、unit、smoke、commands、manifest、diff check |
| [full-refactor-shared.md](full-refactor-shared.md) | Completed | Shared-S1 到 Shared-S6 验证矩阵与跨路线映射 | [full-refactor-completed.md](full-refactor-completed.md) | `npm run verify` |
| [full-refactor-archive.md](full-refactor-archive.md) | Archived | 上一轮 full-refactor 历史阶段 0-10 | 原文件自身 | 历史归档，不再作为当前验证入口 |

## Worldbuilding Quality Roadmap

| 原文件 | 状态 | 完成范围 | 详细证据 | 后续入口 |
| --- | --- | --- | --- | --- |
| [worldbuilding-quality-roadmap.md](worldbuilding-quality-roadmap.md) | Completed | World Bible、Canon Ledger、Entity Graph、Scene Cards、VoiceFingerprint、Reviewer Loop、Genre Preset 第一版 | [full-refactor-completed.md](full-refactor-completed.md#2026-05-02) 的 B0-B3 | 新增类型 preset 或 reviewer 权重接入时，新建增强路线 |

## 命令输入澄清引导

| 原文件 | 状态 | 完成范围 | 详细证据 | 后续入口 |
| --- | --- | --- | --- | --- |
| [command-onboarding.md](command-onboarding.md) | Completed | `argument-hint` / `arguments.hint` 统一转化为输入澄清引导，`/novel-specify` 增加创作控制权保护 | [2026-05-03-command-onboarding.md](../../changes/2026-05-03-command-onboarding.md) | [creative-control-roadmap.md](creative-control-roadmap.md) |

## 创作控制权体验优化

| 原文件 | 状态 | 完成范围 | 详细证据 | 后续入口 |
| --- | --- | --- | --- | --- |
| [creative-control-roadmap.md](creative-control-roadmap.md) | Active | Batch D0：澄清问题、答案、创作决策领域模型与 schema 校验 | [creative-control-roadmap.md](creative-control-roadmap.md#batch-d0创作控制权问题模型) | Batch D2 `/novel-clarify` 创作访谈升级 |
| [creative-control-roadmap.md](creative-control-roadmap.md) | Active | Batch D1：内置澄清问题包与题材问题选择器 | [creative-control-roadmap.md](creative-control-roadmap.md#batch-d1问题库与题材-preset) | Batch D2 `/novel-clarify` 创作访谈升级 |
| [creative-control-roadmap.md](creative-control-roadmap.md) | Active | Batch D2：`/novel-clarify` 创作控制权保护与澄清记录服务 | [creative-control-roadmap.md](creative-control-roadmap.md#batch-d2novel-clarify-创作访谈升级) | Batch D3 写入前预览与确认门禁 |
| [creative-control-roadmap.md](creative-control-roadmap.md) | Active | Batch D3：`/novel-constitution`、`/novel-specify`、`/novel-plan`、`/novel-tasks` 写入前预览门禁 | [creative-control-roadmap.md](creative-control-roadmap.md#batch-d3写入前预览与确认门禁) / [write-preview-gate.md](write-preview-gate.md) | Batch D4 早期灵感合法状态 |
| [creative-control-roadmap.md](creative-control-roadmap.md) | Active | Batch D4：故事成熟度阶段、早期灵感合法状态、status 创作缺口、validate 分阶段检查 | [creative-control-roadmap.md](creative-control-roadmap.md#batch-d4早期灵感合法状态) / [story-maturity-model.md](story-maturity-model.md) | Batch D5 来源追踪与 Canon 防污染 |
| [creative-control-roadmap.md](creative-control-roadmap.md) | Active | Batch D5：WorldFact / CanonFact 来源字段、world/canon 未确认 AI 建议检查、规格来源标记契约 | [creative-control-roadmap.md](creative-control-roadmap.md#batch-d5来源追踪与-canon-防污染) | Batch D6 示例分叉生成器 |

## changeset 记录

| 文件 | 状态 | 范围 | 说明 |
| --- | --- | --- | --- |
| [2026-05-02-refactor-foundation.md](../../changes/2026-05-02-refactor-foundation.md) | Completed | CLI、prompt、validation、plugins、ci | full-refactor 基础设施收口的用户可见契约 |
| [2026-05-03-command-onboarding.md](../../changes/2026-05-03-command-onboarding.md) | Completed | prompt、commands、agent-integrations | 命令输入澄清引导与 `/novel-specify` 创作控制权保护 |
| [2026-05-03-write-preview-gate.md](../../changes/2026-05-03-write-preview-gate.md) | Completed | prompt、commands、generated-artifacts | 高影响写入命令 preview/confirm/apply 门禁 |
| [2026-05-03-story-maturity-model.md](../../changes/2026-05-03-story-maturity-model.md) | Completed | domain、validation、status | 早期灵感合法状态与故事成熟度模型 |
| [2026-05-03-source-tracked-worldbuilding.md](../../changes/2026-05-03-source-tracked-worldbuilding.md) | Completed | domain、validation、templates、commands | WorldFact / CanonFact 来源追踪与正典防污染检查 |

## 架构决策与专题记录

这些文件不是待办，但属于已采纳或已完成的设计证据：

| 文件 | 状态 | 说明 |
| --- | --- | --- |
| [agent-neutral-refactor.md](agent-neutral-refactor.md) | Accepted | AgentIntegration 基线决策 |
| [ai-platform-registry-refactor.md](ai-platform-registry-refactor.md) | Accepted | AI 平台 registry 单一事实源 |
| [codex-optimization.md](codex-optimization.md) | Completed | Codex 状态、handoff、tasks board 与 agent contract 优化记录 |
| [plugin-entrypoint-decision.md](plugin-entrypoint-decision.md) | Accepted | 插件、扩展、预设安装入口决策 |

## 当前仍未完成的活跃路线

- [creative-control-roadmap.md](creative-control-roadmap.md)：Active，D0-D5 已归档，D6-D10 仍在 [todo-index.md](todo-index.md) 中作为当前待办保留。
