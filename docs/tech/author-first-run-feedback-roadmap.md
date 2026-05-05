# 作者首程引导与正反馈路线图

## 状态

Planned。本文记录 2026-05-04 继续 dogfood StorySpec 时，用户指出的五类首程体验问题：工作区初始化、原始灵感/长文资料输入、新手命令理解、卷计划直观反馈、章节生成耗时和正反馈不足。2026-05-05 继续新增首次使用“全流程图 + 当前步骤 + 下一步操作”需求。

## 当前主线

把 StorySpec 的第一次使用从“用户先理解一堆 CLI 命令”改成“系统先确认工作区，再根据用户手里有什么素材带路”：有长文就给输入模板和吸收预览，只有一句灵感就低负担追问；生成计划后给直观摘要和关系/节奏视图；写章节时尽快给用户阶段性反馈，而不是长时间沉默。

## 与既有路线的关系

- [new-user-story-creation-dogfood-roadmap.md](archive/completed-roadmaps/new-user-story-creation-dogfood-roadmap.md) 已完成第一版新用户端到端路径，但本次真实创作暴露出“路径存在，不等于用户看得懂、等得住、用得顺”。
- [story-onboarding-navigation-roadmap.md](archive/completed-roadmaps/story-onboarding-navigation-roadmap.md) 已完成 `story:new` / `next` 等导航基础，但还缺少工作区优先初始化、输入示例、短灵感/长文资料分流和少命令化表达。
- [storyspec-dogfood-friction-roadmap.md](storyspec-dogfood-friction-roadmap.md) 处理命令产物、tracking、章节收尾等工具闭环问题；本文处理作者首程体验和正反馈问题。

## 非目标

- 不开发完整 GUI 或 Web 工作台；本路线先覆盖 CLI、agent prompt、Markdown/JSON 摘要和可选 Mermaid 视图。
- 不把未确认的 AI 候选写入正典；所有吸收、计划和视图仍遵守 preview / confirm / apply。
- 不承诺自动生成整卷正文质量，只优化输入引导、计划理解、进度反馈和上下文效率。
- 不删除高级命令；只是让新用户不用先理解它们。

## 问题复盘

- 初始化工作区是必输项，但当前体验容易先给命令或进入创作步骤，没有先让用户指定小说工作区并自动初始化。
- 原始灵感/长文资料引导不够具体：缺少示例、推荐字数范围、核心要点清单、表格资料说明。用户给了很多内容后，仍看到大量“待澄清”，会误以为导入失败。
- 新用户引导不够友好：一开始就给命令，用户不一定知道自己该贴长文、写一句灵感、回答访谈，还是运行 CLI。
- 首次使用缺少完整路线图：虽然 `init`、`story:new` 和 `next` 会提示下一步，但用户仍不清楚全流程有几步、当前处在哪一步、这一步完成后生成什么、下一步为什么是它、什么时候才进入写正文。用户进一步提出希望像控制台打印日志一样，持续看到对应的流程图、产物、下一步和故事结构反馈。
- 卷计划生成后缺少直观反馈：三幕结构、12 章节奏、角色弧线、关系变化和剧情起伏都在文档里，但缺少一眼能懂的摘要视图。
- 章节生成耗时长，正反馈不足：用户等待第一章、第二章时，很久看不到阶段性产物；工具和 agent 反复读取、验证、收尾，也放大了等待感。

## P0 立即处理

### P0-1 工作区优先初始化引导

- 类型：首程引导、CLI/agent 协议、项目初始化
- 背景/问题：StorySpec 小说工作区是后续所有命令的基础。用户如果没有先指定 `D:\project\小说` 这类目录，agent 继续讲命令或生成正文都会变得不稳定。
- 已有基础：
  - `storyspec init` 已能初始化项目。
  - `ensureProjectRoot` 能判断当前目录是不是 StorySpec 项目。
  - `status`、`story:new`、`next` 已能识别项目状态。
- 缺口：缺少“非工作区时先问路径，然后直接初始化”的首程协议；CLI 帮助和 agent prompt 仍容易先展示命令。
- 建议方案：
  1. 在 agent contract / prompt 中增加首程 preflight：未检测到 StorySpec 工作区时，只问用户“小说工作区放哪里”。
  2. 用户给出路径后，agent 直接执行初始化，不让用户手抄命令。
  3. CLI 侧补一个更明确的错误提示：当前不是工作区时，展示 `storyspec init --here` 和 `storyspec init <path/name>` 的二选一说明。
  4. 初始化完成后，立即进入“你现在有什么素材”的分流，而不是展示完整命令清单。
- 涉及文件/模块：
  - `src/application/init-project.ts`
  - `src/cli/commands/init.command.ts`
  - `src/utils/project.ts`
  - `templates/commands/*.md`
  - `agent-guides/story-creation-guide.md`
  - `README.md`
- 验收标准：
  - 在非 StorySpec 目录中开始创作时，用户只需要提供一次工作区路径。
  - 初始化成功输出包含“工作区已就绪”和下一步素材分流。
  - agent prompt 不再把未初始化用户直接带到 `story:new`、`ingest` 或写正文。
  - 有 smoke 或 snapshot 覆盖非工作区提示和初始化成功首屏。
- 参考资料/项目：
  - 本次用户指定 `D:\project\小说` 后才进入实际创作的过程。
  - 现有 `story:new` / `next` 新故事导航路线。
  - 不需要外部项目；这是 StorySpec 自身首程协议收敛。
- 不做/边界：不自动猜测或创建用户未指定的工作区，不迁移已有项目。

### P0-2 原始灵感/长文资料输入向导

- 类型：输入引导、长文吸收、文档与 CLI 帮助
- 背景/问题：用户不知道“原始灵感/长文资料”应该写到什么程度。缺少示例和要点清单时，用户容易一次性贴很多内容，却不理解为什么系统仍标“待澄清”。
- 已有基础：
  - `story:new` 可保存一句话创意。
  - `ingest` / `co:create` 可吸收长文资料并生成预览。
  - `creative:report` 能展示已确认、待澄清和 AI 候选。
- 缺口：缺少可复制的输入模板、推荐字数、资料类型说明和“待澄清不是失败”的解释。
- 建议方案：
  1. 新增“我有长文资料 / 我只有一句灵感 / 我有设定表格 / 我想先随便聊聊”四个入口说明。
  2. 给长文资料模板：一句话梗概、主角、世界观、力量体系、主要角色、基调、第一卷目标、禁忌/不想要的内容。
  3. 给推荐范围：一句灵感 20-200 字；首轮长文 500-3000 字；超长设定建议分段吸收。
  4. 表格资料说明：可贴 Markdown 表格，但导入器会先保守归为候选/待澄清，等待用户确认。
  5. `ingest` 完成后输出“已识别 / 需要确认 / 仍缺少”的三栏摘要，降低挫败感。
- 涉及文件/模块：
  - `src/application/story-onboarding.ts`
  - `src/application/ingest-story-input.ts`
  - `src/application/co-create-workbench.ts`
  - `src/application/creative-report.ts`
  - `templates/commands/*.md`
  - `docs/quickstart.md`
  - `README.md`
- 验收标准：
  - 新用户能看到至少 2 个可复制示例：一句灵感示例、长文资料示例。
  - `ingest` 或 `co:create` 输出明确解释“待澄清”的原因，不让用户误以为导入失败。
  - 长文、短句、Markdown 表格三类输入都有 fixture 或快照覆盖。
  - preview 仍不会把未确认候选直接写入正典。
- 参考资料/项目：
  - 本次用户提供的“爱情线整合版·完成命名版”长文结构。
  - [low-burden-co-creation.md](low-burden-co-creation.md) 的低负担共创模式。
  - 不照搬固定模板；模板只作为脚手架，允许作者自由写。
- 不做/边界：不要求用户必须按模板填写；不因资料长就自动确认所有设定。

### P0-3 少命令化的新手导航

- 类型：CLI 体验、agent 交互、帮助文案
- 背景/问题：StorySpec 命令很多，一开始直接展示命令会让非开发用户看不懂。用户真正需要的是“我现在有什么素材，下一步怎么做”。
- 已有基础：
  - `next` 已能根据故事状态给下一步建议。
  - `story:new`、`interview`、`ingest`、`co:create`、`preview/apply` 都已存在。
- 缺口：导航输出仍偏命令清单，没有把用户意图分流成自然语言入口。
- 建议方案：
  1. `next` 首屏优先展示自然语言选项：`我有长文资料`、`我只有一句灵感`、`我想补角色`、`我想先写一幕`。
  2. 命令放在次级“可复制命令”区域，避免第一屏压迫用户。
  3. agent prompt 先问素材状态，不先解释 CLI 概念。
  4. `--json` 输出保留机器可读 action，方便 UI/agent 自动选择命令。
- 涉及文件/模块：
  - `src/application/story-onboarding.ts`
  - `src/application/get-project-status.ts`
  - `src/cli/program.ts`
  - `templates/commands/*.md`
  - `tests/unit/story-onboarding.test.ts`
- 验收标准：
  - 空项目或新故事阶段，第一屏不是一长串命令，而是 3-5 个作者可理解的入口。
  - 每个入口仍有对应 copyable command，开发者用户不丢效率。
  - “不是输入长文资料时怎么使用”有明确路径：一句灵感、访谈补齐、今日创作模式。
  - CLI 文案、README 和 agent guide 的首次路径一致。
- 参考资料/项目：
  - 已归档的新故事引导路线。
  - [low-burden-co-creation.md](low-burden-co-creation.md) 的今日创作模式。
- 不做/边界：不删除命令行高级用法，不强制终端交互。

### P0-4 章节生成阶段性正反馈

- 类型：写作流程、性能体验、agent 协作
- 背景/问题：第一章、第二章生成耗时偏长。真实耗时不只来自模型写作，也来自上下文读取、验证、tracking 更新、任务收尾。用户长时间没有反馈，会感觉流程卡住。
- 已有基础：
  - `context:pack` 能生成写作上下文。
  - `draft:new`、`draft:promote` 支持草稿流。
  - `task:finish` 路线正在处理单章收尾。
  - `templates/commands/write.md` 能约束 agent 写作流程。
- 缺口：缺少“先给小纲/场景 beat，再分段正文，再收尾”的阶段性输出协议；缺少明确的进度消息和可恢复 checkpoint。
- 建议方案：
  1. `/storyspec-write` 或对应 prompt 先输出本章 3-6 条 scene beat，让用户快速看到方向。
  2. 正文按场景或段落分块写入，阶段性报告“已完成小纲 / 已完成正文初稿 / 正在收尾验证”。
  3. `context:pack` 成为写章前默认步骤，减少反复扫描大文件。
  4. 与 `task:finish` 联动，自动生成一屏收尾摘要，避免写完后继续长时间沉默。
  5. 对长章节允许 `--target-words` 或 `--chunk` 策略，先交付短初稿，再扩写。
- 涉及文件/模块：
  - `templates/commands/write.md`
  - `templates/commands/write.prompt.md`
  - `src/application/manage-context-packs.ts`
  - `src/application/manage-drafts.ts`
  - `src/application/finish-writing-task.ts`
  - `tests/smoke/`
- 验收标准：
  - 写章开始后，用户能在 30 秒内看到本章 beat 或进度摘要。
  - 长章节生成时至少有 3 个阶段性状态：计划、正文、收尾。
  - 上下文包能减少重复读取，agent 不需要每章重新扫描整卷所有资料。
  - 中断后能从最近 checkpoint 继续，不必重写整章。
- 参考资料/项目：
  - 本次第一章、第二章生成等待体验。
  - [storyspec-dogfood-friction-roadmap.md](storyspec-dogfood-friction-roadmap.md) 的 `task:finish` 和连续章节 checkpoint 任务。
- 不做/边界：不为了快而跳过创作控制权、tracking 或验证；不承诺模型生成速度本身一定变快。

### P0-5 首次使用全流程图与当前步骤提示

- 类型：首程引导、CLI 导航、文档与 JSON 输出
- 背景/问题：真实首次使用时，用户会问“全流程图是怎样的，第一步做完后下一步是什么”。当前命令已经有局部下一步提示，但缺少一张贯穿 `init -> story:new -> next/interview -> core -> preview/apply -> plan/tasks -> scene/context/draft` 的路线图；用户不知道自己现在在哪个阶段，也不知道每一步会写入哪些文件。用户还希望像控制台日志一样持续看到“当前流程、产物、下一步”，让命令运行过程不只是打印结果，而是给作者稳定的方向感。
- 已有基础：
  - `storyspec init` 初始化后会输出工作区就绪和素材分流入口。
  - `storyspec story:new` 会保存 `stories/<story>/idea.md` 并提示 `author-profile`、`interview`、`next`。
  - `storyspec next` 已能根据故事状态推荐入口和 copyable command。
  - `status --json` 已有 `story.stage`、`nextActions`、`creativeControl` 等结构化信息。
- 缺口：
  - 没有固定的“第一次使用流程图”命令或输出区块。
  - 当前阶段没有以“第 N 步 / 共 N 步”的方式展示。
  - 每一步缺少“操作命令 / 产物文件 / 完成后下一步 / 不会做什么”的明确说明。
  - 缺少统一的流程日志格式，不能在关键命令后稳定打印 `[流程]`、`[产物]`、`[下一步]` 这类低噪声反馈。
  - 文档、CLI 文案和 agent guide 对首程路线的表达不够统一。
- 建议方案：
  1. 设计一份首程流程模型，覆盖 8-9 个阶段：初始化工作区、保存原始灵感、选择共创入口、完成访谈、查看缺口、生成规格预览、确认应用、规划任务、创建场景/上下文/草稿。
  2. 在 `storyspec next <story>` 的首屏增加压缩流程提示：`当前：第 2 步 / 9 步，已保存原始灵感；下一步推荐：从能力入口完成第一轮共创`。
  3. 新增或评估 `storyspec guide [story]` / `storyspec next --flow`，专门展示完整流程图；优先复用 `next`，避免命令膨胀。
  4. 每个阶段输出四类信息：`怎么操作`、`会生成什么`、`下一步是什么`、`不会越过哪些确认边界`。
  5. 设计低噪声流程日志块，例如：
     - `[流程] 当前：第 4 步 / 9 步，正在完成能力入口访谈`
     - `[产物] 将生成：clarifications.json / clarifications.md`
     - `[下一步] 完成后建议：storyspec core <story> --missing`
  6. `--json` 输出增加 `firstRunFlow` 或等价结构，包含 `steps[]`、`currentStepId`、`recommendedNextStepId`、`copyableCommand`、`writes`、`guards`、`progressLog[]`，方便 agent/UI 消费。
  7. README、`.specify/agent-guides/story-creation-guide.md` 和 Codex command prompt 同步首程路线，避免 agent 只给命令不解释路线。
- 涉及文件/模块：
  - `src/application/story-onboarding.ts`
  - `src/application/get-project-status.ts`
  - `src/cli/commands/story-onboarding.command.ts`
  - `src/cli/commands/status.command.ts`
  - `templates/commands/*.md`
  - `agent-guides/story-creation-guide.md`
  - `README.md`
  - `tests/unit/story-onboarding.test.ts`
  - `tests/smoke/cli-commands.test.ts`
- 验收标准：
  - 首次用户在 `story:new` 后运行 `storyspec next <story>`，能看到一屏内的当前步骤、下一步推荐和完整流程入口。
  - `story:new`、`next`、`interview`、`core`、`preview`、`apply` 等首程关键命令至少能输出或通过 JSON 提供一组统一流程日志：当前阶段、产物、下一步。
  - 流程图明确展示每一步的产物，例如 `idea.md`、`clarifications.json/md`、`specification.md`、`creative-plan.md`、`tasks.md`、Scene Card、Context Pack、draft。
  - 低信息量故事不会被引导跳到写正文；流程图中 preview / confirm / apply 边界清楚可见。
  - `--json` 能稳定表达流程步骤，agent 不需要解析中文文本才能判断下一步。
  - 单元或快照测试覆盖：空工作区、新建 idea 阶段、已有澄清、已有规格、已有任务但未写正文。
- 参考资料/项目：
  - 2026-05-05 《法术编译纪元》首次使用讨论：用户明确询问是否应在第一次使用时告诉全流程图、第一步后下一步是什么。
  - 2026-05-05 继续讨论：用户提出希望像控制台打印日志一样，打印对应流程图和下一步反馈。
  - 已归档 [story-onboarding-navigation-roadmap.md](archive/completed-roadmaps/story-onboarding-navigation-roadmap.md) 的 `story:new` / `next` 基础。
  - 现有 `status --json` 与 `next --json` 的结构化导航能力。
  - 不需要外部开源参考；这是 StorySpec 自身首程导航和创作控制权表达收敛。
- 不做/边界：
  - 不把完整流程图变成强制长教程；默认首屏仍突出下一步，完整路线可折叠或通过 `--flow` 查看。
  - 不把流程日志做成长篇刷屏；默认一屏内可读，详细流程通过显式参数展开。
  - 不承诺自动完成所有步骤；高影响写入仍必须经过 preview / confirm / apply。
  - 不新增 GUI；本任务只覆盖 CLI、人类文本、JSON 和 agent prompt。

## P1 近期增强

### P1-1 卷计划一屏摘要

- 类型：报告整合、创作反馈、CLI/Markdown 输出
- 背景/问题：`creative-plan.md` 能承载三幕结构、章节节奏、角色弧线，但长文档不够直观。用户想看到“故事已经长出来了”的即时反馈。
- 已有基础：
  - `creative:report` 能展示创作骨架和风险。
  - `preview plan` 能生成计划预览。
  - `tension:chart` 已存在 tracking 曲线命令。
- 缺口：缺少计划生成后的简短打印信息和面向作者的一屏概览。
- 建议方案：
  1. `preview plan` 或 `creative:report` 增加 `planDigest` 区块。
  2. 输出第一卷一句话目标、三幕分段、12 章节奏表、核心冲突、三条角色弧线。
  3. 同时提供 JSON 字段，方便后续 UI 或 agent 消费。
  4. 若信息不足，摘要明确标“待确认”，不编造缺失内容。
- 涉及文件/模块：
  - `src/application/creative-report.ts`
  - `src/application/preview-apply.ts`
  - `src/domain/creative-plan*`
  - `templates/spec/`
  - `tests/unit/creative-report.test.ts`
- 验收标准：
  - 生成卷计划后，CLI 输出一屏内摘要，不需要用户先打开长 Markdown。
  - 摘要能显示三幕结构和 12 章节奏的标题/功能。
  - 未确认信息不会被摘要伪装成已定案。
- 参考资料/项目：
  - 本次《法术编译纪元》第一卷计划生成体验。
  - 现有 `tension:chart` 命令的表格输出思路。
- 不做/边界：不取代 `creative-plan.md`，只提供摘要视图。

### P1-2 剧情起伏、人物关系和角色弧线视图

- 类型：可视化摘要、叙事追踪、Markdown/Mermaid 输出
- 背景/问题：作者希望更直觉地感受故事走势和人物关系。纯列表能表达信息，但不如关系图、曲线和角色线清楚。2026-05-05 讨论中进一步确认：这些视图不应只作为长报告存在，也可以在关键节点像控制台日志一样打印“故事结构快照”，给作者看到故事正在长成什么样。
- 已有基础：
  - `spec/tracking/tension-curve.json`
  - `spec/tracking/relationships.json`
  - Entity Graph / Scene Card / Canon Ledger
  - `tension:chart`、`graph:impact`
- 缺口：
  - 缺少把这些结构聚合成“作者可读视图”的命令或报告区块。
  - 缺少关键节点输出策略：什么时候打印剧情起伏、人物关系、角色弧线，什么时候只提示资料不足和下一步。
  - 缺少资料不足时的安全降级文案，容易为了图好看而脑补未确认关系。
- 建议方案：
  1. 增加 `storyspec story:map <story>` 或在 `creative:report` 中增加视图区块。
  2. 输出 Mermaid 关系图：主角、重要伙伴、阵营、冲突关系。
  3. 输出剧情起伏表：章节、张力、主要矛盾、情感推进、伏笔/回收。
  4. 输出角色弧线表：起点、转折、阶段性选择、卷末状态。
  5. 在关键节点打印结构快照：访谈后只打印已确认能力/人物缺口；计划预览后打印三幕和章节起伏；章节完成后打印本章关系变化、伏笔推进和下一章压力。
  6. 对资料不足场景输出缺口图示而非脑补图，例如：`[人物关系] 暂无足够确认资料；缺口：核心伙伴未确认、主要势力未确认；下一步：storyspec interview <story> --focus partner`。
- 涉及文件/模块：
  - `src/application/creative-report.ts`
  - `src/application/manage-relationships*`
  - `src/application/manage-tension*`
  - `src/application/inspect-story-structure.ts`
  - `templates/tracking/*.json`
  - `tests/unit/`
- 验收标准：
  - 对有计划和 tracking 的故事，能输出至少一种关系图和一种节奏/起伏表。
  - 对资料不足的故事，视图显示缺口，不自动脑补。
  - `creative:report`、`preview plan` 或章节收尾报告至少一个关键节点能输出“故事结构快照”，并明确标注 confirmed / candidate / missing。
  - CLI 人类输出保持一屏内可读；复杂 Mermaid 或完整结构图通过显式参数或 Markdown 文件展开。
  - Markdown 输出可直接复制到支持 Mermaid 的环境中查看。
- 参考资料/项目：
  - 本仓库已有 Entity Graph、tension tracking 和 relationship tracking。
  - 2026-05-05 《法术编译纪元》体验讨论：用户提出像日志一样打印故事情节起伏、人物关系等图示，以增强创作反馈。
  - 后续进入设计时可调研写作软件/大纲工具的关系图呈现方式；本任务先不引入 GUI 依赖。
- 不做/边界：不把视图作为唯一正典来源；正典仍来自确认文件和 evidence。

### P1-3 长文导入的“待澄清”解释和确认体验

- 类型：导入器、澄清报告、用户信任
- 背景/问题：导入器保守是合理的，但用户需要知道每个“待澄清”到底是缺信息、冲突、未确认，还是因为表格字段无法稳定识别。
- 已有基础：
  - `ingest` 已能吸收长文。
  - `clarifications.json` 能区分 confirmed / candidate。
  - `creative:report` 能列出缺口和风险。
- 缺口：缺少待澄清原因分类和批量确认/保留候选的低负担入口。
- 建议方案：
  1. 为待澄清项增加 reason：`missing`、`ambiguous`、`conflict`、`needs-confirmation`、`table-uncertain`。
  2. `creative:report` 按原因分组，并展示“为什么不是失败”。
  3. 对高置信内容提供批量确认 preview，但默认不 apply。
  4. 对表格资料输出识别结果预览，显示字段映射和未识别列。
- 涉及文件/模块：
  - `src/application/ingest-story-input.ts`
  - `src/application/manage-clarifications.ts`
  - `src/application/creative-report.ts`
  - `src/domain/clarification-schema.ts`
  - `tests/unit/`
- 验收标准：
  - 长文导入后，每个待澄清项至少有一个可解释 reason。
  - 表格导入能展示已识别列和未识别列。
  - 用户可以选择确认、改写、保留候选或稍后决定。
- 参考资料/项目：
  - 本次长文设定被保守标注的讨论。
  - 现有 `clarification:rollback` 和低负担确认机制。
- 不做/边界：不为了减少待澄清数量而降低确认门槛。

### P1-4 上下文包和写作模板的耗时优化

- 类型：性能体验、agent prompt、上下文治理
- 背景/问题：章节生成慢的一部分原因是上下文组织成本高。每次写章都重新读计划、任务、Scene Card、tracking 和前文，会增加等待和出错概率。
- 已有基础：
  - `context:pack`
  - `handoff`
  - Scene Card 的 `requiredReads` / `allowedWrites`
  - `task-board.json`
- 缺口：缺少写章前的标准上下文包粒度和缓存/复用策略。
- 建议方案：
  1. 定义“本章最小上下文包”：当前任务、当前 Scene Card、上一章摘要、相关 tracking、角色声音。
  2. `context:pack` 支持 `--task <id>` 或 `--chapter <n>`，避免打包整卷。
  3. 写作 prompt 明确禁止无目的全项目扫描。
  4. 收尾报告记录下一章需要读取的最小集合。
- 涉及文件/模块：
  - `src/application/manage-context-packs.ts`
  - `src/application/generate-handoff.ts`
  - `templates/commands/write.md`
  - `templates/commands/write.prompt.md`
  - `tests/unit/manage-context-packs.test.ts`
- 验收标准：
  - 写单章时 context pack 的文件数量和 token 规模可预期。
  - agent 能根据 pack 直接写下一章，不需要重新扫描所有 world/spec/tracking。
  - 中断恢复时能从 handoff/context pack 接上。
- 参考资料/项目：
  - 本次连续生成章节耗时体验。
  - 已有 `context:pack` 和 `handoff` 能力。
- 不做/边界：不缓存用户未授权的外部资料，不牺牲必要连续性检查。

## P2 体验和效率

### P2-1 首程示例库

- 类型：文档、示例、测试 fixture
- 背景/问题：没有示例时，用户不知道应该提供什么资料，也不知道 StorySpec 能处理到什么程度。
- 建议方案：
  1. 提供 3 套短示例：一句灵感、长文资料、Markdown 表格。
  2. 示例覆盖不同类型：奇幻冒险、都市情感、科幻群像。
  3. 示例明确哪些内容会进入 confirmed，哪些会作为 candidate。
- 涉及文件/模块：
  - `docs/examples/`
  - `tests/fixtures/`
  - `README.md`
  - `docs/quickstart.md`
- 验收标准：
  - 新用户能直接复制一个示例跑通首程。
  - 示例不会承诺未实现能力。
- 参考资料/项目：本次用户资料结构和已归档 dogfood 示例。
- 不做/边界：不把示例变成固定创作模板。

### P2-2 进度事件和 JSON 输出统一

- 类型：可观测性、CLI 输出、agent/UI 集成
- 背景/问题：后续如果要接 UI 或更好的 agent 体验，需要命令输出稳定的阶段状态，而不是只能读人类文本。
- 建议方案：
  1. 关键命令输出统一 stage：`preflight`、`input`、`preview`、`write`、`validate`、`finish`。
  2. `--json` 包含 `nextActions`、`warnings`、`progressEvents`。
  3. 人类文本保持简短，JSON 给自动化使用。
- 涉及文件/模块：
  - `src/cli/commands/`
  - `src/application/*`
  - `tests/smoke/cli-commands.test.ts`
- 验收标准：
  - agent 可以基于 JSON 判断下一步，不需要解析中文文本。
  - 人类 CLI 输出不超过一屏，重点清楚。
- 参考资料/项目：现有 `tasks:board --json`、`creative:report` 和 `context:pack` 输出。
- 不做/边界：不在本任务实现 GUI。

## 完成同步要求

- 涉及 CLI 行为、模板契约、生成产物或公共接口变化时，新增 `changes/YYYY-MM-DD-*.md`。
- 修改 command template 后，运行 `npm run build:commands` 和 `npm run check:command-manifest`。
- 修改 onboarding、ingest、creative report、context pack 或 write prompt 后，补 unit/smoke fixture。
- 文档-only 收尾至少运行 `git diff --check`。

## 风险与缓解

- 风险：把新手体验做成强制流程，反而拖慢高级用户。缓解：自然语言入口优先，仍保留 copyable command 和高级参数。
- 风险：为了减少“待澄清”而过度自动确认。缓解：待澄清解释更清楚，但确认门槛不降低。
- 风险：阶段性输出让用户误以为正文已完成。缓解：明确标注 beat、初稿、收尾完成三种状态。
- 风险：摘要视图看起来像正典事实。缓解：视图引用确认来源和 evidence，未确认内容标为 candidate。
