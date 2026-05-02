# Novel Writer 重构完成批次归档

## 状态

Archive。本文保存当前 full-refactor 路线中已经完成的批次，避免活跃路线图变重。活跃待办仍以 [full-refactor-todo.md](full-refactor-todo.md) 和各专题文件为准。

## 归档规则

- 批次完成后，同步更新专题文件、[full-refactor-shared.md](full-refactor-shared.md) 和本文。
- 归档条目必须包含：完成批次、覆盖旧编号、实际完成能力和验证口径。
- 未完全完成的批次不移入本文；可以在专题文件中保留子批次状态。
- 归档后若发现缺口，新增修正批次，不把已归档批次改回待办。

## 2026-05-02

### [x] Batch A0：Agent-neutral 基线与入口

覆盖原 A0-A3 与 shared N001-N006。

已完成：

- `docs/tech/agent-neutral-refactor.md` 记录 `AIPlatform` 到 `AgentIntegration` 的重构决策、非目标和兼容策略。
- `src/agent/capabilities.ts`、`src/agent/registry.ts` 建立能力模型和 agent registry，并保留 `src/utils/ai-platforms.ts` 兼容 wrapper。
- `generic` integration、`agent:list`、`init/upgrade --agent`、`agent:add`、`agent:doctor` 已落地。
- `templates/agent/agent-contract.md`、`.specify/agent-contract.md`、通用 `AGENTS.md`、generic commands、`contract:print`、`contract:sync` 已落地。
- 旧 `--ai` / `--all` 仍处于兼容期，并输出迁移提示。

验证口径：

- 新旧初始化、升级、agent doctor 和 generic validate 相关测试已覆盖。
- A0 细项虽曾保持未勾选，但对应 ADR、盘点、命名和 contract 主从关系已经由 A1-A3 实现与文档吸收，状态规范为已完成批次。

### [x] Batch A1：CommandSpec 与插件统一

覆盖原 A4-A5。

已完成：

- `CommandSpec` 类型、`write` / `analyze` 试点迁移、旧 Markdown 模板兼容 renderer 已落地。
- `build:commands` manifest 标记命令来源，迁移指南见 `docs/tech/command-spec-migration-guide.md`。
- `PluginManifest` 已支持 `kind`、`priority`、`provides`、`overrides`。
- 插件命令先归一为 command source，再由 agent renderer 输出。
- template resolution stack 已诊断 project override / preset / extension / core 最终来源。
- `plugins:add --dry-run` 已显示对所有 agent integration 的影响。
- `docs/tech/plugin-entrypoint-decision.md` 决定当前继续复用 `plugins:add`，未来 `preset:add` / `extension:add` 作为薄 alias 再评估。

验证口径：

- 插件安装计划、CommandSpec renderer、manifest 和 CLI dry-run 相关测试已覆盖。

### [x] Batch A2a：脚本能力降级

覆盖原 A6-T001。

已完成：

- renderer 根据 `capabilities.runShell` 决定是否写入 CLI/脚本步骤。
- 不支持 shell 的 agent 输出人工检查说明，不再要求执行 `.specify/scripts/**`。

验证口径：

- platform renderer、build command、manifest 和 build 验证已覆盖。
