---
change_type: minor
scope: domain,prompt,commands,templates,validation
---

# 示例分叉生成器

## CLI 行为

- `/novel-clarify` 和 `/novel-specify` 现在会在“可复制示例”区域展示结构化示例分叉。
- 示例分叉包含 `label`、`tone`、`assumptions`、`sampleAnswer`、`tradeoffs`，并明确标记为不自动进入正典。
- `selectClarificationQuestions` 支持从独立的示例分叉题材包中选取 2-3 个不同方向的分叉。

## 模板契约

- 新增 `templates/clarification/examples/*.yaml` 作为示例分叉种子库。
- `templates/commands/clarify.md` 与 `templates/commands/specify.md` 统一使用“可复制示例分叉”表述。
- 示例分叉必须包含“作者主导/继续提问”类型，避免一开始就替用户定稿。

## 生成产物

- 命令构建流程会复制新的示例分叉模板目录。
- 澄清记录的 Markdown 会把示例分叉与普通示例分开展示。

## 验证

- `npx vitest run tests/unit/example-branch.test.ts tests/unit/select-clarification-questions.test.ts tests/unit/manage-clarifications.test.ts tests/unit/prompt-compiler.test.ts`
- `npm run build`
- `npm run build:commands`
- `npm run update:command-manifest`
- `git diff --check`
