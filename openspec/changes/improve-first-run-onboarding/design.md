# improve-first-run-onboarding 设计

## 背景

首程体验需要从“命令驱动”调整为“作者状态驱动”。系统应先确认作者有没有可用工作区，再识别作者手头素材类型，最后才把自然语言选择映射到 CLI 命令或 agent 动作。

参考材料：

- `docs/tech/archive/completed-roadmaps/author-first-run-feedback-roadmap.md`
- `docs/tech/low-burden-co-creation.md`
- `agent-guides/story-creation-guide.md`

## 关键决策

### 1. 工作区 preflight 是创作入口的前置合同

任何 story creation、ingest、co-create、next 或写作入口在缺少 StorySpec 工作区时，都不应继续解释后续创作命令。首轮只收集一个关键信息：小说工作区路径。

拿到路径后，agent 应直接执行初始化或选择等价初始化动作；CLI 文案可以展示二选一命令，但 agent 面向作者时不要求用户手抄命令。

### 2. 首屏按素材状态分流，而不是按命令分流

首屏入口固定面向作者的真实状态：

- 我有长文资料
- 我只有一句灵感
- 我想先随便聊聊
- 我有表格资料

实现可以复用现有 `story:new`、`ingest`、`co:create`、`next`、`interview` 能力，但 UI/agent copy 必须先说入口含义，再给 copyable command。

### 3. 长文和表格导入继续保守，但必须解释保守性

导入器不应为了减少“待澄清”而自动确认信息。相反，输出需要把保守结果解释清楚：

- 已识别：来自作者明确表达或结构化字段。
- 需要确认：可用但尚未获得作者确认的候选。
- 仍缺少：影响后续计划或正文的关键缺口。

表格资料可以被接受为 Markdown 表格或文本表格，但字段映射不稳定时必须标为候选或待确认。

### 4. JSON action 与人类文案分离

人类首屏应短、自然、可选择；`--json` 应保留稳定 action，例如 `initializeWorkspace`、`startFromLongMaterial`、`startFromOneLineIdea`、`startCasualCoCreation`、`ingestTableMaterial`。后续 agent/UI 依赖 JSON，不解析中文文案。

### 5. preview / confirm / apply 是硬边界

本 change 只改善入口和解释，不改变创作控制权。任何候选事实、AI 推断、表格映射、长文归纳都必须在 preview 中可见，并等待作者确认后才可 apply 到正典或规格文件。

## 风险与缓解

- 风险：新手流程变成强制向导，拖慢熟悉 CLI 的用户。缓解：保留 copyable command、高级命令和 `--json` action；少命令化只改变默认首屏。
- 风险：自动初始化到错误路径。缓解：非工作区时只在用户明确给出路径后初始化，不猜测、不迁移已有项目。
- 风险：用户把“待澄清”理解为导入失败。缓解：导入输出必须解释原因，并展示“已识别 / 需要确认 / 仍缺少”三栏摘要。
- 风险：为了让首程顺滑而跳过确认。缓解：spec 明确禁止自动确认候选，tests 需要覆盖候选不被 apply。
- 风险：自然语言入口和 CLI 命令文案漂移。缓解：实现任务要求同步 CLI、agent prompt、README/quickstart 或等价文档，并使用 snapshot/smoke 固定首屏输出。

## 迁移

- 现有 CLI 命令继续可用，不做破坏性迁移。
- 现有 StorySpec 工作区无需数据迁移。
- 新增或调整输出字段时，`--json` 应向后兼容：新增 action/metadata 字段，不删除现有字段，除非另有单独 OpenSpec change。
- 修改命令模板或生成产物时，后续实现必须运行 `npm run build:commands` 和 `npm run check:command-manifest`。
- 涉及 CLI 行为、模板契约或公共接口变化时，后续实现应新增 `changes/*.md` 记录。
