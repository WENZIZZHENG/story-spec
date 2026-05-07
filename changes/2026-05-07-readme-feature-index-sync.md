---
change_type: none
scope: docs
---

# README 功能索引同步

## CLI 行为

无用户可见行为变化。本次只把 README 中缺失的已实现 CLI 能力补入索引，包括任务状态收尾、澄清诊断、图谱影响范围和维护自动化入口。

## 模板契约

无变化。未修改 agent prompt、命令模板或用户项目初始化模板。

## 生成产物

无变化。未重新生成 agent 命令产物，也未修改 `dist/`。

## 验证

- `node dist/cli.js --help`
- `node dist/cli.js tasks:set-status --help`
- `node dist/cli.js task:finish --help`
- `node dist/cli.js graph:impact --help`
- `node dist/cli.js clarification:doctor --help`
- `node dist/cli.js ci:check --help`
- `node dist/cli.js maint:context --help`
- `node dist/cli.js docs:finish --help`
- `node dist/cli.js todo:capture --help`
- `npm run check:changes`
- `git diff --check`
