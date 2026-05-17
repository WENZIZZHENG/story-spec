## S. 共享契约

- [x] S.1 首屏必须展示三步开始路径。
- [x] S.2 引导必须说明候选/预览不会自动写入正式故事。
- [x] S.3 保持工作室控制台视觉，不做营销 hero 或装饰渐变。

## P. 实现任务

- [x] P.1 先补 local app HTML 单元测试。
  - May edit: `tests/unit/local-app-html.test.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1-S.3
  - Validation: `npx vitest run tests/unit/local-app-html.test.ts`

- [x] P.2 实现首屏开始路径 UI 和响应式样式。
  - May edit: `src/app-server/local-app-html.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/local-app-html.test.ts`

- [x] P.3 同步路线图、changeset 和 OpenSpec 状态。
  - May edit: `docs/tech/app-ux-roadmap.md`, `docs/tech/todo-index.md`, `changes/2026-05-14-local-app-guided-first-run.md`, `openspec/changes/add-local-app-guided-first-run/tasks.md`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-local-app-guided-first-run --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/local-app-html.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [x] V.6 使用 in-app browser 检查本机页面首屏。
- [x] V.7 创建本地中文 commit，不 push。
