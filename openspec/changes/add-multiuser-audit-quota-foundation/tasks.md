## S. 共享契约

- [x] S.1 冻结范围：只做纯 TypeScript 审计和配额 foundation。
- [x] S.2 冻结边界：不实现商业计费或不可篡改审计存储。
- [x] S.3 冻结兼容：不修改本机 `storyspec app`。

## P. 实现任务

- [x] P.1 用 TDD 覆盖审计事件记录。
  - May edit: `tests/unit/multiuser-audit-quota.test.ts`
  - Must not edit: `src/server/audit/audit-log.ts`
  - Depends on: S.1-S.3
  - Validation: 先运行目标单测看到模块不存在。

- [x] P.2 实现 AuditLog 模型、内存 repository 和 `recordAuditEvent()`。
  - May edit: `src/server/audit/audit-log.ts`
  - Must not edit: `src/app-server/**`, `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-audit-quota.test.ts`

- [x] P.3 用 TDD 覆盖配额检查与消耗。
  - May edit: `tests/unit/multiuser-audit-quota.test.ts`
  - Must not edit: `src/server/quota/quota.ts`
  - Depends on: P.2
  - Validation: 目标单测先失败。

- [x] P.4 实现 Quota 模型、内存 repository、`checkQuota()` 和 `consumeQuota()`。
  - May edit: `src/server/quota/quota.ts`, `changes/*.md`
  - Must not edit: `src/app-server/**`, `dist/**`
  - Depends on: P.3
  - Validation: `npm run build && npx vitest run tests/unit/multiuser-audit-quota.test.ts && npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-multiuser-audit-quota-foundation --strict --json --no-interactive`。
- [x] V.2 运行目标 unit、`npm run build`、`npm run check:changes`、`git diff --check`。
- [ ] V.3 创建本地中文 commit，不 push。
