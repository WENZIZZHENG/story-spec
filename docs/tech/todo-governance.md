# 待办治理规则

## 状态

Active。本文定义 Novel Writer 后续开发待办、路线图、完成归档和变更记录的统一规则。

## 目标

- 让“当前还要做什么”只有一个入口：[todo-index.md](todo-index.md)。
- 让“过去做完了什么”只有一个归档入口：[todo-archive.md](todo-archive.md)。
- 已完成路线文件统一移动到 `docs/tech/archive/`，由 [todo-archive.md](todo-archive.md) 作为归档索引。
- changeset 文件保留在 `changes/`，只记录已经发生的变化。
- 防止 `full-refactor-todo.md`、`*-roadmap.md`、`changes/*.md` 同时承担待办职责，造成状态混乱。

## 文档职责

| 文件类型 | 职责 | 是否承载活跃待办 |
| --- | --- | --- |
| `docs/tech/todo-index.md` | 当前唯一活跃待办入口，只列 Planned / Active 路线和下一步顺序 | 是 |
| `docs/tech/*-roadmap.md` | 某一专题的详细路线、批次、风险和验收 | 仅当被 `todo-index.md` 引用 |
| `docs/tech/todo-archive.md` | 已完成路线、历史待办、changeset 的统一归档索引 | 否 |
| `docs/tech/archive/full-refactor/*.md` | full-refactor 历史索引、路线文件和完成证据 | 否 |
| `docs/tech/archive/completed-roadmaps/*.md` | 已完成专题路线和配套专题记录 | 否 |
| `docs/tech/archive/decisions/*.md` | 已采纳架构决策或专题设计记录 | 否 |
| `changes/YYYY-MM-DD-topic.md` | 用户可见行为、模板契约、生成产物或验证变化的 changeset | 否 |

## 状态词

- `Planned`：已规划，尚未开始实现。
- `Active`：当前推荐推进，允许被拆成开发批次。
- `Completed`：路线或批次已经完成，并有验证口径。
- `Archive`：归档索引或完成证据集合。
- `Archived`：历史资料，仅供追溯，不再作为执行入口。
- `Accepted`：架构决策已采纳；不是待办状态。

## 新增待办规则

新增任何长期或多批次待办时：

1. 先判断是否能并入现有路线；能并入则更新现有 `*-roadmap.md`。
2. 不能并入时，新建 `docs/tech/<topic>-roadmap.md`，文件名使用英文 kebab-case。
3. 在新路线顶部写清 `## 状态`，默认使用 `Planned`。
4. 在 [todo-index.md](todo-index.md) 的“当前待办”表中登记一次。
5. 不再把新的活跃待办写入 `full-refactor-todo.md`。

路线文件必须包含：

- 背景和目标。
- 非目标。
- Batch 或阶段划分。
- 每个 Batch 的验收口径。
- 风险与缓解。
- 完成后需要更新的文档、测试或生成产物。

## 完成与归档规则

完成 Batch 或路线时：

1. 在对应 `*-roadmap.md` 更新状态和勾选项。
2. 在 [todo-archive.md](todo-archive.md) 添加或更新归档条目。
3. 从 [todo-index.md](todo-index.md) 的“当前待办”移除已完成路线，或标记为“已完成，详见归档”。
4. 如果涉及 CLI 行为、模板契约、生成产物或项目结构变化，新增或更新 `changes/YYYY-MM-DD-topic.md`。
5. 将完成路线移动到 `docs/tech/archive/completed-roadmaps/`，full-refactor 历史移动到 `docs/tech/archive/full-refactor/`，已采纳决策移动到 `docs/tech/archive/decisions/`。
6. 文档-only 收尾至少运行 `git diff --check`。

归档条目至少包含：

- 原待办或路线文件。
- 状态。
- 完成范围。
- 详细证据位置。
- 验证口径。
- 是否仍有后续增强入口。

## changeset 与待办的边界

`changes/*.md` 记录“已经发生的变化”，不是未来待办。

- 可以被 [todo-archive.md](todo-archive.md) 引用为完成证据。
- 不应作为活跃开发入口。
- 不应承载 `[ ]` 待办清单。
- 不应替代 `*-roadmap.md` 的设计和验收计划。

## 维护检查

每次文档治理或路线收尾后，检查：

- [ ] `todo-index.md` 只包含未完成的 Planned / Active 项。
- [ ] 已完成路线能在 `todo-archive.md` 找到统一归档条目。
- [ ] 已完成路线位于 `docs/tech/archive/` 对应目录，不散落在 `docs/tech/` 根目录。
- [ ] `changes/*.md` 只描述已发生变化。
- [ ] `git diff --check` 通过。
