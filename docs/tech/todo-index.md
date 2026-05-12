# 待办统一入口

## 状态

Active。本文是 StorySpec 当前唯一的待办入口。详细规则见 [todo-governance.md](todo-governance.md)，已完成事项见 [todo-archive.md](todo-archive.md)。

## 当前待办

当前主线：本机 CLI、实验性本机工作台和多用户控制面基础已经完成一轮收口，P0 构建/依赖/命令产物/README 事实边界也已收稳；下一步进入“完整 App 与多人在线写作平台”的产品体验和 API 契约前置设计。P1-0 的核心设计决策已记录到 [完整 App 故事驾驶舱体验设计](../superpowers/specs/2026-05-12-complete-app-story-cockpit-ux-design.md)，但功能尚未实现。`storyspec app` 当前仍是实验性本机工作台，`storyspec server` 当前仍是多用户控制平面基础；账号、云端、实时协作、富文本编辑器、真实 PostgreSQL/Redis worker 和完整 SaaS 都只能作为待办推进，不能写成已实现能力。

| 优先级 | 路线 | 状态 | 覆盖范围 | 下一步 |
| --- | --- | --- | --- | --- |
| 总览 | [完整 App 与多人在线写作平台路线图](online-app-platform-roadmap.md) | Planned | 子路线索引、共通边界、推荐推进顺序、拆分映射 | 先读本文确认路线，再按任务范围读取对应子路线 |
| P1 | [完整 App 产品体验路线图](app-ux-roadmap.md) | Active | 产品体验设计、信息架构、首批页面、状态语言、编辑器与工作台体验 | Review P1-0 设计规格，再进入 API contract 与前端状态模型实施计划 |
| P1 | [多人平台与 API 契约路线图](multiuser-platform-roadmap.md) | Planned | 多用户角色模型、API contract、真实 PostgreSQL、真实 worker、完整前端架构 | 先做 API contract 前置设计，再进入数据库、worker 和前端实现 |
| P1/P2 | [协作写作与正典合并路线图](collaboration-canon-roadmap.md) | Planned | 候选、评论、审批、正典 patch、导入导出、插件/团队模板 | 平台对象模型和 API contract 清楚后再拆 OpenSpec |
| P2/P3 | [运维、安全与质量路线图](ops-quality-roadmap.md) | Planned | 安全、部署、观测性、备份恢复、场景测试、大文件拆分、依赖升级 | 随 P1 实现分批补质量门禁 |

## 当前推荐推进顺序

1. 继续处理 [app-ux-roadmap.md](app-ux-roadmap.md) 的 P1-0 完整 App 产品体验与界面重设计，先把用户路径、信息架构、页面地图和状态语言设计清楚。
2. 再做 [multiuser-platform-roadmap.md](multiuser-platform-roadmap.md) 的 P1-2 API contract 与前端状态模型前置设计，让前端、server 和测试先共享字段契约。
3. 最后为多人平台 P1 实现任务逐项建立 OpenSpec：产品边界/角色模型、真实数据库、真实 worker、完整 App 前端、协同写作正典合并协议。
4. P2/P3 任务只在 P0/P1 稳定或有真实用户反馈后推进。

## 暂不作为活跃待办

| 文件 | 原因 | 归档入口 |
| --- | --- | --- |
| [project-optimization-roadmap.md](project-optimization-roadmap.md) | 项目优化建议池 P0/P2 已完成并归档；本次新增建议已迁移到 [online-app-platform-roadmap.md](online-app-platform-roadmap.md) | [todo-archive.md](todo-archive.md#项目优化建议池-p0) / [todo-archive.md](todo-archive.md#项目优化建议池-p2) |
| [platform-foundation-roadmap.md](platform-foundation-roadmap.md) | 完整 App 路线 P0 地基任务已完成；后续转入 App UX 和 API contract | [todo-archive.md](todo-archive.md#平台地基与发布边界) |
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
