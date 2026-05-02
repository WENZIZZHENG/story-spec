# Novel Writer 重构路线图索引

## 状态

Active planning。本文件是轻量索引，详细路线已拆分到专题文件，后续开发应按专题文件批次推进。

## 路线文件

| 文件 | 范围 | 阶段 |
|------|-------|--------|
| [full-refactor-agent-neutral.md](full-refactor-agent-neutral.md) | 任意 agent 触发、AgentIntegration、Agent Contract、Generic Commands、CLI 兼容、插件/预设/扩展统一 | A0-A7 |
| [full-refactor-worldbuilding.md](full-refactor-worldbuilding.md) | World Bible、Canon Ledger、Entity Graph、Scene Cards、揭示节奏、角色声音、Reviewer Loop、类型 Preset | B0-B8 |
| [full-refactor-workbench.md](full-refactor-workbench.md) | Context Pack、Draft/Revision、Narrative Tests、Dialogue、Branch、Promise、Research、Style Linter、Compile、Feedback | C0-C9 |
| [full-refactor-shared.md](full-refactor-shared.md) | 公共验证矩阵、风险与缓解、第一批建议开发任务、参考链接 | 通用 |
| [full-refactor-completed.md](full-refactor-completed.md) | 当前 full-refactor 已完成批次归档 | Archive |
| [full-refactor-archive.md](full-refactor-archive.md) | 上一轮已完成全面重构归档 | Archived |

## 一句话目标

Novel Writer 应提供稳定的小说项目协议、agent contract、命令语义、世界记忆、写作质量检查和生成器。Codex、Claude、Gemini 和其他 agent 是 integration，不是产品核心。

## 推荐开发顺序

1. Agent-neutral 路线已完成 A0、A1、A2a 与 A2，详情见 [full-refactor-completed.md](full-refactor-completed.md)。
2. Worldbuilding 路线已完成 Batch B0。下一步执行 [full-refactor-worldbuilding.md](full-refactor-worldbuilding.md) 的 Batch B1-B3，推进 Entity Graph、Scene Card、Quality / Voice / Reviewer 与 Genre Preset。
3. 然后执行 [full-refactor-workbench.md](full-refactor-workbench.md) 的 Batch C0-C2。先落地 Context Pack、Draft/Revision、Narrative Tests，再推进 Dialogue、Branch、Promise、Research、Style、Compile 与 Feedback。
4. 每个批次完成前，对照 [full-refactor-shared.md](full-refactor-shared.md) 的验证矩阵和风险清单；大阶段收尾时再运行完整验证。

## 维护规则

- 本文件只保留索引和推荐顺序，不继续堆详细任务。
- 新增 A/B/C 路线内容时，写入对应专题文件。
- 已完成批次要同步勾选专题文件与 Shared 批次映射，并把完成能力、覆盖旧编号和验证口径写入 [full-refactor-completed.md](full-refactor-completed.md)。
- 已完成的大段历史内容移入归档文件，保持活跃路线轻量。
