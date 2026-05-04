---
change_type: minor
scope: cli,application,validation,docs,tests
---

# 任务状态幂等同步

## CLI 行为

- 新增 `storyspec tasks:set-status <taskId> [story] --status done|todo`，用于幂等更新单个任务状态并刷新 `task-board.json`。
- `--json` 输出包含 `statusBefore`、`statusAfter`、`changed` 和 `updatedFiles`，便于 agent 或脚本判断是否真的产生改动。
- `task:finish --apply` 复用同一套任务状态更新逻辑，重复完成已完成任务不会重写 `tasks.md` 或看板。

## 模板契约

- 不改变 `tasks.md` 语法；任务勾选框仍是状态的源数据。
- 不新增外部项目管理系统或远程同步契约。

## 生成产物

- `tasks:board` 和任务状态更新在看板内容未变时不会仅因 `generatedAt` 重写 `task-board.json`。
- `validate` 会在已有 `task-board.json` 与 `tasks.md` 状态不一致时提示运行 `storyspec tasks:board <story>`。

## 验证

- 新增单测覆盖状态更新 helper 的 done/todo 双向切换和重复运行无 diff。
- 新增单测覆盖 `task-board.json` 仅 `generatedAt` 不同时不重写。
- 新增 `validate` 单测覆盖 stale task board 修复提示。
- 更新 CLI smoke 覆盖 `tasks:set-status` JSON 输出和重复运行幂等性。
