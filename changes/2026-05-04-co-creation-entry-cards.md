---
change_type: minor
scope: cli,domain,docs,tests
---

# 六大核心入口卡模板

## CLI 行为

- `storyspec next [story]` 会按核心要素成熟度和灵感文本推荐具体入口卡，例如能力、舞台、势力或伙伴入口。
- `storyspec interview [story] --entry <entry>` 新增为 `--focus <entry>` 的等价别名，可从指定入口卡开始一轮共创。

## 模板契约

- 共创入口点升级为统一入口卡字段：`title`、`openingQuestions`、`interestingChoices`、`candidateArtifacts`、`canonBoundary`、`nextRecommendations` 和 `maturityImpact`。
- 主角、伙伴、舞台、能力、势力、冲突六个核心入口都有完整入口卡测试覆盖。

## 生成产物

- `storyspec next` 渲染入口时会显示推荐原因、开场问题、有趣选择、候选产物、正典边界和下一步推荐。
- 入口输出仍保持候选状态，不会绕过 preview/confirm/apply 或作者明确确认。

## 验证

- 新增入口卡领域测试，避免核心入口缺少关键字段。
- 更新 onboarding 和 CLI smoke 覆盖入口推荐排序与 `--entry` 别名。
