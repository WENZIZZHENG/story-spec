## S. 共享契约

- [x] S.1 独立 Web shell 必须暴露统一错误边界 contract。
- [x] S.2 错误状态必须包含 label、message、nextAction、severity 和 retryable。
- [x] S.3 本切片不自动 retry、logout、apply 或修改权限。

## P. 实现任务

- [x] P.1 为错误边界 UI 补红测试。
  - May edit: `tests/unit/independent-web-app-shell.test.ts`
  - Validation: `npx vitest run tests/unit/independent-web-app-shell.test.ts -t "error boundary"`

- [x] P.2 扩展独立 Web shell contract 和 HTML 渲染。
  - May edit: `apps/web/src/app-shell.ts`
  - Validation: `npx vitest run tests/unit/independent-web-app-shell.test.ts`

- [x] P.3 同步 changeset 和 roadmap。
  - May edit: `changes/2026-05-17-web-error-boundary.md`, `docs/tech/app-ux-roadmap.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-web-error-boundary --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/independent-web-app-shell.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [ ] V.6 创建本地中文 commit，不 push。
