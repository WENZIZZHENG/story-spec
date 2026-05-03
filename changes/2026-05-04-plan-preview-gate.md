---
change_type: minor
scope: cli,application,tests
---

# 创作计划预览门禁

## CLI 行为

- 新增 `storyspec preview plan <story>`，用于生成 `creative-plan.md` 写入前预览。
- `storyspec apply <previewId> --yes` 默认会阻止存在核心要素缺口的 plan preview 写入。
- `storyspec apply <previewId> --yes --draft` 允许写入保留 `[需要澄清]` 与来源标记的计划草案。

## 模板契约

- 本批次不修改 slash command 模板。
- plan preview 必须保留用户已确认核心要素、核心缺口、AI 候选分叉、拟写入范围和写作边界。
- 未确认候选角色、势力或章节安排不得伪装成已确认正典。

## 生成产物

- preview JSON 的 `kind` 支持 `plan`。
- `preview plan` 目标文件为 `stories/<story>/creative-plan.md`。
- plan 草案内容会保留 `[需要澄清]` 与 `来源：clarifications.json`。

## 验证

- 已运行 `npx vitest run tests/unit/preview-apply.test.ts`。
