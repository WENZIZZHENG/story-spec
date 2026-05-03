---
change_type: minor
scope: domain,templates,validation
---

# 澄清问题库与选择器

## CLI 行为

无用户可见 CLI 变化。本次新增问题库和选择器应用层能力，不新增命令入口，也不改变现有命令参数。

## 模板契约

- 新增 `templates/clarification/core.yaml`。
- 新增 `portal-fantasy`、`magic-system`、`slow-burn-romance`、`civilization-threat`、`cozy-adventure`、`kingdom-building-support` 题材问题包。
- 每个问题必须包含 `whyItMatters` 和至少 2 个 `exampleAnswers`。
- 选择器根据 `keywords` 匹配用户输入，默认最多输出 10 个问题，`fewer` 模式最多 6 个问题，`examples-only` 只输出可复制示例。

## 生成产物

无命令生成产物变化。本次没有修改 prompt compiler、agent renderer 或 command manifest。

## 验证

- 已运行 `npx vitest run tests/unit/select-clarification-questions.test.ts`。
