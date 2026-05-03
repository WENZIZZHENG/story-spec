---
change_type: minor
scope: prompt,commands,domain,templates
---

# 创作访谈澄清记录

## CLI 行为

- `/novel-clarify` 现在明确要求低信息量输入先输出“用户已明确 / 需要澄清 / 可复制示例”。
- `/novel-clarify` 默认只记录问题和答案，不写完整规格，不修改 `stories/*/specification.md`。
- 当用户回答“你推荐”时，推荐必须标记为 `ai-suggested` 和 `confirmed: false`。

## 模板契约

- `/novel-clarify` 的澄清记录目标路径为 `stories/<story>/clarifications.md` 和 `stories/<story>/clarifications.json`。
- Markdown 记录面向用户审阅，JSON 记录面向后续 validate/status/plan 复用。
- 命令产物会携带 `templates/clarification/*.yaml` 问题包。

## 生成产物

- 已更新 `tests/fixtures/command-artifacts.manifest.json`。
- 已运行 `npm run build:commands` 生成最新本地命令产物。

## 验证

- 已运行 `npx vitest run tests/unit/manage-clarifications.test.ts tests/unit/prompt-compiler.test.ts tests/unit/build-commands.test.ts`。
- 已运行 `npm run build`。
- 已运行 `npm run build:commands`。
- 已运行 `npm run update:command-manifest`。
