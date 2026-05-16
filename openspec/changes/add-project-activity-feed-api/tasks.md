## S. 共享契约

- [x] S.1 Activity feed 必须按项目读取 audit events，并按时间倒序返回。
- [x] S.2 Activity item 必须保留 actor、action、source、summary、jobId 和 createdAt。
- [x] S.3 Activity feed 必须提供稳定 kind，供完整 App 分类渲染。
- [x] S.4 Activity API 是只读接口，不写入 audit、job、collaboration 或正式故事文件。

## P. 实现任务

- [x] P.1 为 activity feed 聚合和 HTTP GET 补红测试。
  - May edit: `tests/unit/multiuser-audit-quota.test.ts`, `tests/unit/multiuser-server.test.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1-S.4
  - Validation: `npx vitest run tests/unit/multiuser-audit-quota.test.ts tests/unit/multiuser-server.test.ts`

- [x] P.2 实现 activity feed 读模型。
  - May edit: `src/server/audit/audit-log.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-audit-quota.test.ts`

- [x] P.3 接入多用户 HTTP GET 路由。
  - May edit: `src/server/http/multiuser-server.ts`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts`

- [x] P.4 同步路线图、changeset 和 OpenSpec 状态。
  - May edit: `docs/tech/collaboration-canon-roadmap.md`, `docs/tech/todo-index.md`, `changes/2026-05-16-project-activity-feed-api.md`, `openspec/changes/add-project-activity-feed-api/tasks.md`
  - Must not edit: `dist/**`
  - Depends on: P.3
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-project-activity-feed-api --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-audit-quota.test.ts tests/unit/multiuser-server.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `npm test`
- [x] V.6 `git diff --check`
- [x] V.7 创建本地中文 commit，不 push。
