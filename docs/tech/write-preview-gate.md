# 写入前预览门禁

## 状态

Accepted。本文记录高影响写入命令的 `preview/confirm/apply` 规则，作为 Batch D3 的实现说明。

## 适用范围

首批覆盖以下命令：

- `/novel-constitution`
- `/novel-specify`
- `/novel-plan`
- `/novel-tasks`

这些命令会写入创作宪法、故事规格、创作计划或任务清单。它们会影响后续多个阶段，因此默认必须先给用户预览，而不是直接把 AI 推断落盘。

## 门禁流程

- `preview`：默认阶段，只输出预览，不写文件。
- `confirm`：用户明确回复“确认写入”“应用预览”或 `apply` 后，才允许进入写入阶段。
- `apply`：已有确认记录时，按预览内容写入，并说明实际修改路径和剩余风险。

preview 必须包含：

- 拟写入文件路径。
- 用户明确输入。
- AI 建议内容。
- 未决 `[需要澄清]`。
- 可能影响到的后续文件。

如果当前 agent 不支持交互，或用户输入不足以确认创作决策，降级为只输出 preview，不写文件。

## 澄清记录联动

如果 `stories/<story>/clarifications.json` 中存在以下内容，命令必须把它列入未决 `[需要澄清]`：

- required 问题尚未确认。
- `ai-suggested` 答案仍为 `confirmed: false`。

未确认的 AI 建议不能静默进入 `specification.md`、`creative-plan.md`、`tasks.md` 或 `.specify/memory/constitution.md`。

## 实现位置

门禁由 `src/prompt/compiler.ts` 在编译阶段注入。这样 Codex、Claude、Gemini、generic markdown 等命令产物共享同一套规则。

CLI 级 `novel preview <command> [story]` 尚未实现。当前 D3 只交付 agent prompt 层门禁，后续如需要离线预览或交互式 CLI，可在独立批次补齐。

## 验证口径

- `tests/unit/prompt-compiler.test.ts` 覆盖四个高影响命令均注入门禁。
- `/novel-clarify` 不注入该门禁，避免把澄清记录命令误判为高影响正典写入命令。
- 命令产物 manifest 随编译结果更新。
