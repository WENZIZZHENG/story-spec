---
change_type: minor
scope: cli,application,tests,openspec,todo
---

# task:finish 缺失正文阻断

## CLI 行为

- `storyspec task:finish <taskId> [story] --apply` 在任务关联的正文 / 草稿 Markdown 路径缺失时，不再把任务标记为 done。
- JSON 输出新增 `blocked`、`checks`、`blockedReasons` 和 `nextActions`，便于 agent 判断为何没有写入。
- 人类摘要新增门禁状态、阻断原因和下一步建议。

## 模板契约

- 不改变 `tasks.md` 语法；任务勾选框仍是任务状态源数据。
- 本次只检查任务中已经声明的相关正文 / 草稿路径，不要求模板新增字段。
- 没有可识别正文路径的任务不会被本次门禁阻断，避免误伤非正文任务。

## 生成产物

- 阻断时不会写入 `tasks.md`，也不会创建或刷新 `task-board.json`。
- `dist/` 仍由 `npm run build` 生成，不手工维护。

## 验证

- 新增单测覆盖关联正文缺失时 `task:finish --apply` 返回 blocked，且不修改任务文件。
- 新增 smoke 覆盖真实 CLI 的 `task:finish --apply --json` 阻断输出。
- OpenSpec change：`openspec/changes/block-failed-task-finish`。
