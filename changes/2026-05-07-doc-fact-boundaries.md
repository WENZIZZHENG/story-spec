---
change_type: patch
scope: docs
---

# 文档事实源收口

## CLI 行为

无变化。未新增或修改 CLI、App、API 或 agent 执行行为。

## 模板契约

无变化。未修改 agent prompt 或用户项目初始化模板。

## 生成产物

无变化。未修改命令模板或构建产物，不需要重新生成 agent command manifest。

## 文档

同步 `docs/commands.md`、`docs/workflow.md`、`docs/index.md` 和 `docs/quickstart.md` 的章节写作链路，统一为“章节前置约束卡 -> beat 预览 -> 章节小样 -> 完整正文块 -> 写后自检”。同时收紧快速入门中的协作说明，明确当前没有账号、云端项目隔离或实时多人编辑。

## 验证

- `npx openspec validate align-doc-fact-boundaries --strict --json --no-interactive`
- 文档关键词检查
- `npm run check:changes`
- `git diff --check`
