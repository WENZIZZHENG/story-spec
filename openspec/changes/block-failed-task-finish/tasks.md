## S 共享契约

- [x] S1 冻结 `task:finish` apply 前文件存在性门禁的结果结构：`blocked`、`checks`、`blockedReasons`、`nextActions`。

## P 实现任务

- [x] P1 用 TDD 覆盖关联正文缺失时阻断 apply。
  - May edit: `tests/unit/finish-writing-task.test.ts`, `src/application/finish-writing-task.ts`
  - Must not edit: `dist/**`, `task-board` schema, `templates/**`
  - Depends on: S1
  - Validation: `npx vitest run tests/unit/finish-writing-task.test.ts`

- [x] P2 同步 CLI JSON / 人类摘要输出，阻断时给出明确状态。
  - May edit: `src/application/finish-writing-task.ts`, `src/cli/commands/tasks-board.command.ts`, `tests/smoke/cli-commands.test.ts`
  - Must not edit: `dist/**`
  - Depends on: P1
  - Validation: 相关 smoke 覆盖 `task:finish --apply --json` 阻断结果

- [x] P3 更新活跃待办和 changeset。
  - May edit: `docs/tech/chapter-maintenance-automation-roadmap.md`, `changes/*.md`
  - Must not edit: `README.md`，除非新增用户可见说明需要同步
  - Depends on: P1, P2
  - Validation: `npm run check:changes`

## V 集成验证

- [x] V1 运行 OpenSpec 严格校验。
- [x] V2 运行 `npm run build`、相关 unit、相关 smoke、`npm run check:changes`、`git diff --check`。
