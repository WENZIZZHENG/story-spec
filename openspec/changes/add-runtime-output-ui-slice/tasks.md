## S. 共享契约

- [x] S.1 任务中心必须暴露 runtime output 只读 endpoint 和 preview-only UI 边界。
- [x] S.2 UI contract 必须覆盖 artifacts、logs、empty/error states 和只读动作语言。
- [x] S.3 本切片不实现独立前端项目、不新增 mutation、不自动 apply。

## P. 实现任务

- [x] P.1 为 runtime output UI contract 和本机 shell 补红测试。
  - May edit: `tests/unit/app-frontend-architecture.test.ts`, `tests/unit/local-app-html.test.ts`
  - Validation: `npx vitest run tests/unit/app-frontend-architecture.test.ts tests/unit/local-app-html.test.ts -t "runtime output"`

- [x] P.2 实现 frontend architecture contract。
  - May edit: `src/app-server/app-frontend-architecture.ts`
  - Validation: `npx vitest run tests/unit/app-frontend-architecture.test.ts`

- [x] P.3 在本机 shell 渲染 runtime output 只读面板。
  - May edit: `src/app-server/local-app-html.ts`
  - Validation: `npx vitest run tests/unit/local-app-html.test.ts`

- [x] P.4 同步 changeset 和 roadmap。
  - May edit: `changes/2026-05-16-runtime-output-ui-slice.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-runtime-output-ui-slice --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/app-frontend-architecture.test.ts tests/unit/local-app-html.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [ ] V.6 创建本地中文 commit，不 push。
