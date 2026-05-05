## S. 共享契约

- [x] S.1 冻结 alias 边界：复用 `plugins:add` plan / renderer / apply，不新增独立安装逻辑。
- [x] S.2 冻结展示口径：dry-run 输出 manifest kind 和 agent impact。

## P. 实现任务

- [x] P.1 用 TDD/smoke 覆盖 CLI help 暴露 `extension:add`。
  - May edit: `tests/smoke/cli-commands.test.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1
  - Validation: 先运行目标 smoke 看到 help 缺少命令。

- [x] P.2 用 TDD/smoke 覆盖 `extension:add --dry-run` 复用安装预览并显示 manifest kind。
  - May edit: `tests/smoke/cli-commands.test.ts`, `src/cli/commands/plugins.command.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: 先运行目标 smoke 看到 unknown command，再实现通过。

- [x] P.3 抽出共享 add handler，避免 `plugins:add` 和 `extension:add` 复制安装逻辑。
  - May edit: `src/cli/commands/plugins.command.ts`
  - Must not edit: `src/plugins/manager.ts`，除非现有 API 不足
  - Depends on: P.2
  - Validation: `npm run build` 和相关 smoke。

- [x] P.4 同步命令文档、changeset 和生态路线状态。
  - May edit: `docs/commands.md`, `changes/*.md`, `docs/tech/storyspec-ecosystem-roadmap.md`, `docs/tech/todo-index.md`
  - Must not edit: README 未涉及的未实现能力
  - Depends on: P.3
  - Validation: `npm run check:changes`、`git diff --check`。

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`openspec validate add-extension-add-alias --strict --json --no-interactive`。
- [x] V.2 运行相关 smoke、`npm run build`、`node dist/cli.js --help`、`node dist/cli.js extension:add --help`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
