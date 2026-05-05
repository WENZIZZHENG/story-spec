# 待办统一入口

## 状态

Active。本文是 StorySpec 当前唯一的活跃待办入口。详细规则见 [todo-governance.md](todo-governance.md)，已完成事项见 [todo-archive.md](todo-archive.md)。当前有 2 条活跃路线；新增长期增强时先在本文登记。

## 当前待办

| 路线 | 状态 | 优先级 | 下一步 |
| --- | --- | --- | --- |
| [作者首程引导与正反馈路线图](author-first-run-feedback-roadmap.md) | Planned | P0 | 先实现工作区优先初始化、首次使用全流程图、日志式流程反馈、原始灵感/长文资料输入向导、少命令化新手导航和章节生成阶段性正反馈。 |
| [StorySpec 自用创作流程问题待办](storyspec-dogfood-friction-roadmap.md) | Planned | P0 | 先修复 `task:finish` / `tasks:set-status` 源码与 `dist` 产物漂移，再统一章节路径解析、写作阶段验证范围和 tracking evidence schema。 |

## 暂不作为活跃待办

| 文件 | 原因 | 归档入口 |
| --- | --- | --- |
| [archive/completed-roadmaps/chapter-production-workflow-roadmap.md](archive/completed-roadmaps/chapter-production-workflow-roadmap.md) | 章节生产流程优化 P0-P2 已完成并归档 | [todo-archive.md](todo-archive.md#章节生产流程优化) |
| [archive/completed-roadmaps/new-user-story-creation-dogfood-roadmap.md](archive/completed-roadmaps/new-user-story-creation-dogfood-roadmap.md) | 新用户小说创建端到端体验 P0-P2 已完成并归档 | [todo-archive.md](todo-archive.md#新用户小说创建端到端体验) |
| [archive/completed-roadmaps/co-creation-input-and-core-roadmap.md](archive/completed-roadmaps/co-creation-input-and-core-roadmap.md) | 共创输入与核心信息面板 P0-P3 已完成并归档 | [todo-archive.md](todo-archive.md#共创输入与核心信息面板) |
| [archive/completed-roadmaps/story-co-creation-interview-roadmap.md](archive/completed-roadmaps/story-co-creation-interview-roadmap.md) | 故事共创访谈体验增强 F0-F21 已完成；后续新体验优化应新建专题 roadmap | [todo-archive.md](todo-archive.md#故事共创访谈体验增强) |
| [archive/full-refactor/full-refactor-todo.md](archive/full-refactor/full-refactor-todo.md) | A/B/C 主路线已完成，当前仅保留历史索引 | [todo-archive.md](todo-archive.md#full-refactor-主路线) |
| [archive/completed-roadmaps/creative-control-roadmap.md](archive/completed-roadmaps/creative-control-roadmap.md) | 创作控制权 D0-D10 已完成，当前无后续活跃批次 | [todo-archive.md](todo-archive.md#创作控制权体验优化) |
| [archive/completed-roadmaps/story-onboarding-navigation-roadmap.md](archive/completed-roadmaps/story-onboarding-navigation-roadmap.md) | 新故事引导与创作导航 E0-E5 已完成，当前无后续活跃批次 | [todo-archive.md](todo-archive.md#新故事引导与创作导航) |
| [archive/completed-roadmaps/worldbuilding-quality-roadmap.md](archive/completed-roadmaps/worldbuilding-quality-roadmap.md) | 第一版 Worldbuilding 能力已完成并被 full-refactor B0-B3 覆盖 | [todo-archive.md](todo-archive.md#worldbuilding-quality-roadmap) |
| [archive/completed-roadmaps/command-onboarding.md](archive/completed-roadmaps/command-onboarding.md) | 输入澄清引导已实现，后续创作控制权增强已完成归档 | [todo-archive.md](todo-archive.md#命令输入澄清引导) |
| `changes/*.md` | changeset 只记录已发生变化，不作为待办入口 | [todo-archive.md](todo-archive.md#changeset-记录) |

## 使用方式

1. 开始新开发前，先读本文确认当前活跃路线。
2. 只在本文中登记未完成的 Planned / Active 路线。
3. 完成路线后，把详细证据写入 [todo-archive.md](todo-archive.md)，再从本文移除或转为历史链接。
4. 新增长期路线时，先按 [todo-governance.md](todo-governance.md) 建立专题 roadmap。
