# 故事共创访谈体验增强路线图

## 状态

Planned。本路线用于修复真实使用中暴露出的创作体验问题：StorySpec 已能保护作者确认权，但仍可能过快从少量输入进入规格和创作计划，导致作者没有充分体验“选择、改写、发现小说”的乐趣。

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
   - 可选入口包括主角、伙伴、世界、冲突、场景、能力、结尾/反转、分支。

4. **局部共创与候选沉淀**
   - 每个入口只围绕当前兴趣点提问和生成候选。
   - 产物默认保持候选状态，不直接进入 canon。

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
3. **第三优先级：Ink、Yarn Spinner、novelWriter、Manuskript、Redux**
   - 这些项目主要作为叙事结构、场景组织、长篇项目管理和事件记录参考。
   - 只有当现有数据结构不足时再吸收，不提前引入沉重抽象。

### 参考项目使用规则

- 每个批次实现前，应先写清“借鉴点、落地文件、验收方式、不照搬边界”。
- 参考项目只能降低实现风险，不能替代 StorySpec 的产品目标。
- 不把参考项目能力写进 README 的可用功能，除非对应 batch 已实现并验证。
- 不引入大型运行时依赖，除非有明确收益、测试覆盖和迁移说明。
- 对叙事工具的借鉴只学习结构和工作流，不复制具体内容、世界观或表达。
- 每次新增外部参考导致 CLI 行为、模板契约或数据结构变化时，必须同步 tests、docs 和 changeset。

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
| P1 | F12 | 多入口共创与创作模式切换 | 支持从主角、场景、冲突、世界、伙伴等不同入口开始创作 |
| P1 | F13 | 分叉可视化与 what-if 管理 | 让不同分支的小说风味、代价和走向可比较 |
| P2 | F14 | 创作回声与成果摘要 | 让报告更像“你已经创造了什么”，而不是只报缺口 |
| P2 | F15 | 未决项回流与决策日志 | 让 deferred 问题在合适时机回到作者面前，并保留决策理由 |

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

参考项目/资料：

- 参考项目：Yarn Spinner。
  借鉴点：对话节点、选项和场景动作能帮助追踪关系变化。
  不照搬：不把长篇人物关系写成游戏对话树。
  落地方式：关系追踪只记录 trust、distance、conflict、vulnerability、repair、turningPoints 等写作证据。
- 参考项目：Ink。
  借鉴点：选择会改变后续路径，人物互动不只是台词内容。
  不照搬：不引入脚本语法或 runtime。
  落地方式：慢热关系场景要标注“本场选择/行动怎样改变关系状态”。

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

参考项目/资料：

- 参考项目：Foam、Dendron、Logseq。
  借鉴点：世界事实应像知识节点一样能互链、能追溯、能回到证据。
  不照搬：不做完整知识图谱 UI，不要求作者维护复杂双链。
  落地方式：WorldFact 增加 pressure、beneficiaries、costs、violationConsequence、sceneEvidencePaths，并能被 Scene Card 引用。
- 参考项目：novelWriter、Manuskript。
  借鉴点：长篇世界资料需要服务章节和场景，不只是百科条目。
  不照搬：不新增独立世界观管理软件式界面。
  落地方式：`world:check` 把主线相关设定映射到行动后果和场景压力。

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

参考项目/资料：

- 参考项目：Ink。
  借鉴点：场景节点应有进入条件、选择/行动、结果和后续路径。
  不照搬：不把 Scene Card 改造成完整脚本语言。
  落地方式：Scene Card 增加 plotThread、readerPromise、relationshipChange、worldReveal、emotionalBeat、endingHook、successCriteria。
- 参考项目：Yarn Spinner。
  借鉴点：对话、动作和命令可以结构化地表达“场景发生了什么变化”。
  不照搬：不把正文写作变成游戏事件编排。
  落地方式：`scene:check` 检查关系、信息、情绪、钩子是否至少有一项发生变化。

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

参考项目/资料：

- 参考项目：novelWriter、Manuskript。
  借鉴点：章节、场景和大纲可以带结构化元数据，便于长期检查节奏。
  不照搬：不做参考作品内容导入器，也不复制对标作品桥段。
  落地方式：只允许用户手工提供抽象节奏参数，写入本地 rhythm config。
- 参考资料：版权与原创边界。
  借鉴点：参考作品只能抽象为节奏、结构和信息密度。
  不照搬：不联网抓取或解析受版权保护文本。
  落地方式：命令和文档必须提示“借鉴结构，不借鉴表达”。

验收标准：

- 能用一个本地 rhythm config 表达“章节长度、爽点间隔、张力曲线、信息揭示密度”。
- plan 阶段能引用 rhythm config，但不会生成对标作品的具体剧情或人物。
- 文档明确版权和原创边界。

不做/边界：

- 本批次不联网抓取作品，不自动解析受版权保护文本；只处理用户提供的抽象节奏数据或手工配置。

## Batch F11：作者画像初始化、记忆与偏好回填

类型：记忆、个性化、提示词、状态

目标：把作者画像分成三个阶段处理：第一次使用只做轻量偏好采样；创作过程中从用户选择自然沉淀画像；后续使用时再回填、复用和修正偏好，让新故事和新会话不必从零反复询问。

已有基础：

- `memory/constitution.md` 和 `memory/personal-voice.md` 已存在，能承载创作原则和表达指纹。
- `story:new`、`interview`、`creative:report` 已有连续流程，但默认更偏“当前故事”而非“作者长期画像”。

缺口：

- 作者偏好主要以自然语言模板存在，难以结构化读取、更新和复用。
- 新故事往往会重复问同类问题，例如喜欢的节奏、禁区、叙述口味、偏好冲突类型。
- 没有明确的“作者画像 vs 故事正典”边界，容易混在一起。
- 第一次使用没有历史画像可回填，如果一上来重度建档，会打断创作乐趣。

建议方案：

1. 新增 `AuthorProfile` 或类似结构，记录：
   - 题材偏好。
   - 节奏偏好。
   - 叙述风格。
   - 明确禁区。
   - 常见创作模式。
   - 状态：`provisional`、`confirmed`、`deprecated`。
2. 第一次使用时只做轻量偏好采样：
   - 默认 2-4 个高价值问题。
   - 必须允许跳过。
   - 只影响推荐和示例，不影响故事正典。
   - 采样结果默认标记为 `provisional`。
3. 创作过程中自然沉淀画像：
   - 从用户多次选择中形成候选偏好。
   - 候选偏好必须允许用户确认、修正或拒绝。
   - 不把单次故事选择直接提升为长期偏好。
4. 后续使用时在 `story:new`、`interview`、`plan`、`report` 中回填作者画像，作为默认上下文而非正典。
5. 支持作者显式修改、覆盖、清空或暂时忽略画像。
6. 在提示词中区分：
   - 作者长期偏好。
   - 临时/待确认偏好。
   - 当前故事确认。
   - 当前故事待澄清。

涉及文件/模块：

- `memory/constitution.md`
- `memory/personal-voice.md`
- `src/application/story-onboarding.ts`
- `src/application/interview-story.ts`
- `src/application/story-context.ts`（如需新增）
- `templates/commands/*`

参考项目/资料：

- 参考项目：Foam、Dendron、Logseq。
  借鉴点：个人知识库的长期记忆、可修正条目和本地优先存储。
  不照搬：不做通用个人知识管理，也不把作者画像变成不可见监控。
  落地方式：AuthorProfile 条目必须有状态、来源、最近确认时间和关闭/忽略方式。
- 参考项目：Inquirer.js、Yeoman。
  借鉴点：首次使用只问最少必要问题，且允许跳过。
  不照搬：不做重度 onboarding 问卷。
  落地方式：首次偏好采样默认 2-4 个问题，结果为 `provisional`。

验收标准：

- 首次使用时只出现轻量偏好采样，问题数量不超过 4 个，并且可以跳过。
- 首次采样结果标记为 `provisional`，只影响推荐，不影响正典。
- 后续新故事启动时能自动带入作者的已确认风格偏好，减少重复提问。
- 作者可以手动更新或关闭某条画像偏好。
- 作者画像不会被写成故事正典，也不会覆盖用户对当前故事的明确回答。

不做/边界：

- 不把作者画像变成监控或打分系统；它只服务创作体验。
- 不把第一次使用变成重度问卷；画像应随创作慢慢长出来。

## Batch F12：多入口共创与创作模式切换

类型：导航、交互、工作流

目标：让 StorySpec 不只从“规格”进入小说，而是支持从主角、场景、冲突、世界、伙伴等多个入口开始共创，并在创作过程中自由切换模式。

核心定义：

多入口共创不是增加几个命令，而是把 StorySpec 从一条“灵感 -> 规格 -> 计划 -> 正文”的流水线，改造成创作桌面。作者可以从当前最有兴趣的创作点切入，先玩局部，再决定是否沉淀为 specification、Scene Card、World Bible、tracking 或 tasks。

已有基础：

- `story:new`、`interview`、`preview specify`、`creative:report`、`next` 已形成主路径。
- 已有共创访谈和计划门禁思路。

缺口：

- 当前流程还是偏线性：先灵感，再问答，再规格，再计划。
- 如果作者今天只想先玩一个角色、一个场景或一个冲突，系统没有足够友好的入口表达。
- 切换到不同创作模式后，用户容易丢失上下文或感觉“重新开始”。

建议方案：

1. 定义多入口：
   - 主角入口。
   - 场景入口。
   - 冲突入口。
   - 世界入口。
   - 伙伴入口。
   - 能力入口。
   - 结尾/反转入口。
   - 分支/what-if 入口。
2. 每个入口必须定义：
   - 适用场景：作者为什么从这里开始。
   - 引导问题：这一入口最该问什么。
   - 候选产物：会生成什么草案、卡片或待确认项。
   - 正典边界：哪些内容只是候选，哪些需要用户确认后才能写入。
   - 下一步推荐：从这个入口自然转向哪里。
3. 定义创作模式：
   - `discover`：探索和乱想。
   - `co-create`：共创访谈。
   - `plan`：结构化规划。
   - `write`：正文写作。
   - `reflect`：回顾和修订。
4. 让 `next` 和相关 prompt 提供“从哪个入口继续”的明确选项。
5. 在模式切换时保留上下文，不要求重做已确认部分。

### 入口设计草案

| 入口 | 适用场景 | 典型引导问题 | 候选产物 |
| --- | --- | --- | --- |
| 主角入口 | 作者先想到主角或主角气质 | 主角最想要什么？最容易误判什么？价值观怎样体现在行动里？第一次成功和失败分别因为什么？ | 主角核心卡、成长路线候选、`character-state` 待确认项 |
| 伙伴入口 | 作者想先找能让主角变有趣的人 | 谁最能挑战主角？为什么不信他？能力如何互补？关系起点是什么？TA 自己想要什么？ | 核心伙伴候选、关系张力卡、`relationships` 待确认项 |
| 世界入口 | 作者想先搭世界问题或舞台 | 第一舞台在哪里？谁掌握资源？禁令和代价是什么？普通人如何感到世界压力？ | WorldFact 候选、第一舞台候选、世界压力卡 |
| 冲突入口 | 作者想先决定第一卷打什么 | 阻力来自人、制度、误解、资源还是异常？主角赢得什么？代价是什么？如何引出更大危机？ | 第一卷冲突卡、promise/tension 候选 |
| 场景入口 | 作者脑中已有一幕戏 | 这一场开头动作是什么？谁在场？推进哪条线？关系如何变化？结尾钩子是什么？ | Scene Card、章节任务候选 |
| 能力入口 | 作者想先玩金手指或能力爽点 | 能力爽点来自哪里？不能做什么？需要谁配合？失败后果是什么？第一次使用能力解决什么问题？ | 能力边界卡、世界规则候选、场景候选 |
| 结尾/反转入口 | 作者先想到远期震撼点 | 这个反转改变哪个主题？需要隐藏哪些信息？何时埋伏笔？第一卷只能露出哪一角？ | 远期候选、伏笔候选、branch/what-if |
| 分支入口 | 作者想比较几条可能走向 | 这条分支会长成什么风味？牺牲什么？强化什么？对关系/世界/节奏有什么影响？ | 分支对照卡、branch impact |

入口输出默认是候选，不直接进入 canon。只有用户明确确认后，才允许写入 specification、World Bible、Scene Card、tracking 或 tasks。

涉及文件/模块：

- `src/application/story-onboarding.ts`
- `src/application/interview-story.ts`
- `src/cli/commands/*`
- `templates/commands/*.md`
- `docs/tech/`

参考项目/资料：

- 参考项目：Inquirer.js。
  借鉴点：入口菜单、单选/多选、跳过、自由输入和确认操作。
  不照搬：不要求所有用户都在交互式终端里完成创作。
  落地方式：`next` 以“你想从哪里继续？”展示入口，同时输出可复制命令。
- 参考项目：Twine。
  借鉴点：作者可以从任意节点进入，并看见选择通向哪里。
  不照搬：不把 StorySpec 变成节点编辑器。
  落地方式：每个入口都输出候选产物、正典边界和自然下一步。
- 参考项目：XState。
  借鉴点：discover、co-create、plan、write、reflect 的模式切换应可验证。
  不照搬：不把模式系统做成复杂工作流配置。
  落地方式：状态切换必须保留上下文，并阻止候选内容绕过确认。

验收标准：

- 作者可以从任意一个入口开始，而不是必须先填完整故事表。
- 在不同模式之间切换时，不会丢失已确认设定。
- 同一故事可以先玩角色，再转场景，再回头补冲突，而不会被流程锁死。
- 每个入口都能说明适用场景、引导问题、候选产物、正典边界和下一步推荐。
- 用户可以不经过完整 specification，就从一个角色、一幕戏或一个冲突开始共创；产物默认保持候选状态。
- `next` 能用“你想从哪里继续？”的方式呈现入口，而不是只给线性命令列表。

不做/边界：

- 不要求每个入口都产出正式规格；探索和正式写入要分开。
- 不把多入口做成绕过确认门禁的快捷写入；入口是创作桌面，不是自动定稿器。

## Batch F13：分叉可视化与 what-if 管理

类型：分支、比较、可视化、创作决策

目标：把分叉从“临时试验”升级为“可比较的创作方向”。作者要能看见不同分支会长成什么小说，以及每条路的代价和回报。

已有基础：

- `branch:create`、`branch:list`、`branch:compare`、`branch:promote` 已存在。
- 澄清流程也有示例分叉思想。

缺口：

- 分支比较更偏结构与文件层面，不够像“这条分支会变成什么小说”。
- 分支与阅读承诺、人物关系、世界压力、节奏回报之间的联系不足。
- 分支没有进入日常创作导航，容易成为少用的高级功能。

建议方案：

1. 强化 branch compare 输出：
   - 这条分支的小说风味。
   - 读者承诺如何变化。
   - 主要代价和收益。
   - 关系线会怎样偏移。
   - 世界压力会如何提前或延后显露。
2. 为分支增加可视化摘要或对照卡。
3. 让 `creative:report`、`next`、`plan` 能引用活跃分支。
4. 为重要分支加入 evidence、promises、tension 的继承或分流说明。

涉及文件/模块：

- `src/application/*branch*`
- `src/cli/commands/*`
- `templates/commands/*`
- `spec/tracking/*`（若需分支层追踪）

参考项目/资料：

- 参考项目：Twine。
  借鉴点：分叉和路径对作者应是可感知、可回退、可比较的。
  不照搬：不新增图形节点编辑器，不追求无限分支树。
  落地方式：branch compare 输出小说风味、读者承诺、代价收益、关系偏移和世界压力显露节奏。
- 参考项目：Ink。
  借鉴点：分支不仅是文件差异，还会改变后续叙事路径。
  不照搬：不引入脚本 runtime。
  落地方式：重要 what-if 必须说明会影响哪些 promise、tension、relationship 或 WorldFact。

验收标准：

- 同一故事的两个分支能清楚说明“会长成什么不同的小说”。
- 分支比较不仅给技术差异，还给创作差异。
- 活跃分支能进入导航和报告，而不是躺在角落里。

不做/边界：

- 不把分支做成无限复制树；只保留对创作有明显价值的 what-if。

## Batch F14：创作回声与成果摘要

类型：报告、状态、反馈

目标：让 StorySpec 更会说“你已经创造出了什么”。创作者需要的不只是缺口列表，还需要成果回声和情绪反馈。

已有基础：

- `creative:report`、`next`、`status` 已能说明缺口和下一步。

缺口：

- 报告更偏控制权和阻塞项，不够像创作回声。
- 用户难以一眼看出：这个故事现在已经有哪几个灵魂部件、哪几条线已经活起来了。
- 没有足够的“被看见”的感觉。

建议方案：

1. 为 `creative:report` 增加“成果摘要”区块：
   - 当前这本小说是什么风味。
   - 已形成哪些核心部件。
   - 哪些部分最有生命力。
   - 还差哪几个关键部件。
2. 让 `status` 能显示“当前故事长成了什么”而不只是文件状态。
3. 输出“下一轮创作回声”：告诉作者这次创作让故事发生了什么变化。

涉及文件/模块：

- `src/application/creative-report.ts`
- `src/application/story-onboarding.ts`
- `src/cli/commands/*`
- `templates/commands/clarify.md`

参考项目/资料：

- 参考项目：novelWriter、Manuskript。
  借鉴点：创作软件应让作者知道项目里有哪些角色、章节、线索和进度。
  不照搬：不把报告做成项目管理仪表盘。
  落地方式：成果摘要优先描述故事生命力、已确认选择和下一轮乐趣点。
- 参考项目：Foam。
  借鉴点：通过链接和回顾让作者看到自己积累出的世界。
  不照搬：不增加沉重图谱。
  落地方式：报告可以引用已确认节点，但必须清楚标注候选和缺口。

验收标准：

- 报告能自然回答“我现在已经创造出了什么小说”。
- 报告同时保留缺口，不把未确认内容说成已完成。
- 作者能从状态里感到作品在生长，而不是在填表。

不做/边界：

- 不把成果摘要做成营销文案；它仍是创作回声，不是宣传页。

## Batch F15：未决项回流与决策日志

类型：决策记录、回流、上下文恢复

目标：让 deferred 问题不会被遗忘。未决项应该在合适时机重新回到作者面前，同时保留当初为什么这么决定的记录。

已有基础：

- `clarifications.json` 已支持 `deferred` / `confirmed` / `source`。
- 访谈和澄清流程已有 replay 的雏形。

缺口：

- deferred 内容没有明确回流机制，作者容易忘记。
- 后续阶段看不到“当初为什么这么选”的理由。
- 当场景和分支改变时，系统不会主动提醒相关未决项。

建议方案：

1. 为 deferred 问题增加回流条件：
   - 当相关主题进入 plan。
   - 当 Scene Card 关联到该主题。
   - 当分支切换触发相关设定时。
2. 新增轻量决策日志：
   - 选择了什么。
   - 为什么这么选。
   - 还留了什么悬而未决。
3. 让 `next`、`creative:report`、`interview` 在适当时候重新提出历史未决项。

涉及文件/模块：

- `stories/*/clarifications.json`
- `stories/*/clarifications.md`
- `src/application/interview-story.ts`
- `src/application/story-onboarding.ts`
- `src/application/creative-report.ts`
- `src/validation/rules/writing-rules.ts`

参考项目/资料：

- 参考项目：Redux。
  借鉴点：用轻量 action/event 记录“谁在什么时候确认、拒绝、延后或提升了什么候选”。
  不照搬：不引入 Redux 作为依赖，也不把创作状态前端化。
  落地方式：决策日志使用简单 JSON/Markdown 结构，支持回看、回流和人工编辑。
- 参考项目：Foam、Dendron、Logseq。
  借鉴点：未决项和决策理由应能从后续上下文自然链接回来。
  不照搬：不要求作者维护双链笔记系统。
  落地方式：deferred 问题绑定 topic、触发条件和 evidence path，进入相关场景/计划时回流。

验收标准：

- deferred 设定不会永久丢失。
- 当相关主题重新变得重要时，系统会把它带回前台。
- 用户能回看“为什么当时这么决定”。

不做/边界：

- 不把回流做成强制打扰；只在上下文相关时提示。

## 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| 问题变多导致用户压力上升 | 默认分轮提问，每轮 3-6 个；允许“稍后决定”和“给我候选” |
| 门禁过严阻碍高级用户 | 支持草案模式和显式 override，但保留来源标记 |
| 示例太丰富反而像 AI 定稿 | 示例必须标注为候选，并要求用户选择、改写或拒绝 |
| 核心要素模型不适配所有类型 | 支持按 genre preset 调整必需元素，不把恋爱/伙伴/修炼等写死为全局强制 |
| 文档写成已实现能力 | 只有完成对应 batch 后再更新 README 的真实能力描述 |
| 功能越做越像复杂项目管理器 | 用“用户是否感觉自己在创造小说世界”作为总体验验收，优先砍掉只增加管理负担的功能 |

## 完成后需要同步

- 更新 [todo-index.md](todo-index.md) 状态。
- 完成批次时更新本文状态和勾选结果。
- 完成整条路线后归档到 [todo-archive.md](todo-archive.md)，并移动到 `archive/completed-roadmaps/`。
- 涉及 CLI、模板、生成产物或验证变化时新增 changeset。
- 按影响面运行 `npm run build`、相关 `vitest`、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`。
