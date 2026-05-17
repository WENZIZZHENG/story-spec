## S. 共享契约

- [x] S.1 定义完整 App 首批前端 route、API client、状态语言和边界契约。
- [x] S.2 本机 App shell 必须消费该契约渲染导航和 endpoint map。
- [x] S.3 保持边界：不引入完整前端框架、不做富文本/实时协作、不绕过 preview / confirm / apply。

## P. 实现任务

- [x] P.1 新增前端架构契约和测试。
  - May edit: `src/app-server/app-frontend-architecture.ts`, `tests/unit/app-frontend-architecture.test.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1
  - Validation: `npx vitest run tests/unit/app-frontend-architecture.test.ts`

- [x] P.2 将本机 App shell 接入前端架构契约。
  - May edit: `src/app-server/local-app-html.ts`, `tests/unit/local-app-html.test.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/local-app-html.test.ts`

- [x] P.3 同步 README、部署边界、路线图和 changeset。
  - May edit: `README.md`, `docs/deploy/self-hosted.md`, `docs/tech/app-ux-roadmap.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, `changes/2026-05-14-complete-app-frontend-architecture.md`, `openspec/changes/add-complete-app-frontend-architecture-slice/tasks.md`
  - Must not edit: `dist/**`
  - Depends on: P.1-P.2
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-complete-app-frontend-architecture-slice --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/app-frontend-architecture.test.ts tests/unit/local-app-html.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [x] V.6 创建本地中文 commit，不 push。
