## S. 共享契约

- [x] S.1 冻结第一版行为：`ci:check` 只读，不运行外部命令，不联网，不修改文件。
- [x] S.2 冻结 JSON 字段：`checkId`、`status`、`command`、`files`、`message`、`suggestedAction`。

## P. 实现任务

- [x] P.1 用 TDD 覆盖 CI quality checks manifest 输出字段和 pass/fail。
  - May edit: `tests/unit/ci-quality-checks.test.ts`
  - Must not edit: `src/application/ci-quality-checks.ts`
  - Depends on: S.2
  - Validation: 先运行目标单测看到模块不存在。

- [x] P.2 实现 `src/application/ci-quality-checks.ts`。
  - May edit: `src/application/ci-quality-checks.ts`
  - Must not edit: `scripts/build/**`
  - Depends on: P.1
  - Validation: 目标单测通过。

- [x] P.3 新增 `storyspec ci:check` CLI 和 smoke。
  - May edit: `src/cli/commands/ci.command.ts`, `src/cli/program.ts`, `tests/smoke/cli-commands.test.ts`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: 先运行目标 smoke 看到 unknown command，再实现通过。

- [x] P.4 同步命令文档、changeset、路线和待办入口。
  - May edit: `docs/commands.md`, `changes/*.md`, `docs/tech/agent-ci-quality-roadmap.md`, `docs/tech/todo-index.md`
  - Must not edit: README 未涉及的未实现 CI workflow
  - Depends on: P.3
  - Validation: `npm run check:changes`、`git diff --check`。

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`openspec validate add-ci-quality-checks-manifest --strict --json --no-interactive`。
- [x] V.2 运行 `npm run build`、目标 unit、目标 smoke、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
