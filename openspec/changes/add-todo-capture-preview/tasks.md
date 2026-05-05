## S. 共享契约

- [x] S.1 冻结 `todo:capture` 的输入互斥规则、结果字段和 blocked 文案。
- [x] S.2 冻结第一版草案模板和写入边界：只新增 roadmap 与更新 `todo-index.md`。

## P. 实现任务

- [x] P.1 用 TDD 覆盖 preview 不写文件，并输出 roadmap 草案与 index 预览。
  - May edit: `tests/unit/capture-todo.test.ts`, `src/application/capture-todo.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1, S.2
  - Validation: 先运行新增单测看到缺少模块失败，再实现最小代码通过。

- [x] P.2 用 TDD 覆盖 apply 写入 roadmap 并更新 `todo-index.md`。
  - May edit: `tests/unit/capture-todo.test.ts`, `src/application/capture-todo.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/capture-todo.test.ts`

- [x] P.3 用 TDD 覆盖缺少 notes、输入冲突、重复 topic 和目标文件已存在的 blocked。
  - May edit: `tests/unit/capture-todo.test.ts`, `src/application/capture-todo.ts`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npx vitest run tests/unit/capture-todo.test.ts`

- [x] P.4 同步 CLI 选项和 smoke。
  - May edit: `src/cli/commands/maintenance.command.ts`, `tests/smoke/cli-commands.test.ts`
  - Must not edit: `templates/**`, `dist/**`
  - Depends on: P.3
  - Validation: `npm run build` 后运行相关 smoke。

- [x] P.5 更新 changeset 和活跃待办状态。
  - May edit: `changes/*.md`, `docs/tech/chapter-maintenance-automation-roadmap.md`, `docs/tech/todo-index.md`
  - Must not edit: `README.md`，除非新增用户文档需要同步。
  - Depends on: P.4
  - Validation: `npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`openspec validate add-todo-capture-preview --strict --json --no-interactive`。
- [x] V.2 运行相关单元测试、相关 smoke、`npm run build`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
