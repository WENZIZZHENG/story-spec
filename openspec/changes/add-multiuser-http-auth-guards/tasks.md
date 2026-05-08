## S. 共享契约

- [x] S.1 冻结范围：只做 HTTP guard 和一个上下文探针端点。
- [x] S.2 冻结安全：所有受保护端点必须先 requireUser，再 requireProjectAccess。
- [x] S.3 冻结兼容：不修改本机 `storyspec app`。

## P. 实现任务

- [x] P.1 用 TDD 覆盖缺失 token、越权项目和成功上下文。
  - May edit: `tests/unit/multiuser-server.test.ts`
  - Must not edit: `src/server/http/multiuser-server.ts`
  - Depends on: S.1-S.3
  - Validation: 目标测试先失败。

- [x] P.2 实现多用户 HTTP guard。
  - May edit: `src/server/http/multiuser-server.ts`
  - Must not edit: `src/app-server/**`, `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts`

- [x] P.3 同步 changeset、todo 和 roadmap。
  - May edit: `changes/*.md`, `docs/tech/app-multiuser-roadmap.md`, `docs/tech/app-multiuser-development-tasks.md`, `docs/tech/todo-index.md`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-multiuser-http-auth-guards --strict --json --no-interactive`。
- [x] V.2 运行相关 unit、`npm run build`、`npm run check:changes`、`git diff --check`。
