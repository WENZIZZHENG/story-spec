# 待办统一归档

## 状态

Archive。本文统一索引 StorySpec 已完成或已关闭的待办、路线图和 changeset 记录。已完成路线文件统一放入 `archive/`，本文只做归档入口和状态收口。

## 归档规则

- 已完成路线不再作为活跃开发入口。
- 历史路线文件移动到 `archive/full-refactor/`、`archive/completed-roadmaps/` 或 `archive/decisions/`，根目录只保留活跃入口和常用技术文档。
- 归档只表示“当前批次已完成或关闭”，不表示未来不能新增增强路线。
- 新增强路线必须回到 [todo-index.md](todo-index.md) 登记。

## full-refactor 主路线

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 |
| --- | --- | --- | --- | --- |
| [full-refactor-todo.md](archive/full-refactor/full-refactor-todo.md) | Completed | Agent-neutral、Worldbuilding、Workbench 三条主路线的大阶段索引 | [full-refactor-completed.md](archive/full-refactor/full-refactor-completed.md) | `npm run verify` |
| [full-refactor-agent-neutral.md](archive/full-refactor/full-refactor-agent-neutral.md) | Completed | A0、A1、A2a、A2 | [full-refactor-completed.md](archive/full-refactor/full-refactor-completed.md#2026-05-02) | build、unit、smoke、commands、manifest、diff check |
| [full-refactor-worldbuilding.md](archive/full-refactor/full-refactor-worldbuilding.md) | Completed | B0、B1、B2、B3 | [full-refactor-completed.md](archive/full-refactor/full-refactor-completed.md#2026-05-02) | build、unit、smoke、commands、manifest、diff check |
| [full-refactor-workbench.md](archive/full-refactor/full-refactor-workbench.md) | Completed | C0、C1、C2 | [full-refactor-completed.md](archive/full-refactor/full-refactor-completed.md#2026-05-02) | build、unit、smoke、commands、manifest、diff check |
| [full-refactor-shared.md](archive/full-refactor/full-refactor-shared.md) | Completed | Shared-S1 到 Shared-S6 验证矩阵与跨路线映射 | [full-refactor-completed.md](archive/full-refactor/full-refactor-completed.md) | `npm run verify` |
| [full-refactor-archive.md](archive/full-refactor/full-refactor-archive.md) | Archived | 上一轮 full-refactor 历史阶段 0-10 | 原文件自身 | 历史归档，不再作为当前验证入口 |

## Worldbuilding Quality Roadmap

| 原文件 | 状态 | 完成范围 | 详细证据 | 后续入口 |
| --- | --- | --- | --- | --- |
| [worldbuilding-quality-roadmap.md](archive/completed-roadmaps/worldbuilding-quality-roadmap.md) | Completed | World Bible、Canon Ledger、Entity Graph、Scene Cards、VoiceFingerprint、Reviewer Loop、Genre Preset 第一版 | [full-refactor-completed.md](archive/full-refactor/full-refactor-completed.md#2026-05-02) 的 B0-B3 | 新增类型 preset 或 reviewer 权重接入时，新建增强路线 |

## 命令输入澄清引导

| 原文件 | 状态 | 完成范围 | 详细证据 | 后续入口 |
| --- | --- | --- | --- | --- |
| [command-onboarding.md](archive/completed-roadmaps/command-onboarding.md) | Completed | `argument-hint` / `arguments.hint` 统一转化为输入澄清引导，`/storyspec-specify` 增加创作控制权保护 | [2026-05-03-command-onboarding.md](../../changes/2026-05-03-command-onboarding.md) | [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md) |

## 创作控制权体验优化

| 原文件 | 状态 | 完成范围 | 详细证据 | 后续入口 |
| --- | --- | --- | --- | --- |
| [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md) | Completed | Batch D0：澄清问题、答案、创作决策领域模型与 schema 校验 | [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md#batch-d0创作控制权问题模型) / [2026-05-03-clarification-domain.md](../../changes/2026-05-03-clarification-domain.md) | D1 已完成 |
| [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md) | Completed | Batch D1：内置澄清问题包与题材问题选择器 | [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md#batch-d1问题库与题材-preset) / [2026-05-03-clarification-question-packs.md](../../changes/2026-05-03-clarification-question-packs.md) | D2 已完成 |
| [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md) | Completed | Batch D2：`/storyspec-clarify` 创作控制权保护与澄清记录服务 | [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md#batch-d2novel-clarify-创作访谈升级) / [2026-05-03-clarify-interview-records.md](../../changes/2026-05-03-clarify-interview-records.md) | D3 已完成 |
| [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md) | Completed | Batch D3：`/storyspec-constitution`、`/storyspec-specify`、`/storyspec-plan`、`/storyspec-tasks` 写入前预览门禁 | [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md#batch-d3写入前预览与确认门禁) / [write-preview-gate.md](archive/completed-roadmaps/write-preview-gate.md) / [2026-05-03-write-preview-gate.md](../../changes/2026-05-03-write-preview-gate.md) | D4 已完成 |
| [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md) | Completed | Batch D4：故事成熟度阶段、早期灵感合法状态、status 创作缺口、validate 分阶段检查 | [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md#batch-d4早期灵感合法状态) / [story-maturity-model.md](archive/completed-roadmaps/story-maturity-model.md) / [2026-05-03-story-maturity-model.md](../../changes/2026-05-03-story-maturity-model.md) | D5 已完成 |
| [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md) | Completed | Batch D5：WorldFact / CanonFact 来源字段、world/canon 未确认 AI 建议检查、规格来源标记契约 | [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md#batch-d5来源追踪与-canon-防污染) / [2026-05-03-source-tracked-worldbuilding.md](../../changes/2026-05-03-source-tracked-worldbuilding.md) | D6 已完成 |
| [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md) | Completed | Batch D6：结构化示例分叉模型、题材种子库、clarify/specify 示例分叉展示 | [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md#batch-d6示例分叉生成器) / [2026-05-03-example-branch-generator.md](../../changes/2026-05-03-example-branch-generator.md) | D7 已完成 |
| [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md) | Completed | Batch D7：status 创作空间、handoff 创作控制摘要、context pack 澄清记录 mustRead | [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md#batch-d7创作状态与下一步推荐) / [2026-05-03-creative-status-navigation.md](../../changes/2026-05-03-creative-status-navigation.md) | D8 已完成 |
| [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md) | Completed | Batch D8：`storyspec interview` / `storyspec clarify` CLI、澄清记录 replay、可复制 `/storyspec-specify` handoff prompt | [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md#batch-d8交互式-cli-兜底) / [2026-05-03-interview-cli.md](../../changes/2026-05-03-interview-cli.md) | D9 已完成 |
| [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md) | Completed | Batch D9：review 创作意图漂移检测、analyze 创作控制权维度、tasks 来源追溯契约 | [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md#batch-d9漂移检测与反向同步) / [2026-05-03-creative-intent-drift.md](../../changes/2026-05-03-creative-intent-drift.md) | D10 已完成 |
| [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md) | Completed | Batch D10：README、创作控制权指南、commands/workflow/index 文档与旧项目迁移说明 | [creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md#batch-d10文档教程与用户引导) / [2026-05-03-creative-control-docs.md](../../changes/2026-05-03-creative-control-docs.md) | 新增强路线时回到 todo-index 登记 |

## 新故事引导与创作导航

| 原文件 | 状态 | 完成范围 | 详细证据 | 后续入口 |
| --- | --- | --- | --- | --- |
| [story-onboarding-navigation-roadmap.md](archive/completed-roadmaps/story-onboarding-navigation-roadmap.md) | Completed | E0-E5：`storyspec story:new`、`storyspec next`、澄清校验门禁、`creative:report`、访谈体验增强、`preview specify` / `apply` | [2026-05-03-story-onboarding-navigation.md](../../changes/2026-05-03-story-onboarding-navigation.md) | 新增创作导航增强时回到 todo-index 登记 |

## 作者首程引导与正反馈

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 | 后续入口 |
| --- | --- | --- | --- | --- | --- |
| [author-first-run-feedback-roadmap.md](archive/completed-roadmaps/author-first-run-feedback-roadmap.md) | Completed | P0-P2：工作区优先初始化、原始灵感/长文/表格资料向导、少命令化导航、首次使用流程图、章节阶段性反馈、scope context pack、卷计划摘要和 Mermaid 结构视图 | [2026-05-05-workspace-onboarding-visuals.md](../../changes/2026-05-05-workspace-onboarding-visuals.md)、[2026-05-05-first-run-docs-sync.md](../../changes/2026-05-05-first-run-docs-sync.md)、`openspec/changes/improve-first-run-onboarding`、`openspec/changes/improve-writing-feedback-loop` | `npm run verify`、OpenSpec strict validate、`git diff --check` | 新增首程体验增强时回到 todo-index 登记 |

## 故事共创访谈体验增强

| 原文件 | 状态 | 完成范围 | 详细证据 | 后续入口 |
| --- | --- | --- | --- | --- |
| [story-co-creation-interview-roadmap.md](archive/completed-roadmaps/story-co-creation-interview-roadmap.md) | Completed | F0-F21：共创访谈基础门禁、故事要素、创作工作台、体验验收和低负担创作闭环 | [story-co-creation-interview-roadmap.md](archive/completed-roadmaps/story-co-creation-interview-roadmap.md) | 后续新体验优化回到 todo-index 新建专题 roadmap |
| [story-co-creation-foundation-roadmap.md](archive/completed-roadmaps/story-co-creation-foundation-roadmap.md) | Completed | F0-F6：共创体验基线、核心要素成熟度、示例分叉、访谈编排、plan 门禁、成果报告和文档迁移 | [story-co-creation-foundation-roadmap.md](archive/completed-roadmaps/story-co-creation-foundation-roadmap.md) | 后续新体验优化回到 todo-index 新建专题 roadmap |
| [story-co-creation-story-elements-roadmap.md](archive/completed-roadmaps/story-co-creation-story-elements-roadmap.md) | Completed | F7-F11：人物情感、世界压力、Scene Card、参考作品节奏和作者画像 | [story-co-creation-story-elements-roadmap.md](archive/completed-roadmaps/story-co-creation-story-elements-roadmap.md) | 后续新体验优化回到 todo-index 新建专题 roadmap |
| [story-co-creation-workbench-roadmap.md](archive/completed-roadmaps/story-co-creation-workbench-roadmap.md) | Completed | F12-F15：多入口共创、分支管理、创作回声和未决项回流 | [story-co-creation-workbench-roadmap.md](archive/completed-roadmaps/story-co-creation-workbench-roadmap.md) | 后续新体验优化回到 todo-index 新建专题 roadmap |
| [story-co-creation-experience-roadmap.md](archive/completed-roadmaps/story-co-creation-experience-roadmap.md) | Completed | F16-F21：有趣选择、入口卡、势力入口、首轮共创样例、创作乐趣验收和低负担创作体验 | [story-co-creation-experience-roadmap.md](archive/completed-roadmaps/story-co-creation-experience-roadmap.md) | 后续新体验优化回到 todo-index 新建专题 roadmap |

## 新用户小说创建端到端体验

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 | 后续入口 |
| --- | --- | --- | --- | --- | --- |
| [new-user-story-creation-dogfood-roadmap.md](archive/completed-roadmaps/new-user-story-creation-dogfood-roadmap.md) | Completed | P0-P2：首次路径统一、next 可复制命令、固定示例去污染、next 分层输出、StorySpec v0、成熟度回声、tasks/write 衔接、init 成功顺序、Scene Card 上下文 | [new-user-story-creation-dogfood-roadmap.md](archive/completed-roadmaps/new-user-story-creation-dogfood-roadmap.md) | `npm run build`、相关 unit tests、`npm run check:changes`、`git diff --check` | 后续新用户体验增强回到 todo-index 新建专题 roadmap |

## 章节生产流程优化

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 | 后续入口 |
| --- | --- | --- | --- | --- | --- |
| [chapter-production-workflow-roadmap.md](archive/completed-roadmaps/chapter-production-workflow-roadmap.md) | Completed | P0-P2：Scene Card 路径诊断和修复、`task:finish`、维护上下文与文档收尾命令、compile 当前阶段降噪、伏笔计划回收、澄清 doctor、compile check、任务状态幂等同步 | [2026-05-04-chapter-production-workflow.md](../../changes/2026-05-04-chapter-production-workflow.md)、[2026-05-04-task-status-idempotent.md](../../changes/2026-05-04-task-status-idempotent.md) | `npm run build`、相关 unit tests、相关 CLI smoke、`npm run check:changes`、`npm run check:command-manifest`、`git diff --check` | 后续章节生产体验增强回到 todo-index 新建专题 roadmap |

## 章节与维护自动化增强

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 | 后续入口 |
| --- | --- | --- | --- | --- | --- |
| [chapter-maintenance-automation-roadmap.md](archive/completed-roadmaps/chapter-maintenance-automation-roadmap.md) | Completed | `task:finish --commit`、验证失败阻断、章节前置约束卡、`docs:finish --commit`、`todo:capture` 和共享流程 JSON 契约 | [2026-05-05-task-finish-commit.md](../../changes/2026-05-05-task-finish-commit.md)、[2026-05-05-task-finish-validation-blocking.md](../../changes/2026-05-05-task-finish-validation-blocking.md)、[2026-05-05-chapter-preflight-constraint-card.md](../../changes/2026-05-05-chapter-preflight-constraint-card.md)、[2026-05-05-docs-finish-commit.md](../../changes/2026-05-05-docs-finish-commit.md)、[2026-05-05-todo-capture-preview.md](../../changes/2026-05-05-todo-capture-preview.md)、[2026-05-05-flow-command-results.md](../../changes/2026-05-05-flow-command-results.md) | OpenSpec strict validate、相关 unit、相关 smoke、`npm run build`、`npm run check:changes`、`git diff --check` | 后续章节或维护自动化增强回到 todo-index 新建专题 roadmap |

## 章节写中沉浸体验

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 | 后续入口 |
| --- | --- | --- | --- | --- | --- |
| [immersive-drafting-roadmap.md](archive/completed-roadmaps/immersive-drafting-roadmap.md) | Completed | 章节卡、`/write`、Scene Card、继续创作入口和 agent guide 统一为“写前确认约束、写中沉浸起草、写后对照自检” | [2026-05-05-immersive-drafting-principle.md](../../changes/2026-05-05-immersive-drafting-principle.md)、`openspec/changes/add-immersive-drafting-principle` | OpenSpec strict validate、相关 unit、`npm run build`、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`、`git diff --check` | 后续章节写作体验增强回到 todo-index 新建专题 roadmap |

## 参考作品反向拆解

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 | 后续入口 |
| --- | --- | --- | --- | --- | --- |
| [reference-reverse-roadmap.md](archive/completed-roadmaps/reference-reverse-roadmap.md) | Completed | `storyspec reference:reverse` preview-only CLI、应用层结构化拆解、agent command、README 和原创边界文档同步 | [2026-05-05-reference-reverse-extraction.md](../../changes/2026-05-05-reference-reverse-extraction.md)、`openspec/changes/add-reference-reverse-extraction` | OpenSpec strict validate、相关 unit / smoke、`npm run build`、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`、`git diff --check` | 后续参考作品资料管理或 apply 流程增强回到 todo-index 新建专题 roadmap |

## 多大纲候选与提升

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 | 后续入口 |
| --- | --- | --- | --- | --- | --- |
| [outline-candidates-roadmap.md](archive/completed-roadmaps/outline-candidates-roadmap.md) | Completed | `storyspec outline:fork`、`outline:new`、`outline:list`、`outline:compare`、`outline:promote`；候选目录、元数据、比较和默认 dry-run 提升门禁 | [2026-05-06-outline-candidates.md](../../changes/2026-05-06-outline-candidates.md)、`openspec/changes/add-outline-candidates` | OpenSpec strict validate、相关 unit、相关 CLI smoke、`npm run build`、`npm run check:changes`、`git diff --check` | 后续 App 中的大纲视图或 AI 生成候选另起路线 |

## 本机 Web 工作台第一阶段

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 | 后续入口 |
| --- | --- | --- | --- | --- | --- |
| [app-multiuser-roadmap.md](app-multiuser-roadmap.md) | Completed 第一阶段 | `storyspec app` 本机服务地基、零依赖工作台 shell、项目打开/创建、创作入口、核心缺口、候选大纲、只读任务板、章节草稿入口、Scene Card 初始化和章节级写后自检 | [2026-05-06-local-app-workbench-foundation.md](../../changes/2026-05-06-local-app-workbench-foundation.md)、[2026-05-06-local-app-shell-ui.md](../../changes/2026-05-06-local-app-shell-ui.md)、[2026-05-06-local-app-intake-core.md](../../changes/2026-05-06-local-app-intake-core.md)、[2026-05-06-local-app-outline-task-views.md](../../changes/2026-05-06-local-app-outline-task-views.md)、[2026-05-06-local-app-chapter-entry.md](../../changes/2026-05-06-local-app-chapter-entry.md)、`openspec/changes/add-local-app-chapter-entry` | OpenSpec strict validate、相关 App unit、`npm run build`、`npm run check:changes`、`git diff --check` | 多用户账号与项目隔离、统一 preview/apply lane 或前端框架化需回到 todo-index 激活并新建 OpenSpec |

## 项目优化建议池 P0

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 | 后续入口 |
| --- | --- | --- | --- | --- | --- |
| [project-optimization-roadmap.md](project-optimization-roadmap.md) | Completed P0 | 写作链路收紧；本机 App 章节写作通道 `outline -> tasks -> scene -> sample -> draft -> review`；`/write` 和章节卡新增阶段 1.5 章节小样；README、agent guide、todo-index 和路线图同步真实边界 | [2026-05-07-chapter-writing-lane-sample-preview.md](../../changes/2026-05-07-chapter-writing-lane-sample-preview.md)、`openspec/changes/add-chapter-writing-lane-sample-preview` | OpenSpec strict validate、相关 App/template unit、`npm run build`、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`、`git diff --check` | 状态语义统一、项目回流闭环、反向拆解增强和文档收口仍按 project-optimization-roadmap 的 P2/P3 子项激活 |

## 项目优化建议池 P2

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 | 后续入口 |
| --- | --- | --- | --- | --- | --- |
| [project-optimization-roadmap.md](project-optimization-roadmap.md) | Completed P2-1/P2-2 | 状态语义统一；`ProjectStatus.resume` 继续创作回流摘要；本机 App `/api/projects/current/resume`；继续创作卡展示当前状态、推荐下一步、可复制命令、写入模式、状态词和边界 | [2026-05-07-status-resume-lane.md](../../changes/2026-05-07-status-resume-lane.md)、`openspec/changes/add-status-resume-lane` | OpenSpec strict validate、相关 App/status unit、`npm run build`、`npm run check:changes`、`git diff --check` | 反向拆解增强和文档收口仍按 project-optimization-roadmap 的 P2 子项激活；多用户账号与项目隔离按 app-multiuser-roadmap 独立推进 |
| [project-optimization-roadmap.md](project-optimization-roadmap.md) | Completed P2-3 | `storyspec reference:reverse` 新增结构吸引力、读者承诺、修复方向和原创化指南；JSON、文本输出和 agent prompt 同步；继续保持 preview-only、不抓取原文、不写入正典 | [2026-05-07-reference-reverse-development.md](../../changes/2026-05-07-reference-reverse-development.md)、`openspec/changes/enhance-reference-reverse-development` | OpenSpec strict validate、相关 unit / smoke、`npm run build`、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`、`git diff --check` | 文档收口仍按 project-optimization-roadmap 的 P2 子项激活；多用户账号与项目隔离按 app-multiuser-roadmap 独立推进 |
| [project-optimization-roadmap.md](project-optimization-roadmap.md) | Completed P2-4 | 文档事实源收口；`docs/commands.md`、`docs/workflow.md`、`docs/index.md`、`docs/quickstart.md` 与 README/prompt 的章节写作链路一致；快速入门明确当前没有账号、云端或实时多人协作 | [2026-05-07-doc-fact-boundaries.md](../../changes/2026-05-07-doc-fact-boundaries.md)、`openspec/changes/align-doc-fact-boundaries` | OpenSpec strict validate、文档关键词检查、`npm run check:changes`、`git diff --check` | 项目优化建议池 P0/P2 当前批次已完成；多用户账号与项目隔离按 app-multiuser-roadmap 独立推进 |

## StorySpec 生态与类型包增强

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 | 后续入口 |
| --- | --- | --- | --- | --- | --- |
| [storyspec-ecosystem-roadmap.md](archive/completed-roadmaps/storyspec-ecosystem-roadmap.md) | Completed | `extension:add` 薄 alias、首个 `mystery` 类型 preset、reviewer 权重接入、插件/preset/extension kind 展示口径统一 | [2026-05-05-extension-add-alias.md](../../changes/2026-05-05-extension-add-alias.md)、[2026-05-05-mystery-genre-preset.md](../../changes/2026-05-05-mystery-genre-preset.md)、[2026-05-05-reviewer-weights.md](../../changes/2026-05-05-reviewer-weights.md)、[2026-05-05-ecosystem-kind-copy.md](../../changes/2026-05-05-ecosystem-kind-copy.md) | OpenSpec strict validate、`npm run build`、相关 unit、相关 smoke、`npm run check:changes`、`git diff --check` | 后续生态增强回到 todo-index 新建专题 roadmap |

## Agent/CI 与自然语言质量增强

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 | 后续入口 |
| --- | --- | --- | --- | --- | --- |
| [agent-ci-quality-roadmap.md](archive/completed-roadmaps/agent-ci-quality-roadmap.md) | Completed | agent integration 准入清单、本地 CI 质量检查清单、可选 Vale / textlint prose lint adapter | [2026-05-05-agent-integration-acceptance.md](../../changes/2026-05-05-agent-integration-acceptance.md)、[2026-05-05-ci-quality-checks.md](../../changes/2026-05-05-ci-quality-checks.md)、[2026-05-05-optional-prose-lint-adapters.md](../../changes/2026-05-05-optional-prose-lint-adapters.md) | OpenSpec strict validate、`npm run build`、相关 unit、相关 smoke、`npm run check:changes`、`npm run check:command-manifest`、`git diff --check` | 后续 agent、CI 或自然语言质量增强回到 todo-index 新建专题 roadmap |

## 体验后续增强入口复核

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 | 后续入口 |
| --- | --- | --- | --- | --- | --- |
| [experience-followup-roadmap.md](experience-followup-roadmap.md) | Completed | Dogfood 继续创作工具包验收、Dogfood 回归记录模板、首程体验、新用户四入口、共创体验、共创输入与核心面板、创作控制权、Worldbuilding / Workbench 后续分流 | [dogfood-authoring-continuation-2026-05-05.md](dogfood-authoring-continuation-2026-05-05.md)、[dogfood-regression-template.md](dogfood-regression-template.md)、[first-run-experience-notes-2026-05-05.md](first-run-experience-notes-2026-05-05.md)、[new-user-story-entry-notes-2026-05-05.md](new-user-story-entry-notes-2026-05-05.md)、[co-creation-experience-followup-2026-05-05.md](co-creation-experience-followup-2026-05-05.md)、[core-input-panel-followup-2026-05-05.md](core-input-panel-followup-2026-05-05.md)、[creative-control-followup-2026-05-05.md](creative-control-followup-2026-05-05.md)、[workbench-worldbuilding-followup-triage-2026-05-05.md](workbench-worldbuilding-followup-triage-2026-05-05.md) | 相关 unit、手工 CLI 走查、`git diff --check`、`npm run check:changes` | 后续真实缺陷或增强证据回到 todo-index 新建专题 roadmap；实现前转 OpenSpec |

## 自用创作流程问题收口

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 | 后续入口 |
| --- | --- | --- | --- | --- | --- |
| [storyspec-dogfood-friction-roadmap.md](archive/completed-roadmaps/storyspec-dogfood-friction-roadmap.md) | Completed | P0-P2：任务收尾命令产物一致性、章节正文路径识别、写作阶段验证分层、tracking evidence schema、任务完成报告、dogfood fixture、插件源码 TODO 和世界观地点引用检查 | [2026-05-04-task-status-idempotent.md](../../changes/2026-05-04-task-status-idempotent.md)、[2026-05-05-source-todo-features.md](../../changes/2026-05-05-source-todo-features.md)、`openspec/changes/fix-storyspec-dogfood-friction`、`openspec/changes/finish-source-todo-features` | `npm run verify`、OpenSpec strict validate、`git diff --check` | 新增 dogfood 回归或章节生产增强时回到 todo-index 登记 |

## 共创输入与核心信息面板

| 原文件 | 状态 | 完成范围 | 详细证据 | 验证口径 | 后续入口 |
| --- | --- | --- | --- | --- | --- |
| [co-creation-input-and-core-roadmap.md](archive/completed-roadmaps/co-creation-input-and-core-roadmap.md) | Completed | P0-P3：核心信息面板、长文吸收、预览写入摘要、故事圣经结构、中文别名、来源状态标记、连续共创入口、无标题长文候选识别 | [co-creation-input-and-core-roadmap.md](archive/completed-roadmaps/co-creation-input-and-core-roadmap.md) | `npm run build`、相关 unit tests、相关 CLI smoke、`git diff --check` | 后续共创输入增强回到 todo-index 新建专题 roadmap |

## changeset 记录

| 文件 | 状态 | 范围 | 说明 |
| --- | --- | --- | --- |
| [2026-05-02-refactor-foundation.md](../../changes/2026-05-02-refactor-foundation.md) | Completed | CLI、prompt、validation、plugins、ci | full-refactor 基础设施收口的用户可见契约 |
| [2026-05-03-command-onboarding.md](../../changes/2026-05-03-command-onboarding.md) | Completed | prompt、commands、agent-integrations | 命令输入澄清引导与 `/storyspec-specify` 创作控制权保护 |
| [2026-05-03-write-preview-gate.md](../../changes/2026-05-03-write-preview-gate.md) | Completed | prompt、commands、generated-artifacts | 高影响写入命令 preview/confirm/apply 门禁 |
| [2026-05-03-story-maturity-model.md](../../changes/2026-05-03-story-maturity-model.md) | Completed | domain、validation、status | 早期灵感合法状态与故事成熟度模型 |
| [2026-05-03-source-tracked-worldbuilding.md](../../changes/2026-05-03-source-tracked-worldbuilding.md) | Completed | domain、validation、templates、commands | WorldFact / CanonFact 来源追踪与正典防污染检查 |
| [2026-05-03-example-branch-generator.md](../../changes/2026-05-03-example-branch-generator.md) | Completed | domain、prompt、commands、templates | 结构化示例分叉模型与题材种子库 |
| [2026-05-03-creative-status-navigation.md](../../changes/2026-05-03-creative-status-navigation.md) | Completed | status、handoff、context-pack | 创作空间统计、创作控制摘要与澄清记录 mustRead |
| [2026-05-03-interview-cli.md](../../changes/2026-05-03-interview-cli.md) | Completed | cli、application、smoke | 交互式创作访谈 CLI、澄清 replay 与 agent handoff prompt |
| [2026-05-03-creative-intent-drift.md](../../changes/2026-05-03-creative-intent-drift.md) | Completed | review、analysis、tasks、commands | 创作意图漂移检测与已确认澄清来源追溯 |
| [2026-05-03-creative-control-docs.md](../../changes/2026-05-03-creative-control-docs.md) | Completed | docs、readme、workflow | 创作控制权用户引导、教程和迁移说明 |
| [2026-05-03-story-onboarding-navigation.md](../../changes/2026-05-03-story-onboarding-navigation.md) | Completed | cli、validation、creative-control | 新故事入口、下一步导航、澄清门禁、创作控制权报告和 CLI preview/apply |
| [2026-05-03-repository-root-slimdown.md](../../changes/2026-05-03-repository-root-slimdown.md) | Completed | repository、docs、templates | 仓库根目录生成副本、本地配置和历史参考材料瘦身 |
| [2026-05-03-maintenance-sdd-agent-docs.md](../../changes/2026-05-03-maintenance-sdd-agent-docs.md) | Completed | repository、docs | 维护期 SDD 与中文 Agent 协作入口 |
| [2026-05-03-repository-plugin-slimdown.md](../../changes/2026-05-03-repository-plugin-slimdown.md) | Completed | repository、docs、templates、plugins、spec | 旧方法论、重复文档、作者风格插件与检测规避导向资料精简 |
| [2026-05-04-agent-story-creation-guide.md](../../changes/2026-05-04-agent-story-creation-guide.md) | Completed | agent、templates、docs | Agent 小说创建引导协议 |
| [2026-05-04-author-profile.md](../../changes/2026-05-04-author-profile.md) | Completed | cli、templates、memory、docs、tests | 作者画像轻量采样与回填 |
| [2026-05-04-branch-what-if-compare.md](../../changes/2026-05-04-branch-what-if-compare.md) | Completed | cli、templates、docs、tests | 分支 what-if 对照卡 |
| [2026-05-04-co-create-workbench.md](../../changes/2026-05-04-co-create-workbench.md) | Completed | cli、application、docs、tests | 连续共创输入入口 |
| [2026-05-04-co-creation-docs-prompts-sync.md](../../changes/2026-05-04-co-creation-docs-prompts-sync.md) | Completed | docs、templates、agent | 共创输入文档与 agent 提示词同步 |
| [2026-05-04-co-creation-docs.md](../../changes/2026-05-04-co-creation-docs.md) | Completed | docs、templates | 同步共创访谈文档流程 |
| [2026-05-04-co-creation-entry-cards.md](../../changes/2026-05-04-co-creation-entry-cards.md) | Completed | cli、domain、docs、tests | 六大核心入口卡模板 |
| [2026-05-04-co-creation-entrypoints.md](../../changes/2026-05-04-co-creation-entrypoints.md) | Completed | cli、application、tests | 共创入口导航基线 |
| [2026-05-04-co-creation-experience-acceptance.md](../../changes/2026-05-04-co-creation-experience-acceptance.md) | Completed | domain、docs、tests | 创作乐趣体验验收 |
| [2026-05-04-co-creation-workbench.md](../../changes/2026-05-04-co-creation-workbench.md) | Completed | cli、templates、docs、tests | 多入口共创工作台 |
| [2026-05-04-core-source-labels.md](../../changes/2026-05-04-core-source-labels.md) | Completed | cli、application、docs、tests | 核心信息来源状态标记 |
| [2026-05-04-copyable-next-interview.md](../../changes/2026-05-04-copyable-next-interview.md) | Completed | cli | 让 next 推荐命令可复制执行 |
| [2026-05-04-creation-echo.md](../../changes/2026-05-04-creation-echo.md) | Completed | cli、application、docs、tests | 创作回声摘要 |
| [2026-05-04-creative-report-status-maturity.md](../../changes/2026-05-04-creative-report-status-maturity.md) | Completed | application、tests | 创作回声与状态成熟度解释 |
| [2026-05-04-creative-report-story-skeleton.md](../../changes/2026-05-04-creative-report-story-skeleton.md) | Completed | cli、application、tests | 创作成果骨架报告 |
| [2026-05-04-deferred-decision-log.md](../../changes/2026-05-04-deferred-decision-log.md) | Completed | cli、application、docs、tests | 未决项回流与决策日志 |
| [2026-05-04-faction-power-structure.md](../../changes/2026-05-04-faction-power-structure.md) | Completed | schema、templates、cli、docs、tests | 势力入口与权力结构共创 |
| [2026-05-04-first-round-co-creation-script.md](../../changes/2026-05-04-first-round-co-creation-script.md) | Completed | fixtures、domain、docs、tests | 首轮共创样例脚本 |
| [2026-05-04-first-run-path.md](../../changes/2026-05-04-first-run-path.md) | Completed | cli、docs | 统一首次创作路径提示 |
| [2026-05-04-init-output-order.md](../../changes/2026-05-04-init-output-order.md) | Completed | cli、tests | init 成功输出顺序 |
| [2026-05-04-interesting-choice-quality.md](../../changes/2026-05-04-interesting-choice-quality.md) | Completed | cli、templates、docs、tests | 有趣选择质量标准 |
| [2026-05-04-ingest-story-input.md](../../changes/2026-05-04-ingest-story-input.md) | Completed | cli、application、docs、tests | 长文创作资料吸收入口 |
| [2026-05-04-ingest-unlabelled-candidates.md](../../changes/2026-05-04-ingest-unlabelled-candidates.md) | Completed | cli、application、tests | 无标题长文候选识别 |
| [2026-05-04-interview-answer-aliases.md](../../changes/2026-05-04-interview-answer-aliases.md) | Completed | cli、application、tests | 访谈答案中文别名 |
| [2026-05-04-interview-stage-planner.md](../../changes/2026-05-04-interview-stage-planner.md) | Completed | cli、application、tests | 访谈阶段编排 |
| [2026-05-04-low-burden-co-creation.md](../../changes/2026-05-04-low-burden-co-creation.md) | Completed | cli、application、domain、docs、tests | 低负担共创模式 |
| [2026-05-04-new-user-dogfood-roadmap.md](../../changes/2026-05-04-new-user-dogfood-roadmap.md) | Completed | docs、todo | 新用户小说创建 dogfood 路线 |
| [2026-05-04-next-progressive-disclosure.md](../../changes/2026-05-04-next-progressive-disclosure.md) | Completed | cli、docs | 降低 next 默认输出信息密度 |
| [2026-05-04-plan-preview-gate.md](../../changes/2026-05-04-plan-preview-gate.md) | Completed | cli、application、tests | 创作计划预览门禁 |
| [2026-05-04-preview-write-summary.md](../../changes/2026-05-04-preview-write-summary.md) | Completed | cli、application、docs、tests | 预览写入摘要 |
| [2026-05-04-question-example-branches.md](../../changes/2026-05-04-question-example-branches.md) | Completed | cli、domain、templates、docs、tests | 问题级示例分叉 |
| [2026-05-04-relationship-tracking.md](../../changes/2026-05-04-relationship-tracking.md) | Completed | domain、templates、validation、tests | 增强人物情感与关系追踪 |
| [2026-05-04-remove-template-example-pollution.md](../../changes/2026-05-04-remove-template-example-pollution.md) | Completed | templates、cli | 移除通用示例固定故事污染 |
| [2026-05-04-rhythm-config.md](../../changes/2026-05-04-rhythm-config.md) | Completed | cli、templates、workbench、docs、tests | 抽象节奏配置 |
| [2026-05-04-scene-card-gate.md](../../changes/2026-05-04-scene-card-gate.md) | Completed | domain、templates、workbench、tests | Scene Card 写作前门禁 |
| [2026-05-04-scene-card-story-context.md](../../changes/2026-05-04-scene-card-story-context.md) | Completed | cli、application、tests | Scene Card 初始化带入故事上下文 |
| [2026-05-04-specification-bible-structure.md](../../changes/2026-05-04-specification-bible-structure.md) | Completed | application、templates、tests | 规格文档故事圣经结构 |
| [2026-05-04-story-core-elements.md](../../changes/2026-05-04-story-core-elements.md) | Completed | cli、application、validation、tests | 核心要素成熟度模型 |
| [2026-05-04-story-core-panel.md](../../changes/2026-05-04-story-core-panel.md) | Completed | cli、application、docs、tests | 核心信息面板命令 |
| [2026-05-04-story-creation-entry-first.md](../../changes/2026-05-04-story-creation-entry-first.md) | Completed | agent、templates、docs | 小说创建入口优先引导 |
| [2026-05-04-storyspec-v0-preview.md](../../changes/2026-05-04-storyspec-v0-preview.md) | Completed | application、cli、tests、docs | StorySpec v0 规格预览 |
| [2026-05-04-task-status-idempotent.md](../../changes/2026-05-04-task-status-idempotent.md) | Completed | cli、application、validation、tests、docs | 任务状态幂等同步与 task-board stale 校验 |
| [2026-05-04-tasks-context-write-guidance.md](../../changes/2026-05-04-tasks-context-write-guidance.md) | Completed | cli、application、docs、tests | tasks/context/write 缺口引导 |
| [2026-05-04-world-pressure.md](../../changes/2026-05-04-world-pressure.md) | Completed | domain、templates、validation、tests | 增强世界观场景压力检查 |
| [2026-05-05-source-todo-features.md](../../changes/2026-05-05-source-todo-features.md) | Completed | cli、plugins、scripts、tests、openspec | 补齐插件安装安全、本地插件源解析和世界观地点引用源码 TODO |

## 架构决策与专题记录

这些文件不是待办，但属于已采纳或已完成的设计证据：

| 文件 | 状态 | 说明 |
| --- | --- | --- |
| [agent-neutral-refactor.md](archive/decisions/agent-neutral-refactor.md) | Accepted | AgentIntegration 基线决策 |
| [ai-platform-registry-refactor.md](archive/decisions/ai-platform-registry-refactor.md) | Accepted | AI 平台 registry 单一事实源 |
| [codex-optimization.md](archive/completed-roadmaps/codex-optimization.md) | Completed | Codex 状态、handoff、tasks board 与 agent contract 优化记录 |
| [plugin-entrypoint-decision.md](archive/decisions/plugin-entrypoint-decision.md) | Accepted | 插件、扩展、预设安装入口决策 |

## 当前仍未完成的活跃路线

- 当前暂无活跃路线，唯一事实源以 [todo-index.md](todo-index.md) 为准。
- 本归档页不复制活跃清单，避免归档状态和入口状态再次分叉。
- 开始下一轮待办开发时，先读 [todo-index.md](todo-index.md)，再按对应 roadmap 进入 OpenSpec-first 流程；完成或关闭后再回到本文追加归档证据。
