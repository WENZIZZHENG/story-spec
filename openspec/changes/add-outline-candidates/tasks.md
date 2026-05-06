## S. 共享契约

- [x] S.1 冻结范围：第一版实现 `outline:fork`、`outline:new`、`outline:list`、`outline:compare`、`outline:promote`，不接入 LLM。
- [x] S.2 冻结安全边界：候选写入 `stories/<story>/outlines/**`，只有 `outline:promote --yes` 能覆盖正式 `creative-plan.md`。
- [x] S.3 冻结非目标：不修改正文、`tasks.md`、Scene Card、Context Pack、tracking 或 canon，不删除旧候选。

## P. 实现任务

- [x] P.1 用 TDD 实现大纲候选领域服务。
  - May edit: `tests/unit/manage-outline-candidates.test.ts`, `src/application/manage-outline-candidates.ts`
  - Must not edit: `dist/**`, `src/cli/**`
  - Depends on: S.1, S.2, S.3
  - Validation: 先运行新增单测看到模块缺失或断言失败，再实现最小代码通过。

- [x] P.2 用 TDD 注册 outline CLI 命令。
  - May edit: `tests/smoke/cli-commands.test.ts`, `src/cli/commands/outline.command.ts`, `src/cli/program.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npm run build` 后运行相关 smoke；命令 help 中出现 `outline:fork` 等入口。

- [x] P.3 同步 README、changeset 和待办归档。
  - May edit: `README.md`, `changes/*.md`, `docs/tech/outline-candidates-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/todo-archive.md`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npm run check:changes`；README 只承诺真实可用能力。

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-outline-candidates --strict --json --no-interactive`。
- [x] V.2 运行相关 unit、相关 smoke、`npm run build`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
