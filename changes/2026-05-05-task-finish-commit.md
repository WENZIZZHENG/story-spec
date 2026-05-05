---
change_type: minor
scope: cli,application,tests,openspec,todo
---

# task:finish 本地提交

## CLI 行为

- `storyspec task:finish <taskId> [story] --apply --commit` 会在任务状态写入成功、未被阻断且 Git 工作区只包含本次更新文件时创建本地 commit。
- 新增 `--message <commit_message>` 覆盖默认 commit message；默认 message 为 `完成写作任务：<taskId> <title>`。
- JSON 和人类摘要新增 `commit` 结果，说明是否请求提交、是否已创建、使用的 message，以及跳过原因。
- 存在 unrelated change、未使用 `--apply`、无本次更新文件、Git 不可用或收尾被阻断时不会创建 commit。

## 模板契约

- 不修改 `tasks.md` 语法；任务标题继续作为默认 commit message 的来源之一。
- 不要求新增 Git 配置模板；命令只复用运行环境已有的 Git 仓库与用户配置。
- `--commit` 不改变 preview/apply 语义，仍必须显式 `--apply` 后才可能写入和提交。

## 生成产物

- `task:finish --commit` 只提交本次更新的 `tasks.md` 和 `task-board.json` 等收尾产物。
- 不主动 push，不 stash，不清理或提交 unrelated change。
- `dist/` 仍由 `npm run build` 生成，不手工维护。

## 验证

- 新增单测覆盖默认 commit message、Git adapter 调用和 unrelated change 跳过提交。
- 新增 smoke 覆盖真实 CLI 在临时 Git 仓库中创建本地 commit。
- OpenSpec change：`openspec/changes/add-task-finish-commit`。
