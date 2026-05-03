# 故事共创访谈体验验收路线图

## 状态

Planned。本文承接总路线 F16-F20，聚焦有趣选择质量标准、六大核心入口卡、势力入口、首轮样例脚本和创作乐趣体验验收。

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

- F16：见本文 Batch F16。
- F17：见本文 Batch F17。
- F18：见本文 Batch F18。
- F19：见本文 Batch F19。
- F20：见本文 Batch F20。

## Batch F16：有趣选择质量标准

类型：体验标准、schema、测试

目标：把“有趣选择”从感觉词变成可开发、可检查的质量标准。StorySpec 给出的每个高影响候选，不应只是 A/B/C 选项，而应让作者看到吸引力、代价、关系影响、世界影响和后续钩子。

已有基础：

- F2 已规划 `exampleBranches`，包含 `flavor`、`tradeoffs`、`downstreamImpact`、`recommendedFor`。
- F13 已规划 branch compare，能比较不同分支会长成什么小说。
- 当前路线已有“用户是否感觉自己在创造小说世界”的总体验验收。

缺口：

- `exampleBranches` 还缺少更硬的质量口径，开发时容易只做成普通选项列表。
- 没有区分“低影响偏好选择”和“高影响创作选择”的验收强度。
- 没有测试能发现“选项有了，但不有趣、不带后果、不推动共创”的退化。

建议方案：

1. 定义 `InterestingChoice` 或等价 schema，至少包含：
   - `label`：短标题。
   - `appeal`：为什么这个方向有吸引力。
   - `cost`：它会牺牲什么或带来什么难题。
   - `relationshipImpact`：它如何改变主角、伙伴或阵营关系。
   - `worldImpact`：它如何改变舞台、制度、资源或世界压力。
   - `futureHook`：它会打开什么后续问题。
   - `confirmationBoundary`：确认后会写入哪里，未确认时保持在哪里。
2. 为高影响问题增加质量检查：
   - 主角、伙伴、舞台、能力、势力、冲突、结尾/反转必须使用完整选择质量标准。
   - 低影响题材偏好可使用简化分叉。
3. 在 `creative:report` 和 `next` 中使用同一套描述方式，让作者能自然理解每个选择的后果。
4. 增加测试夹具，故意放入“只有 label/answer 的高影响选项”，验证校验能提示缺少代价、影响或钩子。

涉及文件/模块：

- `src/domain/clarification.ts`
- `src/application/select-clarification-questions.ts`
- `src/application/interview-story.ts`
- `templates/clarification/*.yaml`
- `docs/tech/clarification-question-packs.md`
- `tests/unit/interview-story.test.ts`
- `tests/unit/story-onboarding.test.ts`

参考项目/资料：

- 参考项目：Twine。
  借鉴点：选择的价值在于通向不同路径，而不是只提供不同答案。
  不照搬：不做节点编辑器，不要求所有选择都形成完整剧情树。
  落地方式：高影响选项必须描述路径变化、代价和后续钩子。
- 参考项目：Ink。
  借鉴点：选择会改变后续叙事路径和信息揭示。
  不照搬：不引入脚本 runtime。
  落地方式：`futureHook` 和 `downstreamImpact` 要能被 branch、Scene Card 或 creative report 引用。
- 参考项目：Inquirer.js。
  借鉴点：选项展示要短、清楚、可选、可跳过、可自由改写。
  不照搬：不把复杂质量字段全部暴露成冗长 UI。
  落地方式：CLI 可显示摘要，详细影响进入 preview/report。

验收标准：

- 高影响选择至少展示 2 个方向，每个方向都有吸引力、代价、关系影响、世界影响和后续钩子。
- 对“轻量隐喻 vs 硬规则”这类能力选择，系统能说明爽点、风险、世界影响和后续写作代价。
- 对“学院舞台 vs 边境冒险”这类舞台选择，系统能说明节奏、关系、资源结构和冲突来源差异。
- 未满足质量标准的高影响选项在测试或校验中产生 warning。
- 作者可以选择、改写、拒绝或稍后决定，候选不会自动进入正典。

不做/边界：

- 不要求每个小偏好都有完整五维影响，避免把轻量问题变重。
- 不把“有趣选择”做成自动评分作者创意；只检查系统给出的候选是否足够可用。

## Batch F17：六大核心入口卡模板

类型：模板、导航、应用服务、测试

目标：把主角、伙伴、舞台、能力、势力、冲突六个核心入口从概念表格升级为可实现的入口卡模板。每个入口都应能独立启动一轮共创，并产出候选、边界和下一步推荐。

已有基础：

- F12 已定义多入口共创和入口设计草案。
- F1 已定义核心要素成熟度。
- F2/F16 将提供高影响选择和分叉质量标准。

缺口：

- 当前入口设计仍偏说明性，缺少统一可落地的数据结构。
- 不同入口的产物写入边界、候选状态和下一步推荐没有统一格式。
- 没有测试能确认六大核心入口都能单独启动并保持创作乐趣。

建议方案：

1. 定义 `CoCreationEntryCard` 或等价结构：
   - `id`
   - `title`
   - `whenToUse`
   - `openingQuestions`
   - `interestingChoices`
   - `candidateArtifacts`
   - `canonBoundary`
   - `nextRecommendations`
   - `maturityImpact`
2. 为六大核心入口建立模板：
   - 主角入口：欲望、价值观行动、误判、首次成功/失败、成长代价。
   - 伙伴入口：独立欲望、与主角冲突、互补能力、关系起点、第一次信任变化。
   - 舞台入口：第一舞台、资源结构、禁令、普通人压力、主角第一步如何撞上规则。
   - 能力入口：爽点、限制、代价、失败后果、本地魔法体系如何误读它。
   - 势力入口：谁掌握资源、谁掌握合法性、谁垄断知识、谁从秩序中获利。
   - 冲突入口：第一卷阻力、阶段胜利、代价、更大危机入口、回报节奏。
3. 让 `next` 能按成熟度推荐最适合的入口，而不是只列命令。
4. 让 `interview` 能按入口启动一轮问题，例如 `--entry protagonist`、`--entry power` 或 agent prompt 等价表达。
5. 每个入口的候选产物默认不写入正典，必须通过 preview/confirm/apply 或明确确认进入对应文件。

涉及文件/模块：

- `src/application/story-onboarding.ts`
- `src/application/interview-story.ts`
- `src/domain/clarification.ts`
- `templates/commands/clarify.md`
- `templates/commands/context-pack.md`
- `templates/clarification/core.yaml`
- `templates/clarification/magic-system.yaml`
- `templates/clarification/slow-burn-romance.yaml`
- `tests/unit/story-onboarding.test.ts`
- `tests/unit/interview-story.test.ts`

参考项目/资料：

- 参考项目：Inquirer.js。
  借鉴点：入口菜单与问题序列可以清楚表达“从哪里开始”和“下一步做什么”。
  不照搬：不强制所有入口必须在 TTY 交互里运行。
  落地方式：入口卡既能渲染成交互菜单，也能渲染成 agent 可复制 prompt。
- 参考项目：GitHub Issue Forms。
  借鉴点：统一 schema 能降低入口模板维护成本。
  不照搬：入口卡不是一次性表单，不要求填满才继续。
  落地方式：入口卡字段作为模板和测试的共同契约。
- 参考项目：XState。
  借鉴点：入口切换后仍要保持明确状态和上下文。
  不照搬：不暴露复杂状态机配置。
  落地方式：入口卡的 `maturityImpact` 驱动核心要素面板和下一步推荐。

验收标准：

- 六大核心入口都能独立生成一轮共创问题、2-3 个候选分叉、候选产物和下一步推荐。
- 每个入口都明确哪些产物只是候选，哪些确认后会写入 specification、World Bible、Scene Card、tracking 或 tasks。
- 对《编程施法》，系统能推荐“能力入口”“舞台入口”“势力入口”中的至少一个，并说明推荐原因。
- 用户可以从主角入口切到舞台入口，再回到伙伴入口，已确认内容不丢失。
- 入口卡模板有测试或快照覆盖，避免新增入口时缺字段。

不做/边界：

- 不把六大入口变成强制顺序；作者可以跳过或从任意入口开始。
- 不要求所有故事都有同样形态的伙伴、势力或能力；入口卡应支持类型差异和禁用项。

## Batch F18：势力入口与权力结构共创

类型：世界观、冲突设计、关系网络、访谈

目标：将“势力”从“冲突”的附属项中拆出来，作为独立共创入口。作者应能设计谁掌握知识、资源、暴力、合法性和叙事权，谁获利、谁受损，主角第一步会撞上哪个制度。

已有基础：

- F1 已把“势力与冲突”列入核心要素。
- F8 已规划世界观场景压力检查。
- F12 已有世界入口和冲突入口，但没有独立势力入口。

缺口：

- 势力目前容易被简化为“反派组织”或“第一卷阻力”，没有权力结构和利益逻辑。
- 对《编程施法》这类“学院、贵族、知识垄断”世界，势力入口是核心乐趣之一，但待办中还不够突出。
- 没有结构化字段表达势力如何垄断资源、制造规则、影响主角成功路线。

建议方案：

1. 新增势力入口卡，典型问题包括：
   - 谁掌握知识、魔法资格、考试许可、土地、军队或话语权？
   - 这个秩序让谁获利，让谁付出代价？
   - 普通人如何在日常生活中感到它？
   - 主角第一步会在哪个具体场景撞上它？
   - 这个势力内部有什么裂缝、温和派、投机者或被压制者？
2. 为势力候选定义轻量结构：
   - `name`
   - `resourceControl`
   - `legitimacySource`
   - `beneficiaries`
   - `victims`
   - `publicNarrative`
   - `internalCracks`
   - `firstCollisionScene`
   - `relationshipHooks`
3. 让势力入口连接：
   - WorldFact 的 pressure/beneficiaries/costs。
   - 冲突入口的第一卷阻力。
   - 主角成功路线的资源障碍。
   - 伙伴入口的立场差异。
4. 对“知识垄断”这类设定提供分叉示例：
   - 学院考试垄断。
   - 贵族许可制度。
   - 教会/行会掌握咒式版权。
   - 边境黑市和民间术士网络。

涉及文件/模块：

- `templates/clarification/core.yaml`
- `templates/clarification/political-intrigue.yaml`（如需新增或扩展）
- `templates/world/world-bible.md`
- `templates/world/*.yaml`
- `src/application/interview-story.ts`
- `src/application/inspect-worldbuilding.ts`
- `src/domain/story-artifact.ts`
- `tests/unit/interview-story.test.ts`
- `tests/unit/inspect-worldbuilding.test.ts`

参考项目/资料：

- 参考项目：NetworkX。
  借鉴点：势力可以视为节点，资源控制、盟友、压迫、依赖和裂缝可以视为边或属性。
  不照搬：不引入图数据库或要求作者维护复杂图算法。
  落地方式：用轻量 JSON/YAML 表达势力关系，并允许后续导出为图或报告。
- 参考项目：Foam、Dendron、Logseq。
  借鉴点：势力、人物、地点、制度和场景之间应能互链和追溯。
  不照搬：不做完整知识库 UI。
  落地方式：势力条目必须能链接 WorldFact、Scene Card、relationship 和 evidence path。
- 参考项目：Twine。
  借鉴点：不同势力设定会让故事走向不同路径。
  不照搬：不把势力设计做成互动小说地图。
  落地方式：势力分叉要说明会改变哪种第一卷冲突和主角成功路线。

验收标准：

- 对《编程施法》，势力入口能围绕学院、贵族和知识垄断生成至少 3 个可选方向，并说明各自的压迫方式、获利者、受损者和第一碰撞场景。
- 势力候选不会被默认写入正典，确认后才能进入 World Bible、specification 或 conflict plan。
- `creative:report` 能区分“有反派名字”和“有权力结构”。
- `world:check` 能发现势力只有名称、没有资源控制或合法性来源的薄弱项。
- 势力入口能自然连接伙伴立场，例如伙伴来自学院、边境、贵族旁支或被排除的民间术士。

不做/边界：

- 不要求所有故事都有复杂政治结构；轻松冒险也可以只保留 1-2 个清晰势力。
- 不把势力设计变成纯设定百科；必须回到场景压力和主角行动。

## Batch F19：首轮共创样例脚本

类型：fixture、示例、测试、文档

目标：用《编程施法》建立首轮共创的标准样例，固化系统应该怎样问、怎样给候选、怎样回声、怎样推荐下一步。这个样例用于指导实现，也用于防止后续流程重新变成“快速生成大纲”。

已有基础：

- F0 已计划新增《编程施法》真实样例 fixture。
- 当前对话已经确认了《编程施法》的核心初始信息：晏无、工科马列青年、异界穿越、编程施法、第三次寂静、轻量隐喻、轻松冒险、慢热感情。
- F5/F14 已规划创作回声。

缺口：

- F0 目前偏测试目标，还没有写清“首轮共创应该是什么样子”。
- 没有示例脚本展示系统如何避免一次性产出完整 creative-plan。
- 没有样例能训练开发者判断输出是否有创作乐趣。

建议方案：

1. 新增 `编程施法` 首轮共创脚本 fixture，至少包含：
   - 用户原始输入。
   - 系统应保存的原始灵感。
   - 系统应推荐的入口。
   - 每个入口应给出的 2-3 个候选方向。
   - 每个候选的吸引力、代价、关系影响、世界影响、后续钩子。
   - 用户确认、改写、拒绝、稍后决定的示例。
   - 系统创作回声示例。
   - 下一步推荐示例。
2. 首轮样例至少覆盖三个入口：
   - 能力入口：轻量隐喻的爽点和边界。
   - 舞台入口：学院、边境、黑市或旅途开局的差异。
   - 势力入口：学院/贵族/知识垄断如何成为第一卷压力。
3. 样例必须明确禁止：
   - 首轮直接写完整分卷大纲。
   - 首轮生成大量未确认角色和势力并写入正典。
   - 把候选当成作者已经确认。
4. 将样例用于测试或快照，作为 F0/F2/F12/F16/F18 的共同验收材料。

涉及文件/模块：

- `tests/fixtures/`
- `tests/unit/interview-story.test.ts`
- `tests/unit/story-onboarding.test.ts`
- `docs/tech/story-co-creation-interview-roadmap.md`
- `docs/tech/clarification-question-packs.md`
- `templates/commands/clarify.md`
- `templates/commands/plan.md`

参考项目/资料：

- 参考项目：Cucumber.js。
  借鉴点：用“给定/当/那么”的场景描述固定用户行为和期望结果。
  不照搬：不必引入 Cucumber 工具链；可以先用 Markdown fixture 或 vitest 快照。
  落地方式：首轮脚本写成可读场景，测试断言关键输出和禁止行为。
- 参考项目：GitHub Spec Kit。
  借鉴点：从 specification 到 plan 的边界需要通过样例和命令流程固化。
  不照搬：不把小说样例写成软件需求。
  落地方式：样例明确 story:new、interview、preview specify、preview plan 的阶段差异。
- 参考项目：Inquirer.js。
  借鉴点：首轮体验应少问题、可跳过、可选候选、可自由改写。
  不照搬：不要求样例必须用真实交互终端实现。
  落地方式：脚本同时提供 CLI 交互版和 agent 文本版的期望。

验收标准：

- 《编程施法》首轮样例能完整展示“保存灵感 -> 推荐入口 -> 给候选 -> 用户选择/改写 -> 创作回声 -> 下一步推荐”。
- 样例中不出现完整 `creative-plan.md` 落盘行为。
- 样例至少覆盖能力、舞台、势力三个入口。
- 每个高影响候选都符合 F16 的有趣选择质量标准。
- 开发者可以根据样例判断实现输出是否偏离共创体验。

不做/边界：

- 样例不是《编程施法》的正式正文或最终大纲。
- 不把样例候选写成所有故事的默认模板。

## Batch F20：创作乐趣体验验收

类型：验收标准、测试、质量门禁、文档

目标：把“StorySpec 是否让作者更好地创造小说，并且过程一直有乐趣”转化为可检查的体验验收。避免后续只实现命令、schema 和文件，却没有实现共创感。

已有基础：

- 当前路线已有一句话总验收：用户是否感觉自己在创造小说世界，而不是填写系统需要的字段。
- F5/F14 已规划创作回声。
- F16/F17/F19 将提供选择质量、入口卡和首轮样例。

缺口：

- 体验验收还分散在各批次，没有统一的测试清单。
- 没有明确区分“功能可用”和“创作体验达标”。
- 没有防回归规则约束 agent 再次过快写 plan、过度补设定或让用户变成验收者。

建议方案：

1. 新增共创体验验收清单，至少包含：
   - 作者能从任意核心入口开始。
   - 每轮默认只问少量高价值问题。
   - 高影响选择展示吸引力、代价、关系影响、世界影响和后续钩子。
   - 系统能说清“你刚刚创造了什么”。
   - 候选、确认、正典、未决项状态清楚。
   - 核心要素不足时不会直接生成完整 creative-plan。
   - 用户能暂停、只讨论、只建待办或稍后决定。
2. 将验收拆成三类：
   - 自动测试：状态、门禁、schema、输出关键字段。
   - 快照测试：首轮样例、入口菜单、创作回声。
   - 人工走查：是否有创作乐趣、是否像填表、是否过度项目管理。
3. 在 PR 或 batch 完成说明中要求回答：
   - 这次改动让作者多了什么创作自由？
   - 哪些内容仍必须由作者确认？
   - 哪些参考项目被借鉴了，哪些没有照搬？
   - 有没有让流程更重，如果有，如何减负？
4. 将体验验收接入 F0 fixture 和 F19 首轮脚本。

涉及文件/模块：

- `tests/fixtures/`
- `tests/unit/story-onboarding.test.ts`
- `tests/unit/interview-story.test.ts`
- `tests/unit/preview-apply.test.ts`
- `docs/tech/story-co-creation-interview-roadmap.md`
- `docs/tech/clarification-question-packs.md`
- `changes/*.md`

参考项目/资料：

- 参考项目：Cucumber.js。
  借鉴点：用行为场景描述“用户做了什么、系统应该如何回应”。
  不照搬：不强制引入 Gherkin 或 Cucumber runtime。
  落地方式：先用 Markdown 场景和 vitest 快照表达体验验收。
- 参考项目：GitHub Spec Kit。
  借鉴点：阶段边界和执行门禁必须可以验证。
  不照搬：不让体验验收变成工程流程审计。
  落地方式：验收清单同时检查创作控制权和乐趣，而不只检查文件产物。
- 参考项目：Inquirer.js、Twine。
  借鉴点：问题要轻，选择要能看见后果。
  不照搬：不把创作变成问卷或节点游戏。
  落地方式：人工走查必须判断“是否像在创造小说世界”。

验收标准：

- 每个完成的相关 batch 都能对照体验验收清单说明通过/未通过。
- 自动测试能阻止“核心要素不足却直接完整 plan”的回归。
- 快照样例能阻止“选项只有短答案、没有后果”的回归。
- 人工走查能明确记录：这次变化是否让创作更有趣，是否增加了负担。
- README 只在对应能力实现后更新，不提前把验收清单写成可用功能。

不做/边界：

- 不把体验验收变成 AI 对作者作品质量的评分。
- 不要求所有创作路径都必须完全一致；验收关注共创控制权、乐趣和边界。

## 完成后需要同步

- 更新 [story-co-creation-interview-roadmap.md](story-co-creation-interview-roadmap.md) 中对应批次状态。
- 更新 [todo-index.md](todo-index.md) 的当前下一步。
- 涉及 CLI、模板、生成产物或验证变化时新增 changeset。
- 按影响面运行构建、测试、command manifest 和 changeset 检查。
