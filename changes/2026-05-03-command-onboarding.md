---
change_type: minor
scope: prompt,commands,agent-integrations
---

# 命令空参数引导

## CLI 行为

- `novel init`、`novel upgrade --agent <id>` 和命令生成流程的 CLI 参数保持不变。
- 新建或升级项目后，带 `argument-hint` / `arguments.hint` 的 agent 命令会在用户未提供参数时先提示补充信息，而不是直接进入写文件流程。

## 模板契约

- prompt compiler 现在会根据命令的参数提示注入统一的“空参数引导”段落。
- 引导要求 agent 在参数为空、只有空白或仍为未替换占位符时，先给用户 2-3 个可复制示例，并提供“让我提问”的选项。
- 未声明参数提示的命令不注入该段落，避免影响可无参数运行的检查类命令。

## 生成产物

- 多 agent 命令产物内容发生变化，已更新 `tests/fixtures/command-artifacts.manifest.json`。
- `dist/` 为本地构建输出，不纳入 Git；发布或本地初始化前需要继续运行 `npm run build && npm run build:commands` 生成最新产物。

## 验证

- 已运行 `npm run test -- --run tests/unit/prompt-compiler.test.ts tests/unit/platform-renderers.test.ts tests/unit/build-commands.test.ts`。
- 已运行 `npm run build`。
- 已运行 `npm run build:commands`。
- 已运行 `npm run update:command-manifest`。
