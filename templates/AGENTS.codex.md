# Agent 指令

## 项目
- 小说项目：`{{PROJECT_NAME}}`。
- 从项目根目录工作；规划或写作前运行 `storyspec status`。
- 除非项目文件另有说明，面向作者的说明、计划和交接内容使用中文。

## 工作流
| 阶段 | Codex prompt |
|-------|--------------|
| 宪章 | `/storyspec-constitution` |
| 规格 | `/storyspec-specify` |
| 澄清 | `/storyspec-clarify` |
| 计划 | `/storyspec-plan` |
| 任务 | `/storyspec-tasks` |
| 写作 | `/storyspec-write` |
| 分析 | `/storyspec-analyze` |

## 必读上下文
- 先读取 `.specify/memory/constitution.md`。
- 再读取 `stories/*/specification.md`、`stories/*/creative-plan.md` 和 `stories/*/tasks.md`。
- 用 `spec/knowledge/` 保存世界、角色、地点和声音事实。
- 用 `spec/tracking/*.json` 维护连续性；保持 JSON 有效。

## 边界
- 如果用户要求规划，只更新规划文件；不要撰写章节正文。
- 除非活跃写作任务另有说明，敏感或成人向故事元素只保留为情节功能、动机、关系变化、后果和边界说明。
- 边界不清楚时，新增澄清任务，不要直接扩写场景。

## 画像
{{AGENTS_PROFILE_SECTION}}

## 文件
- 规划：`stories/*/specification.md`、`stories/*/creative-plan.md`、`stories/*/tasks.md`。
- 草稿：`stories/*/content/`。
- 追踪：`spec/tracking/`。
- 知识：`spec/knowledge/`。
