## S. 共享契约

- [x] S.1 冻结范围：做 runtime adapter 基础、OpenHands PoC 边界、App 回流只读 API 和 readiness/trace。
- [x] S.2 冻结安全：所有项目级列表 API 必须先 session，再 membership。
- [x] S.3 冻结创作控制权：runtime 结果只能是 candidate/preview-only，不自动 apply。

## P. 实现任务

- [x] P.1 用 TDD 覆盖 runtime adapter、LocalStorySpecRunner 和 OpenHandsRunner PoC。
  - May edit: `tests/unit/multiuser-agent-runtime.test.ts`
  - Must not edit: `src/server/agent-runtime/**`
  - Depends on: S.1-S.3
  - Validation: 目标测试先失败。

- [x] P.2 实现 runtime adapter 基础。
  - May edit: `src/server/agent-runtime/*`, `src/server/jobs/agent-job.ts`
  - Must not edit: `src/app-server/**`, `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-agent-runtime.test.ts`

- [x] P.3 用 TDD 覆盖项目列表、成员列表、job 列表和 readiness。
  - May edit: `tests/unit/multiuser-server.test.ts`, `tests/unit/multiuser-server-core.test.ts`
  - Must not edit: `src/server/http/**`, `src/server/projects/**`, `src/server/jobs/**`
  - Depends on: P.2
  - Validation: 目标测试先失败。

- [x] P.4 实现 App 回流 API 与 observability 字段。
  - May edit: `src/server/http/*`, `src/server/projects/project-security.ts`, `src/server/jobs/agent-job.ts`, `src/server/db/repositories.ts`
  - Must not edit: `src/app-server/**`, `dist/**`
  - Depends on: P.3
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts tests/unit/multiuser-server-core.test.ts tests/unit/multiuser-database.test.ts`

- [x] P.5 同步 changeset、todo 和 roadmap。
  - May edit: `changes/*.md`, `docs/tech/app-multiuser-roadmap.md`, `docs/tech/app-multiuser-development-tasks.md`, `docs/tech/todo-index.md`
  - Must not edit: `dist/**`
  - Depends on: P.4
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-multiuser-runtime-app-observability --strict --json --no-interactive`。
- [x] V.2 运行相关 unit、`npm run build`、`npm run check:changes`、`git diff --check`。
