## S. 共享契约

- [x] S.1 冻结范围：只做框架无关的多用户 server 入口，不引入认证、数据库、队列或项目 API。
- [x] S.2 冻结兼容：不修改本机 `storyspec app`。
- [x] S.3 冻结输出：health、request id 和错误响应字段稳定。

## P. 实现任务

- [x] P.1 用 TDD 覆盖 server 入口的 health、request id 和未知路径错误响应。
  - May edit: `tests/unit/multiuser-server.test.ts`, `tests/smoke/multiuser-server.test.ts`
  - Must not edit: `src/server/http/multiuser-server.ts`
  - Depends on: S.1-S.3
  - Validation: 先运行目标单测/冒烟看到模块缺失失败。

- [x] P.2 实现多用户 server 入口与 CLI 命令。
  - May edit: `src/server/http/multiuser-server.ts`, `src/cli/commands/multiuser-server.command.ts`, `src/cli/program.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts && npm run build`

- [x] P.3 同步 changeset、todo 和 roadmap。
  - May edit: `changes/*.md`, `docs/tech/app-multiuser-roadmap.md`, `docs/tech/app-multiuser-development-tasks.md`, `docs/tech/todo-index.md`, `docs/tech/todo-archive.md`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-multiuser-server-entry --strict --json --no-interactive`。
- [x] V.2 运行相关 unit/smoke、`npm run build`、`npm run check:changes`、`git diff --check`。
