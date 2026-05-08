## S. 共享契约

- [x] S.1 冻结范围：只做数据库 schema、迁移骨架和 repository 接口，不接 HTTP、UI 或真实业务流。
- [x] S.2 冻结边界：第一版只做 owner/member 基础角色，不引入复杂组织模型。
- [x] S.3 冻结兼容：不修改本机 `storyspec app`。

## P. 实现任务

- [x] P.1 用 TDD 覆盖多用户数据库 schema 字段。
  - May edit: `tests/unit/multiuser-database.test.ts`
  - Must not edit: `src/server/db/schema.ts`
  - Depends on: S.1-S.3
  - Validation: 先运行目标单测看到模块缺失失败。

- [x] P.2 实现数据库 schema 与迁移骨架。
  - May edit: `src/server/db/schema.ts`, `src/server/db/migrations.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-database.test.ts`

- [x] P.3 用 TDD 覆盖 repository 接口与初始化脚本。
  - May edit: `tests/smoke/multiuser-database.test.ts`, `tests/unit/multiuser-database.test.ts`
  - Must not edit: `src/server/db/**`
  - Depends on: P.2
  - Validation: smoke 先失败。

- [x] P.4 实现 repository 适配层并同步 changeset。
  - May edit: `src/server/db/repositories/*`, `changes/*.md`
  - Must not edit: `dist/**`
  - Depends on: P.3
  - Validation: `npm run build && npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-multiuser-database-foundation --strict --json --no-interactive`。
- [x] V.2 运行相关 unit/smoke、`npm run build`、`npm run check:changes`、`git diff --check`。
