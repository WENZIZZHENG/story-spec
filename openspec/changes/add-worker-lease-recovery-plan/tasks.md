## S. 共享契约

- [x] S.1 recovery plan 必须基于 stale worker lease 和 job repository 生成。
- [x] S.2 recovery plan 只报告 running job、missing refs 和 ignored refs。
- [x] S.3 recovery plan 不重入队、不 retry、不 cancel、不 apply、不改 job 状态。

## P. 实现任务

- [x] P.1 为 stale lease recovery plan 补红测试。
  - May edit: `tests/unit/multiuser-worker-reliability.test.ts`
  - Validation: `npx vitest run tests/unit/multiuser-worker-reliability.test.ts -t "recovery plan"`

- [x] P.2 实现只读 recovery plan 领域函数。
  - May edit: `src/server/workers/worker-reliability.ts`
  - Validation: `npx vitest run tests/unit/multiuser-worker-reliability.test.ts`

- [x] P.3 同步 changeset 和 roadmap。
  - May edit: `changes/2026-05-16-worker-lease-recovery-plan.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-worker-lease-recovery-plan --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-worker-reliability.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [ ] V.6 创建本地中文 commit，不 push。
