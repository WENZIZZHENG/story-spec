## S. 共享契约

- [x] S.1 E2E 冒烟必须启动真实 Web dev server。
- [x] S.2 E2E 冒烟必须读取首页和 JS 入口。
- [x] S.3 本切片不引入 Playwright、浏览器下载、真实登录或多人 server。

## P. 实现任务

- [x] P.1 为 Web shell E2E 补红测试。
  - May edit: `tests/e2e/web-shell.e2e.test.ts`
  - Validation: `npx vitest run tests/e2e/web-shell.e2e.test.ts`

- [x] P.2 增加根 e2e 脚本。
  - May edit: `package.json`
  - Validation: `npm run test:e2e`

- [x] P.3 同步 changeset 和 roadmap。
  - May edit: `changes/2026-05-17-web-shell-e2e-smoke.md`, `docs/tech/app-ux-roadmap.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-web-shell-e2e-smoke --strict --json --no-interactive`
- [x] V.2 `npm run test:e2e`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [ ] V.6 创建本地中文 commit，不 push。
