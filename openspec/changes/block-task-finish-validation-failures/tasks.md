## S 共享契约

- [x] S1 冻结验证失败 check 结构、阻断原因和 next action 文案。

## P 实现任务

- [x] P1 用 TDD 覆盖外部验证失败时不写 `tasks.md` / `task-board.json`。
  - May edit: `tests/unit/finish-writing-task.test.ts`, `src/application/finish-writing-task.ts`, `src/application/project-ports.ts`
  - Must not edit: `dist/**`
  - Depends on: S1
  - Validation: `npx vitest run tests/unit/finish-writing-task.test.ts`

- [x] P2 接入 CLI 真实验证 runner 并补 smoke。
  - May edit: `src/cli/commands/tasks-board.command.ts`, `src/infrastructure/*`, `tests/smoke/cli-commands.test.ts`
  - Must not edit: `templates/**`
  - Depends on: P1
  - Validation: `npm run build` 后运行相关 smoke

- [x] P3 更新 changeset 和活跃待办。
  - May edit: `changes/*.md`, `docs/tech/chapter-maintenance-automation-roadmap.md`
  - Must not edit: `README.md`，除非新增用户文档需要同步
  - Depends on: P2
  - Validation: `npm run check:changes`

## V 集成验证

- [x] V1 运行 OpenSpec 严格校验。
- [x] V2 运行 `npm run build`、相关 unit、相关 smoke、`npm run check:changes`、`git diff --check`。
