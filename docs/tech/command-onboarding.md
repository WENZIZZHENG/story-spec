# Command Onboarding

## 背景

部分 agent integration 会把命令模板渲染成纯 Markdown，例如 Codex 的 `.codex/prompts/novel-*.md`。这类输出会去掉 frontmatter，导致 `argument-hint` 对用户不可见。用户只输入 `/novel-constitution`、`/novel-specify` 等命令时，agent 容易直接执行模板步骤，而不是先解释需要补充什么信息。

另一个风险是用户已经给了非空输入，但输入仍然只是题材标签、风格词或边界声明，例如“异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁”。这类输入表达了方向，但还没有给出主角、舞台、关系对象、核心冲突、威胁形态等足以落盘的创作决策。如果 agent 直接扩写成规格，会降低作者的创造性参与感。

## 设计

输入澄清引导在 `src/prompt/compiler.ts` 中统一注入，而不是在每个命令模板里重复维护。

触发条件：

- legacy Markdown template 声明 `argument-hint`。
- CommandSpec 声明 `arguments.hint`。

注入内容要求 agent 在以下情况先暂停写入：

- 用户输入为空。
- 用户输入只有空白。
- 用户输入仍是未替换的参数占位符，例如 `$ARGUMENTS` 或 `{{args}}`。
- 用户输入只是题材标签、风格词、偏好组合或边界声明，不足以安全落盘。

引导行为：

- 提醒用户补充对应参数。
- 区分“用户已明确”“需要澄清”“AI 可以提出但不能替用户定稿的建议”。
- 给出 2-3 个可直接复制的示例输入。
- 提供“让我提问”的选项，用 3-8 个问题帮助用户补齐关键创作决策。
- 等用户补充有效输入后再执行命令正文。

`/novel-specify` 额外包含“创作控制权保护”规则：当输入只有方向词时，不运行初始化脚本，不创建或修改 `stories/*/specification.md`，先在对话中输出已明确内容、需要澄清的问题和可复制示例。

## 边界

- 不改变 `novel` CLI 参数、项目结构或命令文件名。
- 不给缺少参数提示的命令注入引导，避免影响本来适合无参数运行的命令。
- 示例由 agent 根据命令用途现场生成，不在编译器中硬编码题材内容。

## 验证

- `tests/unit/prompt-compiler.test.ts` 覆盖 legacy template 与 CommandSpec 两条编译路径。
- `tests/unit/prompt-compiler.test.ts` 覆盖 `/novel-specify` 的创作控制权保护段落。
- `tests/unit/build-commands.test.ts` 与 command artifact manifest 覆盖多 agent 生成产物变化。
