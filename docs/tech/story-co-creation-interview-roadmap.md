# 故事共创访谈体验增强路线图

## 状态

Active。F0-F12 已完成；当前继续推进 F13-F15 的创作工作台能力。本路线用于修复真实使用中暴露出的创作体验问题：StorySpec 已能保护作者确认权，但仍可能过快从少量输入进入规格和创作计划，导致作者没有充分体验“选择、改写、发现小说”的乐趣。

## 当前主线

把 StorySpec 的早期流程从“收集字段并生成文件”升级为“故事共创访谈”：先帮助作者围绕主角、伙伴、舞台、能力、势力与冲突做有趣选择，再进入 specification / creative-plan / tasks。

## 未来产品形态

本路线完成后，StorySpec 应成为个人小说共创编辑台，而不是小说生成器、质量裁判或复杂项目管理器。

目标体验：

- 作者不是在填表，也不是在验收 AI 大纲，而是在一个创作桌面上和系统一起玩主角、伙伴、世界、冲突、场景、能力和分支。
- 系统先保护作者原始灵感，再帮助作者看见选择、分叉和后果。
- 规格、计划、任务和正文都应该从作者确认的选择自然长出来，而不是由 AI 从少量关键词一次性推导。
- 任何候选内容进入正典前，都必须保留来源、确认状态和写入边界。

一句话验收标准：

**用户是否感觉自己在创造小说世界，而不是在填写系统需要的字段。**

## 未来整体流程

```text
轻量偏好采样/画像回填
  -> 保存原始灵感
  -> 选择共创入口
  -> 局部共创与候选沉淀
  -> 分叉可视化
  -> 创作回声
  -> specification 预览/确认/应用
  -> creative-plan 预览/确认/应用
  -> Scene Card
  -> 正文写作
  -> tracking 更新
  -> 未决项回流
  -> 回到任意共创入口继续
```

### 阶段说明

1. **轻量偏好采样/画像回填**
   - 第一次使用只做可跳过的 2-4 个偏好采样。
   - 后续使用才回填已确认作者画像。
   - 作者画像只影响推荐和示例，不覆盖当前故事明确回答。

2. **保存原始灵感**
   - `story:new` 只保存用户原话。
   - 不扩写、不补完、不把 AI 设定写进正典。

3. **选择共创入口**
   - `next` 不只给线性命令，而是问“你想从哪里继续？”
   - 可选入口包括主角、伙伴、舞台、能力、势力、冲突、场景、结尾/反转、分支。
   - 主角、伙伴、舞台、能力、势力、冲突是第一优先级核心入口；其他入口作为扩展入口。

4. **局部共创与候选沉淀**
   - 每个入口只围绕当前兴趣点提问和生成候选。
   - 产物默认保持候选状态，不直接进入 canon。
   - 高影响候选必须展示吸引力、代价、关系影响、世界影响和后续钩子。

5. **分叉可视化**
   - 关键选择要说明不同分支会长成什么小说。
   - 对比阅读承诺、人物关系、世界压力、爽点路线、代价和风险。

6. **创作回声**
   - `creative:report` 不只报缺口，还要告诉作者已经创造出了什么。
   - 报告要区分“项目框架已建立”和“小说灵魂仍待共创”。

7. **规格与计划预览**
   - specification 和 creative-plan 必须先预览。
   - `creative-plan.md` 不能在核心要素不足时过早落盘。
   - 计划应像作者选择累积出的结果，而不是 AI 自动生成的大纲。

8. **Scene Card 先行**
   - 写正文前先确认这一场推进什么、揭示什么、改变什么、回收什么。
   - 没有 Scene Card 时，写作路径优先生成或预览场景卡。

9. **正文写作与追踪更新**
   - 正文写作基于 Scene Card、人物关系、世界压力、能力边界和节奏承诺。
   - 写完后更新 relationship、promise、tension、world/canon evidence 等追踪。

10. **未决项回流**
    - 用户曾经选择“稍后决定”的内容不会丢失。
    - 当相关主题进入计划、场景或分支时，系统自然带回。

11. **长期循环**
    - 作者可以随时从任意入口回到共创桌面。
    - 今天玩关系、明天玩世界、后天写一幕戏，都不会丢上下文。

12. **体验验收**
    - 每轮共创后都能回答“作者刚刚创造了什么”。
    - 核心要素不足时不直接进入完整 plan。
    - 系统输出应让作者感觉在做选择、看后果、改造世界，而不是在补系统字段。

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

## 参考项目与借鉴边界

参考开源项目的目的不是把 StorySpec 做成另一个通用 IDE、流程引擎或知识库，而是借成熟项目降低开发不确定性，让每个共创能力有清楚的交互模式、数据边界、状态流转和测试方式。

### 优先参考矩阵

| StorySpec 能力 | 参考项目/资料 | 借鉴点 | 不照搬 | 落地方式 |
| --- | --- | --- | --- | --- |
| 规格、计划、任务的阶段化门禁 | [GitHub Spec Kit](https://github.com/github/spec-kit) / [speckit.org](https://speckit.org/) | `specify -> plan -> tasks` 的阶段拆分、preview/confirm/execute 思路、多 agent 命令产物 | 不照搬软件工程需求模板，不把小说创作压成需求评审 | 用于 F0/F1/F4/F6：明确 story idea、specification、creative-plan、tasks 的进入条件和阻塞原因 |
| CLI 交互与问题呈现 | [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) | list、checkbox、confirm、editor 等交互形态；少量问题逐步推进 | 不强依赖交互式终端；非交互 agent 场景仍要可读、可复制、可继续 | 用于 F2/F3/F11/F12：设计问题 schema、入口菜单、跳过/候选/确认操作 |
| 表单 schema 与必填/可选控制 | [GitHub Issue Forms](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/configuring-issue-templates-for-your-repository) | YAML schema、required、dropdown、checkbox、textarea、占位提示 | 不把创作访谈做成工单表单，不要求一次填完 | 用于 F1/F2/F3：让 clarification schema 更稳定，并保留创作语气 |
| 初始化脚手架体验 | [Yeoman](https://github.com/yeoman/yo) / [generator](https://github.com/yeoman/generator) | 先提示、再生成；生成前收集最少必要信息；模板和用户输入分离 | 不做重型项目生成器，不在第一次使用时重度建档 | 用于 F0/F6/F11：首次偏好采样、story:new 初始化、模板写入边界 |
| 分支叙事与选择后果 | [Twine](https://github.com/klembot/twinejs) | 节点、选择、分叉、路径可视化、作者可探索非线性故事 | 不新增 GUI，不把 StorySpec 变成互动小说引擎 | 用于 F2/F12/F13：branch compare、what-if 对照卡、选择后果说明 |
| 叙事脚本和可运行路径 | [Ink](https://github.com/inkle/ink) | knot/stitch/choice 的叙事组织；选择会改变后续路径 | 不引入 Ink runtime，不把长篇正文写成脚本语言 | 用于 F9/F13：Scene Card、分支路径和伏笔回收的可检查结构 |
| 对话节点与场景动作 | [Yarn Spinner](https://github.com/YarnSpinnerTool/YarnSpinner) | 对话节点、选项、命令、场景事件的结构化组织 | 不把小说写作降级为游戏对话树 | 用于 F7/F9/F13：关系场景、慢热互动、对话选择影响关系状态 |
| 本地 Markdown 知识库 | [Foam](https://github.com/foambubble/foam)、[Dendron](https://github.com/dendronhq/dendron)、[Logseq](https://github.com/logseq/logseq) | 本地优先、双链、图谱、长期记忆、知识节点互链 | 不复制完整知识库产品，不增加沉重 UI 和同步系统 | 用于 F8/F11/F15：作者画像、WorldFact、决策日志、evidence path 和未决项回流 |
| 小说项目组织 | [novelWriter](https://github.com/vkbo/novelWriter)、[Manuskript](https://github.com/olivierkes/manuskript) | 长篇项目树、角色/章节/大纲/元数据组织 | 不照搬桌面写作软件，不新增 GUI，不替代作者正文编辑器 | 用于 F5/F9/F14：故事结构状态、Scene Card、成果摘要和章节组织 |
| 显式流程状态 | [XState](https://github.com/statelyai/xstate) | 状态机、事件驱动、显式状态转移、可测试流程 | 不引入复杂运行时，除非现有实现已经失控 | 用于 F1/F3/F4/F12/F15：把 discover/co-create/preview/apply/plan/write/reflect 变成可验证状态 |
| 可追溯状态变化 | [Redux](https://github.com/reduxjs/redux) | action、reducer、可追溯状态更新、回放思路 | 不引入前端状态框架，不为简单数据增加样板代码 | 用于 F15：决策日志、用户确认、候选提升和回滚记录的设计参考 |
| 势力关系与权力结构 | [NetworkX](https://github.com/networkx/networkx) / Foam、Dendron、Logseq | 节点、边、属性、关系网络和本地知识链接 | 不引入图数据库，不把势力设计做成复杂关系图维护 | 用于 F18：势力入口、资源垄断、合法性、受益者、受损者和第一碰撞点 |
| 共创体验回归样例 | [Cucumber.js](https://github.com/cucumber/cucumber-js) / GitHub Spec Kit | 用场景化样例描述用户行为、期望结果和阶段边界 | 不引入 BDD 工具链作为必选依赖，不把创作体验变成测试术语 | 用于 F19/F20：首轮共创脚本、体验验收和防回归样例 |

### 分批借鉴策略

1. **第一优先级：Inquirer.js、Twine、Foam、XState**
   - Inquirer.js 解决“怎么问得轻、清楚、可跳过”。
   - Twine 解决“怎么让作者看见分叉和后果”。
   - Foam 解决“怎么把世界观、画像、决策长期留住但不压迫作者”。
   - XState 解决“怎么让流程可控、可测试、不被 agent 随手跨阶段”。
2. **第二优先级：Spec Kit、Issue Forms、Yeoman**
   - Spec Kit 适合作为 preview/apply、spec/plan/tasks 边界的参考。
   - Issue Forms 适合稳定问题 schema，但要避免表单感。
   - Yeoman 适合初始化和模板生成前的最小提示设计。
3. **第三优先级：Ink、Yarn Spinner、novelWriter、Manuskript、Redux、NetworkX、Cucumber.js**
   - 这些项目主要作为叙事结构、场景组织、长篇项目管理和事件记录参考。
   - 只有当现有数据结构不足时再吸收，不提前引入沉重抽象。

### 参考项目使用规则

- 每个批次实现前，应先写清“借鉴点、落地文件、验收方式、不照搬边界”。
- 参考项目只能降低实现风险，不能替代 StorySpec 的产品目标。
- 不把参考项目能力写进 README 的可用功能，除非对应 batch 已实现并验证。
- 不引入大型运行时依赖，除非有明确收益、测试覆盖和迁移说明。
- 对叙事工具的借鉴只学习结构和工作流，不复制具体内容、世界观或表达。
- 每次新增外部参考导致 CLI 行为、模板契约或数据结构变化时，必须同步 tests、docs 和 changeset。

## 拆分后的阅读方式

本文件现在只作为轻量总览和导航入口，避免 agent 每次读取完整 20 个批次。开发某个功能时按下面规则读取：

1. 先读本文确认总目标、共通边界和批次位置。
2. 只读取对应子路线文档中的批次详情。
3. 跨主题开发时，再读取相关子路线；不要默认读取所有子路线。

| 子路线 | 覆盖批次 | 何时读取 |
| --- | --- | --- |
| [基础门禁路线图](story-co-creation-foundation-roadmap.md) | F0-F6 | 已完成；共创基线、成熟度、示例分叉、访谈、plan 门禁、成果报告、文档迁移 |
| [故事要素路线图](story-co-creation-story-elements-roadmap.md) | F7-F11 | 人物情感、世界压力、Scene Card、节奏配置、作者画像 |
| [创作工作台路线图](story-co-creation-workbench-roadmap.md) | F12-F15 | 多入口共创、分支管理、创作回声、未决项回流 |
| [体验验收路线图](story-co-creation-experience-roadmap.md) | F16-F21 | 有趣选择、入口卡、势力入口、首轮共创样例、创作乐趣验收、低负担创作体验 |

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
| P1 | F11 | 作者画像初始化、记忆与偏好回填 | 首次轻量采样，创作中自然沉淀，后续复用和修正作者偏好 |
| P1 | F12 | 多入口共创与创作模式切换 | 已完成：`next` 展示创作模式和入口卡，`interview --focus` 支持从指定入口开始 |
| P1 | F13 | 分叉可视化与 what-if 管理 | 让不同分支的小说风味、代价和走向可比较 |
| P2 | F14 | 创作回声与成果摘要 | 让报告更像“你已经创造了什么”，而不是只报缺口 |
| P2 | F15 | 未决项回流与决策日志 | 让 deferred 问题在合适时机回到作者面前，并保留决策理由 |
| P0 | F16 | 有趣选择质量标准 | 定义“好玩的创作选择”必须包含吸引力、代价、关系影响、世界影响和后续钩子 |
| P0 | F17 | 六大核心入口卡模板 | 把主角、伙伴、舞台、能力、势力、冲突做成可实现、可测试、可复用的入口卡 |
| P1 | F18 | 势力入口与权力结构共创 | 将势力从冲突中拆出，单独支持资源、合法性、知识垄断和第一碰撞点设计 |
| P0 | F19 | 首轮共创样例脚本 | 用《编程施法》固化首轮如何问、如何给候选、如何回声、如何推荐下一步 |
| P0 | F20 | 创作乐趣体验验收 | 把“是否有创作乐趣”转成防回归验收，避免只实现功能而不好玩 |
| P1 | F21 | 低负担创作模式与最小快乐闭环 | 增加今日创作模式、低负担模式、撤销回滚、交互语气和最小快乐闭环 |

## 批次详情索引

| 批次 | 详情文档 |
| --- | --- |
| F0 共创体验基线与回归样例 | [基础门禁路线图](story-co-creation-foundation-roadmap.md#batch-f0共创体验基线与回归样例) |
| F1 核心要素成熟度模型 | [基础门禁路线图](story-co-creation-foundation-roadmap.md#batch-f1核心要素成熟度模型) |
| F2 丰富示例分叉与影响说明 | [基础门禁路线图](story-co-creation-foundation-roadmap.md#batch-f2丰富示例分叉与影响说明) |
| F3 访谈编排与追问策略 | [基础门禁路线图](story-co-creation-foundation-roadmap.md#batch-f3访谈编排与追问策略) |
| F4 creative-plan 写入节奏门禁 | [基础门禁路线图](story-co-creation-foundation-roadmap.md#batch-f4creative-plan-写入节奏门禁) |
| F5 作者成就感与状态报告 | [基础门禁路线图](story-co-creation-foundation-roadmap.md#batch-f5作者成就感与状态报告) |
| F6 文档、示例与迁移说明 | [基础门禁路线图](story-co-creation-foundation-roadmap.md#batch-f6文档示例与迁移说明) |
| F7 人物情感与关系追踪增强 | [故事要素路线图](story-co-creation-story-elements-roadmap.md#batch-f7人物情感与关系追踪增强) |
| F8 世界观场景压力检查 | [故事要素路线图](story-co-creation-story-elements-roadmap.md#batch-f8世界观场景压力检查) |
| F9 Scene Card 写作前门禁 | [故事要素路线图](story-co-creation-story-elements-roadmap.md#batch-f9scene-card-写作前门禁) |
| F10 参考作品节奏内化 | [故事要素路线图](story-co-creation-story-elements-roadmap.md#batch-f10参考作品节奏内化) |
| F11 作者画像初始化、记忆与偏好回填 | [故事要素路线图](story-co-creation-story-elements-roadmap.md#batch-f11作者画像初始化记忆与偏好回填) |
| F12 多入口共创与创作模式切换 | [创作工作台路线图](story-co-creation-workbench-roadmap.md#batch-f12多入口共创与创作模式切换) |
| F13 分叉可视化与 what-if 管理 | [创作工作台路线图](story-co-creation-workbench-roadmap.md#batch-f13分叉可视化与-what-if-管理) |
| F14 创作回声与成果摘要 | [创作工作台路线图](story-co-creation-workbench-roadmap.md#batch-f14创作回声与成果摘要) |
| F15 未决项回流与决策日志 | [创作工作台路线图](story-co-creation-workbench-roadmap.md#batch-f15未决项回流与决策日志) |
| F16 有趣选择质量标准 | [体验验收路线图](story-co-creation-experience-roadmap.md#batch-f16有趣选择质量标准) |
| F17 六大核心入口卡模板 | [体验验收路线图](story-co-creation-experience-roadmap.md#batch-f17六大核心入口卡模板) |
| F18 势力入口与权力结构共创 | [体验验收路线图](story-co-creation-experience-roadmap.md#batch-f18势力入口与权力结构共创) |
| F19 首轮共创样例脚本 | [体验验收路线图](story-co-creation-experience-roadmap.md#batch-f19首轮共创样例脚本) |
| F20 创作乐趣体验验收 | [体验验收路线图](story-co-creation-experience-roadmap.md#batch-f20创作乐趣体验验收) |
| F21 低负担创作模式与最小快乐闭环 | [体验验收路线图](story-co-creation-experience-roadmap.md#batch-f21低负担创作模式与最小快乐闭环) |

## 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| 问题变多导致用户压力上升 | 默认分轮提问，每轮 3-6 个；允许“稍后决定”和“给我候选” |
| 门禁过严阻碍高级用户 | 支持草案模式和显式 override，但保留来源标记 |
| 示例太丰富反而像 AI 定稿 | 示例必须标注为候选，并要求用户选择、改写或拒绝 |
| 核心要素模型不适配所有类型 | 支持按 genre preset 调整必需元素，不把恋爱/伙伴/修炼等写死为全局强制 |
| 文档写成已实现能力 | 只有完成对应 batch 后再更新 README 的真实能力描述 |
| 功能越做越像复杂项目管理器 | 用“用户是否感觉自己在创造小说世界”作为总体验验收，优先砍掉只增加管理负担的功能 |
| 有趣选择被实现成普通选项列表 | 用 F16 的五维标准和 F19 的首轮样例做回归，不满足代价、影响和钩子的高影响选项必须 warning |
| 势力入口过度复杂化 | 用“第一碰撞场景”和“谁获利/谁受损”收束，不要求复杂政治图谱或完整组织百科 |
| 体验验收变成作品评分 | F20 只检查系统是否保留共创乐趣、确认边界和选择后果，不评价作者创意高低 |

## 完成后需要同步

- 更新 [todo-index.md](todo-index.md) 状态。
- 完成批次时更新本文状态和勾选结果。
- 完成整条路线后归档到 [todo-archive.md](todo-archive.md)，并移动到 `archive/completed-roadmaps/`。
- 涉及 CLI、模板、生成产物或验证变化时新增 changeset。
- 按影响面运行 `npm run build`、相关 `vitest`、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`。
