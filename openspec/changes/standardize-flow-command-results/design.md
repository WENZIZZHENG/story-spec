## 设计

第一版只做“兼容补齐”，不做大规模抽象重写。新增一个共享类型文件描述流程命令共同字段，三个命令各自保留领域字段和既有实现。

## 共享字段

- `mode`: `preview`、`apply` 或 `commit`。
- `wouldWrite`: preview 或 apply 前可预期会写入的文件；无文件写入能力时为空数组。
- `updatedFiles`: 本次实际写入的文件；preview 或 blocked 时为空数组。
- `checks`: 门禁或验证检查列表；没有检查时为空数组。
- `blocked`: 是否被门禁阻断。
- `blockedReasons`: 阻断原因列表。
- `nextActions`: 下一步建议。
- `commit`: `requested`、`created`、`message`、`skippedReason`。

## 命令映射

| 命令 | mode | wouldWrite | updatedFiles | checks | commit |
| --- | --- | --- | --- | --- | --- |
| `task:finish` | `preview` / `apply` | `tasks.md`、`task-board.json` | apply 后真实写入文件 | 正文存在和验证命令 | 支持 `--commit` |
| `docs:finish` | `preview` / `commit` | 空数组 | 空数组 | diff / placeholder | 支持 `--commit` |
| `todo:capture` | `preview` / `apply` | roadmap、`todo-index.md` | apply 后真实写入文件 | 空数组 | 不支持 commit，固定 `requested: false` |

## 兼容策略

- 旧字段继续保留，例如 `applied`、`writesFiles`、`commitCommand`、`changedFiles`、`draftRoadmap`。
- 摘要渲染不显示“未请求 commit”的噪音，只在用户请求 commit 后显示 commit 结果。
- 不改变现有失败码和文件写入行为。

## 非目标

- 不重构所有 CLI 命令。
- 不删除旧 JSON 字段。
- 不引入 schema 生成器或外部依赖。
