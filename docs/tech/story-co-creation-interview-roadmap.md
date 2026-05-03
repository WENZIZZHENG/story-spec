# 故事共创访谈体验增强路线图

## 状态

Planned。本路线用于修复真实使用中暴露出的创作体验问题：StorySpec 已能保护作者确认权，但仍可能过快从少量输入进入规格和创作计划，导致作者没有充分体验“选择、改写、发现小说”的乐趣。

## 当前主线

把 StorySpec 的早期流程从“收集字段并生成文件”升级为“故事共创访谈”：先帮助作者围绕主角、伙伴、舞台、能力、势力与冲突做有趣选择，再进入 specification / creative-plan / tasks。

## 背景/问题

一次真实使用路径暴露了三个缺口：

1. 引导提示词和示例不够完整。示例能帮助回答，但没有充分说明不同选择会长成什么类型的小说，也缺少“风味、代价、后续影响”。
2. 主角设定、核心伙伴、世界观与舞台、能力体系、势力与冲突等核心要素没有形成足够强的澄清门禁。系统能保存 `[需要澄清]`，但没有让作者充分参与这些关键决定。
3. `creative-plan.md` 生成过快。用户刚给出少量核心设定，系统就能产出分卷、章节和角色候选；这在工程上有效，但体验上会让作者变成验收者，而不是共同创作者。

已有路线 [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md) 和 [story-onboarding-navigation-roadmap.md](archive/completed-roadmaps/story-onboarding-navigation-roadmap.md) 已解决“AI 建议不得静默写入正典”“新故事有入口和下一步导航”等问题；本路线是在其上新增“创作乐趣和关键要素参与度”。

## 优秀小说质量口径

本路线不只解决“问不问问题”，还要让 StorySpec 的早期流程对齐优秀小说的基本闭环。当前判断：

- StorySpec 已是合格的小说工程化底座：能管理规格、澄清、计划、任务和追踪，能防止未确认 AI 建议污染正典，也适合长篇维护。
- StorySpec 还不是足够好的共创型小说编辑：它会过快进入项目文件和计划产物，而没有充分帮助作者创造主角、伙伴、舞台、冲突和情感关系。

后续开发应把以下六个维度作为“好小说早期成熟度”的核心口径：

| 维度 | 对小说的意义 | StorySpec 应支持的体验 |
| --- | --- | --- |
| 核心阅读承诺 | 读者为什么追下去：爽点、悬念、情感、成长或世界谜团 | 在 story:new / interview / creative:report 中明确展示已确认的阅读承诺和未确认的承诺缺口 |
| 有压力的世界观 | 世界不是百科设定，而是有因果、利益结构、代价和压迫 | 追问第一舞台、社会结构、资源分配、禁令、代价，让世界规则落到场景问题 |
| 人物欲望与情感关系 | 主角和伙伴不能只是设定容器，要有欲望、恐惧、误判、张力和变化 | 在 plan 前优先澄清主角欲望、缺陷、核心伙伴功能、关系起点和冲突 |
| 成功路线/成长路线 | 读者要看到主角如何一步步赢得资源、能力、信任和影响力 | 追问能力边界、阶段目标、资源、阻碍、突破和代价，避免无代价升级 |
| 冲突升级与回报节奏 | 小冲突带来小回报，同时打开更大问题；每卷有阶段答案 | 将 promise、tension、前三章钩子和单元冒险节奏纳入访谈与计划门禁 |
| 独特声音 | 作品要有自己的观察方式、幽默、痛感和价值判断 | 追问叙述视角、语言风味、主角看世界的方式，以及不想写成什么 |

这些维度不应变成一次性长表单。它们应被拆进分轮访谈、示例分叉、状态报告和 plan 门禁中，让用户逐步体验“我正在创造一部小说”，而不是“我正在填一个项目模板”。

## 非目标

- 不恢复旧的“一句话自动扩写完整大纲”体验。
- 不要求每个用户一次性填完所有设定；允许跳过、稍后决定和只写临时草稿。
- 不让示例分叉自动进入 canon、specification、tasks 或正文。
- 不在本路线中新增 GUI；优先覆盖 CLI、agent prompt、模板、校验和文档。
- 不将成人向内容展开为露骨正文；只处理情节功能、边界、关系、后果和任务元数据。

## 设计原则

1. **创作访谈是乐趣，不是表单**：问题要帮助作者看到岔路，而不是只补字段。
2. **示例展示后果**：每个高影响示例都要说明风味、适合读者、代价和后续影响。
3. **核心要素先于创作计划**：主角、伙伴、舞台、能力边界、势力冲突未达到最低成熟度时，`creative-plan.md` 只能输出预览或阻塞原因。
4. **作者创建的是小说，不是项目文件**：状态和报告要展示“你已经创造了什么”，而不只是“哪些文件存在”。
5. **允许慢下来**：StorySpec 应提供“继续访谈 / 生成候选 / 暂存灵感 / 进入计划”的可见选择。

## 优先级视图

| 优先级 | 批次 | 主题 | 说明 |
| --- | --- | --- | --- |
| P0 | F0 | 共创体验基线与回归样例 | 固化本次问题，形成可验证的真实使用场景 |
| P0 | F1 | 核心要素成熟度模型 | 明确哪些创作决定应在 plan 前优先澄清 |
| P0 | F2 | 丰富示例分叉与影响说明 | 让示例从“可复制答案”升级为“创作岔路” |
| P1 | F3 | 访谈编排与追问策略 | 根据已回答内容动态追问主角、伙伴、舞台、能力和冲突 |
| P1 | F4 | creative-plan 写入节奏门禁 | 避免少量输入后过早生成完整计划 |
| P2 | F5 | 作者成就感与状态报告 | 让用户看见自己已创造的小说骨架和仍可探索的空间 |
| P2 | F6 | 文档、示例与迁移说明 | 更新 README、工作流和贡献规范 |
| P1 | F7 | 人物情感与关系追踪增强 | 强化主角欲望、伙伴张力、慢热关系和关系状态变化 |
| P1 | F8 | 世界观场景压力检查 | 确保世界观设定落到场景行动、利益结构和代价 |
| P2 | F9 | Scene Card 写作前门禁 | 让正文写作先经过场景意图卡，而不是直接 `/write` |
| P3 | F10 | 参考作品节奏内化 | 谨慎支持对标作品的节奏/结构学习，不复制剧情和表达 |

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

验收标准：

- 测试覆盖“少量输入 + 已确认部分核心设定”的真实路径。
- 当主角/伙伴/舞台/能力/冲突缺口存在时，`next` 或相关应用服务不会把“生成完整 creative-plan”作为唯一首选。
- 文档明确本路线的体验指标和非目标。
- 真实样例能回答“目前这个故事的阅读承诺是什么、世界压力在哪里、主角/伙伴还缺什么”。

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

验收标准：

- README 中的推荐流程明确包含“共创访谈/核心要素确认”。
- 文档说明 `creative-plan.md` 不应过早替作者定稿。
- `npm run check:changes` 通过。

不做/边界：

- 不承诺尚未实现的 GUI、自动迁移或外部平台功能。

## Batch F7：人物情感与关系追踪增强

类型：领域模型、追踪、访谈、任务生成

目标：把 StorySpec 的人物系统从“角色资料管理”推进到“人物欲望、情感关系和关系变化追踪”。长篇是否立得住，很大程度取决于主角和核心伙伴能否持续相互影响。

已有基础：

- `spec/tracking/relationships.json` 和 `character-state.json` 已存在。
- `templates/knowledge/character-profiles.md`、`templates/knowledge/character-voices.md` 已有角色资料入口。
- AGENTS 画像中已有 `slow-burn`、`romance`、`multi-thread` 边界。

缺口：

- 早期访谈对主角欲望、恐惧、误判和成长代价追问不足。
- 核心伙伴容易被写成功能位，例如引路人、恋爱对象、竞争者，而不是能挑战主角的人。
- 慢热关系缺少可追踪的信任、距离、冲突、脆弱、修复节点。

建议方案：

1. 在核心要素成熟度中增加人物情感子项：
   - 主角想要什么。
   - 主角怕失去什么。
   - 主角会犯什么价值观或方法论误判。
   - 核心伙伴如何挑战主角，而不是只帮助主角。
2. 增强 `relationships.json` 模板或校验，支持：
   - `trust`
   - `distance`
   - `conflict`
   - `vulnerability`
   - `repair`
   - `turningPoints`
3. 在 `/tasks` 或任务生成中要求每个关系线任务说明：
   - 本任务推进哪段关系。
   - 关系状态如何变化。
   - 是否有事件证据。
4. 为慢热关系添加访谈分叉：搭档、互相利用、低烈度对立、救命债、共同调查等。

涉及文件/模块：

- `templates/tracking/relationships.json`
- `templates/tracking/character-state.json`
- `templates/clarification/slow-burn-romance.yaml`
- `templates/clarification/core.yaml`
- `src/application/interview-story.ts`
- `src/validation/rules/writing-rules.ts`
- `templates/commands/tasks.md`
- `templates/commands/write.md`

验收标准：

- 对包含慢热感情的故事，访谈至少追问关系起点、阻力、边界和第一次信任变化。
- `creative:report` 能指出核心伙伴是否只是功能位，还是已有独立欲望和与主角的张力。
- 写作任务能标注关系变化，正文后可追踪到 evidence path。

不做/边界：

- 不强制每部作品有恋爱线；人物情感也包括师徒、伙伴、竞争、亲情、阵营信任等关系。

## Batch F8：世界观场景压力检查

类型：世界观质量、校验、Scene Card、reviewer

目标：让世界观从设定表落到场景压力。真实的世界观不是资料越多越好，而是规则、资源、禁令和利益结构会改变角色行动。

已有基础：

- World Bible、Canon Ledger、Entity Graph 和 Scene Card 已存在。
- `xuanhuan-cultivation` preset 已要求境界、灵力、势力秩序有代价和限制。
- reviewer loop 已有 worldbuilding 权重。

缺口：

- 世界设定可能停留在百科描述，没有落实为角色面临的选择和代价。
- `world.cultivation.*` 等 draft facts 不一定能说明谁获利、谁受损、违反规则会怎样。
- `creative-plan.md` 和 Scene Card 不一定标注世界观 reveal 如何通过行动呈现。

建议方案：

1. 为 WorldFact 增加或鼓励字段：
   - `pressure`
   - `beneficiaries`
   - `costs`
   - `violationConsequence`
   - `sceneEvidencePaths`
2. 增强 `world:check` / `validate`：
   - 对关键世界观事实缺少场景压力给 warning。
   - 对只有百科描述、没有行动影响的事实给改写建议。
3. 在 Scene Card 中要求 `reveals` 标注：
   - 揭示的世界规则。
   - 该规则如何影响角色行动。
   - 谁因此获利或受损。
4. 在 `review` 中增加“世界观是否落地到场景”检查项。

涉及文件/模块：

- `templates/world/world-bible.md`
- `templates/world/*.yaml`
- `src/domain/story-artifact.ts`
- `src/application/inspect-worldbuilding.ts`
- `src/validation/rules/writing-rules.ts`
- `templates/scenes/scene-001.yaml`
- `templates/commands/review.md`

验收标准：

- 对“知识垄断”类设定，系统能要求说明它如何变成考试、禁书、许可、身份审查、资源分配或具体冲突。
- `world:check` 能区分“有设定文本”和“有场景压力”。
- Scene Card 的 `reveals` 能连接到 WorldFact，并说明行动后果。

不做/边界：

- 不要求所有背景设定都有完整压力模型；只对主线相关或高影响设定强制/提示。

## Batch F9：Scene Card 写作前门禁

类型：写作工作台、任务流、校验

目标：把 Scene Card 变成正文写作前的核心入口。真正写章节前，先确认本场景推进哪条线、揭示什么信息、改变哪段关系、建立或兑现哪个 promise、读者情绪是什么、结尾钩子是什么。

已有基础：

- `storyspec scene:init`、`scene:list`、`scene:check`、`scene:compile` 已存在。
- `templates/scenes/scene-001.yaml` 已有基础模板。
- `context:pack` 能声明 mustRead 和 allowedWrites。

缺口：

- `/write` 仍可能直接写正文，没有强制读取或生成 Scene Card。
- Scene Card 与 promise/tension/relationships/world reveals 的连接还不够强。
- 任务拆分后，写作任务不一定先经过场景意图验证。

建议方案：

1. 增强 Scene Card 模板，加入：
   - `plotThread`
   - `readerPromise`
   - `relationshipChange`
   - `worldReveal`
   - `emotionalBeat`
   - `endingHook`
   - `successCriteria`
2. 增强 `/write` prompt：
   - 写作前三章或任意章节前，优先读取对应 Scene Card。
   - 没有 Scene Card 时，先输出 Scene Card preview，不直接写正文。
3. 增强 `context:pack`：
   - 对写作任务把 Scene Card 标为 mustRead。
   - 限制 allowedWrites，避免无任务边界写整章外内容。
4. 增强 `scene:check`：
   - 检查是否推进至少一条线。
   - 检查是否有 reader emotion / ending hook。
   - 检查是否连接 promise/tension/relationship/world reveal。

涉及文件/模块：

- `templates/scenes/scene-001.yaml`
- `src/application/inspect-story-structure.ts`
- `src/application/check-writing-state.ts`
- `templates/commands/write.md`
- `templates/commands/context-pack.md`
- `src/cli/commands/story-structure.command.ts`
- `tests/unit/inspect-story-structure.test.ts`

验收标准：

- 没有 Scene Card 的章节写作路径会优先提示创建/预览场景卡。
- Scene Card 能明确说明本场景推进的情节、信息、关系和情绪。
- `scene:check` 能发现“只有事件摘要，没有读者情绪或结尾钩子”的场景卡。

不做/边界：

- 不让 Scene Card 变成比正文还重的负担；短篇或草稿模式可允许简化卡片，但必须保留核心意图。

## Batch F10：参考作品节奏内化

类型：研究、节奏配置、文档

目标：谨慎支持“参考作品内化”：只学习节奏、结构、信息密度、爽点间隔、章节长度和情绪曲线，不复制具体剧情、人物、设定或表达。

已有基础：

- `/plan` prompt 已预留 `rhythm-config.json`。
- `tension-curve.json` 已能记录章节张力、情绪、信息收益和回报。
- 文档中已有节奏配置的引用，但功能边界尚未系统化。

缺口：

- 参考作品内化还没有明确安全边界和数据结构。
- 没有工具帮助作者把“我喜欢某本书的节奏”转成可验证的 rhythm config。
- 容易误导为模仿剧情或风格表达。

建议方案：

1. 新增设计文档或研究任务，定义 `rhythm-config.json` schema：
   - `averageChapterLength`
   - `hookFrequency`
   - `payoffInterval`
   - `dialogueActionDescriptionRatio`
   - `tensionPattern`
   - `infoRevealDensity`
2. 增加命令或文档入口：
   - `storyspec rhythm:init`
   - 或先以 `docs/tech/rhythm-config.md` 作为研究稿。
3. 在 README 和命令模板中强调：
   - 借鉴结构，不借鉴表达。
   - 不生成对标作品的角色、桥段或专有设定。
4. 让 `plan` 和 `tension:chart` 能读取 rhythm config 并提示节奏偏差。

涉及文件/模块：

- `spec/tracking/tension-curve.json`
- `templates/tracking/tension-curve.json`
- `templates/commands/plan.md`
- `src/application/*tension*`
- `docs/tech/`
- `README.md`

验收标准：

- 能用一个本地 rhythm config 表达“章节长度、爽点间隔、张力曲线、信息揭示密度”。
- plan 阶段能引用 rhythm config，但不会生成对标作品的具体剧情或人物。
- 文档明确版权和原创边界。

不做/边界：

- 本批次不联网抓取作品，不自动解析受版权保护文本；只处理用户提供的抽象节奏数据或手工配置。

## 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| 问题变多导致用户压力上升 | 默认分轮提问，每轮 3-6 个；允许“稍后决定”和“给我候选” |
| 门禁过严阻碍高级用户 | 支持草案模式和显式 override，但保留来源标记 |
| 示例太丰富反而像 AI 定稿 | 示例必须标注为候选，并要求用户选择、改写或拒绝 |
| 核心要素模型不适配所有类型 | 支持按 genre preset 调整必需元素，不把恋爱/伙伴/修炼等写死为全局强制 |
| 文档写成已实现能力 | 只有完成对应 batch 后再更新 README 的真实能力描述 |

## 完成后需要同步

- 更新 [todo-index.md](todo-index.md) 状态。
- 完成批次时更新本文状态和勾选结果。
- 完成整条路线后归档到 [todo-archive.md](todo-archive.md)，并移动到 `archive/completed-roadmaps/`。
- 涉及 CLI、模板、生成产物或验证变化时新增 changeset。
- 按影响面运行 `npm run build`、相关 `vitest`、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`。
