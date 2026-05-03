# Novel Writer 全面重构归档

## 状态

Archived。本文保存上一轮 `full-refactor-todo.md` 已完成阶段的归档摘要，避免当前活跃路线图继续膨胀。

## 归档范围

上一轮目标是“让 Novel Writer 从单体 CLI + 大模板变成可测试、可维护、多平台的产品级架构”。该轮阶段 0-10 已完成，当前新的活跃路线图转向 agent-neutral 协议，不再重复拆 CLI、应用层、prompt compiler 等已完成工作。

如需恢复每个阶段的逐项任务、阶段备注和实现细节，请查看 `docs/tech/archive/full-refactor/full-refactor-todo.md` 的 Git 历史。

## 阶段摘要

| 阶段 | 状态 | 归档摘要 |
|------|------|----------|
| 阶段 0：重构保护网 | Done | 引入 Vitest、CLI smoke、golden fixture、`npm run verify`。 |
| 阶段 1：CLI 拆分 | Done | 建立 `src/cli/program.ts` 与 `src/cli/commands/*`，CLI 入口变薄。 |
| 阶段 2：应用层 use case | Done | `init-project`、`upgrade-project`、`get-project-status` 等迁入 application 层，并引入 ports。 |
| 阶段 3：artifact graph | Done | 定义 story/task artifact，支持扫描、阻塞项、任务/章节/线索关系查询。 |
| 阶段 4：prompt compiler | Done | 建立 frontmatter parser、compiler、platform renderers、TypeScript build-commands。 |
| 阶段 5：脚本运行时统一 | Done | 盘点脚本，新增 script runner 和 `check-writing-state` TS runtime wrapper。 |
| 阶段 6：插件与扩展系统 | Done | 定义 `PluginManifest`，安装 plan/apply、dry-run、冲突策略、hook 操作。 |
| 阶段 7：schema 与规则验证 | Done | 新增 `novel validate`、severity、tracking/task/plugin/写作规则校验。 |
| 阶段 8：测试与 CI | Done | GitHub Actions、matrix、command artifact manifest、coverage 门槛。 |
| 阶段 9：文档与发布治理 | Done | 更新架构文档、changes 记录、迁移指南、README 快速路径。 |
| 阶段 10：Codex 专项增强 | Done | `status` 泛化、`codex-status` 别名、Codex `AGENTS.md` profile、`tasks:board`、`handoff`。 |

## 归档说明

- 当前 full-refactor 历史索引是 [full-refactor-todo.md](full-refactor-todo.md)；活跃待办入口是 [todo-index.md](../../todo-index.md)。
- 已完成项目不再放回活跃待办，除非发现回归或需要二次设计。
- 后续新的归档条目也应继续拆到独立归档文件，保持活跃路线图轻量。
