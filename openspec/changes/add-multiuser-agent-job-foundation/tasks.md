## S. 共享契约

- [x] S.1 冻结范围：只做纯 TypeScript AgentJob 状态机，不接队列、worker 或 runtime。
- [x] S.2 冻结写入边界：job foundation 不写项目文件，不触发 apply。
- [x] S.3 冻结幂等：同一 user/project/idempotencyKey 的非终态 job 不重复创建。

## P. 实现任务

- [x] P.1 用 TDD 覆盖 job 创建和幂等。
  - May edit: `tests/unit/multiuser-agent-job.test.ts`
  - Must not edit: `src/server/jobs/agent-job.ts`
  - Depends on: S.1-S.3
  - Validation: 先运行目标单测看到模块不存在。

- [x] P.2 实现 `AgentJob` 模型、内存 repository 和 `createAgentJob()`。
  - May edit: `src/server/jobs/agent-job.ts`
  - Must not edit: `dist/**`, `src/app-server/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-agent-job.test.ts`

- [x] P.3 用 TDD 覆盖合法/非法状态转移、取消和重试。
  - May edit: `tests/unit/multiuser-agent-job.test.ts`
  - Must not edit: `dist/**`, `src/app-server/**`
  - Depends on: P.2
  - Validation: 目标单测先失败。

- [x] P.4 实现 `transitionAgentJob()`、`cancelAgentJob()`、`retryAgentJob()` 并同步 changeset。
  - May edit: `src/server/jobs/agent-job.ts`, `changes/*.md`
  - Must not edit: `dist/**`, `src/app-server/**`
  - Depends on: P.3
  - Validation: `npm run build && npx vitest run tests/unit/multiuser-agent-job.test.ts && npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-multiuser-agent-job-foundation --strict --json --no-interactive`。
- [x] V.2 运行目标 unit、`npm run build`、`npm run check:changes`、`git diff --check`。
- [ ] V.3 创建本地中文 commit，不 push。
