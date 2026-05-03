---
change_type: minor
scope: cli,domain,templates,docs,tests
---

# 问题级示例分叉

## CLI 行为

- `storyspec interview` 生成的澄清 Markdown 会显示问题级“示例分叉”，包含示例回答、风味、取舍、后续影响和适合场景。
- 分叉仍标记为 `confirmed: false`，不会默认写入正典。

## 模板契约

- `ClarificationQuestion` 支持可选 `exampleBranches` 字段。
- `exampleBranches` 字段包含 `label`、`answer`、`flavor`、`tradeoffs`、`downstreamImpact`、`recommendedFor`。
- 旧 `exampleAnswers` 继续可用，保持向后兼容。

## 生成产物

- 内置 `core.yaml` 补充主角、伙伴、第一舞台、势力冲突等高影响问题分叉。
- 内置 `magic-system.yaml` 补充轻量隐喻、中度规则、硬规则三条分叉。
- 内置 `civilization-threat.yaml` 补充小异常和揭示节奏分叉。
- `clarifications.json` 会保留问题级 `exampleBranches`，方便 agent 后续继续共创。

## 验证

- 已运行 `npx vitest run tests/unit/clarification.test.ts tests/unit/select-clarification-questions.test.ts tests/unit/interview-story.test.ts tests/unit/manage-clarifications.test.ts`。
