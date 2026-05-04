---
change_type: minor
scope: cli,application,tests
---

# 新增 clarification doctor 清理孤儿答案

## CLI 行为

- 新增 `storyspec clarification:doctor`，默认只预览澄清记录中的孤儿答案、重复问题和未确认候选。
- 新增 `storyspec clarification:doctor --fix`，把引用不存在问题的答案移入 `archivedAnswers`，并重写 `clarifications.md`。
- `--json` 输出结构化结果，包含 `summary`、`orphanAnswers`、`duplicateQuestions`、`unconfirmedSuggestions` 和 `fixed`。

## 数据契约

- `clarifications.json` 可包含 `archivedAnswers`。
- 归档答案保留原 `questionId`、`answer`、`source`、`confidence`、`confirmed`、`createdAt`、`updatedAt`，并补充 `archivedAt` 与 `reason`。
- 默认修复策略不删除用户内容、不确认 AI 候选、不写入 specification、canon 或正文。

## 模板契约

- 本次不修改初始化模板；旧项目可在现有 `stories/*/clarifications.json` 上直接运行 doctor。
- `clarifications.md` 渲染新增“已归档澄清答案”区，用于展示 `archivedAnswers`。

## 生成产物

- 新增 CLI 命令后需要重新构建命令产物并同步 `tests/fixtures/command-artifacts.manifest.json`。
- doctor 修复只写回当前故事的 `clarifications.json` 和 `clarifications.md`。

## 验证

- 新增单测覆盖 doctor 预览与 `--fix` 归档。
- 新增 smoke 覆盖 CLI JSON 预览、修复和 Markdown 归档区渲染。
