## 设计

`task:finish --commit` 复用现有 `GitAdapter`，不在应用层直接调用 shell。CLI 注入 `commandGitAdapter`；单元测试使用内存 fake adapter 记录调用。

## 安全边界

- `--commit` 只有配合 `--apply` 才会尝试提交。
- 如果 `task:finish` 被 blocked，不提交。
- 如果状态更新没有产生文件变更，不提交。
- 提交前读取 `git status --short`，只允许本次 `updatedFiles` 出现在 changed files 中；若存在 unrelated change，则跳过提交并说明原因。
- 默认 commit message 为 `完成写作任务：<taskId> <title>`，`--message` 可覆盖。

## 结果结构

新增 `commit` 字段：

- `requested`: 用户是否请求提交。
- `created`: 是否创建 commit。
- `message`: 实际或预期 commit message。
- `skippedReason`: 未提交原因。

## 非目标

- 不主动 push。
- 不处理交互式 rebase、签名、远程分支。
- 不自动 stash 或清理 unrelated change。
