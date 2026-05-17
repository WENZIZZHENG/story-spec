## S. 共享契约

- [x] S.1 定义 proposal、comment thread、review decision、apply request、canon patch 和 version snapshot。
- [x] S.2 冻结 apply gate：审批/作者确认、版本、blocking risk、source refs、patch/rollback。
- [x] S.3 保持边界：不实时协同、不接 HTTP、不写正式文件、不自动 apply 正典。

## P. 实现任务

- [x] P.1 新增协作正典领域模型、内存 repository 和测试。
  - May edit: `src/server/collaboration/canon-merge.ts`, `tests/unit/collaboration-canon-merge.test.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1-S.3
  - Validation: `npx vitest run tests/unit/collaboration-canon-merge.test.ts`

- [x] P.2 同步路线图、changeset 和事实边界。
  - May edit: `docs/tech/collaboration-canon-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, `changes/2026-05-14-collaboration-canon-merge-protocol.md`, `openspec/changes/add-collaboration-canon-merge-protocol/tasks.md`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-collaboration-canon-merge-protocol --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/collaboration-canon-merge.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [x] V.6 创建本地中文 commit，不 push。
