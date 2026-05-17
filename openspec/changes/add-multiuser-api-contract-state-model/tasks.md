## S. 共享契约

- [x] S.1 定义统一 API envelope、错误码、权限状态、分页、warning 和 resourceVersion。
- [x] S.2 定义首批完整 App 页面 endpoint map。
- [x] S.3 提供 success / empty / unauthorized / forbidden / conflict / blocked / offline fixtures。
- [x] S.4 保持边界：不实现完整前端、不接真实数据库或 worker。

## P. 实现任务

- [x] P.1 新增 API contract state model 和单元测试。
  - May edit: `src/server/http/api-contract.ts`, `tests/unit/api-contract.test.ts`
  - Must not edit: `dist/**`, `src/app-server/local-app-html.ts`
  - Depends on: S.1, S.2
  - Validation: `npx vitest run tests/unit/api-contract.test.ts`

- [x] P.2 新增 contract fixtures 和 fixture 测试。
  - May edit: `tests/fixtures/api-contract/*.json`, `tests/unit/api-contract-fixtures.test.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1, S.3
  - Validation: `npx vitest run tests/unit/api-contract-fixtures.test.ts`

- [x] P.3 同步 server-core 到 contract helper。
  - May edit: `src/server/http/server-core.ts`, `tests/unit/multiuser-server-core.test.ts`
  - Must not edit: `src/server/http/multiuser-server.ts`, `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-server-core.test.ts tests/unit/api-contract.test.ts`

- [x] P.4 同步 changeset 与路线图状态。
  - May edit: `changes/2026-05-13-multiuser-api-contract-state-model.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `openspec/changes/add-multiuser-api-contract-state-model/tasks.md`
  - Must not edit: `README.md`, `dist/**`
  - Depends on: P.1-P.3
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-multiuser-api-contract-state-model --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/api-contract.test.ts tests/unit/api-contract-fixtures.test.ts tests/unit/multiuser-server-core.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [x] V.6 创建本地中文 commit，不 push。
