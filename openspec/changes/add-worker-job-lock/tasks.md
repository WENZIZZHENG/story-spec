## S. 共享契约

- [x] S.1 同一 job 的 active lock 同时只能归一个 worker。
- [x] S.2 过期 lock 可被新 worker takeover。
- [x] S.3 非 owner worker 不能 heartbeat 或 release lock。
- [x] S.4 本切片不执行 runtime、不改变 job 状态、不接数据库/Redis。

## P. 实现任务

- [x] P.1 为 worker job lock 补红测试。
  - May edit: `tests/unit/multiuser-worker-reliability.test.ts`
  - Validation: `npx vitest run tests/unit/multiuser-worker-reliability.test.ts -t "job lock"`

- [x] P.2 实现 job lock 领域模型和内存 repository。
  - May edit: `src/server/workers/worker-reliability.ts`
  - Validation: `npx vitest run tests/unit/multiuser-worker-reliability.test.ts`

- [x] P.3 同步 changeset 和 roadmap。
  - May edit: `changes/2026-05-16-worker-job-lock.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-worker-job-lock --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-worker-reliability.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [ ] V.6 创建本地中文 commit，不 push。
