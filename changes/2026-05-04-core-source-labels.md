---
change_type: minor
scope: cli,application,docs,tests
---

# 核心信息来源标记

## CLI 行为

- `storyspec core` 的文本与 JSON 现在会显示 `sourceLabel`，区分作者确认、部分确认、AI 候选、待澄清和稍后决定。
- `creative:report` 的用户确认项、待澄清项、AI 建议和核心要素面板统一显示中文来源标记。
- preview 写入摘要的 JSON 与 `.preview.md` 会标明作者确认项、Agent 建议和待确认项的来源状态。

## 模板契约

- 来源标记只增强展示与 JSON 输出，不改变确认状态语义。
- `suggested`、`deferred`、`missing` 不会被标记为作者确认。

## 生成产物

- 核心面板、创作报告和 preview 摘要获得统一的来源状态标签。
- JSON 输出保留 `sourceLabel` 供工作台或自动化复用。

## 验证

- `npm test -- tests/unit/story-core-summary.test.ts tests/unit/creative-report.test.ts tests/unit/write-preview-summary.test.ts`
- `npm run build`
- `npx vitest run tests/smoke/core-cli.test.ts tests/smoke/preview-summary-cli.test.ts`
