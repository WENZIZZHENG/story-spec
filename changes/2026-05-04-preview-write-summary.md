---
change_type: minor
scope: cli,application,docs,tests
---

# 增强 preview 写入摘要

## CLI 行为

- `preview specify/plan` 生成的 JSON 记录新增 `writeSummary`，区分作者确认项、Agent 建议和待确认项。
- `.preview.md` 报告新增“写入摘要”区，帮助作者在 `apply` 前快速判断将写入什么、来源是什么、还有哪些缺口。

## 模板契约

- 写入摘要只复用现有澄清记录和核心要素评估。
- 未确认候选不会因为出现在摘要中被提升为正典。

## 生成产物

- preview JSON 增加稳定的 `writeSummary` 数据。
- preview Markdown 增加面向作者的写入摘要区。

## 验证

- `npm test -- tests/unit/write-preview-summary.test.ts`
- `npm run build`
- `npx vitest run tests/smoke/preview-summary-cli.test.ts`
