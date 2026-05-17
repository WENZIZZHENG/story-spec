## S. 共享契约

- [x] S.1 独立前端项目必须位于 `apps/web/`，不替换本机 shell。
- [x] S.2 独立前端 shell 必须复用首批页面和 API 边界语言。
- [x] S.3 本切片不引入大型前端框架、不实现登录/富文本/实时协作。

## P. 实现任务

- [x] P.1 为独立 web app shell 补红测试。
  - May edit: `tests/unit/independent-web-app-shell.test.ts`
  - Validation: `npx vitest run tests/unit/independent-web-app-shell.test.ts`

- [x] P.2 新增 `apps/web/` shell、contract 和入口文件。
  - May edit: `apps/web/package.json`, `apps/web/index.html`, `apps/web/src/app-shell.ts`, `apps/web/src/main.ts`
  - Validation: `npx vitest run tests/unit/independent-web-app-shell.test.ts`

- [x] P.3 同步 changeset 和 roadmap。
  - May edit: `changes/2026-05-16-independent-web-app-shell.md`, `docs/tech/app-ux-roadmap.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-independent-web-app-shell --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/independent-web-app-shell.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [ ] V.6 创建本地中文 commit，不 push。
