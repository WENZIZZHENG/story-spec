# 体验后续增强入口路线图

## 状态

Active。本文把归档中只留下方向、尚未登记为活跃待办的体验增强入口统一转为活跃 discovery 路线。每个任务的第一步是形成更具体的 OpenSpec change 或专题 roadmap，而不是直接实现。

## 背景和目标

当前 `todo-index.md` 曾显示无活跃路线，但多个归档条目仍写着“新增首程体验增强”“共创体验增强”“dogfood 回归”“创作控制权增强”等后续入口。目标是把这些入口显式登记为活跃，避免未来增强散落在归档文件里。

## 非目标

- 不把已完成路线重新打开。
- 不承诺 GUI、自动迁移或外部平台能力。
- 不把 discovery 任务写成已确定实现方案。
- 不覆盖作者确认、preview / confirm / apply 和来源追踪边界。

## P0 回归与体验证据

### P0-0 Dogfood 继续创作工具包后续验收

- [x] 状态：完成（2026-05-05）。已形成 dogfood 记录 `docs/tech/dogfood-authoring-continuation-2026-05-05.md`；复现 `storyspec upgrade --templates --scripts` 会覆盖故事级根 `CONTINUE.md`，并转入 OpenSpec `openspec/changes/preserve-continuation-entry-on-upgrade` 修复。
- 类型：dogfood、继续创作、验证体验
- 背景/问题：`法术编译纪元` dogfood 已把继续创作入口、故事面板、开放承诺、追踪回填清单和本地验证脚本沉淀为源项目通用工具包；下一步需要用真实项目继续观察这些模板是否降低断点续写成本。
- 已有基础：`templates/CONTINUE.md`、`templates/authoring/*`、`scripts/*/validate-local.*`、`storyspec validate` 工具包缺失 warning。
- 缺口：缺少真实故事升级后的使用记录，例如作者是否能只读 `CONTINUE.md` 就进入下一章、agent 是否会正确复制故事级模板、tracking 回填是否仍漏项。
- 建议方案：挑选 1-2 个已有 StorySpec 项目运行 `storyspec upgrade --templates --scripts`，记录继续创作入口、handoff、validate-local 和 story-dashboard 模板的实际使用摩擦；只把复现明确的问题转为 OpenSpec。
- 下一次开发入口：本轮已创建 dogfood 记录并转入实现修复；后续若继续观察工具包体验，另建新 dogfood 记录，不复用本条。
- 涉及文件/模块：`templates/CONTINUE.md`、`templates/authoring/*`、`src/application/validate-project.ts`、`src/application/check-writing-state.ts`、`scripts/*/validate-local.*`。
- 参考资料：`openspec/changes/dogfood-authoring-continuation-kit/`。
- OpenSpec 输入：若转实现，proposal 必须引用 dogfood 记录中的复现项目和命令；没有复现证据时只更新记录，不改业务代码。
- 验收标准：形成一份 dogfood 记录，包含复现项目、入口选择、遇到的问题、是否阻断继续写作、建议 OpenSpec change。
- 验收命令：`storyspec upgrade --templates --scripts` 的实际输出记录、`storyspec validate` 或本地 `validate-local` 输出、`git diff --check`。
- 不做/边界：不在本路线直接实现静态 HTML 或交互图谱，不把模板内容写成某个故事的正典。

### P0-1 Dogfood 回归和章节生产问题再收集

- [x] 状态：完成（2026-05-05）。已新增 `docs/tech/dogfood-regression-template.md`，固定“场景、命令、输入、预期、实际、阻断等级、复现文件、候选路线、建议验证”字段，并用 `upgrade --templates` 覆盖故事级 `CONTINUE.md` 的真实回归填入样例。
- 类型：dogfood、测试、路线分流
- 背景/问题：归档记录允许新增 dogfood 回归或章节生产增强时回到待办入口；当前需要把这一入口显式登记。
- 已有基础：`docs/tech/archive/completed-roadmaps/storyspec-dogfood-friction-roadmap.md`、`chapter-production-workflow-roadmap.md`、smoke 和 unit tests。
- 缺口：缺少新一轮 dogfood 问题的收集模板、优先级规则和分流到 OpenSpec 的判断。
- 建议方案：先建立 dogfood 回归记录格式，覆盖首程、章节写作、任务收尾、validate 噪音和生成产物一致性；发现具体缺陷后拆成独立 OpenSpec。
- 下一次开发入口：本轮已完成模板和真实样例；后续 dogfood 新问题直接按该模板记录，P0/P1 再转 OpenSpec。
- 涉及文件/模块：`docs/tech/`、`tests/fixtures/`、`tests/smoke/`、相关 CLI 模块。
- 参考资料：`docs/tech/archive/completed-roadmaps/storyspec-dogfood-friction-roadmap.md`、`docs/tech/archive/completed-roadmaps/chapter-production-workflow-roadmap.md`。
- OpenSpec 输入：P0/P1 缺陷才进入实现 change；P2/P3 体验问题先保留记录并补证据。每个 change 必须带复现命令或 fixture。
- 验收标准：新问题能被记录为“证据、影响、复现、候选路线、建议验证”；不再只留在聊天记录或归档备注。
- 验收命令：文档检查 `git diff --check`；若新增 fixture，运行对应 unit/smoke。
- 不做/边界：本任务不直接修复具体 bug。

## P1 作者首程与新用户体验

### P1-1 首程体验增强 discovery

- [x] 状态：完成（2026-05-05）。已新增 `docs/tech/first-run-experience-notes-2026-05-05.md`，走查 `init -> story:new -> next -> interview -> core/creative:report -> preview specify -> apply` 主路径；未发现 P0/P1 阻断缺陷，记录 `creative:report` 首程默认文本偏长为 P2 候选。
- 类型：用户体验、文档、CLI 导航
- 背景/问题：作者首程引导已完成一轮，但归档中保留“新增首程体验增强时回到 todo-index”的入口。
- 已有基础：`story:new`、`next`、`interview`、`creative:report`、`preview/apply`、quickstart。
- 缺口：缺少下一轮首程体验的具体痛点、用户路径证据和成功指标。
- 建议方案：收集首次创建故事、长文导入、低负担访谈、首次预览写入四类体验证据，再决定是否拆出专题路线。
- 下一次开发入口：本轮已完成首程主路径走查；后续若重复发现 `creative:report` 首程输出过长，再转 OpenSpec 设计简短默认视图。
- 涉及文件/模块：`src/cli/commands/story-onboarding.command.ts`、`src/application/story-onboarding.ts`、`docs/quickstart.md`、`README.md`、smoke。
- 参考资料：`docs/tech/archive/completed-roadmaps/author-first-run-feedback-roadmap.md`、`new-user-story-creation-dogfood-roadmap.md`。
- OpenSpec 输入：只有当记录中出现明确命令输出缺陷、文档与实际不一致或用户路径阻断时才开实现 change；单纯偏好调整先留在体验记录。
- 验收标准：输出下一轮首程体验问题清单，包含复现路径、用户感知、影响模块和是否进入 OpenSpec。
- 验收命令：记录所用 CLI 命令的 stdout 摘要；文档变更跑 `git diff --check`，涉及 README/commands 时跑 `npm run check:changes`。
- 不做/边界：不把 quickstart 写成未实现能力宣传。

### P1-2 新用户小说创建体验增强

- [x] 状态：完成（2026-05-05）。已新增 `docs/tech/new-user-story-entry-notes-2026-05-05.md`，走查一句灵感、长文资料、表格资料和随便聊聊四类入口；未发现 P0/P1 阻断缺陷，记录 300 字左右资料归入 `short-idea`、表格只做列映射为 P2 观察。
- 类型：新用户体验、CLI 导航、文档
- 背景/问题：新用户小说创建端到端体验 P0-P2 已完成，但后续增强入口仍应活跃登记。
- 已有基础：`story:new -> next -> interview -> creative:report -> preview specify -> apply` 主路径。
- 缺口：缺少新用户在“只有一句灵感 / 有长文资料 / 想随便聊聊 / 有表格资料”四种入口下的下一轮优化证据。
- 建议方案：用 fixture 或手工走查记录每种入口的输出密度、下一步可执行性和作者控制权提示，再转具体 OpenSpec。
- 下一次开发入口：本轮已完成四入口记录；后续若 300 字资料分类或表格摘要反馈重复出现，再转独立 OpenSpec，不在本条继续扩展。
- 涉及文件/模块：`src/application/get-next-action.ts`、`src/application/story-onboarding.ts`、`docs/quickstart.md`、`tests/smoke/`。
- 参考资料：`docs/tech/archive/completed-roadmaps/new-user-story-creation-dogfood-roadmap.md`。
- OpenSpec 输入：把四类入口的“当前可用/缺口”作为 proposal 背景；任务必须拆成单一路径，不把四种入口合成一个大改。
- 验收标准：每种入口都有明确“当前可用 / 缺口 / 建议下一步 / 不做”的记录。
- 验收命令：相关 smoke 或手工命令记录；`npm run build` 只在改源码时需要。
- 不做/边界：不新增 GUI。

## P2 共创和创作控制权

### P2-1 共创体验下一轮增强

- [x] 状态：完成（2026-05-05）。已新增 `docs/tech/co-creation-experience-followup-2026-05-05.md`，复核《编程施法》首轮共创 fixture 和共创体验验收；相关 3 个测试文件 5 个测试通过，未发现 P0/P1 缺陷，仅保留“增加非能力驱动 fixture”“默认入口输出减密”为 P2 观察。
- 类型：共创体验、访谈、创作乐趣
- 背景/问题：F0-F21 已完成，但归档记录保留新体验优化入口。
- 已有基础：共创访谈、核心要素、入口卡、分支、创作回声、低负担模式。
- 缺口：缺少下一轮“更有趣、更可控、更低负担”的具体问题和优先级。
- 建议方案：围绕选择后果、入口卡、势力入口、未决项回流和首轮样例做体验验收复盘；产出新专题路线或关闭无收益项。
- 下一次开发入口：本轮已完成复核；后续若真实首程反馈显示入口过密，或共创改动需要更宽题材回归，再分别转 OpenSpec。
- 涉及文件/模块：`src/application/interview-story.ts`、`src/application/co-create-workbench.ts`、`templates/clarification/`、`docs/creative-control.md`、tests。
- 参考资料：`docs/tech/archive/completed-roadmaps/story-co-creation-*.md`。
- OpenSpec 输入：高影响候选展示、入口卡排序、未决项回流等应分别开 change；proposal 必须引用体验验收失败项或人工走查记录。
- 验收标准：列出下一轮共创体验候选增强，每项有用户收益、涉及模块、验收方式和边界。
- 验收命令：相关 co-creation unit/fixture；文档-only 走查跑 `git diff --check`。
- 不做/边界：不替作者决定正典事实。

### P2-2 共创输入与核心信息面板增强

- [ ] 状态：Active
- 类型：共创输入、核心面板、长文吸收
- 背景/问题：共创输入与核心信息面板 P0-P3 已完成，后续增强入口需要活跃登记。
- 已有基础：`core`、`ingest`、`co:create`、来源状态标记、无标题长文候选识别。
- 缺口：缺少下一轮对长文、表格、核心要素缺口和中文别名体验的改进证据。
- 建议方案：采集不同资料形态的输入样例，检查 core 面板是否能清楚区分 confirmed / partial / missing / suggested / deferred。
- 下一次开发入口：建立 3-4 个输入样例记录：短灵感、长文、Markdown 表格、无标题资料；记录 `ingest`、`co:create`、`core --missing --json` 的输出差异，再决定是否补 fixture 或 schema。
- 涉及文件/模块：`src/application/ingest-story-input.ts`、`src/application/story-core-summary.ts`、`src/application/co-create-workbench.ts`、tests。
- 参考资料：`docs/tech/archive/completed-roadmaps/co-creation-input-and-core-roadmap.md`。
- OpenSpec 输入：如果问题是识别错误，附输入样例和期望 JSON；如果问题是文案不清，附当前输出和目标输出；如果问题是来源污染，必须写 preview/apply 边界。
- 验收标准：输出可转 OpenSpec 的增强清单，至少覆盖输入识别、来源状态、面板解释和 preview 写入边界。
- 验收命令：相关 unit/smoke 或手工 CLI 输出记录；改源码后运行 `npm run build`。
- 不做/边界：不自动把 suggested 内容写入正典。

### P2-3 创作控制权下一轮增强

- [ ] 状态：Active
- 类型：创作控制权、来源追踪、确认门禁
- 背景/问题：D0-D10 已完成，但归档入口允许新增强路线回到 todo-index。
- 已有基础：澄清记录、preview/confirm/apply、成熟度模型、来源追踪、漂移检测、文档教程。
- 缺口：缺少下一轮控制权体验的具体痛点，例如未确认候选展示、回滚、漂移解释或 handoff 摘要可读性。
- 建议方案：复盘 creative:report、next、clarification rollback、preview/apply 的用户输出，收集哪些地方仍可能让 AI 过早定案。
- 下一次开发入口：新增控制权走查记录，逐项截图或摘录 `creative:report --json`、`next`、`clarification:rollback --json`、`preview/apply` 输出；用“可能让 AI 过早定案的证据”作为候选增强入口。
- 涉及文件/模块：`src/application/manage-clarifications.ts`、`src/application/preview-apply.ts`、`src/application/detect-creative-intent-drift.ts`、templates、docs。
- 参考资料：`docs/tech/archive/completed-roadmaps/creative-control-roadmap.md`。
- OpenSpec 输入：所有实现 change 必须声明保护的控制权类型、不会写入的文件、回滚或确认边界；若只是解释文案问题，优先做文档/渲染小切片。
- 验收标准：每个候选增强说明它保护哪类作者控制权、需要读写哪些文件、如何验证不污染正典。
- 验收命令：相关 clarification/preview unit、CLI smoke 或手工命令记录；`git diff --check`。
- 不做/边界：不降低确认门禁。

## P3 世界观与工作台体验

### P3-1 Worldbuilding / Workbench 后续增强 discovery

- [ ] 状态：Active
- 类型：世界观、工作台、体验研究
- 背景/问题：Worldbuilding 第一版和 Workbench 基座已完成，归档记录保留后续增强入口。
- 已有基础：World Bible、Canon Ledger、Entity Graph、Scene Cards、VoiceFingerprint、Reviewer Loop、Workbench commands。
- 缺口：缺少下一轮世界观和工作台增强的优先级，尤其是类型包、reviewer 权重、lint 外部工具已拆到其他路线后，剩余体验问题需要重新确认。
- 建议方案：先做 discovery，区分应进入 `storyspec-ecosystem-roadmap.md`、`agent-ci-quality-roadmap.md` 还是新建独立 Workbench 路线。
- 下一次开发入口：产出 `docs/tech/workbench-worldbuilding-followup-triage-YYYY-MM-DD.md` 分流表，列出候选、用户收益、已有命令、是否已被生态/质量路线覆盖、建议归属和是否关闭。
- 涉及文件/模块：`src/application/*world*`、`src/application/*graph*`、`src/application/*scene*`、`src/application/*voice*`、`src/application/review*`。
- 参考资料：`docs/tech/archive/completed-roadmaps/worldbuilding-quality-roadmap.md`、`docs/tech/archive/full-refactor/full-refactor-workbench.md`。
- OpenSpec 输入：只有分流表判定为独立 Workbench/Worldbuilding 缺口时才新建路线；已归属类型包、reviewer 权重或 lint adapter 的候选只在对应路线推进。
- 验收标准：形成一份分流表，明确哪些进入现有活跃路线，哪些需要新 OpenSpec，哪些关闭。
- 验收命令：文档检查 `git diff --check`；若补验证 fixture，运行对应 unit/smoke。
- 不做/边界：不自动重写世界观或正文。

## 完成同步

- discovery 任务产出具体实现时，先转 OpenSpec change。
- 若拆出新专题路线，更新 `todo-index.md`。
- 若确认无收益，记录关闭原因并从活跃路线移除或归档。
