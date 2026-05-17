## S. 共享契约

- [x] S.1 `apps/web` 必须提供 `dev` 脚本启动本地静态预览。
- [x] S.2 dev server 必须服务构建后的 `dist/index.html` 和 JS 入口。
- [x] S.3 本切片不引入 Vite/Express/React/Next/Tailwind、热更新或 API 代理。

## P. 实现任务

- [x] P.1 为 web dev server 补红测试。
  - May edit: `tests/unit/independent-web-app-shell.test.ts`
  - Validation: `npx vitest run tests/unit/independent-web-app-shell.test.ts -t "dev server"`

- [x] P.2 增加 dev server 脚本和 `apps/web` dev 命令。
  - May edit: `scripts/dev-web-app.cjs`, `apps/web/package.json`
  - Validation: `npm --prefix apps/web run dev -- --port 0`

- [x] P.3 同步 changeset 和 roadmap。
  - May edit: `changes/2026-05-17-web-dev-server.md`, `docs/tech/app-ux-roadmap.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-web-dev-server --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/independent-web-app-shell.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [ ] V.6 创建本地中文 commit，不 push。
