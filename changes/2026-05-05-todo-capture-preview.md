---
change_type: minor
scope: cli,application,tests,openspec,todo
---

# todo:capture 待办草案

## CLI 行为

- 新增 `storyspec todo:capture --topic <name> (--from <path>|--notes <text>)`。
- 默认 preview 只输出 roadmap 草案、目标路径和 `todo-index.md` 表格行预览，不写文件。
- `--apply` 会新建 `docs/tech/<topic>-roadmap.md` 并更新 `docs/tech/todo-index.md`。
- 缺少 notes、同时传入 `--from` 和 `--notes`、目标 roadmap 已存在或缺少 `todo-index.md` 时返回 blocked，不写文件。

## 模板契约

- 第一版不调用 LLM，不自动判断复杂方案可行性。
- 生成的 roadmap 草案包含状态、背景和目标、非目标、P1 捕获任务、风险与边界和完成同步。
- 草案中的不确定项写成“待人工确认”，不使用 `TBD` / `TODO` / `待定`，避免文档收尾 placeholder 门禁误伤。

## 生成产物

- `todo:capture --apply` 生成新的 `docs/tech/<slug>-roadmap.md`。
- `todo:capture --apply` 追加 `docs/tech/todo-index.md` 的当前待办表格行。
- 不修改命令模板或 agent command 生成产物。

## 验证

- `openspec validate add-todo-capture-preview --strict --json --no-interactive`
- `npx vitest run tests/unit/capture-todo.test.ts`
- `npx vitest run tests/smoke/cli-commands.test.ts -t "captures todo notes into a roadmap from the CLI"`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
