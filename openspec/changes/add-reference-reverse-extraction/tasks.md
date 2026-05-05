## S. 共享契约

- [x] S.1 冻结范围：第一版只做 preview-only CLI、应用层服务、agent command、测试和文档，不新增抓取或 apply 写入。
- [x] S.2 明确边界：不下载原文、不解析整本小说、不生成原作续写正文、不把专名写入原创正典。

## P. 实现任务

- [x] P.1 用 TDD 覆盖应用层反向拆解结构。
  - May edit: `tests/unit/reverse-reference.test.ts`, `src/application/reverse-reference.ts`
  - Validation: 先运行目标单测看到新增断言失败，再实现服务并运行通过。

- [x] P.2 用 TDD 覆盖 `storyspec reference:reverse` CLI。
  - May edit: `tests/smoke/reference-reverse-cli.test.ts`, `src/cli/commands/reference.command.ts`, `src/cli/program.ts`
  - Validation: 先运行 smoke 看到命令不存在或断言失败，再实现 CLI 并运行通过。

- [x] P.3 新增 agent command 模板并重建命令产物。
  - May edit: `templates/commands/reference-reverse.command.yaml`, `templates/commands/reference-reverse.prompt.md`, `tests/unit/build-commands.test.ts`, `tests/fixtures/command-artifacts.manifest.json`
  - Validation: `npm run build:commands`, `npm run check:command-manifest`。

- [x] P.4 同步 README / changeset / 待办 / 归档。
  - May edit: `README.md`, `changes/*.md`, `docs/tech/reference-reverse-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/todo-archive.md`
  - Validation: README 只承诺 preview-only，不承诺未授权续写。

## V. 验证

- [x] V.1 运行 OpenSpec 严格校验：`openspec validate add-reference-reverse-extraction --strict --json --no-interactive`。
- [x] V.2 运行相关 unit / smoke、`npm run build`、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
