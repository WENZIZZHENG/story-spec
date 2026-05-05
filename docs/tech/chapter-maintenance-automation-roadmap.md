# 章节与维护自动化增强路线图

## 状态

Active。本文把已归档路线中明确保留的 `task:finish --commit`、失败门禁、`todo:capture`、`docs:finish --commit` 等能力登记为当前活跃待办。实现任一任务前应先转为 OpenSpec change。

## 背景和目标

StorySpec 已有 `task:finish`、`maint:context` 和 `docs:finish` 的基线能力，但部分高影响自动化仍停留在“后续增强”备注里。目标是把章节收尾和文档维护中的重复动作继续收敛为可预览、可验证、失败不写入的命令流程。

## 非目标

- 不把 Git commit 变成强制行为。
- 不让命令绕过作者确认或自动改写正文。
- 不把所有维护动作合并成单一大命令。
- 不替代 OpenSpec；本路线只登记待办。

## P0 章节收尾门禁

### P0-1 `task:finish` 验证失败自动阻断写入

- [x] 状态：部分完成（2026-05-05）。已实现第一层文件存在性门禁：`task:finish --apply` 在关联正文缺失时返回 blocked，不写 `tasks.md`，不刷新 `task-board.json`。style / narrative / review 外部命令失败阻断仍留在后续切片。
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

- [ ] 状态：Active
- 类型：CLI、Git 集成、任务收尾
- 背景/问题：归档路线要求 `--commit` 只在验证和状态更新成功后创建本地 commit；当前该能力仍是后续切片。
- 已有基础：`task:finish` 可定位任务、正文路径和状态同步；项目 AGENTS 已定义本地 commit 规则。
- 缺口：缺少 Git adapter、安全状态检查、中文 commit message 生成和失败回滚口径。
- 建议方案：先实现只读 Git 状态检查和 commit preview，再实现 `--commit --message <commit_message>`，最后补 dirty worktree、无 Git 仓库、验证失败、commit 成功四类测试。
- 涉及文件/模块：`src/application/finish-writing-task.ts`、新增或复用 Git adapter、`src/cli/commands/tasks-board.command.ts`、`tests/unit/`、`tests/smoke/`。
- 参考资料：`docs/tech/archive/completed-roadmaps/chapter-production-workflow-roadmap.md`、项目级 `AGENTS.md` 提交规则。
- 验收标准：只有验证通过且状态写入成功时才创建本地 commit；commit message 默认来自任务标题且可覆盖；失败时说明未提交原因。
- 不做/边界：不主动 push，不自动提交 unrelated change。

## P1 文档与待办维护命令

### P1-1 `docs:finish --commit`

- [ ] 状态：Active
- 类型：文档维护、Git 集成、收尾验证
- 背景/问题：`docs:finish` 已有只读预览基线，但文档-only 任务仍需要人工串联 `git diff --check`、placeholder 检查、状态摘要和 commit。
- 已有基础：`src/application/finish-docs-change.ts`、`src/cli/commands/maintenance.command.ts`、`tests/unit/finish-docs-change.test.ts`。
- 缺口：缺少 `--commit` 的安全状态判断、commit message 校验和失败输出。
- 建议方案：扩展现有 docs finish 结果模型，加入 commit preview；显式 `--commit --message <commit_message>` 后再执行本地 commit。
- 涉及文件/模块：`src/application/finish-docs-change.ts`、`src/cli/commands/maintenance.command.ts`、`tests/unit/`、`tests/smoke/`。
- 参考资料：`docs/tech/todo-governance.md`、`docs/tech/archive/completed-roadmaps/chapter-production-workflow-roadmap.md` 的 P0-3。
- 验收标准：文档-only 变更通过检查后能创建本地 commit；存在 placeholder 或 diff check 失败时不提交；输出列出验证命令和 commit 状态。
- 不做/边界：不为代码变更自动选择测试集。

### P1-2 `todo:capture`

- [ ] 状态：Active
- 类型：待办治理、CLI preview、文档生成
- 背景/问题：讨论结论转 roadmap 时仍需要手工读取治理规则、写路线文件、更新 `todo-index.md`。
- 已有基础：`docs/tech/todo-governance.md`、`docs/tech/todo-index.md`、`maint:context --topic todo`。
- 缺口：缺少从 notes 生成符合治理规则的 roadmap preview，以及将路线登记到 `todo-index.md` 的安全写入流程。
- 建议方案：实现 `storyspec todo:capture --topic <name> --from <notes>`；默认 preview 生成路线草案和 index diff，显式 `--apply` 后写入。
- 涉及文件/模块：`src/cli/commands/maintenance.command.ts` 或新命令模块、`src/application/maintenance-context.ts`、`docs/tech/todo-governance.md`、`tests/unit/`、`tests/smoke/`。
- 参考资料：`docs/tech/archive/completed-roadmaps/chapter-production-workflow-roadmap.md` 的 P0-3。
- 验收标准：preview 不写文件；apply 后新增 `docs/tech/<topic>-roadmap.md` 并更新 `todo-index.md`；生成任务包含目标、缺口、涉及模块、验收标准和边界。
- 不做/边界：不自动判断复杂实现方案是否可行，复杂任务仍需 OpenSpec。

## P2 共享流程门禁

### P2-1 统一流程命令的失败门禁和 JSON 契约

- [ ] 状态：Active
- 类型：CLI 契约、测试、可观测性
- 背景/问题：`task:finish`、`docs:finish`、未来 `todo:capture` 都需要一致的 preview/apply/commit/failed 输出，避免每个命令各自定义失败格式。
- 已有基础：多个命令已支持 `--json` 和 preview/dry-run。
- 缺口：缺少共享结果字段、失败分类和 fixture。
- 建议方案：定义最小共享契约：`mode`、`wouldWrite`、`updatedFiles`、`checks`、`blockedReasons`、`nextActions`、`commit`；逐步让流程压缩命令复用。
- 涉及文件/模块：`src/application/*finish*`、`src/cli/commands/`、`tests/unit/`、`tests/smoke/`。
- 参考资料：`docs/tech/archive/completed-roadmaps/chapter-production-workflow-roadmap.md`。
- 验收标准：三个流程命令的 JSON 输出字段一致；失败时不写入；测试覆盖 preview、apply、commit skipped、blocked。
- 不做/边界：不要求普通只读查询命令全部迁移到该契约。

## 完成同步

- 完成任何 Batch 后更新本文状态。
- 涉及 CLI 行为时新增 `changes/YYYY-MM-DD-topic.md`。
- 修改命令模板或生成产物时运行 `npm run build:commands` 和 `npm run check:command-manifest`。
- 路线完成后按 `docs/tech/todo-governance.md` 归档。
