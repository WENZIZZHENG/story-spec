## Why

项目已经连续完成本机 App、章节小样、继续创作回流和反向拆解增强。README、命令速查、工作流、快速入门和待办文档之间出现了少量口径漂移：有的文档仍把 `/write` 描述成 beat 后直接进入正文，有的快速入门文字容易让人误解 StorySpec 已有多人协作平台。

本变更只做文档事实源收口，让用户文档、待办入口和归档记录一致表达真实可用能力。

## What Changes

- 同步 `/write` 文档口径：章节前置约束卡、beat 预览、章节小样、完整正文块、写后自检。
- 收紧快速入门里“协作创作”和下一步文案，明确当前没有账号、云端或实时多人协作。
- 更新待办路线，把 P2-4 文档收口标记为已完成，并让 todo-index 不再保留本轮未完成 P2 项。
- 补齐上一个反向拆解增强 OpenSpec 的提交验证勾选。

## Capabilities

### Changed Capabilities

- `documentation-fact-boundaries`: 文档事实源收口，减少已实现能力、待办和归档之间的矛盾。

## Non-goals

- 不新增 CLI、App、API 或 agent prompt 行为。
- 不修改 `dist/`。
- 不把多用户账号、云端部署、团队协作或富文本编辑器写成已完成能力。
- 不清理历史归档中的旧阶段描述；归档文档可以保留当时上下文。

## Impact

影响范围限于 `docs/commands.md`、`docs/workflow.md`、`docs/quickstart.md`、`docs/index.md`、`docs/tech/*`、changeset 和 OpenSpec 文档。验证以 OpenSpec strict validate、文档关键词检查、changeset 检查和 diff check 为主。
