## S. 共享契约

- [x] S.1 定义协作正典 HTTP mutation 路由和权限映射。
- [x] S.2 明确 API 只创建控制面对象，不自动写正式故事/正典文件。
- [x] S.3 将协作 mutation 纳入 readiness 和 audit log。

## P. 实现任务

- [x] P.1 先补多用户协作 API 单元测试。
  - May edit: `tests/unit/multiuser-server.test.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1-S.3
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts`

- [x] P.2 实现 multiuser server 协作正典 API 和 readiness 状态。
  - May edit: `src/server/http/multiuser-server.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts`

- [x] P.3 同步路线图、待办、changeset 和 OpenSpec 状态。
  - May edit: `docs/tech/collaboration-canon-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, `changes/2026-05-14-collaboration-canon-api-control-plane.md`, `openspec/changes/add-collaboration-canon-api-control-plane/tasks.md`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-collaboration-canon-api-control-plane --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-server.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [x] V.6 创建本地中文 commit，不 push。
