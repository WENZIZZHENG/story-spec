## S. 共享契约

- [x] S.1 冻结范围：只把 audit/quota foundation 接入现有 job API。
- [x] S.2 冻结边界：不做商业计费、真实 Redis 限流或 runtime apply 审计。
- [x] S.3 冻结兼容：未注入 audit/quota repository 时，现有 job API 行为保持可用。

## P. 实现任务

- [x] P.1 用 TDD 覆盖配额阻断、配额消耗和 job 审计记录。
  - May edit: `tests/unit/multiuser-server.test.ts`
  - Must not edit: `src/server/http/multiuser-server.ts`
  - Depends on: S.1-S.3
  - Validation: 目标测试先失败。

- [x] P.2 实现 job API 审计和配额接入。
  - May edit: `src/server/http/multiuser-server.ts`
  - Must not edit: `src/app-server/**`, `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts`

- [x] P.3 同步 changeset、todo 和 roadmap。
  - May edit: `changes/*.md`, `docs/tech/app-multiuser-roadmap.md`, `docs/tech/app-multiuser-development-tasks.md`, `docs/tech/todo-index.md`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-multiuser-job-audit-quota-guards --strict --json --no-interactive`。
- [x] V.2 运行相关 unit、`npm run build`、`npm run check:changes`、`git diff --check`。
