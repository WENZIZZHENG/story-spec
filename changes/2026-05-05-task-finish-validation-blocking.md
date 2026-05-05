---
change_type: minor
scope: cli,application,infrastructure,tests,openspec,todo
---

# task:finish 验证失败阻断

## CLI 行为

- `storyspec task:finish <taskId> [story] --apply` 现在会在写入任务状态前执行收尾验证计划。
- 任一验证命令失败时返回 `blocked: true`，并在 `checks`、`blockedReasons` 和 `nextActions` 中说明失败命令和修复建议。
- 验证失败时不会修改 `tasks.md`，不会写入或刷新 `task-board.json`，也不会创建 `--commit` 请求的本地 commit。

## 模板契约

- 不修改 `tasks.md` 语法，不新增任务字段。
- 验证计划沿用现有收尾摘要中的 `storyspec validate`、`storyspec style:lint <story>`、`storyspec narrative:test <story>` 和 `storyspec review --panel continuity`。
- 预览模式继续只展示建议验证命令，不执行外部命令。

## 生成产物

- 失败时没有新增生成产物；成功时仍只刷新任务收尾本身产生的 `tasks.md` 和 `task-board.json`。
- CLI 真实验证 runner 复用当前构建产物 `dist/cli.js` 执行 StorySpec 自身命令。
- `dist/` 仍由 `npm run build` 生成，不手工维护。

## 验证

- 新增单测覆盖外部验证失败时不写任务文件、不刷新 task board、不提交。
- 新增 smoke 覆盖真实 CLI 在自定义 style error 规则下阻断 `task:finish --apply`。
- OpenSpec change：`openspec/changes/block-task-finish-validation-failures`。
