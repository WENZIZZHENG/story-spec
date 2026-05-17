## S. 共享契约

- [x] S.1 独立 Web shell 必须展示 session 绑定状态和当前项目角色。
- [x] S.2 权限 UI 必须区分 allowed 与 disabled 动作，并给出禁用原因和下一步。
- [x] S.3 本切片不实现真实登录、注册、邀请、角色变更或 mutation。

## P. 实现任务

- [x] P.1 为登录/权限 UI contract 补红测试。
  - May edit: `tests/unit/independent-web-app-shell.test.ts`
  - Validation: `npx vitest run tests/unit/independent-web-app-shell.test.ts -t "login permission"`

- [x] P.2 扩展独立 Web shell contract 与 HTML 渲染。
  - May edit: `apps/web/src/app-shell.ts`
  - Validation: `npx vitest run tests/unit/independent-web-app-shell.test.ts`

- [x] P.3 同步完整前端架构契约、changeset 和 roadmap。
  - May edit: `src/app-server/app-frontend-architecture.ts`, `changes/2026-05-17-login-permission-ui-slice.md`, `docs/tech/app-ux-roadmap.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-login-permission-ui-slice --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/independent-web-app-shell.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [ ] V.6 创建本地中文 commit，不 push。
