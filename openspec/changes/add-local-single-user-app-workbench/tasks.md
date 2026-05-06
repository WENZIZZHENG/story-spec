## S. 共享契约

- [x] S.1 冻结本机工作台第一批范围：`storyspec app`、项目校验、最近项目、创建项目、状态 API。
- [x] S.2 冻结本机安全边界：默认 `127.0.0.1`、session token、allowlist 项目根目录。
- [x] S.3 冻结本 change 不做范围：账号、多用户、云端数据库、富文本编辑器和绕过 preview / confirm / apply。

## P. 实现任务

- [x] P.1 用 TDD 实现项目根目录校验和最近项目记录。
  - May edit: `tests/unit/local-app-projects.test.ts`, `tests/unit/local-app-config.test.ts`, `src/application/local-app-projects.ts`, `src/infrastructure/local-app-config.ts`
  - Must not edit: `dist/**`, `src/cli/**`
  - Depends on: S.1, S.2
  - Validation: 先运行新增单测看到模块缺失失败，再实现最小代码通过。

- [x] P.2 用 TDD 实现 App 创建项目适配，默认 agent 为 `codex` 并复用 `initProject()`。
  - May edit: `tests/unit/local-app-projects.test.ts`, `src/application/local-app-projects.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/local-app-projects.test.ts`

- [x] P.3 用 TDD 实现本地 App server 的 token、allowlist 和状态 API。
  - May edit: `tests/unit/local-app-server.test.ts`, `tests/unit/local-app-http-server.test.ts`, `src/app-server/local-app-server.ts`, `src/app-server/local-app-http-server.ts`
  - Must not edit: `dist/**`, frontend source
  - Depends on: P.1, P.2
  - Validation: 先运行新增单测看到模块缺失失败，再实现最小代码通过。

- [x] P.4 注册 `storyspec app` CLI 最小入口和 smoke。
  - May edit: `src/cli/commands/app.command.ts`, `src/cli/program.ts`, `tests/smoke/cli-commands.test.ts`
  - Must not edit: `dist/**`
  - Depends on: P.3
  - Validation: `npm run build` 后运行相关 smoke。

- [x] P.5 同步 changeset、README 或 docs。
  - May edit: `changes/*.md`, `README.md`, `docs/**`, `docs/tech/app-multiuser-roadmap.md`, `docs/tech/todo-index.md`
  - Must not edit: 未实现能力不得写成已可用。
  - Depends on: P.4
  - Validation: `npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-local-single-user-app-workbench --strict --json --no-interactive`。
- [x] V.2 运行相关单元测试、相关 smoke、`npm run build`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
