## S. 共享契约

- [ ] S.1 建立 complete App state contract。
- [ ] S.2 新增 token-protected `/api/projects/current/app-state`。
- [ ] S.3 重设计本机 App shell 为工作室控制台。
- [ ] S.4 保留 preview / confirm / apply，不新增高影响静默写入。

## P. 实现任务

- [ ] P.1 新增 app state contract 和测试。
  - May edit: `tests/unit/app-state-contract.test.ts`, `src/app-server/app-state-contract.ts`
  - Must not edit: `dist/**`, `src/app-server/local-app-html.ts`, `src/app-server/local-app-server.ts`, `src/app-server/local-app-http-server.ts`
  - Depends on: S.1
  - Validation: `npx vitest run tests/unit/app-state-contract.test.ts`

- [ ] P.2 接入 local app server core 与 HTTP endpoint。
  - May edit: `tests/unit/local-app-server.test.ts`, `tests/unit/local-app-http-server.test.ts`, `src/app-server/local-app-server.ts`, `src/app-server/local-app-http-server.ts`
  - Must not edit: `dist/**`, `src/app-server/local-app-html.ts`
  - Depends on: P.1, S.2
  - Validation: `npx vitest run tests/unit/local-app-server.test.ts tests/unit/local-app-http-server.test.ts`

- [ ] P.3 重写 local app HTML 的 shell 结构与状态语言。
  - May edit: `tests/unit/local-app-html.test.ts`, `src/app-server/local-app-html.ts`
  - Must not edit: `dist/**`, `src/app-server/local-app-server.ts`, `src/app-server/local-app-http-server.ts`
  - Depends on: P.1, P.2, S.3, S.4
  - Validation: `npx vitest run tests/unit/local-app-html.test.ts`

- [ ] P.4 同步 docs、changeset 和 roadmap。
  - May edit: `changes/2026-05-12-complete-app-story-cockpit-first-slice.md`, `docs/tech/app-ux-roadmap.md`, `docs/tech/todo-index.md`, `openspec/changes/add-complete-app-story-cockpit-first-slice/tasks.md`
  - Must not edit: `README.md`, `dist/**`
  - Depends on: P.1, P.2, P.3
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [ ] V.1 `npx openspec validate add-complete-app-story-cockpit-first-slice --strict --json --no-interactive`
- [ ] V.2 `npx vitest run tests/unit/app-state-contract.test.ts tests/unit/local-app-server.test.ts tests/unit/local-app-http-server.test.ts tests/unit/local-app-html.test.ts`
- [ ] V.3 `npm run build`
- [ ] V.4 `npm run check:changes`
- [ ] V.5 `git diff --check`
- [ ] V.6 创建本地中文 commit，不 push。
