# 故事共创访谈基础门禁路线图

## 状态

Completed。本文承接总路线 F0-F6，聚焦共创体验基线、核心要素成熟度、示例分叉、访谈编排、plan 写入门禁、成果报告和文档迁移。

F0-F6 已完成并验证。后续开发应从 [story-co-creation-story-elements-roadmap.md](story-co-creation-story-elements-roadmap.md) 的 F7 开始，不再把本文作为下一批实现入口。

## 共通上下文

本子路线继承 [story-co-creation-interview-roadmap.md](story-co-creation-interview-roadmap.md) 的产品目标：把 StorySpec 的早期流程从“收集字段并生成文件”升级为“故事共创访谈”。

执行本子路线时必须遵守：

- 作者是在创造小说世界，不是在填写系统字段。
- 高影响候选进入正典前必须保留候选状态、来源、确认边界和 preview/confirm/apply 或等价确认流程。
- 主角、伙伴、舞台、能力、势力、冲突是第一优先级核心入口。
- 高影响候选应展示吸引力、代价、关系影响、世界影响和后续钩子。
- README 只写已实现并验证的能力；本路线内容在完成前只作为待办。
- 开发某个 batch 前，优先读取本文对应 batch；跨主题时再读取关联子路线。


## 执行顺序

- F0：见本文 Batch F0。
- F1：见本文 Batch F1。
- F2：见本文 Batch F2。
- F3：见本文 Batch F3。
- F4：见本文 Batch F4。
- F5：见本文 Batch F5。
- F6：见本文 Batch F6。

## Batch F0：共创体验基线与回归样例

类型：测试、文档、体验基线

目标：把本次真实使用暴露的问题转化为可回归的 fixtures 和验收样例，防止后续只凭主观判断优化。

已有基础：

- `storyspec story:new`、`storyspec interview`、`storyspec creative:report`、`storyspec preview specify` 已存在。
- `templates/clarification/*.yaml` 已有题材问题包。
- `tests/unit/interview-story.test.ts`、`tests/unit/story-onboarding.test.ts` 已覆盖基础访谈和导航。

缺口：

- 没有端到端样例衡量“少量输入是否过快进入 creative-plan”。
- 没有测试断言核心要素是否被充分追问。
- 没有体验指标描述“用户到底创建了什么小说”。

建议方案：

1. 新增真实样例 fixture：`编程施法`，包含一句话灵感、题材偏好、第三次寂静、轻量隐喻。
2. 增加回归测试或 smoke 测试，断言在核心伙伴、舞台、能力边界、势力冲突未成熟时，导航优先推荐继续访谈或候选面板。
3. 在测试注释或 docs 中定义最小体验指标：问题完整度、示例分叉质量、计划前成熟度、用户成就感摘要。
4. 将“优秀小说质量口径”转为回归断言或快照字段，至少覆盖阅读承诺、世界压力、人物情感、成长路线、冲突回报和独特声音中的前三项。

涉及文件/模块：

- `tests/fixtures/`
- `tests/unit/interview-story.test.ts`
- `tests/unit/story-onboarding.test.ts`
- `src/application/story-onboarding.ts`
- `src/application/interview-story.ts`

参考项目/资料：

- 参考项目：GitHub Spec Kit。
  借鉴点：把 `specify`、`plan`、`tasks` 作为可测试阶段，而不是一条不可见的 agent 习惯。
  不照搬：不使用软件需求文档口吻替代小说创作口吻。
  落地方式：fixture 和测试要断言每个阶段的进入条件、阻塞原因和作者确认状态。
- 参考项目：XState。
  借鉴点：用显式状态转移描述 idea、interviewing、candidate、specified、planned。
  不照搬：本批次不引入状态机运行时，只把状态转移写成测试夹具和验收快照。
  落地方式：新增回归样例时同步覆盖“少量输入不能直接跨到完整 plan”的路径。

验收标准：

- 测试覆盖“少量输入 + 已确认部分核心设定”的真实路径。
- 当主角/伙伴/舞台/能力/冲突缺口存在时，`next` 或相关应用服务不会把“生成完整 creative-plan”作为唯一首选。
- 文档明确本路线的体验指标和非目标。
- 真实样例能回答“目前这个故事的阅读承诺是什么、世界压力在哪里、主角/伙伴还缺什么”。
- 真实样例能跑通“保存灵感 -> 选择入口 -> 生成候选 -> 创作回声 -> 预览规格/计划”的流程，而不是直接进入完整大纲。
- 测试或快照中必须体现总体验验收：用户在创造小说世界，而不是填写系统字段。

不做/边界：

- 本批次不改变用户可见行为，只建立样例和判定口径。

## Batch F1：核心要素成熟度模型

类型：领域模型、校验、导航

目标：建立“故事核心要素”成熟度模型，区分已确认、候选、缺失、可稍后决定，并驱动 `next`、`validate`、`creative:report` 和 plan 门禁。

建议核心要素：

- 主角：身份、欲望、价值观、缺陷或误判。
- 核心伙伴：至少一名重要同伴或关系线的功能、立场、与主角的张力。
- 舞台：第一卷主要地点或社会空间，以及它如何呈现世界规则。
- 能力体系：能力用途、限制、代价、与世界本地规则的关系。
- 势力与冲突：至少一个压迫/阻碍来源，以及其合理性或利益逻辑。
- 长线威胁：早期异常、揭示节奏和阶段性回报。
- 类型体验：轻松冒险、慢热感情、成人向边界、建设流边界等阅读承诺。
- 成功路线：主角如何阶段性获得资源、能力、信任、组织能力或影响力，以及每一步代价。
- 独特声音：主角观察世界的方式、叙述语气、幽默/痛感/价值判断和明确不写的风格。

已有基础：

- `ClarificationQuestion` / `ClarificationAnswer` 已有 required、topic、source、confirmed。
- `StoryStage` 已能区分 idea/interviewing/specified/planned。
- validate 已能报告 required 问题未确认。

缺口：

- required 问题是单题级别，无法表达“核心要素成熟度”。
- `creative-plan.md` 是否过早，缺少结构化判断。
- optional 问题可能实际属于 plan 前必须确认的创作体验要素。

建议方案：

1. 新增 `StoryCoreElement` 或类似领域类型，映射 topic/question 到核心要素。
2. 为每个核心要素计算状态：`missing`、`suggested`、`partial`、`confirmed`、`deferred`。
3. 增强 `creative:report`，输出“核心要素面板”。
4. 增强 `next`，当 P0 核心要素不足时，推荐继续共创访谈，而不是进入 plan。
5. 增强 validate：对 plan 前缺失核心要素给 warning；如果 plan/apply 试图把 AI 候选写成正典，继续 blocking。

涉及文件/模块：

- `src/domain/clarification.ts`
- `src/domain/story-stage.ts`
- `src/application/interview-story.ts`
- `src/application/story-onboarding.ts`
- `src/application/creative-report.ts`（如存在，或对应实现文件）
- `src/validation/rules/writing-rules.ts`
- `tests/unit/*`

参考项目/资料：

- 参考项目：GitHub Issue Forms。
  借鉴点：required、optional、dropdown、textarea 等 schema 约束能帮助问题包稳定演进。
  不照搬：不把核心要素做成一次性表单；同一要素可以由多轮回答逐步成熟。
  落地方式：将成熟度状态映射到 clarification schema 和 validate warning。
- 参考项目：XState。
  借鉴点：用状态和事件区分 `missing`、`suggested`、`partial`、`confirmed`、`deferred`。
  不照搬：不让状态机术语暴露给作者。
  落地方式：核心要素面板和 plan 门禁使用同一套状态计算，避免 CLI、agent prompt、validate 各说各话。

验收标准：

- 对“编程施法”样例，报告能明确显示：主角部分确认、能力方向确认、长线威胁确认；核心伙伴、第一舞台、势力冲突细节仍需共创。
- `storyspec next` 能输出“继续确认核心伙伴/舞台/冲突”作为高优先级动作。
- 已 `deferred` 的元素不会阻止保存草稿，但会阻止直接应用完整 plan。
- 核心要素面板能区分“世界观真实压力”和“百科式设定堆叠”，至少要求第一舞台中存在会影响角色行动的利益结构或代价。

不做/边界：

- 不要求每部小说必须有恋爱线或固定伙伴；核心要素模型应支持类型差异。

## Batch F2：丰富示例分叉与影响说明

类型：模板、问题库、用户体验

目标：让引导提示词和示例更完整。示例不只回答问题，还展示选择会产生的小说风味、代价和后续影响。

已有基础：

- `templates/clarification/*.yaml` 每题已有 `exampleAnswers`。
- `docs/tech/clarification-question-packs.md` 已要求示例必须分叉。
- 示例分叉模型已归档完成，但当前问题库仍偏“短答案”。

缺口：

- 示例缺少风味说明，例如“学院调查”“边境冒险”“旅途修复”会带来不同节奏。
- 示例缺少代价和边界说明，例如轻量隐喻如何避免能力边界模糊。
- 示例没有覆盖主角、伙伴、舞台、势力冲突等高影响模块的完整决策包。

建议方案：

1. 扩展 clarification schema，支持 `exampleBranches`：
   - `label`
   - `answer`
   - `flavor`
   - `tradeoffs`
   - `downstreamImpact`
   - `recommendedFor`
2. 保持向后兼容：旧 `exampleAnswers` 继续可用。
3. 更新核心问题包：
   - `core.yaml`：主角价值观、核心伙伴、第一舞台、第一卷冲突。
   - `portal-fantasy.yaml`：穿越机制与回家动机。
   - `magic-system.yaml`：轻量隐喻/中度规则/硬规则的差异和后果。
   - `civilization-threat.yaml`：小异常、历史灾难、揭示节奏。
   - `slow-burn-romance.yaml`：关系起点与升温阻力。
   - 新增或扩展成功路线/作品声音问题：阶段性胜利、代价、叙述风味、价值判断和明确不想写成的样子。
4. 更新 CLI/agent 输出，让每个高影响问题展示 2-3 个“可复制但可改写”的分叉。

涉及文件/模块：

- `templates/clarification/*.yaml`
- `src/domain/clarification.ts`
- `src/application/select-clarification-questions.ts`
- `src/application/interview-story.ts`
- `templates/commands/clarify.md`
- `templates/commands/specify.md`
- `docs/tech/clarification-question-packs.md`

参考项目/资料：

- 参考项目：Twine。
  借鉴点：每个选择都应能看见后续路径和故事风味变化。
  不照搬：不把示例分叉做成完整互动小说节点图。
  落地方式：`exampleBranches` 必须包含 `flavor`、`tradeoffs`、`downstreamImpact`。
- 参考项目：Inquirer.js。
  借鉴点：选择、确认、跳过、自由编辑应作为同一轮问题的自然操作。
  不照搬：不强制所有运行环境进入交互式 prompt。
  落地方式：CLI 输出和 agent prompt 都要能表达“复制示例 / 改写示例 / 拒绝示例 / 稍后决定”。
- 参考项目：GitHub Issue Forms。
  借鉴点：结构化字段和占位说明能降低问题包维护成本。
  不照搬：不把分叉压成冷冰冰的表单字段。
  落地方式：为 `exampleBranches` 增加 schema 校验和文档约束。

验收标准：

- “编程施法更偏硬规则还是轻量隐喻”输出至少三条分叉：轻量隐喻、中度规则、硬规则，并说明各自风味与风险。
- 主角/伙伴/舞台/势力冲突问题至少各有 2-3 个高质量分叉。
- 示例仍不会被默认写入 canon；必须由用户确认。
- 示例能说明选择如何影响阅读承诺、成长路线、情感关系或世界压力，而不是只给短答案。

不做/边界：

- 不让示例变成长篇设定生成器；每个分叉应短、清楚、可改写。

## Batch F3：访谈编排与追问策略

类型：应用服务、CLI、prompt

目标：把访谈从“按关键词抽问题”升级为“围绕故事骨架逐步共创”。每轮问题要有阶段目标，并根据用户回答追问。

已有基础：

- 问题选择器能根据关键词选择题材问题包。
- `interview` 支持 replay、跳过已确认答案和 `max-questions`。

缺口：

- 选择器可能优先问到题材细节，而不是主角/伙伴/舞台/冲突这些骨架问题。
- 追问策略不足；用户确认“轻量隐喻”后，应追问能力边界和爽点来源，而不是直接结束。
- 用户缺少“让我提问 / 给我候选 / 稍后决定 / 进入计划预览”的明确选择。

建议方案：

1. 引入访谈阶段：
   - `seed`：保留原始灵感。
   - `core-cast`：主角与核心伙伴。
   - `stage`：第一舞台与社会结构。
   - `power`：能力用途、限制、代价。
   - `conflict`：势力与第一卷阻力。
   - `promise`：读者承诺和前三章钩子。
   - `growth-route`：主角阶段性成功路线、资源、代价和回报节奏。
   - `voice`：叙述声音、主角观察方式和作品不想变成的形态。
2. 每轮优先补最薄弱的核心要素，而不是只按关键词顺序。
3. 增加依赖追问：
   - 选择轻量隐喻后，追问“能力爽点来自哪里”和“能力不能做什么”。
   - 选择文明级威胁后，追问“第一卷只看到哪一角”。
   - 选择慢热感情后，追问“开局张力和边界”。
4. CLI 输出下一步菜单：继续访谈、生成候选、预览规格、暂存。

涉及文件/模块：

- `src/application/interview-story.ts`
- `src/application/select-clarification-questions.ts`
- `src/application/story-onboarding.ts`
- `src/cli/commands/*`
- `templates/commands/clarify.md`
- `templates/commands/context-pack.md`

参考项目/资料：

- 参考项目：Inquirer.js。
  借鉴点：每轮只问少量高价值问题，并提供 list/confirm/editor 等不同回答方式。
  不照搬：不要求 TTY 环境；文本 handoff 也必须完整。
  落地方式：访谈输出统一包含继续访谈、生成候选、预览规格、暂存等动作。
- 参考项目：Yeoman。
  借鉴点：先提示、再生成，生成前只收集当前阶段必要信息。
  不照搬：不把 story:new 做成重型初始化向导。
  落地方式：每个访谈阶段都有“足够进入下一步”的最小条件。
- 参考项目：XState。
  借鉴点：访谈阶段和模式切换应有明确状态转移。
  不照搬：不把状态机复杂度提前推给作者。
  落地方式：阶段选择器用同一套状态驱动 `next` 和 `creative:report`。

验收标准：

- 对“18+ 玄幻、异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁”，前两轮访谈必须覆盖主角、舞台、能力边界、长线威胁；如果用户继续，覆盖伙伴和势力冲突。
- 已确认答案会触发相关追问，而不是减少到只剩文件生成建议。
- 用户能明确选择“暂停后续小说编写/只讨论/只建待办”而不触发写作流程。
- 访谈能追问“主角如何一步步成功”和“这本书的独特声音是什么”，但允许用户稍后决定。

不做/边界：

- 不强制交互式终端；非交互环境仍可输出问题和 handoff prompt。

## Batch F4：creative-plan 写入节奏门禁

类型：命令模板、preview/apply、校验

目标：防止 `creative-plan.md` 在作者尚未充分参与核心要素时过早落盘。让 plan 阶段默认先输出“计划预览 + 缺口面板 + 候选分叉”，确认后再写入。

已有基础：

- 高影响写入命令已有 preview/confirm/apply 规则。
- `preview specify` / `apply` 已有 CLI。
- `templates/commands/plan.md` 已说明写入前预览门禁。

缺口：

- 实际 agent 执行时容易直接手写 `creative-plan.md`。
- CLI 尚未提供稳定的 `preview plan` / `apply` 路径。
- 缺少“核心要素不足时只允许 plan preview”的明确验收。

建议方案：

1. 新增或增强 `storyspec preview plan <story>`。
2. 预览内容必须包含：
   - 用户已确认核心要素。
   - `[需要澄清]` 核心缺口。
   - AI 候选分叉。
   - 拟写入 `creative-plan.md` 的范围和风险。
   - 阅读承诺、世界压力、人物情感、成长路线、冲突回报和独特声音的覆盖情况。
3. `apply` 在核心要素不足时阻止完整计划落盘，除非用户显式选择“生成草案并保留缺口”。
4. 更新 `templates/commands/plan.md`，强调 plan 不能把候选角色/势力/章节安排伪装成已确认正典。
5. 增加 validate 检查：`creative-plan.md` 中未标注来源的高影响设定应产生 warning。

涉及文件/模块：

- `src/cli/commands/preview*.ts` 或对应 preview 实现
- `src/application/*preview*`
- `templates/commands/plan.md`
- `src/validation/rules/writing-rules.ts`
- `tests/unit/preview-apply.test.ts`
- `tests/unit/inspect-story-structure.test.ts`

参考项目/资料：

- 参考项目：GitHub Spec Kit。
  借鉴点：specification、plan、tasks 的阶段边界和确认后执行。
  不照搬：不把小说 plan 当作软件实现计划，不用工程任务替代创作选择。
  落地方式：`preview plan` 和 `apply plan` 必须有清楚差异，并输出写入范围。
- 参考项目：XState。
  借鉴点：阻止从 `candidate` 或 `partial` 直接进入 `planned`。
  不照搬：不新增复杂依赖作为第一步。
  落地方式：以测试覆盖状态转移和 override 行为，确保 agent 不能绕过门禁。

验收标准：

- 当核心伙伴、第一舞台、势力冲突均缺失时，`preview plan` 可以生成预览，但 `apply` 默认阻止完整写入。
- 用户显式确认“草案模式”时，`creative-plan.md` 必须保留 `[需要澄清]` 和来源标记。
- 文档和命令提示清楚解释为什么慢下来。
- `creative-plan.md` 若包含分卷/章节安排，必须能追溯到已确认阅读承诺、世界压力、成长路线或明确标为候选。

不做/边界：

- 不禁止高级用户直接手写计划；只要求 CLI/agent 推荐路径保护创作体验。

## Batch F5：作者成就感与状态报告

类型：CLI、报告、文档

目标：回答“用户到底创建了什么小说？”让用户在每个阶段看到自己已经做出的创作决定，以及下一步可探索的乐趣点。

已有基础：

- `creative:report` 能输出用户确认、待澄清、AI 候选和漂移风险。
- `next` 能输出下一步动作。

缺口：

- 报告偏控制权和缺口，不够像“创作成果摘要”。
- 用户看不到“我已经创造出了什么故事骨架”。
- 缺少把创作乐趣点呈现为可选择下一步的能力。

建议方案：

1. 增强 `creative:report`，增加“你已经创建的小说骨架”：
   - 已确认主角/价值观。
   - 已确认世界问题。
   - 已确认阅读承诺。
   - 已确认能力风味。
   - 已确认成功路线或阶段性回报。
   - 已确认作品声音或叙述风味。
2. 增加“仍可探索的乐趣点”：
   - 伙伴会怎样挑战主角。
   - 第一舞台会怎样压迫或诱惑主角。
   - 能力限制会制造什么爽点。
   - 第三次寂静第一卷只露出哪一角。
   - 主角每一步成功要付出什么代价。
   - 这本书应避免变成哪种俗套作品。
3. 输出“下一轮共创建议”，而不是只给命令名。

涉及文件/模块：

- `src/application/creative-report.ts` 或对应实现
- `src/application/story-onboarding.ts`
- `templates/commands/clarify.md`
- `README.md`

参考项目/资料：

- 参考项目：novelWriter、Manuskript。
  借鉴点：长篇项目需要清楚呈现角色、章节、结构和进度，但应服务作者写作。
  不照搬：不新增桌面式项目树，也不让报告变成文件清单。
  落地方式：`creative:report` 输出“故事骨架”和“仍可探索的乐趣点”，而不是只列文件状态。
- 参考项目：Foam。
  借鉴点：用本地知识节点和链接感呈现作品正在生长。
  不照搬：不引入完整双链 UI。
  落地方式：成果摘要引用已确认的 story facts、relationships、WorldFact 和 decisions。

验收标准：

- 对样例故事，报告能自然回答“目前这是一部什么小说”。
- 报告不把未确认候选当作已创建成果。
- 下一步建议包含创作问题和命令，例如“先确认核心伙伴：运行 storyspec interview ... 或直接回答以下问题”。
- 报告能区分“项目框架已建立”和“小说灵魂仍待共创”，避免把文件齐全误报为创作成熟。

不做/边界：

- 不生成营销式简介替代规格；报告是创作状态，不是宣传文案。

## Batch F6：文档、示例与迁移说明

类型：文档、教程、changeset

目标：把新的共创访谈流程写入用户文档和贡献规范，避免 README 继续暗示“快速进入 plan”。

建议方案：

1. 更新 README 快速开始：
   - 强调 story:new 后进入“共创访谈”。
   - 说明 specification 与 creative-plan 的生成时机。
2. 更新 `docs/tech/clarification-question-packs.md`：
   - 增加 `exampleBranches` 贡献规范。
   - 增加核心要素覆盖要求。
3. 新增 changeset：`changes/YYYY-MM-DD-story-co-creation-interview.md`。
4. 更新命令模板中的措辞，避免“基于少量输入直接制定完整计划”的暗示。

涉及文件/模块：

- `README.md`
- `docs/tech/clarification-question-packs.md`
- `templates/commands/*.md`
- `changes/*.md`

参考项目/资料：

- 参考项目：GitHub Spec Kit。
  借鉴点：把推荐流程、命令阶段和 agent 使用方式写清楚。
  不照搬：不让 README 承诺未实现的未来能力。
  落地方式：文档只描述已完成 batch 的真实行为，规划内容留在 `docs/tech/`。
- 参考项目：Yeoman。
  借鉴点：初始化说明要清楚告诉用户会生成什么、不会覆盖什么、下一步是什么。
  不照搬：不把文档写成脚手架宣传页。
  落地方式：README 快速开始突出“保存灵感 -> 共创访谈 -> 预览 -> 确认写入”。

验收标准：

- README 中的推荐流程明确包含“共创访谈/核心要素确认”。
- 文档说明 `creative-plan.md` 不应过早替作者定稿。
- `npm run check:changes` 通过。

不做/边界：

- 不承诺尚未实现的 GUI、自动迁移或外部平台功能。

## 完成后需要同步

- 更新 [story-co-creation-interview-roadmap.md](story-co-creation-interview-roadmap.md) 中对应批次状态。
- 更新 [todo-index.md](todo-index.md) 的当前下一步。
- 涉及 CLI、模板、生成产物或验证变化时新增 changeset。
- 按影响面运行构建、测试、command manifest 和 changeset 检查。
