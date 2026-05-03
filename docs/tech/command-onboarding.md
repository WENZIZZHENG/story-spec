# Command Onboarding

## 背景

部分 agent integration 会把命令模板渲染成纯 Markdown，例如 Codex 的 `.codex/prompts/novel-*.md`。这类输出会去掉 frontmatter，导致 `argument-hint` 对用户不可见。用户只输入 `/novel-constitution`、`/novel-specify` 等命令时，agent 容易直接执行模板步骤，而不是先解释需要补充什么信息。

## 设计

空参数引导在 `src/prompt/compiler.ts` 中统一注入，而不是在每个命令模板里重复维护。

触发条件：

- legacy Markdown template 声明 `argument-hint`。
- CommandSpec 声明 `arguments.hint`。

注入内容要求 agent 在以下情况先暂停写入：

- 用户输入为空。
- 用户输入只有空白。
- 用户输入仍是未替换的参数占位符，例如 `$ARGUMENTS` 或 `{{args}}`。

引导行为：

- 提醒用户补充对应参数。
- 给出 2-3 个可直接复制的示例输入。
- 提供“让我提问”的选项，用 3-5 个问题帮助用户补齐信息。
- 等用户补充有效输入后再执行命令正文。

## 边界

- 不改变 `novel` CLI 参数、项目结构或命令文件名。
- 不给缺少参数提示的命令注入引导，避免影响本来适合无参数运行的命令。
- 示例由 agent 根据命令用途现场生成，不在编译器中硬编码题材内容。

## 验证

- `tests/unit/prompt-compiler.test.ts` 覆盖 legacy template 与 CommandSpec 两条编译路径。
- `tests/unit/build-commands.test.ts` 与 command artifact manifest 覆盖多 agent 生成产物变化。
