## S. 共享契约

- [x] S.1 定义协作正典审阅 UI contract。
- [x] S.2 把 canon review、proposal comment、activity、apply 和 rollback endpoints 接入前端架构 API map。
- [x] S.3 在本机 App shell 展示协作正典审阅台和作者确认边界。

## P. 实现任务

- [x] P.1 新增前端架构 contract 测试。
  - May edit: `tests/unit/app-frontend-architecture.test.ts`
  - Validation: `npx vitest run tests/unit/app-frontend-architecture.test.ts -t "collaboration canon review UI"`

- [x] P.2 实现 `collaborationCanonReview` contract。
  - May edit: `src/app-server/app-frontend-architecture.ts`
  - Validation: `npx vitest run tests/unit/app-frontend-architecture.test.ts`

- [x] P.3 新增本机 shell 渲染测试。
  - May edit: `tests/unit/local-app-html.test.ts`
  - Validation: `npx vitest run tests/unit/local-app-html.test.ts -t "collaboration canon review UI"`

- [x] P.4 实现本机 shell 协作正典审阅台。
  - May edit: `src/app-server/local-app-html.ts`
  - Validation: `npx vitest run tests/unit/local-app-html.test.ts`

- [x] P.5 同步 changeset、roadmap 和 tasks 状态。
  - May edit: `changes/2026-05-16-collaboration-canon-review-ui.md`, `docs/tech/collaboration-canon-roadmap.md`, `docs/tech/todo-index.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-collaboration-canon-review-ui-slice --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/app-frontend-architecture.test.ts tests/unit/local-app-html.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [x] V.6 创建本地中文 commit，不 push。
