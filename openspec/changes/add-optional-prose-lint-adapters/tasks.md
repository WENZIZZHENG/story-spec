## S. 共享契约

- [x] S.1 冻结安全边界：CLI 默认不执行外部工具，未安装/未提供 runner 时 skipped。
- [x] S.2 冻结输出：`style:lint` JSON 新增 `adapters`，finding 可选 `source`，内置行为保持兼容。

## P. 实现任务

- [x] P.1 用 TDD 覆盖未安装外部工具时 adapter skipped 且内置 lint 继续通过。
  - May edit: `tests/unit/manage-style.test.ts`
  - Must not edit: `src/application/manage-style.ts`
  - Depends on: S.1
  - Validation: 先运行目标单测看到 `adapters` 字段缺失。

- [x] P.2 用 TDD 覆盖注入 adapter runner 时外部 finding 合并并带 source。
  - May edit: `tests/unit/manage-style.test.ts`
  - Must not edit: `src/application/manage-style.ts`
  - Depends on: P.1
  - Validation: 先运行目标单测看到 `adapterRunner` 不存在或 finding 未合并。

- [x] P.3 实现 style adapter 配置解析、runner 注入、skipped 状态和渲染。
  - May edit: `src/application/manage-style.ts`, `src/domain/workbench.ts`
  - Must not edit: 外部依赖配置
  - Depends on: P.2
  - Validation: 目标单测通过。

- [x] P.4 同步 smoke、文档、changeset、路线和待办入口。
  - May edit: `tests/smoke/cli-commands.test.ts`, `docs/commands.md`, `changes/*.md`, `docs/tech/agent-ci-quality-roadmap.md`, `docs/tech/todo-index.md`
  - Must not edit: README 未涉及的未实现外部工具运行能力
  - Depends on: P.3
  - Validation: `npm run check:changes`、`git diff --check`。

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`openspec validate add-optional-prose-lint-adapters --strict --json --no-interactive`。
- [x] V.2 运行 `npm run build`、`npx vitest run tests/unit/manage-style.test.ts`、相关 smoke、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
