## S. 共享契约

- [x] S.1 冻结范围：只做框架无关 server core，不引入新依赖。
- [x] S.2 冻结边界：不接认证、数据库、队列、项目 API 或 runtime。
- [x] S.3 冻结兼容：不修改本机 `storyspec app`。

## P. 实现任务

- [x] P.1 用 TDD 覆盖 health 与 request id。
  - May edit: `tests/unit/multiuser-server-core.test.ts`
  - Must not edit: `src/server/http/server-core.ts`
  - Depends on: S.1-S.3
  - Validation: 先运行目标单测看到模块不存在。

- [x] P.2 实现 `server-core.ts`。
  - May edit: `src/server/http/server-core.ts`
  - Must not edit: `package.json`, `bun.lock`, `src/app-server/**`, `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-server-core.test.ts`

- [x] P.3 覆盖并实现错误响应模型，补 changeset。
  - May edit: `tests/unit/multiuser-server-core.test.ts`, `src/server/http/server-core.ts`, `changes/*.md`
  - Must not edit: `package.json`, `bun.lock`, `dist/**`
  - Depends on: P.2
  - Validation: `npm run build && npx vitest run tests/unit/multiuser-server-core.test.ts && npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-multiuser-server-foundation --strict --json --no-interactive`。
- [x] V.2 运行目标 unit、`npm run build`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
