## Why

讨论结论转成长期待办时，目前仍要人工读取 `todo-governance.md`、手写专题 roadmap，并同步 `todo-index.md`。活跃待办要求提供一个 deterministic 的 `todo:capture` 入口，先生成可编辑草案，再由显式 `--apply` 写入。

## What Changes

- 新增 `storyspec todo:capture --topic <name> (--from <path>|--notes <text>)`。
- 默认 preview 不写文件，输出 roadmap 草案、目标路径、index 变更预览、阻断原因和下一步。
- 显式 `--apply` 后新建 `docs/tech/<topic>-roadmap.md`，并把路线登记到 `docs/tech/todo-index.md`。
- 重复 topic、缺少 notes、同时传入 `--from` 和 `--notes`、目标文件已存在时返回 blocked，不写文件。

## Impact

影响维护 CLI、待办捕获应用服务、单元测试、smoke、changeset 和活跃待办状态。第一版不调用 LLM，不自动判断复杂方案可行性，不替代 OpenSpec。

## Capabilities

- `cli-todo-capture`
