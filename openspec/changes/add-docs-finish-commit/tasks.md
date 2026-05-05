## S. 共享契约

- [x] S.1 冻结 `docs:finish --commit` 的结果结构、检查顺序和跳过原因。
- [x] S.2 明确文档-only 变更边界，避免提交代码、模板或生成产物。

## P. 实现任务

- [x] P.1 用 TDD 覆盖 preview 保持不执行提交，并输出 commit preview。
  - May edit: `tests/unit/finish-docs-change.test.ts`, `src/application/finish-docs-change.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1
  - Validation: 先运行单测看到断言失败，再实现最小代码通过。

- [x] P.2 用 TDD 覆盖 placeholder 和 `git diff --check` 失败时阻断 commit。
  - May edit: `tests/unit/finish-docs-change.test.ts`, `src/application/finish-docs-change.ts`, `src/application/project-ports.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/finish-docs-change.test.ts`

- [x] P.3 用 TDD 覆盖 unrelated / 非文档 change 跳过 commit，以及文档-only 变更成功提交。
  - May edit: `tests/unit/finish-docs-change.test.ts`, `src/application/finish-docs-change.ts`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npx vitest run tests/unit/finish-docs-change.test.ts`

- [x] P.4 同步 CLI 选项和 smoke。
  - May edit: `src/cli/commands/maintenance.command.ts`, `src/infrastructure/*`, `tests/smoke/cli-commands.test.ts`
  - Must not edit: `templates/**`, `dist/**`
  - Depends on: P.3
  - Validation: `npm run build` 后运行相关 smoke。

- [x] P.5 更新 changeset 和活跃待办状态。
  - May edit: `changes/*.md`, `docs/tech/chapter-maintenance-automation-roadmap.md`, `docs/tech/todo-index.md`
  - Must not edit: `README.md`，除非新增用户文档需要同步。
  - Depends on: P.4
  - Validation: `npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`openspec validate add-docs-finish-commit --strict --json --no-interactive`。
- [x] V.2 运行相关单元测试、相关 smoke、`npm run build`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
