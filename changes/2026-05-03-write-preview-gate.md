---
change_type: minor
scope: prompt,commands,generated-artifacts
---

# 写入前预览门禁

## CLI 行为

- `novel init`、`novel upgrade --agent <id>` 和命令生成流程的 CLI 参数保持不变。
- CLI 级 `novel preview <command> [story]` 尚未实现，本批次只交付 agent prompt 层门禁。

## 模板契约

- `/novel-constitution`、`/novel-specify`、`/novel-plan`、`/novel-tasks` 现在会在 prompt 编译阶段注入 `preview/confirm/apply` 写入门禁。
- preview 默认不写文件，必须列出拟写入文件路径、用户明确输入、AI 建议内容、未决 `[需要澄清]` 和可能影响到的后续文件。
- 用户明确确认前，未确认的 `ai-suggested` 答案不能进入创作宪法、故事规格、创作计划或任务清单。
- 不支持交互的 agent 默认只输出 preview，不写文件。

## 生成产物

- 已更新 `tests/fixtures/command-artifacts.manifest.json`。
- 已运行 `npm run build:commands` 生成最新本地命令产物。

## 验证

- 已运行 `npx vitest run tests/unit/prompt-compiler.test.ts`。
- 已运行 `npm run build`。
- 已运行 `npm run build:commands`。
- 已运行 `npm run update:command-manifest`。
