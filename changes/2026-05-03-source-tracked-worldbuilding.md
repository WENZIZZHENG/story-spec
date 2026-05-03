---
change_type: minor
scope: domain,validation,templates,commands,generated-artifacts
---

# 来源追踪与 Canon 防污染

## CLI 行为

- `novel world:check` 现在会提示 confirmed WorldFact 是否仍来自未确认 AI 建议。
- `novel canon:check` 现在会提示 confirmed CanonFact 是否仍来自未确认 AI 建议。
- CLI 参数保持不变。

## 模板契约

- WorldFact / CanonFact 新增 `source.confirmedByUser`、`source.aiSuggested`、`source.needsClarification`。
- `/novel-specify` 的规格生成提示增加“来源标记与正典防污染”规则。
- AI 建议可以保存在 draft/pending 中，但不能在用户确认前静默写成 confirmed canon。

## 生成产物

- 已更新 `tests/fixtures/command-artifacts.manifest.json`。
- 已运行 `npm run build:commands` 生成最新本地命令产物。

## 验证

- 已运行 `npx vitest run tests/unit/worldbuilding.test.ts tests/unit/inspect-worldbuilding.test.ts tests/unit/prompt-compiler.test.ts tests/unit/init-project.test.ts tests/unit/manage-context-packs.test.ts tests/unit/validate-project.test.ts`。
- 已运行 `npm run build`。
- 已运行 `npm run build:commands`。
- 已运行 `npm run update:command-manifest`。
