---
change_type: minor
scope: cli,application,tests,openspec,todo
---

# 流程命令 JSON 契约

## CLI 行为

- `task:finish`、`docs:finish` 和 `todo:capture` 的 JSON 输出现在都包含统一顶层字段：`mode`、`wouldWrite`、`updatedFiles`、`checks`、`blocked`、`blockedReasons`、`nextActions` 和 `commit`。
- 旧字段继续保留，例如 `applied`、`writesFiles`、`changedFiles`、`draftRoadmap`、`indexPatchPreview`。
- 摘要输出不会在未请求 commit 时显示多余 commit 噪音。

## 模板契约

- 不修改写作模板或 agent command 模板。
- 共享契约只覆盖流程型命令，不要求普通只读查询命令迁移。
- 本批只新增兼容字段，不删除旧 JSON 字段。

## 生成产物

- 不新增模板生成产物。
- `dist/` 仍由 `npm run build` 生成，不手工维护。
- 新增应用层共享类型 `flow-command-result.ts`，用于描述流程命令共同字段。

## 验证

- `openspec validate standardize-flow-command-results --strict --json --no-interactive`
- `npx vitest run tests/unit/flow-command-results.test.ts tests/unit/finish-writing-task.test.ts tests/unit/finish-docs-change.test.ts tests/unit/capture-todo.test.ts`
- `npx vitest run tests/smoke/cli-commands.test.ts -t "creates a local commit from task finish when requested|creates a local commit from docs finish when requested|captures todo notes into a roadmap from the CLI"`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
