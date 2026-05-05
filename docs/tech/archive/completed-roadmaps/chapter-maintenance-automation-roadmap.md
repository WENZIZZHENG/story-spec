# 章节与维护自动化增强路线图

## 状态

Completed。本文记录已完成的章节与维护自动化增强路线：`task:finish --commit`、失败门禁、章节前置约束卡、`docs:finish --commit`、`todo:capture` 和共享流程 JSON 契约均已收口。

## 背景和目标

StorySpec 已有 `task:finish`、`maint:context`、`docs:finish`、Scene Card 和章节卡模板的基线能力，但部分高影响自动化仍停留在“后续增强”备注里。目标是把章节写作前的约束确认、章节收尾和文档维护中的重复动作继续收敛为可预览、可验证、失败不写入的命令流程。

## 非目标

- 不把 Git commit 变成强制行为。
- 不让命令绕过作者确认或自动改写正文。
- 不把所有写作和维护动作合并成单一大命令。
- 不替代 OpenSpec；本路线只登记待办。

## P0 章节收尾门禁

### P0-1 `task:finish` 验证失败自动阻断写入

- [x] 状态：完成（2026-05-05）。已实现两层门禁：`task:finish --apply` 在关联正文缺失时返回 blocked，不写 `tasks.md`，不刷新 `task-board.json`；关联正文存在后会执行收尾验证计划，`style:lint` / `narrative:test` / `review` 等外部验证失败时同样阻断写入和 commit。验证见 OpenSpec `openspec/changes/block-failed-task-finish`、`openspec/changes/block-task-finish-validation-failures` 和 changeset `changes/2026-05-05-task-finish-validation-blocking.md`。
- 类型：CLI 流程编排、验证自动化、测试
- 背景/问题：当前 `task:finish` 已能预览和 `--apply` 同步任务状态，但归档路线仍保留“验证失败自动阻断写入”和多失败 fixture 作为后续增强。
- 已有基础：`src/application/finish-writing-task.ts`、`src/cli/commands/tasks-board.command.ts`、`tests/unit/finish-writing-task.test.ts`、`tests/smoke/cli-commands.test.ts`。
- 缺口：缺少明确的验证执行层、失败摘要结构，以及失败时保证 `tasks.md` / `task-board.json` 不变的端到端 fixture。
- 建议方案：先定义验证计划和失败结果模型，再让 `task:finish --apply` 在关键验证失败时停止写入，最后补正文缺失、style 失败、narrative 失败、review 失败等 fixture。
- 涉及文件/模块：`src/application/finish-writing-task.ts`、`src/application/check-writing-state.ts`、`src/cli/commands/tasks-board.command.ts`、`tests/unit/`、`tests/smoke/`。
- 参考资料：`docs/tech/archive/completed-roadmaps/chapter-production-workflow-roadmap.md` 的 P0-1。
- 验收标准：失败 fixture 下命令退出非零或给出明确失败状态；`tasks.md` 和 `task-board.json` 不发生状态变更；JSON 输出包含失败命令、影响文件和下一步建议。
- 不做/边界：不自动修正文风、连续性或正文内容。

### P0-2 `task:finish --commit`

- [x] 状态：完成（2026-05-05）。`task:finish --apply --commit` 已支持安全创建本地 commit；存在 unrelated change、未 apply、无本次更新文件、Git 不可用或门禁阻断时会跳过并说明原因。默认 message 为 `完成写作任务：<taskId> <title>`，也可用 `--message <commit_message>` 覆盖。验证见 OpenSpec `openspec/changes/add-task-finish-commit` 和 changeset `changes/2026-05-05-task-finish-commit.md`。
- 类型：CLI、Git 集成、任务收尾
- 背景/问题：归档路线要求 `--commit` 只在验证和状态更新成功后创建本地 commit；当前该能力仍是后续切片。
- 已有基础：`task:finish` 可定位任务、正文路径和状态同步；项目 AGENTS 已定义本地 commit 规则。
- 缺口：缺少 Git adapter、安全状态检查、中文 commit message 生成和失败回滚口径。
- 建议方案：先实现只读 Git 状态检查和 commit preview，再实现 `--commit --message <commit_message>`，最后补 dirty worktree、无 Git 仓库、验证失败、commit 成功四类测试。
- 涉及文件/模块：`src/application/finish-writing-task.ts`、新增或复用 Git adapter、`src/cli/commands/tasks-board.command.ts`、`tests/unit/`、`tests/smoke/`。
- 参考资料：`docs/tech/archive/completed-roadmaps/chapter-production-workflow-roadmap.md`、项目级 `AGENTS.md` 提交规则。
- 验收标准：只有验证通过且状态写入成功时才创建本地 commit；commit message 默认来自任务标题且可覆盖；失败时说明未提交原因。
- 不做/边界：不主动 push，不自动提交 unrelated change。

## P1 章节前置与维护命令

### P1-0 章节前置约束卡

- [x] 状态：完成（2026-05-05）。第一版已增强章节卡模板、继续创作入口、agent guide、`/write` 和 `/scene` prompt：正文前必须输出章节前置约束卡并等待作者确认，写后收尾需要对照硬约束自检。CLI 化 `storyspec chapter:preflight` 未实现，保留为后续评估。
- 类型：章节写作前置门禁、模板、agent prompt、可选 CLI preview
- 背景/问题：长篇连续写作中，正文开写前最容易漏掉的是“当前章节时间点下的人物情绪顺序、能力边界、语言水平、权力关系和世界观规则”。现有章节卡能记录目标、冲突、信息释放、情绪变化和能力边界，但没有把“写错等于崩人设/破规则”的硬约束固定成每章确认卡，也没有形成“约束卡 -> 作者确认 -> 写正文 -> 自检对照 -> 更新状态”的明确流程。
- 已有基础：`.specify/templates/authoring/chapter-card.md` 已要求写正文前确认章节目标、冲突、信息释放、情绪变化、能力与世界边界；Scene Card 写作前门禁、`context:pack` mustRead、`/write` beat preview、`narrative:test`、`review`、`task:finish` 已能支撑写前/写后闭环。
- 缺口：缺少面向单章的硬约束区块，例如主角当前情绪反应顺序、能力使用条件和代价、语言理解/表达水平、核心人物反应、权力不对等瞬间、世界观一致性；也缺少写后按约束卡自检的固定输出。
- 建议方案：第一版先增强章节卡模板和 `/write` / agent guide，不新增 CLI：在章节卡中新增“时间点”“主角当前能力”“本章情感检查点”“硬约束”“软约束”“写后自检对照”区块，并要求正文前先输出约束卡等待作者确认。第二版再评估 `storyspec chapter:preflight <story> --chapter <id>`，默认只预览，不写正文；确认后可写入 `stories/<story>/chapter-cards/chapter-XXX.md`。
- 下一次开发入口：新建 OpenSpec change `add-chapter-preflight-constraint-card`，第一版聚焦模板和 prompt，不做自动推理；从 fixture 验证章节卡包含硬约束/软约束/自检区块开始，再同步 `templates/CONTINUE.md`、`agent-guides/story-creation-guide.md` 和 `/write` 相关命令模板。
- 涉及文件/模块：`templates/authoring/chapter-card.md`、`templates/CONTINUE.md`、`agent-guides/story-creation-guide.md`、`docs/quickstart.md`、`templates/commands/write.md`、`templates/commands/scene.md`、相关 command artifact manifest。
- 参考资料：`docs/tech/archive/completed-roadmaps/story-co-creation-story-elements-roadmap.md` 的 F9 Scene Card 写作前门禁；`docs/tech/archive/completed-roadmaps/author-first-run-feedback-roadmap.md` 的章节阶段性反馈；本次“晏无章节约束卡”讨论中的情感真实性、金手指规则、语言水平、人物反应、权力关系和世界观一致性示例。
- OpenSpec 输入：`proposal.md` 写清这是写前约束确认，不是自动创作引擎；`design.md` 列出章节卡新增区块、agent 输出顺序、确认门禁和写后自检格式；`tasks.md` 至少包含模板更新、prompt 同步、fixture/快照测试、命令产物重建、文档同步和本文状态更新。
- 验收标准：写正文前 agent 会先输出本章约束卡并等待确认；约束卡至少覆盖时间点、当前能力/语言水平、情绪检查点、硬约束、软约束和写后自检；未确认约束不得被写成正典；写后收尾能对照约束卡说明是否违反硬约束。
- 验收命令：`npm run build:commands`、`npm run check:command-manifest`、相关 prompt/template snapshot 或 smoke、`npm run check:changes`、`git diff --check`。
- 不做/边界：第一版不自动推断角色心理、语言学习进度或能力数值；资料不足时必须标“待确认”，由作者确认或改写。

### P1-1 `docs:finish --commit`

- [x] 状态：完成（2026-05-05）。`docs:finish --commit --message <commit_message>` 已支持文档-only 收尾检查后创建本地 commit；`git diff --check` 或 placeholder 扫描失败时阻断提交，存在非文档-only change、Git 不可用或无可提交改动时跳过并说明原因。验证见 OpenSpec `openspec/changes/add-docs-finish-commit` 和 changeset `changes/2026-05-05-docs-finish-commit.md`。
- 类型：文档维护、Git 集成、收尾验证
- 背景/问题：`docs:finish` 已有只读预览基线，但文档-only 任务仍需要人工串联 `git diff --check`、placeholder 检查、状态摘要和 commit。
- 已有基础：`src/application/finish-docs-change.ts`、`src/cli/commands/maintenance.command.ts`、`tests/unit/finish-docs-change.test.ts`。
- 缺口：缺少 `--commit` 的安全状态判断、commit message 校验和失败输出。
- 建议方案：扩展现有 docs finish 结果模型，加入 commit preview；显式 `--commit --message <commit_message>` 后再执行本地 commit。
- 下一次开发入口：新建 OpenSpec change `add-docs-finish-commit`，先冻结 `docs:finish` 的 commit 结果结构，再复用或抽出 `GitAdapter` 的安全状态检查；从单测开始覆盖 placeholder 阻断、diff check 阻断、unrelated change 跳过和成功 commit。
- 涉及文件/模块：`src/application/finish-docs-change.ts`、`src/cli/commands/maintenance.command.ts`、`tests/unit/`、`tests/smoke/`。
- 参考资料：`docs/tech/todo-governance.md`、`docs/tech/archive/completed-roadmaps/chapter-production-workflow-roadmap.md` 的 P0-3；`src/application/finish-writing-task.ts` 中 `task:finish --commit` 的 skip reason 与 Git adapter 注入方式。
- OpenSpec 输入：`proposal.md` 写清文档-only 收尾不选择代码测试集；`design.md` 说明检查命令执行层、commit 安全边界和 JSON 字段；`tasks.md` 至少包含契约冻结、TDD、CLI 选项、smoke、changeset 和本文状态同步。
- 验收标准：文档-only 变更通过检查后能创建本地 commit；存在 placeholder 或 diff check 失败时不提交；输出列出验证命令和 commit 状态。
- 验收命令：`npm run build`、`npx vitest run tests/unit/finish-docs-change.test.ts`、新增或相关 smoke、`npm run check:changes`、`git diff --check`。
- 不做/边界：不为代码变更自动选择测试集。

### P1-2 `todo:capture`

- [x] 状态：完成（2026-05-05）。`todo:capture --topic <name> (--from <path>|--notes <text>)` 已支持 preview 生成治理化 roadmap 草案和 index 行预览，`--apply` 会新建 `docs/tech/<slug>-roadmap.md` 并更新 `todo-index.md`；缺少 notes、输入冲突、重复目标或缺少 todo-index 时 blocked 且不写文件。验证见 OpenSpec `openspec/changes/add-todo-capture-preview` 和 changeset `changes/2026-05-05-todo-capture-preview.md`。
- 类型：待办治理、CLI preview、文档生成
- 背景/问题：讨论结论转 roadmap 时仍需要手工读取治理规则、写路线文件、更新 `todo-index.md`。
- 已有基础：`docs/tech/todo-governance.md`、`docs/tech/todo-index.md`、`maint:context --topic todo`。
- 缺口：缺少从 notes 生成符合治理规则的 roadmap preview，以及将路线登记到 `todo-index.md` 的安全写入流程。
- 建议方案：实现 `storyspec todo:capture --topic <name> --from <notes>`；默认 preview 生成路线草案和 index diff，显式 `--apply` 后写入。
- 下一次开发入口：新建 OpenSpec change `add-todo-capture-preview`，第一版只做本地 deterministic 规则和模板填充，不调用 LLM；先实现 `--from <path>` 和 `--notes <text>` 二选一输入，再生成 preview 中的 roadmap 路径、任务草案、index 变更摘要和 blocked reasons。
- 涉及文件/模块：`src/cli/commands/maintenance.command.ts` 或新命令模块、`src/application/maintenance-context.ts`、`docs/tech/todo-governance.md`、`tests/unit/`、`tests/smoke/`。
- 参考资料：`docs/tech/archive/completed-roadmaps/chapter-production-workflow-roadmap.md` 的 P0-3；`docs/tech/todo-governance.md` 的任务字段和归档规则；`createDocsFinishPreview` 的 preview-only 结果形态。
- OpenSpec 输入：先冻结结果字段 `topic`、`roadmapPath`、`indexPath`、`wouldWrite`、`draftRoadmap`、`indexPatchPreview`、`blockedReasons`、`nextActions`；第一版必须说明无法自动判断复杂方案可行性，只生成可编辑草案。
- 验收标准：preview 不写文件；apply 后新增 `docs/tech/<topic>-roadmap.md` 并更新 `todo-index.md`；生成任务包含目标、缺口、涉及模块、验收标准和边界。
- 验收命令：新增 unit 覆盖 preview 不写、apply 写入、重复 topic 阻断、缺少 notes 阻断；新增 CLI smoke 覆盖 `todo:capture --from fixture --json`；运行 `npm run build`、`npm run check:changes`、`git diff --check`。
- 不做/边界：不自动判断复杂实现方案是否可行，复杂任务仍需 OpenSpec。

## P2 共享流程门禁

### P2-1 统一流程命令的失败门禁和 JSON 契约

- [x] 状态：完成（2026-05-05）。`task:finish`、`docs:finish` 和 `todo:capture` 的 JSON 输出已补齐统一顶层字段：`mode`、`wouldWrite`、`updatedFiles`、`checks`、`blocked`、`blockedReasons`、`nextActions` 和 `commit`；旧字段继续保留以兼容现有调用。验证见 OpenSpec `openspec/changes/standardize-flow-command-results` 和 changeset `changes/2026-05-05-flow-command-results.md`。
- 类型：CLI 契约、测试、可观测性
- 背景/问题：`task:finish`、`docs:finish`、未来 `todo:capture` 都需要一致的 preview/apply/commit/failed 输出，避免每个命令各自定义失败格式。
- 已有基础：多个命令已支持 `--json` 和 preview/dry-run。
- 缺口：缺少共享结果字段、失败分类和 fixture。
- 建议方案：定义最小共享契约：`mode`、`wouldWrite`、`updatedFiles`、`checks`、`blockedReasons`、`nextActions`、`commit`；逐步让流程压缩命令复用。
- 下一次开发入口：在 `docs:finish --commit` 和 `todo:capture` 任一落地后新建 OpenSpec change `standardize-flow-command-results`，不要先抽象空框架；先用已有三个命令的真实结果做兼容矩阵，再抽出最小 DTO/helper。
- 涉及文件/模块：`src/application/*finish*`、`src/cli/commands/`、`tests/unit/`、`tests/smoke/`。
- 参考资料：`docs/tech/archive/completed-roadmaps/chapter-production-workflow-roadmap.md`。
- OpenSpec 输入：列出 `task:finish`、`docs:finish`、`todo:capture` 的字段映射表；标记哪些字段是必选、哪些只在 commit/apply 时出现；保留旧 JSON 字段的兼容窗口。
- 验收标准：三个流程命令的 JSON 输出字段一致；失败时不写入；测试覆盖 preview、apply、commit skipped、blocked。
- 验收命令：相关 unit、相关 smoke、`npm run build`；若更改 CLI help 或文档，补 changeset 并运行 `npm run check:changes`。
- 不做/边界：不要求普通只读查询命令全部迁移到该契约。

## 完成同步

- 完成任何 Batch 后更新本文状态。
- 涉及 CLI 行为时新增 `changes/YYYY-MM-DD-topic.md`。
- 修改命令模板或生成产物时运行 `npm run build:commands` 和 `npm run check:command-manifest`。
- 路线已完成并归档；后续章节或维护自动化增强应回到 `docs/tech/todo-index.md` 新建活跃路线。
