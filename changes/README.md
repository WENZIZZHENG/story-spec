# 变更记录

本目录存放 changeset 风格的本地变更记录。每次改动 CLI 行为、模板契约、生成产物或项目结构时，都应新增一条 Markdown 记录，并随代码一起提交。

changeset 只记录已经发生的变化，不作为活跃待办入口。活跃待办统一登记到 `docs/tech/todo-index.md`，已完成待办统一索引到 `docs/tech/todo-archive.md`。

文件名建议使用 `YYYY-MM-DD-short-topic.md`。

每条记录必须包含 frontmatter：

```yaml
---
change_type: minor
scope: cli,prompt,validation
---
```

`change_type` 可选值：

- `major`：破坏性变化。
- `minor`：新增能力或明显行为变化。
- `patch`：兼容修复。
- `none`：只改内部实现或文档，但仍需要记录影响范围。

每条记录必须包含以下章节：

- `## CLI 行为`
- `## 模板契约`
- `## 生成产物`
- `## 验证`

如果某个维度没有变化，也需要写明“无用户可见变化”以及原因，避免未来维护者误判影响面。
