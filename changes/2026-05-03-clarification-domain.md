---
change_type: minor
scope: domain,validation,templates
---

# 创作澄清领域模型

## CLI 行为

无用户可见 CLI 变化。本次只新增领域模型、schema 校验、模板样例和单测，不新增命令入口，也不改变已有命令参数。

## 模板契约

- 新增 `templates/clarification/question-set.example.yaml` 作为澄清问题集样例。
- 澄清问题支持 `text`、`textarea`、`single-choice`、`multi-choice`、`scale`、`confirm`。
- 澄清答案来源支持 `user-explicit`、`ai-suggested`、`imported`、`default`。
- 未确认的 `ai-suggested` 答案不能作为进入正典的创作决策来源。

## 生成产物

无命令生成产物变化。本次没有修改 prompt compiler、agent renderer 或 command manifest。

## 验证

- 已运行 `npx vitest run tests/unit/clarification.test.ts`。
