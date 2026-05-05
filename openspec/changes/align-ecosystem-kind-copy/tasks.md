## S. 共享契约

- [x] S.1 冻结变更范围：只改人读文案和测试，不改安装行为或 JSON schema。
- [x] S.2 冻结 kind 映射：extension / preset / style-pack / market-bridge 显示中文名并保留 raw kind。

## P. 实现任务

- [x] P.1 用 smoke 覆盖插件 dry-run 输出中文 kind 和安装影响文案。
  - May edit: `tests/smoke/cli-commands.test.ts`
  - Must not edit: `src/cli/commands/plugins.command.ts`
  - Depends on: S.2
  - Validation: 先运行目标 smoke 看到输出缺少 `包类型: 扩展包 (extension)`。

- [x] P.2 用 unit 覆盖 preset 文本 renderer 显示类型包和 genre。
  - May edit: `tests/unit/manage-presets.test.ts`
  - Must not edit: `src/application/manage-presets.ts`
  - Depends on: S.1
  - Validation: 先运行目标单测看到输出仍是 `Genre Presets` 或未标注类型包。

- [x] P.3 实现生态 kind 文案统一。
  - May edit: `src/cli/commands/plugins.command.ts`, `src/application/manage-presets.ts`
  - Must not edit: `src/domain/plugin-manifest.ts`, `src/domain/preset-manifest.ts`
  - Depends on: P.1, P.2
  - Validation: 目标 smoke 和 unit 通过。

- [x] P.4 同步文档、changeset、生态路线和待办入口。
  - May edit: `docs/commands.md`, `changes/*.md`, `docs/tech/storyspec-ecosystem-roadmap.md`, `docs/tech/todo-index.md`
  - Must not edit: README 未涉及的未实现能力
  - Depends on: P.3
  - Validation: `npm run check:changes`、`git diff --check`。

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`openspec validate align-ecosystem-kind-copy --strict --json --no-interactive`。
- [x] V.2 运行 `npm run build`、相关 preset unit、相关 CLI smoke、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
