## S. 共享契约

- [x] S.1 recovery executor 只处理 stale lease recovery plan 中的 running jobs。
- [x] S.2 recovery executor 必须把受影响 running job 标记为 timeout 并记录 failure。
- [x] S.3 recovery executor 不 retry、不 requeue、不 cancel、不执行 runtime、不 apply。

## P. 实现任务

- [x] P.1 为 stale job timeout recovery 补红测试。
  - May edit: `tests/unit/multiuser-worker-reliability.test.ts`
  - Validation: `npx vitest run tests/unit/multiuser-worker-reliability.test.ts -t "timeout recovery"`

- [x] P.2 实现 recovery executor。
  - May edit: `src/server/workers/worker-reliability.ts`
  - Validation: `npx vitest run tests/unit/multiuser-worker-reliability.test.ts`

- [x] P.3 同步 changeset 和 roadmap。
  - May edit: `changes/2026-05-16-worker-stale-job-timeout-recovery.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-worker-stale-job-timeout-recovery --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-worker-reliability.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [ ] V.6 创建本地中文 commit，不 push。
