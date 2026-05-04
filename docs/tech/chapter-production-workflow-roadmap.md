# 章节生产流程优化路线图

## 状态

Active。本文记录 2026-05-04 在“法术编译纪元”第一章 dogfood 后发现的 StorySpec 流程优化点，目标是减少每章写作后的手工收尾、误报噪音和路径返工。P0 基线与 P1-1/P1-2/P1-3 已完成，当前下一步是 P2-1：让生成目录默认更安静。

## 背景和目标

本次 dogfood 中，章节正文起草本身较顺畅，但收尾阶段需要人工串联多个动作：修正 Scene Card 路径、运行多条验证命令、更新 `tasks.md`、刷新 `task-board.json`、清理临时 `build/`、检查 Git 状态并提交。流程可用，但对作者和 agent 都偏重，且容易在章节连续生产时漏步骤。

本路线的主目标是把“写完一章后的收尾”从人工清单升级为可验证、可预览、可选择提交的轻量流水线，同时降低正常写作阶段的 warning 噪音。

## 体验承诺

- 作者写完章节后，可以运行一条命令完成收尾检查、任务状态同步和可选提交。
- Scene Card 路径错误应在写作前被发现，并提供可理解的修复建议。
- 仍未写的后续章节不应污染当前章节的验证结果。
- 伏笔、澄清记录、生成目录等状态要区分“正常未完成”和“需要处理的问题”。

## 非目标

- 不实现自动正文写作或自动改稿。
- 不绕过作者确认机制，不自动把 AI 建议写入正典。
- 不把所有 StorySpec 命令合并成单一大命令；只优化章节生产收尾路径。
- 不承诺一次性完成 Web 工作台或 GUI。

## P0 立即处理

### P0-1 新增 `storyspec task:finish <taskId>` 章节收尾命令

状态：基线完成（2026-05-04）。已实现 `task:finish <taskId> [story]` 的预览与 `--apply` 状态同步，能定位任务、列出正文路径和推荐验证命令，并刷新 `task-board.json`。`--commit`、验证失败自动阻断写入和多失败 fixture 留作 P2-2/后续增强，避免把本批命令做成不可控的大流水线。

- 类型：CLI 流程编排、任务状态同步、验证自动化
- 背景/问题：写完 `chapter-001` 后，agent 需要手动执行多步：检查正文、运行 `validate`、`style:lint`、`narrative:test`、`review --panel continuity`、更新任务状态、刷新看板、清理临时产物、Git 提交。步骤分散，后续每章都会重复。
- 已有基础：
  - `storyspec validate`
  - `storyspec style:lint <story>`
  - `storyspec narrative:test <story>`
  - `storyspec review --panel continuity`
  - `storyspec tasks:board <story>`
  - `stories/<story>/tasks.md` 与 Scene Card 已能表达写作任务和允许写入路径。
- 缺口：没有一个命令知道“某个写作任务已经完成，需要同步状态并跑完整章节门禁”。
- 建议方案：
  1. 新增 `task:finish <taskId>`，从 `tasks.md` 定位任务、相关 Scene Card、目标正文文件和 story 名称。
  2. 默认先执行 dry-run，展示将检查的文件、将更新的任务状态、将运行的验证命令。
  3. `--apply` 后更新 `tasks.md`、刷新 `task-board.json`，并保留验证摘要。
  4. `--commit` 可选创建本地 commit，commit message 默认从任务标题生成，支持 `--message` 覆盖。
  5. 任一关键验证失败时不更新任务状态，不提交，并输出下一步建议。
- 涉及文件/模块：
  - `src/cli/commands/tasks-board.command.ts`
  - `src/application/*task*`
  - `src/application/*validate*`
  - `src/application/review*`
  - `tests/unit/`
  - `tests/smoke/`
- 验收标准：
  - 对已存在正文的写作任务运行 dry-run，会列出正文文件、Scene Card 和验证计划，不修改文件。
  - `--apply` 在验证通过后将对应任务从 todo 改为 done，并刷新 `task-board.json`。
  - `--commit` 只在验证和状态更新成功后创建本地 commit。
  - 验证失败时，`tasks.md` 和 `task-board.json` 不被改动。
  - 有 fixture 覆盖“通过、正文缺失、style 失败、continuity 失败、commit 跳过”场景。
- 参考资料：
  - 本次 dogfood：`法术编译纪元` 第一章试写收尾流程。
  - 借鉴点：把人工命令串联成可预览、可回滚的任务流水线。
  - 不照搬：不把 Git 提交变成强制行为；仍保留作者或 agent 手动处理空间。
- 不做/边界：本任务不评价正文文学质量，只编排已有门禁和任务状态。

### P0-2 统一 Scene Card 路径语义并提供自动修复

状态：完成（2026-05-04）。Scene Card 解析会诊断 `stories/<story>/...` 这类重复 story 前缀，模板改为 story-relative 路径，`scene:check --fix-paths` 可自动把高置信错误改为相对 story root 的路径。

- 类型：数据模型约束、校验、迁移体验
- 背景/问题：本次 Scene Card 中 `draftPath/allowedWrites` 曾写成 `stories/<story>/content/chapter-001.md`，`compile` 会在 story root 下再次拼接，导致重复路径 warning。问题直到 compile 才暴露，且需要人工批量修正。
- 已有基础：Scene Card 已包含 `draftPath`、`allowedWrites`、`requiredReads`，`validate` 和 `scene:check` 已能检查基础结构。
- 缺口：缺少“路径必须相对 story root”的显式规则和重复 story 前缀诊断。
- 建议方案：
  1. 在 Scene Card schema/validator 中规定用户项目内路径统一相对 story root。
  2. 检测 `stories/<story>/...`、绝对路径、重复 story 前缀等高概率错误。
  3. 新增 `storyspec scene:fix-paths <story>` 或在 `scene:check --fix` 中提供自动修复。
  4. 修复前输出 preview，修复后保持 YAML 原有字段顺序和注释尽量稳定。
- 涉及文件/模块：
  - `src/application/create-scene-card.ts`
  - `src/application/validate*`
  - `src/cli/commands/story-structure.command.ts`
  - `templates/`
  - `tests/unit/`
- 验收标准：
  - `validate` 能对重复 story 前缀报出明确 warning 或 error，包含修复前后路径示例。
  - `scene:fix-paths` 能把 `stories/<story>/content/chapter-001.md` 修成 `content/chapter-001.md`。
  - compile 不再因可自动识别的重复路径产生后置噪音。
  - fixture 覆盖中文 story 名称、空格路径和 Windows 路径分隔符。
- 参考资料：
  - 本次 dogfood 的 16 张 Scene Card 路径修正。
  - 借鉴点：把“人工经验修复”前移为结构化诊断。
  - 不照搬：不强制重写用户所有路径风格，只修复高置信错误。
- 不做/边界：不改变用户项目根目录结构，不迁移正文文件位置。

### P0-3 建立 agent 重复流程压缩命令基线

状态：基线完成（2026-05-04）。已实现 `maint:context --topic todo|chapter|release --brief` 与 `docs:finish --message <commit_message>` 的只读预览基线，统一输出人类摘要和 JSON，压缩待办维护、章节维护和文档-only 收尾的高频上下文读取。`todo:capture`、`docs:finish --commit` 和失败门禁自动化保留为后续增强。

- 类型：CLI 流程编排、agent token 优化、维护体验
- 背景/问题：本次“把分析更新到待办”过程中，agent 为了遵守维护规则，读取了 skill、SDD、AGENTS、todo-governance、todo-index、示例路线，之后又手动执行 diff 检查、placeholder 搜索、status/log 和 commit。步骤都合理，但对小型文档维护任务来说 token 和操作成本偏高，说明 StorySpec 需要把高频 agent 流程压缩成稳定命令。
- 已有基础：
  - 项目已有 `validate`、`tasks:board`、`review`、`compile` 等单点命令。
  - `docs/tech/todo-governance.md` 已定义待办入口、路线文件、归档和验证规则。
  - `P0-1` 的 `task:finish` 可作为章节收尾领域的第一个流程压缩样板。
- 缺口：缺少通用的“流程压缩命令”设计口径，也缺少文档维护、上下文摘要、收尾验证这类 agent 高频动作的命令入口。
- 建议方案：
  1. 定义一套流程压缩命令原则：默认 `preview/dry-run`、显式 `--apply`、高影响动作独立 `--commit`、输出 brief 摘要、失败不写入。
  2. 新增 `storyspec maint:context --topic todo|chapter|release --brief`，只输出当前任务需要的维护规则、入口文件和推荐验证命令，减少 agent 每次读取长文档。
  3. 新增 `storyspec todo:capture --topic <name> --from <notes>` 或等价命令，把讨论结论生成 roadmap 草案并自动登记到 `todo-index.md` 的 preview。
  4. 新增 `storyspec docs:finish --message <commit_message>`，聚合文档-only 的 `git diff --check`、placeholder 检查、状态摘要和可选 commit。
  5. 将 `task:finish`、`docs:finish`、`todo:capture` 的输出统一为人类可读摘要与 JSON 结构化结果，方便 agent/UI 复用。
- 涉及文件/模块：
  - `src/cli/commands/`
  - `src/application/`
  - `docs/tech/todo-governance.md`
  - `docs/tech/README.md`
  - `tests/unit/`
  - `tests/smoke/`
- 验收标准：
  - agent 能通过 `maint:context --topic todo --brief` 获取不超过一屏的待办维护规则，而不是整篇读取 SDD 和治理文档。
  - `todo:capture` 能从一段优化分析生成符合治理规则的 roadmap preview，并显示将更新的 `todo-index.md` 行。
  - `docs:finish` 能对文档-only 变更输出验证摘要，并在 `--commit` 时创建本地 commit。
  - 所有流程压缩命令默认不写文件；只有显式 `--apply` 或 `--commit` 才产生变更。
  - 有 fixture 覆盖“只预览、应用、验证失败、commit 跳过、JSON 输出”场景。
- 参考资料：
  - 本次对话中的 StorySpec 待办更新流程与 token 复盘。
  - 借鉴点：把 agent 高频、规则性、可验证的重复动作沉淀为 CLI。
  - 不照搬：不做一个包办所有事务的万能命令；每个命令只覆盖一个清晰流程。
- 不做/边界：本任务不替代 agent 推理，不自动决定产品优先级；命令只压缩可机械执行的上下文定位、模板生成、验证和收尾动作。

## P1 近期增强

### P1-1 优化 `compile` 的未写章节噪音

状态：完成（2026-05-04）。已新增 `compile --written-only`，只编译已存在正文；全量 `compile` 仍保留缺失章节 warning，当前阶段编译可避免未来 Scene Card 噪音。

- 类型：CLI 输出、写作阶段感知
- 背景/问题：第一章阶段运行 compile 时，后续 `chapter-002` 到 `chapter-016` 未写是正常状态，但会形成大量 warning，掩盖真正需要处理的问题。
- 已有基础：`compile` 已能从 Scene Card 和正文路径生成章节汇总。
- 缺口：compile 不区分“当前写作阶段尚未开始”和“应该存在却缺失”。
- 建议方案：
  1. 新增 `compile --written-only`，只编译已存在正文。
  2. 新增 `compile --through <chapter>` 或按 `tasks.md` done 状态决定编译范围。
  3. 对未开始任务输出 summary，而不是 warning。
  4. 在 `task:finish` 中默认使用当前任务范围的 compile/check 模式。
- 涉及文件/模块：
  - `src/application/compile-manuscript.ts`
  - `src/cli/commands/story-structure.command.ts`
  - `tests/unit/compile-manuscript.test.ts`
- 验收标准：
  - 仅写完第一章时，`compile --written-only` 不报告后续章节缺失 warning。
  - 明确要求全卷 compile 时，仍能发现缺失章节。
  - CLI 输出区分 `missing but not due` 与 `missing required`。
- 参考资料：
  - 本次 dogfood 的 compile 后续章节 warning。
  - 借鉴点：让验证结果符合作者当前阶段。
- 不做/边界：不删除全量 compile 能力。

### P1-2 为伏笔增加“计划回收”状态

状态：完成（2026-05-04）。Scene Card 的 `foreshadowing` 支持 `plannedPayoff`，有计划回收位置时不再被 `FORESHADOWING_OPEN_LOOP` 视为缺少计划；`narrative:test` 会把 planned payoff 输出为通过型 info。

- 类型：叙事追踪、连续性门禁
- 背景/问题：当前 `FORESHADOWING_OPEN_LOOP` 在 `validate` 中是 info，在 `narrative:test` 中又以 pass 附带建议出现。对早期章节来说，未回收伏笔通常是正常的，但缺少“已计划回收”和“遗漏未计划”的区分。
- 已有基础：Scene Card 已有 `foreshadowing` 字段，`validate` 与 `narrative:test` 能识别伏笔未回收。
- 缺口：没有表达 `planned/open/paidOff` 等生命周期。
- 建议方案：
  1. 扩展 Scene Card 伏笔结构，支持 `status`、`plannedPayoffScene`、`paidOffIn`。
  2. `validate` 对 `planned` 给 info 摘要，对长期无计划的 open loop 给 warning。
  3. `narrative:test` 输出“已计划未回收”和“缺少回收计划”的分组。
- 涉及文件/模块：
  - `src/domain/`
  - `src/application/validate*`
  - `src/application/narrative*`
  - `templates/`
  - `tests/unit/`
- 验收标准：
  - Scene Card 能记录伏笔计划回收位置。
  - 早期章节的 planned 伏笔不制造需要立即处理的噪音。
  - 未计划且跨越过多章节的伏笔可被升级提示。
- 参考资料：
  - 本次 dogfood 中 scene-001 到 scene-005 的 open loop info。
  - 借鉴点：把叙事债务从二元“有/无”改为生命周期。
- 不做/边界：不自动决定伏笔回收方式，避免替作者定案。

### P1-3 增加 `clarification:doctor --fix` 清理历史澄清孤儿答案

状态：完成（2026-05-04）。已新增 `clarification:doctor`，默认预览 orphan answers、重复问题和未确认候选；`--fix` 会把孤儿答案移入 `archivedAnswers` 并重渲染 `clarifications.md`，保留原 answer/source/confirmed/confidence，清理后不再触发 `UNKNOWN_CLARIFICATION_ANSWER_QUESTION`。

- 类型：数据治理、升级体验
- 背景/问题：`validate` 中出现 `UNKNOWN_CLARIFICATION_ANSWER_QUESTION`，属于历史澄清记录引用不存在问题。它不阻断写作，但每次验证都会出现，降低信号质量。
- 已有基础：`clarifications.json` 已保存 answers，`validate` 已能识别孤儿答案。
- 缺口：缺少安全的迁移/归档命令。
- 建议方案：
  1. 新增 `clarification:doctor` 展示孤儿答案、重复问题、未确认候选等状态。
  2. `--fix` 默认把孤儿答案移动到归档区或补齐 `legacyQuestion` stub，并记录来源。
  3. 修复前 preview，修复后保证原作者确认内容不丢失。
- 涉及文件/模块：
  - `src/application/creative-control-summary.ts`
  - `src/application/creative-report.ts`
  - `src/application/validate*`
  - `src/cli/commands/`
  - `tests/unit/`
- 验收标准：
  - 对历史项目运行 doctor 能列出孤儿答案和建议处理方式。
  - `--fix` 后 `validate` 不再出现同类 info。
  - 修复不会删除用户答案，归档记录可追溯。
- 参考资料：
  - 本次 dogfood 的 `文风`、`core.premise`、`core.scope` 三条孤儿答案 info。
  - 借鉴点：把 schema 漂移转化为可控迁移。
- 不做/边界：不自动确认未确认候选，不把归档内容写入正典。

## P2 体验和维护

### P2-1 生成目录默认更安静

- 类型：生成产物管理、Git 体验
- 背景/问题：`compile` 会生成 `build/`。在写作收尾里它常是临时产物，agent 需要额外检查和清理，避免把非源文件提交。
- 已有基础：`compile` 已集中生成产物，仓库 SDD 已规定不把生成目录当源目录维护。
- 缺口：缺少只检查不落盘的模式，以及更明确的默认生成目录策略。
- 建议方案：
  1. 新增 `compile --check`，只验证可编译性和字数统计，不写文件。
  2. 将默认临时输出迁移到 `.storyspec/build`，或确保用户项目模板 `.gitignore` 默认忽略 `build/`。
  3. 在 CLI 输出中明确“生成目录是否需要提交”。
- 涉及文件/模块：
  - `src/application/compile-manuscript.ts`
  - `templates/`
  - `README.md`
  - `tests/unit/`
- 验收标准：
  - 文档和 CLI 输出明确区分源文件与生成文件。
  - `compile --check` 不产生工作区新增文件。
  - 新初始化项目不会误把临时 build 作为待提交源文件。
- 参考资料：
  - 本次 dogfood 中清理临时 `build/` 的收尾动作。
  - 借鉴点：减少 Git 工作区噪音。
- 不做/边界：不取消导出成品稿能力。

### P2-2 任务看板刷新与 tasks 状态更新保持幂等

- 类型：任务数据一致性、CLI 易用性
- 背景/问题：本次完成 T001 后，需要手动改 `tasks.md` 并重新生成 `task-board.json`。如果用户只改其中一个，状态容易短暂不一致。
- 已有基础：`tasks:board` 已能从任务文档生成 JSON 看板。
- 缺口：缺少任务状态变更的唯一入口和幂等检查。
- 建议方案：
  1. 在 `task:finish` 中复用任务状态更新逻辑。
  2. 另提供轻量 `tasks:set-status <taskId> --status done|todo`，供非章节任务使用。
  3. `validate` 检查 `tasks.md` 与 `task-board.json` 是否同步，必要时建议运行 `tasks:board`。
- 涉及文件/模块：
  - `src/cli/commands/tasks-board.command.ts`
  - `src/application/`
  - `tests/unit/`
- 验收标准：
  - 重复运行状态更新命令不会产生无意义 diff。
  - `tasks.md` 与 `task-board.json` 不一致时，validate 能给出明确修复命令。
  - `task:finish` 不需要手写 Markdown 替换即可更新任务状态。
- 参考资料：
  - 本次 dogfood 的 `tasks.md` 与 `task-board.json` 同步动作。
  - 借鉴点：任务状态应有单一写入口。
- 不做/边界：不引入外部项目管理系统。

## 推荐推进顺序

1. P0-2：先修路径语义，减少后续所有章节的结构性返工。
2. P0-1：再做 `task:finish`，把验证、状态、可选 commit 串起来。
3. P0-3：抽象 agent 流程压缩命令基线，把 `task:finish` 的经验扩展到待办、文档和维护收尾。
4. P1-1：降低 compile 在早期章节的 warning 噪音。
5. P1-2 与 P1-3：治理叙事债务和历史澄清 info。
6. P2-1 与 P2-2：继续降低生成物和任务状态维护成本。

## 风险与缓解

- 风险：`task:finish` 如果自动提交过强，可能侵犯作者控制权。缓解：默认 dry-run，`--apply` 与 `--commit` 分离。
- 风险：流程压缩命令做成万能入口后反而难维护。缓解：按 `task:finish`、`todo:capture`、`docs:finish` 等清晰场景拆分，统一 preview/apply/brief 契约。
- 风险：路径自动修复误改用户自定义结构。缓解：只修复高置信重复前缀，并提供 preview。
- 风险：降低 warning 噪音后掩盖真实缺失。缓解：保留全量 compile 和严格模式，当前章节模式只作为默认写作体验。
- 风险：伏笔状态结构过重。缓解：保持字段可选，旧 Scene Card 继续可用。

## 完成后同步

- 若新增 CLI 行为，补充 `changes/YYYY-MM-DD-*.md`。
- 若修改 Scene Card schema 或模板，更新 README、agent guide、相关 fixture。
- 若新增命令，运行 `npm run build:commands` 与 `npm run check:command-manifest`。
- 每个 Batch 完成后更新本文状态；整条路线完成后归档到 `docs/tech/todo-archive.md`，并从 `docs/tech/todo-index.md` 移除。
