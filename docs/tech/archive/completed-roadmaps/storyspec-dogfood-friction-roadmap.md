# StorySpec 自用创作流程问题待办

## 状态

Completed。本文记录 2026-05-04 使用 StorySpec 创作《法术编译纪元》第一卷时暴露的问题，并把它们整理成后续可直接进入 SDD / OpenSpec 的开发路线。2026-05-05 已通过 `fix-storyspec-dogfood-friction` 与 `finish-source-todo-features` 收口任务收尾、章节路径、验证分层、tracking evidence 和源码 TODO 功能。

## 当前主线

让作者和 agent 从“生成卷计划 -> 拆写作任务 -> 连续写章节 -> 更新 tracking -> 标记任务完成 -> 验证收尾”的路径真正闭环：命令要可用，路径要能被自动识别，验证输出要符合当前写作阶段，tracking evidence 要有明确 schema，不再依赖手工猜字段和手工改任务板。

## 非目标

- 不在本路线继续扩写《法术编译纪元》正文或重写创作设定。
- 不绕过 StorySpec 的 preview / confirm / apply 边界，不把 AI 建议静默写入正典。
- 不承诺“一键生成整卷高质量正文”；连续写作编排只负责检查点、上下文、状态同步和失败恢复。
- 不直接修改已归档路线的完成结论；若历史完成项与当前运行产物不一致，以本路线新增回归任务处理。

## 问题复盘

- CLI 源码和 `dist` 产物漂移：`src/cli/commands/tasks-board.command.ts` 已注册 `tasks:set-status` 和 `task:finish`，但 `node dist/cli.js --help` 没有展示这两个命令，`dist/cli/commands/tasks-board.command.js` 也只保留了 `tasks:board`。实际使用时收尾命令不可用。
- 章节路径识别过窄：`src/application/finish-writing-task.ts` 的 `relatedDraftPaths` 只匹配 `content/chapter-\d+.md`，而本次项目实际正文路径是 `content/volume1/chapter-XXX.md`，任务里还可能出现 `chapter-XXX.md` 简写，导致收尾预览无法可靠列出目标正文。
- 写作阶段验证噪音偏高：只写到当前章节时，后续章节输出缺失、未回收伏笔、长文导入的自定义澄清键等信息会混在验证结果里。工具没有足够区分“当前必须处理”和“未来阶段正常未完成”。
- tracking evidence 契约不够统一：`plot-tracker.json` 的 `completedNodes` 被脚本当成字符串数组；关系、promise、plot 的 evidencePath 需求散落在不同文件和提示里。agent 容易为了补证据临时发明字段，后续脚本和校验不一定承认。
- “继续，直接所有流程结束”的长跑流程没有内置安全编排：当前 StorySpec 更适合任务级推进，缺少卷级/批量章节的检查点、预算、失败恢复、状态摘要和自动收尾建议。
- 任务板输出与任务验收之间仍有断点：`tasks.md` 的任务勾选、子验收项、`task-board.json` 的状态、正文文件和 tracking 更新没有一个统一收尾报告串起来。

## P0 立即处理

### P0-1 修复任务收尾命令的源码/产物一致性

- 类型：CLI、构建产物、回归测试
- 背景/问题：历史路线已把 `task:finish` 视为章节收尾基线，但当前 `dist` 运行产物没有该命令，作者实际使用时只能手动改 `tasks.md` 和刷新看板。
- 已有基础：
  - `src/cli/commands/tasks-board.command.ts` 已有 `tasks:set-status`、`task:finish` 注册逻辑。
  - `src/application/finish-writing-task.ts` 已有状态更新和看板刷新逻辑。
  - `tests/smoke/cli-commands.test.ts` 已有 CLI 命令冒烟测试入口。
- 缺口：构建产物没有同步；帮助页、烟测和命令 manifest 没有拦住这种漂移。
- 建议方案：
  1. 复查 CLI 构建链路，确认 `npm run build` 后 `dist/cli/commands/tasks-board.command.js` 包含全部任务命令。
  2. 在 smoke 测试中断言 `node dist/cli.js --help`、`task:finish --help`、`tasks:set-status --help` 都可用。
  3. 若 `tasks:set-status` 不应作为公开命令，则从源码、文档和维护上下文中统一移除；否则补齐 help、测试和文档。
  4. 将“源码新增命令但 dist 帮助页缺失”作为发布前检查项。
- 涉及文件/模块：
  - `src/cli/commands/tasks-board.command.ts`
  - `src/cli/program.ts`
  - `dist/cli/commands/tasks-board.command.js`
  - `tests/smoke/cli-commands.test.ts`
  - `package.json`
- 验收标准：
  - `npm run build` 后，`node dist/cli.js --help` 能看到 `task:finish` 和明确保留的任务状态命令。
  - `node dist/cli.js task:finish --help` 返回成功并展示用法。
  - 章节任务 dry-run 不修改文件，`--apply` 能幂等更新 `tasks.md` 并刷新 `task-board.json`。
  - CI 或本地 `npm run verify` 能捕获命令注册与 `dist` 产物不一致。
- 参考资料/项目：
  - 本次 dogfood 的实际 CLI 输出。
  - 本仓库已归档的章节生产路线。
  - 不需要外部开源参考；这是本仓库内部源码、构建产物和测试覆盖的一致性修复。
- 不做/边界：不在本任务实现卷级自动写作，也不改变任务 Markdown 的业务语义。

### P0-2 统一章节任务路径解析和正文文件识别

- 类型：任务模型、路径规范、测试
- 背景/问题：收尾命令目前只识别 `content/chapter-001.md`，无法覆盖 `content/volume1/chapter-001.md`、`content/卷一/chapter-001.md` 或任务中的短路径写法。连续写作时，agent 需要人工确认正文文件是否属于当前任务。
- 已有基础：
  - `parseWritingTasksFromMarkdown` 能解析任务的 `outputs`、`allowedWrites`、`requiredReads`。
  - Scene Card 已有 `draftPath` 和 `allowedWrites`。
  - `tasks:board` 能导出任务 JSON。
- 缺口：缺少统一的 story-relative 路径归一化规则；章节文件检测与实际目录结构不匹配。
- 建议方案：
  1. 新增章节正文路径识别工具函数，支持 `content/**/chapter-###.md` 和可迁移的 `chapter-###.md` 简写。
  2. `task:finish` 优先从任务 `outputs` 和 Scene Card `draftPath` 定位正文，再回退到 `allowedWrites`。
  3. `tasks:board` 导出的路径统一为 story-relative，不在不同命令间混用短路径、story 路径和绝对路径。
  4. 对无法解析的路径输出可修复建议，而不是默默给空草稿列表。
- 涉及文件/模块：
  - `src/application/finish-writing-task.ts`
  - `src/application/export-task-board.ts`
  - `src/domain/story-artifact.ts`
  - `templates/commands/tasks.md`
  - `tests/unit/finish-writing-task.test.ts`
  - `tests/unit/export-task-board.test.ts`
- 验收标准：
  - `content/volume1/chapter-004.md` 能被识别为当前任务正文。
  - 任务只写 `chapter-004.md` 时，命令能给出归一化建议或自动映射到约定目录。
  - `task:finish` summary 中的草稿数量和路径正确，不再出现“任务存在但草稿为空”的误导。
  - Windows 路径分隔符、中文故事名、卷目录都被 fixture 覆盖。
- 参考资料/项目：
  - 本次《法术编译纪元》第一卷目录结构。
  - 本仓库 Scene Card 路径修复路线的 story-relative 约定。
  - 不需要外部依赖；关键是复用现有路径规范。
- 不做/边界：不迁移用户已有正文目录，只提供识别、归一化和建议。

### P0-3 增加写作阶段感知的验证范围

- 类型：验证体系、CLI 选项、输出降噪
- 背景/问题：作者只写到当前章节时，未来章节缺失是正常状态，但 `validate`、`narrative:test`、`review` 的输出可能把未来任务、计划伏笔和当前必须修复的问题混在一起，导致 agent 需要人工过滤。
- 已有基础：
  - `validate` 已有 artifact、tracking、clarification、agent contract 等检查。
  - `compile --written-only` 和 Scene Card planned payoff 已有阶段感知基础。
  - `tasks.md` 已能表达任务状态和依赖关系。
- 缺口：缺少以当前任务、当前章节或已完成任务为边界的验证模式。
- 建议方案：
  1. 为 `validate` 增加 `--task <id>`、`--through <chapter>` 或等价 scope 设计，默认只把已完成/当前任务缺失升级为 warning。
  2. 未开始任务的缺失输出进入 summary 或 info，不作为当前修复项。
  3. `task:finish` 默认调用当前任务范围验证，卷末或发布前再调用 strict 全量验证。
  4. 统一 `validate`、`narrative:test`、`review` 对 planned/open/paidOff 伏笔状态的展示口径。
- 涉及文件/模块：
  - `src/application/validate-project.ts`
  - `src/validation/artifact-scanner.ts`
  - `src/application/run-narrative-tests.ts`
  - `src/application/review-project.ts`
  - `src/cli/commands/`
  - `tests/unit/validate-project.test.ts`
- 验收标准：
  - 只完成第一章时，未来章节缺失不会压过当前章节结果。
  - 已标记 done 的任务如果缺输出文件，仍会被 warning 或 error 捕获。
  - `--strict` 或全卷模式保留完整缺失检查。
  - JSON 输出中能区分 `dueNow`、`plannedLater`、`blocked` 等状态，便于 agent/UI 读取。
- 参考资料/项目：
  - 本次连续章节写作中的 validate 输出体验。
  - 现有 `compile --written-only` 的阶段过滤思路。
  - 暂不引入外部项目；若进入 OpenSpec，可参考成熟测试框架的 severity/scope 设计做补充调研。
- 不做/边界：不降低最终发布前的全量验证强度。

### P0-4 明确 tracking evidence schema 并提供迁移

- 类型：数据模型、schema、迁移脚本、验证
- 背景/问题：plot、relationship、promise 都需要 evidencePath，但现有模板和脚本对字段形态不统一。例如 `completedNodes` 被脚本读取为字符串数组，agent 若直接改成对象数组会破坏旧脚本。
- 已有基础：
  - `templates/tracking/plot-tracker.json`
  - `templates/tracking/relationships.json`
  - `src/application/manage-promises.ts`
  - `scripts/bash/check-plot.sh`
  - `scripts/powershell/check-plot.ps1`
- 缺口：没有一个统一的 tracking evidence 契约说明哪些字段可写、哪些字段兼容旧脚本、证据路径如何校验。
- 建议方案：
  1. 为 plot / relationship / promise 分别定义 evidence 字段和生命周期，不破坏已有字符串数组字段。
  2. plot 侧优先新增旁路字段，如 `completedNodeEvidence`，而不是改变 `completedNodes` 类型。
  3. relationship 侧明确 turning point 的 `evidencePath` 或 `evidencePaths` 结构。
  4. promise 侧明确 establish / reinforce / payoff 的 evidence 字段，并让 `promise:check` 与 schema 一致。
  5. 增加 `tracking:migrate` 或 `upgrade` 步骤，给旧项目补字段、保留原数据。
- 涉及文件/模块：
  - `templates/tracking/*.json`
  - `templates/commands/track-init.md`
  - `src/validation/schema/index.ts`
  - `src/application/manage-promises.ts`
  - `scripts/bash/check-plot.sh`
  - `scripts/powershell/check-plot.ps1`
  - `tests/unit/schema-validators.test.ts`
- 验收标准：
  - agent 不需要临时发明 tracking evidence 字段，就能记录章节证据。
  - 旧脚本仍能读取 `completedNodes` 字符串数组。
  - 新 schema 能校验 relationship turning points 和 promise payoff evidence。
  - upgrade/migrate 对旧项目幂等，不删除用户已有 tracking 内容。
- 参考资料/项目：
  - 本次手工更新 tracking 时发现的字段冲突。
  - 现有 `promise:check` 的 payoff evidence 检查。
  - 不需要外部依赖；这是 StorySpec 自有 tracking 契约收敛。
- 不做/边界：不自动判断剧情节点是否完成，只校验证据字段和路径存在性。

## P1 近期增强

### P1-1 复验长文创意导入的澄清记录兼容性

- 类型：数据治理、导入体验、验证降噪
- 背景/问题：用户提供的长篇创作提示中包含“感情线”“基调”“思想表达”等自然语言键；进入 StorySpec 后可能变成 answers 里没有 question 对应项的孤儿答案，触发 `UNKNOWN_CLARIFICATION_ANSWER_QUESTION`。
- 已有基础：`clarification:doctor` 已能处理历史孤儿答案，clarification schema 已能报告未知 question。
- 缺口：需要确认 `ingest` / `co:create` 对长文提示的自定义键是否能稳定映射、归档或补 stub，不让作者每次验证都看到历史噪音。
- 建议方案：
  1. 增加包含“爱情线整合版·完成命名版”这类长文提示结构的 fixture。
  2. 复验 `ingest`、`creative:report`、`clarification:doctor --fix` 的端到端行为。
  3. 对无法映射的问题键，统一进入 `archivedAnswers` 或 `sourceNotes`，并保留作者原文来源。
- 涉及文件/模块：
  - `src/application/ingest-story-input.ts`
  - `src/application/manage-clarifications.ts`
  - `src/domain/clarification-schema.ts`
  - `tests/unit/manage-clarifications.test.ts`
  - `tests/fixtures/`
- 验收标准：
  - 长文提示导入后，`validate` 不出现可预防的 unknown answer 噪音。
  - 作者原文中的高影响设定仍可追溯，不被自动改写成正典。
  - `clarification:doctor --fix` 对新旧项目都幂等。
- 参考资料/项目：
  - 本次用户提供的完整故事提示词结构。
  - 现有澄清 doctor 设计。
- 不做/边界：不把用户长文中的所有信息强行拆成标准问题；无法确认的内容仍保持候选或归档。

### P1-2 打通任务验收、tracking 更新和收尾报告

- 类型：任务流程、报告、可观测性
- 背景/问题：完成一章后，`tasks.md` 的主任务勾选、子验收项、`task-board.json`、正文文件、tracking 更新和验证结果之间没有一份统一收尾报告。作者要求“所有流程结束”时，agent 容易漏掉某个状态文件。
- 已有基础：
  - `task:finish` 设计上能更新任务状态。
  - `tasks:board` 能导出 JSON 看板。
  - `validate`、`style:lint`、`narrative:test`、`review` 已能各自产出结果。
- 缺口：缺少把这些状态合成一个章节完成摘要的应用层对象和 CLI 输出。
- 建议方案：
  1. `task:finish` 增加 completion report，列出正文、Scene Card、tracking 文件、验证命令和遗留项。
  2. 子验收项不自动全勾；只在规则可机器判断时标记，其他进入人工确认列表。
  3. `task-board.json` 增加 `evidencePaths`、`lastFinishedAt` 或等价只读摘要字段。
  4. 失败时输出“可以继续写 / 必须修复 / 需要作者确认”三类下一步。
- 涉及文件/模块：
  - `src/application/finish-writing-task.ts`
  - `src/application/export-task-board.ts`
  - `src/domain/story-artifact.ts`
  - `tests/unit/finish-writing-task.test.ts`
- 验收标准：
  - 完成章节后有一份一屏内的收尾摘要。
  - 机器无法判断的验收项不会被自动假装完成。
  - JSON 输出足够让 agent 在下一轮接着工作，不必重新扫描整章。
- 参考资料/项目：
  - 本次多轮“继续”后手工同步任务、tracking 和验证的流程。
- 不做/边界：不让收尾报告替代人工文学审稿。

### P1-3 设计连续章节/卷级批处理编排

- 类型：流程编排、agent 协作、失败恢复
- 背景/问题：用户说“继续，直接所有流程结束”时，当前工具没有卷级 runner。agent 只能在对话中循环写章、验证、更新状态，长任务容易被中断、遗漏或混淆最新用户指令。
- 已有基础：
  - `next` 能给出下一步导航。
  - `context:pack` 能生成写作上下文包。
  - `task:finish` 可作为单任务收尾基础。
- 缺口：缺少“按任务顺序推进 N 个章节”的安全机制，包括预算、检查点、失败停止、摘要和恢复入口。
- 建议方案：
  1. 先写 runbook：推荐 agent 如何按任务批量推进、每章必须跑哪些门禁、何时停下来要求作者确认。
  2. 再评估 CLI：例如 `storyspec next --batch`、`storyspec volume:plan-run` 或 `storyspec task:run --from T004 --limit 3`。
  3. 每个章节都创建 checkpoint，不跨章节静默覆盖。
  4. 失败后给出 resume token 或 handoff summary。
- 涉及文件/模块：
  - `src/application/get-project-status.ts`
  - `src/application/manage-context-packs.ts`
  - `src/application/finish-writing-task.ts`
  - `src/cli/commands/`
  - `templates/commands/write.md`
  - `docs/tech/`
- 验收标准：
  - 作者可以选择“只推进下一章 / 连续推进 3 章 / 只生成计划不写正文”。
  - 任一章节验证失败时停止后续写入，并保留可恢复上下文。
  - 批处理默认不提交 Git、不越过作者确认、不改未授权文件。
- 参考资料/项目：
  - 本次用户连续下达“继续”的真实使用场景。
  - 现有 `handoff` 和 `context:pack` 的上下文交接能力。
  - 进入 OpenSpec 时可补充调研 task runner 的 checkpoint/resume 模式，但本待办阶段不引入依赖。
- 不做/边界：不让 CLI 自己生成小说正文；正文仍由 agent 在受控上下文中创作。

## P2 体验和维护

### P2-1 增加 StorySpec 自用 dogfood 回归 fixture

- 类型：测试、回归保护、文档
- 背景/问题：这次问题不是单个函数坏掉，而是“真实创作长链路”暴露的组合问题。普通单元测试不一定覆盖长文导入、章节目录、任务收尾、tracking 更新和验证降噪的组合。
- 建议方案：
  1. 新增一个合成故事 fixture，覆盖卷目录、中文故事名、多女主关系、伏笔 planned payoff、tracking evidence。
  2. 增加 smoke：`story:new -> ingest/co:create preview -> tasks:board -> task:finish dry-run -> validate scoped`。
  3. fixture 使用虚构短文本，不纳入真实用户项目数据。
- 涉及文件/模块：
  - `tests/fixtures/`
  - `tests/smoke/`
  - `tests/unit/`
- 验收标准：
  - 核心 dogfood 链路能在本地测试中稳定复现。
  - 命令产物漂移、章节路径误识别、tracking schema 破坏至少有一类测试能捕获。
- 参考资料/项目：本次《法术编译纪元》使用流程的结构特征；不复制用户正文。
- 不做/边界：不把 `stories/法术编译纪元` 作为仓库测试 fixture。

### P2-2 减少任务板刷新造成的无意义 diff

- 类型：可维护性、输出稳定性
- 背景/问题：`tasks:board` 刷新通常会更新 `generatedAt`。这对人读有价值，但对频繁收尾和测试 fixture 会造成额外 diff。
- 建议方案：
  1. 增加 `--stable`、`--no-timestamp` 或测试注入 `now` 的统一入口。
  2. 人类默认输出仍保留时间；测试和 agent 自动化可选择稳定输出。
- 涉及文件/模块：
  - `src/application/export-task-board.ts`
  - `src/cli/commands/tasks-board.command.ts`
  - `tests/unit/export-task-board.test.ts`
- 验收标准：
  - 自动化场景可以生成稳定 JSON。
  - 默认 CLI 行为不破坏现有用户体验。
- 参考资料/项目：本次手动刷新看板后的工作区噪音。
- 不做/边界：不删除 `generatedAt` 字段。

### P2-3 扩展文风与叙事质量门禁的可解释性

- 类型：写作质量、规则解释、报告
- 背景/问题：`style:lint` 在当前正文上可能只扫描少量规则且输出较少，不能承担“章节文学质量已检查”的全部期待。作者容易把工具门禁误解为内容质量保证。
- 建议方案：
  1. 在 `style:lint` 输出中区分“已检查规则数”“未覆盖领域”“建议人工审稿项”。
  2. 为长篇轻松冒险、爱情线、团队关系这类常见目标提供可选规则包或 preset 建议。
  3. `task:finish` report 明确 style/narrative 检查是结构门禁，不等同于终稿质量。
- 涉及文件/模块：
  - `src/application/manage-style.ts`
  - `src/validation/rules/writing-rules.ts`
  - `spec/presets/`
  - `docs/tech/`
- 验收标准：
  - 作者能看懂“工具检查覆盖了什么、没有覆盖什么”。
  - 不因为规则少而误报“质量完全通过”。
- 参考资料/项目：本次章节收尾质量检查体验。
- 不做/边界：不自动改写作者文风。

## 完成同步要求

- 涉及 CLI 行为、模板契约、生成产物或公共接口的批次，需要新增 `changes/YYYY-MM-DD-*.md`。
- 修改命令 renderer 或模板后，运行 `npm run build:commands` 和 `npm run check:command-manifest`。
- 修改 CLI 或验证逻辑后，至少运行相关 unit/smoke；合并前运行 `npm run verify`。
- 文档-only 收尾至少运行 `git diff --check`。

## 风险与缓解

- 风险：把“当前写作阶段降噪”误做成“全量验证变松”。缓解：保留 strict 模式，并让发布前流程默认全量检查。
- 风险：tracking schema 迁移破坏旧项目脚本。缓解：不改变旧字段类型，新增旁路 evidence 字段，迁移前后都跑 Bash/PowerShell 检查 fixture。
- 风险：卷级批处理鼓励越过作者确认。缓解：默认只预览和分章 checkpoint，高影响写入必须显式确认。
- 风险：重复实现已归档路线。缓解：本路线只处理实际运行产物、回归测试和长链路 dogfood 发现的新缺口。
