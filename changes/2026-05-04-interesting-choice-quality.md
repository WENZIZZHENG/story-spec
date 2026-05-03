---
change_type: minor
scope: cli,templates,docs,tests
---

# 有趣选择质量标准

## CLI 行为

- `storyspec interview` 生成的 `clarifications.md` 会在示例分叉中展示高影响候选的吸引力、代价、关系影响、世界影响、后续钩子和确认边界。
- 澄清 schema 新增 `choiceImpact` 与 `InterestingChoice`，高影响候选缺少关键影响字段时产生 warning。
- 内置 `magic.rule-hardness` 模板补充“轻量隐喻 / 中度规则 / 硬规则”的完整有趣选择信息。

## 模板契约

- 高影响候选仍保持候选状态，不会因为字段完整就自动进入正典。
- `InterestingChoice` 用于检查系统候选是否足够可用，不用于评价作者创意质量。

## 生成产物

- `clarifications.md` 的“示例分叉”会新增“吸引力 / 代价 / 关系影响 / 世界影响 / 后续钩子 / 确认边界”行。
- `clarifications.json` 中的问题可携带 `choiceImpact` 和 `exampleBranches[].interestingChoice`。

## 验证

- `npm run build`
- `npx vitest run tests/unit/manage-clarifications.test.ts tests/unit/select-clarification-questions.test.ts tests/unit/clarification.test.ts`
- `npm test`
- `npm run test:smoke`
- `npm run check:changes`
- `npm run check:command-manifest`
