---
change_type: minor
scope: docs
---

# 文档瘦身与入口收敛

## CLI 行为

- 无 CLI 行为变化。
- README 的文档入口删除已废弃或已合并的文档链接。

## 模板契约

- 无模板契约变化。
- 写作方法、最佳实践和 Gemini 专项说明已合并到当前 `workflow.md`、`commands.md`、`agent-commands.md`。

## 生成产物

- 删除过时的主目录文档、早期 PRD、旧 API 说明、外部 AI 建议整合材料和长篇案例文档。
- 精简 `docs/commands.md`、`docs/workflow.md`、`docs/agent-commands.md`、`docs/upgrade-guide.md`、`docs/local-development.md` 和 `docs/README.md`。
- 保留当前用户入口：安装、快速开始、创作流程、创作控制权、命令语义、agent 集成、升级、迁移、本地开发和技术文档。

## 验证

- 后续收尾需运行 `npm run check:changes`、`git diff --check`，并检查被删除文档的引用残留。
