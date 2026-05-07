## S. 共享契约

- [x] S.1 冻结范围：只增强 `reference:reverse` preview 输出，不新增抓取、下载、apply 写入或正文生成。
- [x] S.2 保留边界：新增字段全部是 candidate/preview；不得写入 world/canon/spec/content/tracking。

## P. 实现任务

- [x] P.1 用 TDD 覆盖应用层新增结构。
  - May edit: `tests/unit/reverse-reference.test.ts`, `src/application/reverse-reference.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1, S.2
  - Validation: 先运行目标单测看到新增断言失败，再实现并运行通过。

- [x] P.2 用 TDD 覆盖 CLI JSON / 文本输出增强。
  - May edit: `tests/smoke/reference-reverse-cli.test.ts`, `src/application/reverse-reference.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: 先运行 smoke 或相关断言看到失败；构建后运行 smoke 通过。

- [x] P.3 同步 README / changeset / 待办 / 归档。
  - May edit: `README.md`, `changes/*.md`, `docs/tech/project-optimization-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/todo-archive.md`
  - Must not edit: `dist/**`
  - Depends on: P.1, P.2
  - Validation: README 只承诺真实可用能力，待办入口不再把 P2-3 写成未完成。

## V. 验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate enhance-reference-reverse-development --strict --json --no-interactive`。
- [x] V.2 运行相关 unit/smoke、`npm run build`、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
