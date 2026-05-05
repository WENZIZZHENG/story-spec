## S. 共享契约

- [x] S.1 冻结首个类型切片：新增 `mystery`，不同时展开多个类型包。
- [x] S.2 冻结安装边界：仅新增 preset 资产和测试，不改 preset 安装架构。

## P. 实现任务

- [x] P.1 用 TDD 覆盖内置 `mystery` manifest 可解析且包含关键约束。
  - May edit: `tests/unit/preset-manifest.test.ts`
  - Must not edit: `src/domain/preset-manifest.ts`
  - Depends on: S.1
  - Validation: 先运行目标单测看到 `presets/mystery/preset.yaml` 缺失或 preset id 不存在。

- [x] P.2 用 TDD/smoke 覆盖 `preset:list` 可发现 `mystery`，`preset:add mystery` 可安装，`preset:doctor` 和 `validate` 可通过。
  - May edit: `tests/smoke/cli-commands.test.ts`
  - Must not edit: `src/application/manage-presets.ts`
  - Depends on: P.1
  - Validation: 先运行目标 smoke 看到 `mystery` 缺失或安装失败。

- [x] P.3 新增 `presets/mystery/**` 资产。
  - May edit: `presets/mystery/**`
  - Must not edit: `.specify/**`, `stories/**`, `dist/**`
  - Depends on: P.2
  - Validation: 目标单测和 smoke 通过。

- [x] P.4 同步文档、changeset、生态路线和待办入口。
  - May edit: `docs/commands.md`, `changes/*.md`, `docs/tech/storyspec-ecosystem-roadmap.md`, `docs/tech/todo-index.md`
  - Must not edit: README 未涉及的未实现类型包承诺
  - Depends on: P.3
  - Validation: `npm run check:changes`、`git diff --check`。

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`openspec validate add-first-genre-preset-slice --strict --json --no-interactive`。
- [x] V.2 运行 `npm run build`、目标单测、目标 smoke、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
