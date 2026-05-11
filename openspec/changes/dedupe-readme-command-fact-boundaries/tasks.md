## S. 共享契约

- [x] S.1 冻结范围：README 与待办文档事实边界，不改 CLI/App/API/模板行为。
- [x] S.2 README 高频命令表不允许同一命令重复出现。
- [x] S.3 App/Server 仍必须标注实验性和未实现边界。

## P. 实现任务

- [x] P.1 用 TDD 覆盖 README 高频命令去重和 App/Server 边界。
  - May edit: `tests/unit/readme-fact-boundaries.test.ts`
  - Must not edit: `README.md`
  - Depends on: S.1-S.3
  - Validation: `npx vitest run tests/unit/readme-fact-boundaries.test.ts` 先失败，失败原因应指向重复 `storyspec server`。

- [x] P.2 去重 README 高频命令并保留事实边界。
  - May edit: `README.md`
  - Must not edit: `src/**`, `templates/**`, `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/readme-fact-boundaries.test.ts`

- [x] P.3 同步路线图状态和 changeset。
  - May edit: `docs/tech/platform-foundation-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, `changes/*.md`
  - Must not edit: `src/**`, `templates/**`, `dist/**`
  - Depends on: P.2
  - Validation: `npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate dedupe-readme-command-fact-boundaries --strict --json --no-interactive`。
- [x] V.2 运行相关项目验证：`npx vitest run tests/unit/readme-fact-boundaries.test.ts`、`npm run check:changes`、`git diff --check`。
