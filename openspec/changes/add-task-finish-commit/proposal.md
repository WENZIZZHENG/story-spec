## Why

`task:finish` 可以同步任务状态，但章节收尾后的本地 commit 仍需要人工完成。活跃待办要求 `task:finish --commit` 只在门禁通过且状态更新成功后创建本地 commit，并且不能提交 unrelated change。

## What Changes

- `task:finish` 新增 `--commit` 和 `--message <commit_message>`。
- apply 成功且 Git 工作区只包含本次更新文件时，命令通过 Git adapter add / commit 创建本地 commit。
- 阻断、未 apply、没有实际更新文件、Git 不可用或存在 unrelated change 时不提交，并在 JSON / 摘要中说明原因。

## Impact

影响 `task:finish` 应用服务、CLI 选项、Git adapter 调用、单元测试、smoke 测试和待办状态。该变更不主动 push，不自动提交用户无关改动。

## Capabilities

- `cli-task-finish`
