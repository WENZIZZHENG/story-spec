# 待办统一入口

## 状态

Active。本文是 StorySpec 当前唯一的待办入口。详细规则见 [todo-governance.md](todo-governance.md)，已完成事项见 [todo-archive.md](todo-archive.md)。当前暂无 Active 开发路线；新增或恢复任一任务前按影响范围转为 OpenSpec change。

## 当前待办

当前主线：规划阶段“多大纲候选”体验已完成；App 化路线选择的“本机 Web 工作台”第一阶段也已完成。`storyspec app` 已覆盖本机服务地基、零依赖工作台 shell、创作入口、核心缺口、多大纲候选、只读任务板、章节草稿入口和写后自检。云端多用户账号与项目隔离仍排在本机工作台之后，当前为 Planned 中期路线，不作为本轮 Active 开发项。本轮讨论出的项目优化建议已另行收纳为 `project-optimization-roadmap.md` 的 Planned 路线，其中写作链路收紧和章节小样预览已提升为 P0。

| 优先级 | 路线 | 状态 | 覆盖范围 | 下一步 |
| --- | --- | --- | --- | --- |
| P0 | [项目优化建议池路线图](project-optimization-roadmap.md) | Planned | 写作链路收紧、章节小样预览与确认扩写；后续含状态语义统一、项目回流闭环、反向拆解增强、文档收口，以及与多用户路线的横向关联 | 如要继续优化体验，优先将 P0 子项拆成 OpenSpec change |
| - | - | - | 当前无 Active 开发项 | 如要继续 App 中期路线，先新建 OpenSpec，例如 `add-multiuser-project-isolation` |

## Planned 后续路线

| 优先级 | 路线 | 状态 | 覆盖范围 | 激活条件 |
| --- | --- | --- | --- | --- |
| P2 | [单人 App 与多用户项目隔离路线图](app-multiuser-roadmap.md) | Planned | 多用户账号、项目隔离、部署与 AI 成本边界；本机 Web 工作台第一阶段已完成 | 用户明确要求继续多用户/云端/自托管账号路线，并先完成 OpenSpec-first 设计 |

## 暂不作为活跃待办

| 文件 | 原因 | 归档入口 |
| --- | --- | --- |
| [experience-followup-roadmap.md](experience-followup-roadmap.md) | 体验后续增强入口 P0-P3 discovery 已完成并关闭，未产出需立即实现的 OpenSpec change | [todo-archive.md](todo-archive.md#体验后续增强入口复核) |
| [archive/completed-roadmaps/outline-candidates-roadmap.md](archive/completed-roadmaps/outline-candidates-roadmap.md) | 多大纲候选库、候选比较和 `outline:promote --yes` 提升门禁已完成并归档 | [todo-archive.md](todo-archive.md#多大纲候选与提升) |
| [archive/completed-roadmaps/immersive-drafting-roadmap.md](archive/completed-roadmaps/immersive-drafting-roadmap.md) | 写中沉浸原则、约束后置自检、`/write` 和章节卡 prompt 姿态已完成并归档 | [todo-archive.md](todo-archive.md#章节写中沉浸体验) |
| [archive/completed-roadmaps/reference-reverse-roadmap.md](archive/completed-roadmaps/reference-reverse-roadmap.md) | 参考作品反向拆解、精神内核提取、原创化转译、版权/同人边界已完成第一版 preview-only 能力并归档 | [todo-archive.md](todo-archive.md#参考作品反向拆解) |
| [archive/completed-roadmaps/author-first-run-feedback-roadmap.md](archive/completed-roadmaps/author-first-run-feedback-roadmap.md) | 作者首程引导、素材分流、流程图、阶段性写作反馈和结构视图已完成并归档 | [todo-archive.md](todo-archive.md#作者首程引导与正反馈) |
| [archive/completed-roadmaps/storyspec-dogfood-friction-roadmap.md](archive/completed-roadmaps/storyspec-dogfood-friction-roadmap.md) | 自用创作流程 P0 闭环、tracking evidence、验证分层和源码 TODO 收口已完成并归档 | [todo-archive.md](todo-archive.md#自用创作流程问题收口) |
| [archive/completed-roadmaps/chapter-production-workflow-roadmap.md](archive/completed-roadmaps/chapter-production-workflow-roadmap.md) | 章节生产流程优化 P0-P2 已完成并归档 | [todo-archive.md](todo-archive.md#章节生产流程优化) |
| [archive/completed-roadmaps/new-user-story-creation-dogfood-roadmap.md](archive/completed-roadmaps/new-user-story-creation-dogfood-roadmap.md) | 新用户小说创建端到端体验 P0-P2 已完成并归档 | [todo-archive.md](todo-archive.md#新用户小说创建端到端体验) |
| [archive/completed-roadmaps/co-creation-input-and-core-roadmap.md](archive/completed-roadmaps/co-creation-input-and-core-roadmap.md) | 共创输入与核心信息面板 P0-P3 已完成并归档 | [todo-archive.md](todo-archive.md#共创输入与核心信息面板) |
| [archive/completed-roadmaps/story-co-creation-interview-roadmap.md](archive/completed-roadmaps/story-co-creation-interview-roadmap.md) | 故事共创访谈体验增强 F0-F21 已完成；后续新体验优化应新建专题 roadmap | [todo-archive.md](todo-archive.md#故事共创访谈体验增强) |
| [archive/full-refactor/full-refactor-todo.md](archive/full-refactor/full-refactor-todo.md) | A/B/C 主路线已完成，当前仅保留历史索引 | [todo-archive.md](todo-archive.md#full-refactor-主路线) |
| [archive/completed-roadmaps/creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md) | 创作控制权 D0-D10 已完成，当前无后续活跃批次 | [todo-archive.md](todo-archive.md#创作控制权体验优化) |
| [archive/completed-roadmaps/story-onboarding-navigation-roadmap.md](archive/completed-roadmaps/story-onboarding-navigation-roadmap.md) | 新故事引导与创作导航 E0-E5 已完成，当前无后续活跃批次 | [todo-archive.md](todo-archive.md#新故事引导与创作导航) |
| [archive/completed-roadmaps/worldbuilding-quality-roadmap.md](archive/completed-roadmaps/worldbuilding-quality-roadmap.md) | 第一版 Worldbuilding 能力已完成并被 full-refactor B0-B3 覆盖 | [todo-archive.md](todo-archive.md#worldbuilding-quality-roadmap) |
| [archive/completed-roadmaps/command-onboarding.md](archive/completed-roadmaps/command-onboarding.md) | 输入澄清引导已实现，后续创作控制权增强已完成归档 | [todo-archive.md](todo-archive.md#命令输入澄清引导) |
| [archive/completed-roadmaps/chapter-maintenance-automation-roadmap.md](archive/completed-roadmaps/chapter-maintenance-automation-roadmap.md) | 章节前置约束卡、任务/文档收尾提交、待办捕获和共享流程 JSON 契约已完成并归档 | [todo-archive.md](todo-archive.md#章节与维护自动化增强) |
| [archive/completed-roadmaps/storyspec-ecosystem-roadmap.md](archive/completed-roadmaps/storyspec-ecosystem-roadmap.md) | `extension:add`、首个 `mystery` 类型 preset、reviewer 权重和生态 kind 展示口径已完成并归档 | [todo-archive.md](todo-archive.md#storyspec-生态与类型包增强) |
| [archive/completed-roadmaps/agent-ci-quality-roadmap.md](archive/completed-roadmaps/agent-ci-quality-roadmap.md) | agent 准入清单、CI check manifest、Vale / textlint 可选 adapter 已完成并归档 | [todo-archive.md](todo-archive.md#agentci-与自然语言质量增强) |
| `changes/*.md` | changeset 只记录已发生变化，不作为待办入口 | [todo-archive.md](todo-archive.md#changeset-记录) |

## 使用方式

1. 开始新开发前，先读本文确认当前活跃路线。
2. 只在本文中登记未完成的 Planned / Active 路线。
3. 完成路线后，把详细证据写入 [todo-archive.md](todo-archive.md)，再从本文移除或转为历史链接。
4. 新增长期路线时，先按 [todo-governance.md](todo-governance.md) 建立专题 roadmap。
