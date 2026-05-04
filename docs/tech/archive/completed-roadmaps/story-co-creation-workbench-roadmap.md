# 故事共创访谈创作工作台路线图

## 状态

Completed。本文承接总路线 F12-F15，聚焦多入口共创、分叉管理、创作回声和未决项回流。F12-F15 已完成，当前下一步转入 [体验验收路线图](story-co-creation-experience-roadmap.md) 的 F16 有趣选择质量标准。

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

- F12：Completed。见本文 Batch F12。
- F13：Completed。见本文 Batch F13。
- F14：Completed。见本文 Batch F14。
- F15：Completed。见本文 Batch F15。

## Batch F12：多入口共创与创作模式切换

状态：Completed（2026-05-04）。已实现 `storyspec next` 的创作模式与入口卡展示，并新增 `storyspec interview/clarify --focus <entry>`，入口输出默认保持候选状态。

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

状态：Completed（2026-05-04）。已实现 `branch:compare` 的 What-if 对照卡，并让 `next` / `creative:report` 显示活跃 exploring 分支。

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

状态：Completed（2026-05-04）。已实现 `creative:report` 的“创作回声”区块，并让 `status` 显示“当前故事长成了什么”；回声只引用已确认或部分确认的核心要素，同时保留关键缺口。

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
- `src/application/creation-echo.ts`
- `src/application/get-project-status.ts`
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

状态：Completed（2026-05-04）。已新增轻量决策日志摘要，从 `clarifications.json` 推导 deferred 未决项，并让 `next`、`creative:report`、`interview` handoff 和 `clarifications.md` 显示回流条件、继续命令和证据位置。

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

## 完成后需要同步

- 更新 [story-co-creation-interview-roadmap.md](story-co-creation-interview-roadmap.md) 中对应批次状态。
- 更新 [todo-index.md](../../todo-index.md) 的当前下一步。
- 涉及 CLI、模板、生成产物或验证变化时新增 changeset。
- 按影响面运行构建、测试、command manifest 和 changeset 检查。
