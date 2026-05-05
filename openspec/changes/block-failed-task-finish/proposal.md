## Why

`task:finish --apply` 目前会直接把任务标记为 done 并刷新 `task-board.json`。如果任务关联的正文路径还不存在，作者或 agent 仍可能把未完成章节误登记为完成，后续 handoff、status 和任务看板都会被污染。

## What Changes

- `task:finish` 在 apply 前检查当前任务关联的正文 / 草稿 Markdown 路径。
- 当关联正文缺失时，命令返回结构化阻断结果，不写 `tasks.md`，不刷新 `task-board.json`。
- 人类摘要和 JSON 输出都显示阻断原因、检查项和下一步建议。

## Impact

影响 `task:finish` 应用层、CLI 输出、单元测试、smoke 测试和待办路线状态。该变更只做本地文件存在性门禁；`style:lint`、`narrative:test`、`review` 等外部命令执行门禁留在后续切片。

## Capabilities

- `cli-task-finish`
