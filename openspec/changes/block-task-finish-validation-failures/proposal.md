## Why

`task:finish --apply` 已能阻断缺失正文，但 `style:lint`、`narrative:test`、`review` 等收尾验证仍只是摘要里的建议命令。章节存在但验证失败时，任务仍可能被标记为 done，导致 task board 和后续 handoff 误判章节已经完成。

## What Changes

- `task:finish --apply` 在写入 `tasks.md` 和 `task-board.json` 前执行收尾验证计划。
- 任一验证命令失败时，命令返回 `blocked: true`，保留失败命令、退出码和摘要，不写任务状态、不刷新 task board、不创建 commit。
- 验证执行层通过应用层端口注入，单元测试使用 fake runner，CLI 使用真实命令 runner。

## Impact

影响 `finish-writing-task` 应用服务、CLI 注入、命令执行基础设施、单元测试、smoke 测试和活跃待办状态。该变更不改变 `tasks.md` 语法，不自动修复正文、风格或叙事问题。

## Capabilities

- `cli-task-finish`
