## 设计

`finishWritingTask` 新增可选 `verificationRunner` 端口，端口只接收 `projectRoot` 和命令字符串，返回 `exitCode`、`stdout`、`stderr`。应用层根据已有 `verificationCommands` 顺序执行：

1. `storyspec validate`
2. `storyspec style:lint <story>`
3. `storyspec narrative:test <story>`
4. `storyspec review --panel continuity`

只有 `--apply` 时执行验证；预览模式继续只列出建议命令。

## 阻断规则

- 关联正文缺失优先阻断，不再运行外部验证，避免无意义命令。
- 任一验证失败即停止后续验证，返回 failed check。
- 失败时 `applied` 为 `false`，`updatedFiles` 为空，`commit.created` 为 `false`。
- 失败摘要保留命令、退出码和 stdout/stderr 的短文本，避免输出过长。

## CLI 执行

CLI 注入真实 runner，使用当前构建产物的 `node dist/cli.js` 执行 `storyspec ...` 命令，避免全局未安装 `storyspec` 时无法自检。runner 只用于非交互命令，不处理用户输入。

## 非目标

- 不新增 `--skip-verify`。
- 不自动修复 style / narrative / review findings。
- 不把验证失败转成进程非零退出；当前保持 JSON `blocked` 契约，后续可单独讨论退出码策略。
