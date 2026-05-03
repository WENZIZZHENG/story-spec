---
change_type: none
scope: repository,docs
---

# 维护期 SDD 与中文 Agent 入口

## CLI 行为

- 无 CLI 行为变化。
- 本次只调整仓库维护规则和 agent 协作说明，不影响 `storyspec` 命令。

## 模板契约

- 无模板契约变化。
- `templates/`、`scripts/`、`memory/` 和 `spec/presets/` 的源目录边界仅在文档中重新确认。

## 生成产物

- 无生成产物变化。
- `SDD.md` 从重构期规则改为稳定维护期契约。
- `AGENTS.md` 改为中文说明，并补充源目录、生成目录、changeset 和创作控制权约定。

## 验证

- 后续收尾需运行 `git diff --check` 和 `npm run check:changes`。
