## S. 共享契约

- [x] S.1 冻结三个流程命令的共同字段和兼容策略。
- [x] S.2 明确本批只补齐 JSON 字段，不改业务行为。

## P. 实现任务

- [x] P.1 用 TDD 覆盖 `task:finish`、`docs:finish`、`todo:capture` 都输出共同字段。
  - May edit: `tests/unit/flow-command-results.test.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1
  - Validation: 先运行新增测试看到缺失字段失败。

- [x] P.2 补齐共享类型和三个应用结果结构。
  - May edit: `src/application/flow-command-result.ts`, `src/application/finish-writing-task.ts`, `src/application/finish-docs-change.ts`, `src/application/capture-todo.ts`
  - Must not edit: CLI 行为外的无关模块
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/flow-command-results.test.ts`

- [x] P.3 回归现有相关测试和 smoke，确认旧字段兼容。
  - May edit: related tests only if shared字段导致断言需补充
  - Must not edit: `templates/**`, `dist/**`
  - Depends on: P.2
  - Validation: 相关 unit、相关 smoke、`npm run build`

- [x] P.4 更新 changeset 和活跃待办状态。
  - May edit: `changes/*.md`, `docs/tech/chapter-maintenance-automation-roadmap.md`, `docs/tech/todo-index.md`
  - Must not edit: README，除非新增用户文档需要同步
  - Depends on: P.3
  - Validation: `npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`openspec validate standardize-flow-command-results --strict --json --no-interactive`。
- [x] V.2 运行相关单元测试、相关 smoke、`npm run build`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
