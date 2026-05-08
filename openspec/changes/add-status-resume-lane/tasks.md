## S. 共享契约

- [x] S.1 冻结范围：只做状态语义统一和继续创作回流摘要，不改变现有写入门禁。
- [x] S.2 冻结边界：不做账号、云端、多用户、数据库、前端框架或自动执行命令。
- [x] S.3 冻结安全：新增 App API 必须要求 token，且只读取当前 session 已打开或创建的项目。

## P. 实现任务

- [x] P.1 用 TDD 实现 resume summary application 模型。
  - May edit: `tests/unit/get-project-status.test.ts`, `src/application/get-project-status.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1
  - Validation: `npx vitest run tests/unit/get-project-status.test.ts`

- [x] P.2 用 TDD 接入 App core 当前项目 resume。
  - May edit: `tests/unit/local-app-server.test.ts`, `src/app-server/local-app-server.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1, S.3
  - Validation: `npx vitest run tests/unit/local-app-server.test.ts`

- [x] P.3 用 TDD 接入 HTTP `/api/projects/current/resume`。
  - May edit: `tests/unit/local-app-http-server.test.ts`, `src/app-server/local-app-http-server.ts`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npx vitest run tests/unit/local-app-http-server.test.ts`

- [x] P.4 用 TDD 更新本机 App 继续创作区域。
  - May edit: `tests/unit/local-app-html.test.ts`, `src/app-server/local-app-html.ts`
  - Must not edit: `dist/**`
  - Depends on: P.3
  - Validation: `npx vitest run tests/unit/local-app-html.test.ts`

- [x] P.5 同步 README、changeset、待办和归档。
  - May edit: `README.md`, `changes/*.md`, `docs/tech/project-optimization-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/todo-archive.md`
  - Must not edit: `dist/**`
  - Depends on: P.1-P.4
  - Validation: `npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-status-resume-lane --strict --json --no-interactive`。
- [x] V.2 运行相关 unit、`npm run build`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
