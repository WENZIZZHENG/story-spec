---
change_type: patch
scope: docs,onboarding,creative-report
---

# 同步首程、创作报告和写作反馈文档

## CLI 行为

- 统一新项目示例为 `storyspec init --workspace <path> --agent <id>`，突出工作区路径和首程素材分流。
- 补充 `creative:report` 的卷计划摘要、三幕结构、章节节奏、人物弧线、张力曲线和人物关系视图说明。
- 补充 `/write` 三阶段反馈契约：`plan` beat 预览、`write` 正文分块、`finish` 收尾验证。
- 补充 `status --json` / `codex-status --json` 的 `navigationEntries` 结构化导航字段说明。

## 模板契约

- 不修改 CLI 行为、命令模板或生成产物。
- 不新增未实现能力说明，只同步最近已落地功能的用户入口文档。

## 生成产物

- 未修改 `templates/commands/**` 或 `dist/**`。
- 不需要重新生成 agent 命令 manifest。

## 验证

- 需要运行 `npm run check:changes`。
