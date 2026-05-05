## S 共享契约

- [x] S1 冻结 `task:finish --commit` 的 commit 结果结构和跳过原因。

## P 实现任务

- [x] P1 用 TDD 覆盖 apply 成功后的默认 commit message 和 Git adapter 调用。
  - May edit: `tests/unit/finish-writing-task.test.ts`, `src/application/finish-writing-task.ts`
  - Must not edit: `dist/**`, Git shell adapter
  - Depends on: S1
  - Validation: `npx vitest run tests/unit/finish-writing-task.test.ts`

- [x] P2 用 TDD 覆盖 unrelated change 时跳过 commit。
  - May edit: `tests/unit/finish-writing-task.test.ts`, `src/application/finish-writing-task.ts`
  - Must not edit: `dist/**`
  - Depends on: P1
  - Validation: `npx vitest run tests/unit/finish-writing-task.test.ts`

- [x] P3 同步 CLI 选项和 smoke。
  - May edit: `src/cli/commands/tasks-board.command.ts`, `tests/smoke/cli-commands.test.ts`
  - Must not edit: `dist/**`
  - Depends on: P1, P2
  - Validation: `npm run build` 后运行相关 smoke

- [x] P4 更新活跃待办和 changeset。
  - May edit: `docs/tech/chapter-maintenance-automation-roadmap.md`, `changes/*.md`
  - Must not edit: `README.md`，除非新增用户文档需要同步
  - Depends on: P3
  - Validation: `npm run check:changes`

## V 集成验证

- [x] V1 运行 OpenSpec 严格校验。
- [x] V2 运行 `npm run build`、相关 unit、相关 smoke、`npm run check:changes`、`git diff --check`。
