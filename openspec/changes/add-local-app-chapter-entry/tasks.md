## S. 共享契约

- [x] S.1 冻结范围：本 change 只做 App 内章节草稿入口、Scene Card 初始化和写后自检入口。
- [x] S.2 冻结安全边界：新增 API 全部要求 token，并且只操作当前已打开或已创建项目。
- [x] S.3 冻结创作控制边界：draft promote 默认 dry-run；review 只读；不自动改正文、tracking、tasks 或 canon。

## P. 实现任务

- [x] P.1 用 TDD 实现 App server core 的章节方法。
  - May edit: `tests/unit/local-app-server.test.ts`, `src/app-server/local-app-server.ts`
  - Must not edit: `dist/**`, `src/app-server/local-app-html.ts`
  - Depends on: S.1, S.2, S.3
  - Validation: 先运行新增单测看到方法缺失失败，再实现最小代码通过。

- [x] P.2 用 TDD 接入 HTTP `/api/chapters/*` endpoint。
  - May edit: `tests/unit/local-app-http-server.test.ts`, `src/app-server/local-app-http-server.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/local-app-http-server.test.ts`

- [x] P.3 用 TDD 更新本机工作台 HTML 章节入口。
  - May edit: `tests/unit/local-app-html.test.ts`, `src/app-server/local-app-html.ts`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npx vitest run tests/unit/local-app-html.test.ts`

- [x] P.4 用 TDD 更新 CLI 启动注入和 App command 测试。
  - May edit: `tests/unit/local-app-command.test.ts`, `src/cli/commands/app.command.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/local-app-command.test.ts`

- [x] P.5 同步 README、changeset、App 路线图和待办状态。
  - May edit: `README.md`, `changes/*.md`, `docs/tech/app-multiuser-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/todo-archive.md`
  - Must not edit: `dist/**`
  - Depends on: P.4
  - Validation: `npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-local-app-chapter-entry --strict --json --no-interactive`。
- [x] V.2 运行相关 unit、相关 smoke、`npm run build`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
