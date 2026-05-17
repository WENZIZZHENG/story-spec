## S. 共享契约

- [x] S.1 `apps/web` 必须能生成静态 `dist/index.html` 和编译后的 JS 入口。
- [x] S.2 根脚本必须提供 `build:web`，并把 web build 纳入根 `build`。
- [x] S.3 本切片不引入 Vite/React/Next/Tailwind/bundler/dev server。

## P. 实现任务

- [x] P.1 为 web build pipeline 补红测试。
  - May edit: `tests/unit/independent-web-app-shell.test.ts`
  - Validation: `npx vitest run tests/unit/independent-web-app-shell.test.ts -t "web build"`

- [x] P.2 增加 `apps/web` 构建脚本和 tsconfig。
  - May edit: `apps/web/package.json`, `apps/web/tsconfig.json`, `scripts/build-web-app.cjs`
  - Validation: `npm run build:web`

- [x] P.3 同步根 build、changeset 和 roadmap。
  - May edit: `package.json`, `changes/2026-05-17-web-build-pipeline.md`, `docs/tech/app-ux-roadmap.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, this `tasks.md`
  - Validation: `npm run build && npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-web-build-pipeline --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/independent-web-app-shell.test.ts`
- [x] V.3 `npm run build:web`
- [x] V.4 `npm run build`
- [x] V.5 `npm run check:changes`
- [x] V.6 `git diff --check`
- [ ] V.7 创建本地中文 commit，不 push。
