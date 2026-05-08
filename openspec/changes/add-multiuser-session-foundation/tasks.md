## S. 共享契约

- [x] S.1 冻结范围：只做框架无关 session foundation，不做登录 UI、HTTP middleware 或数据库。
- [x] S.2 冻结安全：session 必须支持过期和撤销。
- [x] S.3 冻结兼容：不修改本机 `storyspec app`。

## P. 实现任务

- [x] P.1 用 TDD 覆盖有效 session 与 requireUser。
  - May edit: `tests/unit/multiuser-session.test.ts`
  - Must not edit: `src/server/auth/session.ts`
  - Depends on: S.1-S.3
  - Validation: 先运行目标单测看到模块不存在。

- [x] P.2 实现 session 模型、内存 repository、`createUserSession()` 和 `requireUser()`。
  - May edit: `src/server/auth/session.ts`
  - Must not edit: `src/app-server/**`, `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-session.test.ts`

- [x] P.3 用 TDD 覆盖过期、撤销和缺失 token。
  - May edit: `tests/unit/multiuser-session.test.ts`
  - Must not edit: `src/app-server/**`, `dist/**`
  - Depends on: P.2
  - Validation: 目标单测先失败。

- [x] P.4 实现撤销与过期判断并同步 changeset。
  - May edit: `src/server/auth/session.ts`, `changes/*.md`
  - Must not edit: `src/app-server/**`, `dist/**`
  - Depends on: P.3
  - Validation: `npm run build && npx vitest run tests/unit/multiuser-session.test.ts && npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-multiuser-session-foundation --strict --json --no-interactive`。
- [x] V.2 运行目标 unit、`npm run build`、`npm run check:changes`、`git diff --check`。
- [ ] V.3 创建本地中文 commit，不 push。
