---
change_type: minor
scope: cli,application,smoke
---

# 交互式创作访谈 CLI

## CLI 行为

- 新增 `novel interview [story]`，用于在 CLI 中完成创作访谈并写入 `stories/<story>/clarifications.json` / `clarifications.md`。
- 新增 `novel clarify [story]`，作为非 agent 环境下的同能力入口。
- 非交互环境支持 `--premise`、`--answers`、`--use-examples`、`--max-questions`、`--json` 和 `--no-write`。
- 交互环境会显示旧答案、问题影响和可复制示例；选择题、多选题、确认题和评分题使用 Inquirer 风格控件。
- 再次运行会 replay 旧澄清记录，只更新本轮明确答案；已有记录时，非交互模式也可以复用旧 `premise`。

## 模板契约

- 本批次没有修改 slash command 模板。
- CLI 输出的 handoff prompt 要求 `/novel-specify` 先读取 `clarifications.json`，并只把 `confirmed: true` 且 `source: user-explicit/imported` 的答案视为用户已确认。
- `source: ai-suggested` 或 `confirmed: false` 的内容仍必须作为 `[需要澄清]`，不得静默写入正典。

## 生成产物

- 运行 `novel interview` 或 `novel clarify` 会生成或更新 `stories/<story>/clarifications.json` 和 `stories/<story>/clarifications.md`。
- `--json` 输出包含 `updatedAnswerIds`、`reusedAnswerIds`、结构化 `record` 和可复制 `handoffPrompt`。
- 本批次刷新了 command artifact manifest，纳入当前 `build:commands` 生成的 runtime 脚本清单。

## 验证

- 已运行 `npx vitest run tests/unit/interview-story.test.ts`。
- 已运行 `npx vitest run tests/smoke/interview-cli.test.ts tests/smoke/cli-commands.test.ts`。
- 已运行 `npm run build`。
- 已运行 `npm run build:commands`。
- 已运行 `npm run check:command-manifest`。
- 已运行 `npm run check:changes`。
- 已运行 `npm test`。
- 已运行 `npm run test:smoke`。
