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

### [x] Batch A2：Agent 能力与文档收口

覆盖原 A6-T002、A6-T003、A6-T004、A7-T001 至 A7-T005，以及 shared N007。

已完成：

- 新增 `continue-check` agent integration，产出 `.continue/prompts/*.md` 只读检查提示词。
- renderer 根据 `capabilities.writeFiles` 输出“可执行修改”或“只读建议”模式。
- 只读 agent 不再被提示直接写正文、tracking 或任务文件；命令改为输出目标路径、建议内容和补丁式说明。
- `novel handoff --target-agent <id>` 会按目标 agent 的 `runShell` / `writeFiles` 能力生成继续步骤。
- README 主路径切换为 `--agent` / `--all-agents`，`--ai` / `--all` 作为兼容入口说明。
- 新增 `docs/agent-integrations.md`、`docs/agent-contract.md`，并更新 `docs/migration-guide.md`、CHANGELOG。

验证口径：

- `npm run build` 通过。
- `npm test` 通过。
- `npm run test:smoke` 通过。
- `npm run build:commands` 产出 generic、continue-check 与 legacy agent 命令。
- `npm run check:command-manifest` 通过。
- `git diff --check` 通过。

### [x] Batch B0：World / Canon 基座

覆盖原 B0-B2 与 shared N008-N011。

已完成：

- 新增 `docs/tech/worldbuilding-quality-roadmap.md`，明确 World Bible、Canon Ledger、Entity Graph、Scene Cards 等能力的第一版边界与旧文件映射。
- 新项目初始化会生成 `spec/world/` 与 `spec/canon/` 基础模板，包括 World Bible、typed world YAML、Canon facts、contradictions 和 propagation debt。
- 新增 WorldFact / CanonFact domain parser 与 validator，统一输出 world/canon issue。
- `novel validate --json` 汇总 `worldFiles` / `canonFiles`，旧项目缺少 World Bible / Canon Ledger 时只给 warning，不阻断写作。
- 新增 `world:list`、`world:check`、`canon:list`、`canon:check` 基础 CLI，支持 `--json`。
- `/write` / generic write 命令读取 world/canon 上下文，并在写作完成后生成待确认 canon fact 或 propagation debt，不自动重写正文。
- checklist 模板增加 World / Canon 检查项，README 与 CHANGELOG 补充用户可见命令。

验证口径：

- `npm run build` 通过。
- `npm test` 通过。
- `npm run test:smoke` 通过。
- `npm run build:commands` 已重新生成命令产物。
- `npm run check:command-manifest` 通过。
- `git diff --check` 通过。

### [x] Batch B1：Entity Graph / Scene Card 创作结构

覆盖原 B3-B4。

已完成：

- 新增 `spec/graph/` 初始化模板，包含 `entities.json`、`edges.json`、`indexes.json`，graph edge 必须保留 `evidencePaths`。
- 新增 StoryEntity、StoryEdge、SceneCard domain parser / validator，并把 graph edge 引用不存在 entity 作为 error。
- 新增 `entity:list`、`graph:build`、`graph:check`、`graph:impact`、`scene:init`、`scene:list`、`scene:check`、`scene:compile` CLI，均支持 `--json`。
- `graph:build` 基于显式 graph 文件生成 indexes，不把 AI 推断写成事实。
- 新增 `/scene` 通用命令模板；`/tasks`、`/write`、`/checklist` 已接入 Scene Card 与 Entity Graph 上下文。
- `novel validate --json` 汇总 graph entities、graph edges 和 scene cards，并检查 Scene Card 的 POV、location、time、sceneGoal、conflict、outcome。
- `handoff` 输出结构上下文与下一任务相关 scene；`tasks:board` 输出 relatedSceneIds / relatedEntityIds。
- 旧章节不强制补 scene cards；没有 `stories/*/scenes/` 时 scene 计数为 0，不阻断写作。

验证口径：

- `npm run build` 通过。
- `npm test` 通过。
- `npm run test:smoke` 通过。
- `npm run build:commands` 已重新生成 14 个 agent command。
- `npm run check:command-manifest` 通过。
- `git diff --check` 通过。

### [x] Batch B2：Worldbuilding Quality / Voice / Reviewer

覆盖原 B5-B7。

已完成：

- 新项目初始化会生成 `spec/voice/`，包括 `character-voices.yaml`、`narrator-voice.md` 和角色声音样本。
- 新增 VoiceFingerprint domain parser / validator，校验角色声音必填字段、禁用词、称呼规则和样本路径。
- 新增 `voice:list`、`voice:check`、`voice:sample` CLI，均支持 `--json`。
- `novel validate --json` 汇总 `voiceFingerprints`，旧项目缺少 `spec/voice` 时只给 warning。
- 写作规则新增世界观密度、揭示节奏和伏笔闭环检查，基于 Scene Card 输出 `WORLD_DENSITY_HIGH`、`REVEAL_PACING_GAP`、`FORESHADOWING_OPEN_LOOP`。
- 新增 reviewer registry 与 `novel review`，按 worldbuilding、voice、continuity、editor、reader 输出结构化 findings、score 和任务草稿。
- 新增 `/review` 通用命令模板；`/analyze` 增加 world-density / reveal-pacing 专项和 reviewer loop 输出约束。
- `/write` 与 `/scene` 明确读取 VoiceFingerprint；reviewer loop 只输出建议或任务草稿，不直接覆盖正文。

验证口径：

- `npm run build` 通过。
- `npm test` 通过。
- `npm run test:smoke` 通过。
- `npm run build:commands` 已重新生成 15 个 agent command。
- `npm run check:command-manifest` 通过。
- `git diff --check` 通过。

### [x] Batch B3：Genre Preset 包

覆盖原 B8。

已完成：

- 新增 `PresetManifest` domain parser / validator，支持 World Bible 必填字段、角色功能位、节奏模板、常见错误、reviewer 权重和 validate 规则。
- 新增内置 `presets/xuanhuan-cultivation`，包含 manifest、preset 专属 `/specify`、`/plan`、`/tasks` 增强说明、WorldFact 模板和 reviewer 配置。
- 新增 `novel preset:list`、`novel preset:add <id>`、`novel preset:doctor` CLI，支持 `--json` 和 `--dry-run`。
- `preset:add` 会把 preset 安装到 `.specify/presets/<id>`，写入 `spec/presets/current-preset.json`，并只补充缺失的 `spec/**` 模板，不覆盖用户已有世界观文件或正文。
- `novel validate --json` 汇总 `activePreset`，并按当前 preset 检查必填 WorldFact，输出 `MISSING_PRESET_WORLD_FACT` warning。
- `/specify`、`/plan`、`/tasks` 已读取当前 Genre Preset，用于增强规格字段、计划和任务拆分。
- README、CHANGELOG、worldbuilding roadmap 和 shared 验证矩阵已补充 preset 使用方式。

验证口径：

- `npm run build` 通过。
- `npm test` 通过。
- `npm run test:smoke` 通过。
- `npm run build:commands` 已重新生成 15 个 agent command。
- `npm run check:command-manifest` 通过。
- `git diff --check` 通过。
