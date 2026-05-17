## S. 共享契约

- [x] S.1 冻结第一版项目角色：owner/editor/reviewer/viewer/agent。
- [x] S.2 冻结权限动作覆盖范围：项目、故事、章节、候选、评论、正典、agent job、导出、删除和成员管理。
- [x] S.3 冻结高影响动作必须 requires-confirmation。
- [x] S.4 保持边界：不实现邀请 UI、复杂组织模型、故事/章节级独立 ACL、真实数据库 driver 或 worker。

## P. 实现任务

- [x] P.1 新增角色/权限矩阵和项目安全单元测试。
  - May edit: `src/server/projects/permission-model.ts`, `src/server/projects/project-security.ts`, `tests/unit/multiuser-role-permissions.test.ts`, `tests/unit/multiuser-project-security.test.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1-S.3
  - Validation: `npx vitest run tests/unit/multiuser-role-permissions.test.ts tests/unit/multiuser-project-security.test.ts`

- [x] P.2 更新数据库 schema/repository typing 与相关测试。
  - May edit: `src/server/db/schema.ts`, `src/server/db/repositories.ts`, `tests/unit/multiuser-database.test.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-database.test.ts`

- [x] P.3 更新 API contract page permission actions 和 server 测试中的角色样例。
  - May edit: `src/server/http/api-contract.ts`, `tests/unit/api-contract.test.ts`, `tests/unit/multiuser-server.test.ts`, `tests/fixtures/api-contract/*.json`
  - Must not edit: `dist/**`
  - Depends on: P.1-P.2
  - Validation: `npx vitest run tests/unit/api-contract.test.ts tests/unit/api-contract-fixtures.test.ts tests/unit/multiuser-server.test.ts`

- [x] P.4 同步 changeset 与路线图状态。
  - May edit: `changes/2026-05-13-multiuser-role-permission-model.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `openspec/changes/add-multiuser-role-permission-model/tasks.md`
  - Must not edit: `README.md`, `dist/**`
  - Depends on: P.1-P.3
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-multiuser-role-permission-model --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-role-permissions.test.ts tests/unit/multiuser-project-security.test.ts tests/unit/multiuser-database.test.ts tests/unit/api-contract.test.ts tests/unit/api-contract-fixtures.test.ts tests/unit/multiuser-server.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [ ] V.6 创建本地中文 commit，不 push。
