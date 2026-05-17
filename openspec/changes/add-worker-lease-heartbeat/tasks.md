## S. 共享契约

- [x] S.1 worker lease 必须记录 workerId、状态、heartbeat、lease 过期时间、并发和 active job。
- [x] S.2 heartbeat 刷新必须延长 lease，并保留 active job 列表。
- [x] S.3 stale lease 只能被识别为 HA 告警/后续恢复输入，本切片不自动重入队或抢占。

## P. 实现任务

- [x] P.1 为 worker lease/heartbeat 模型补红测试。
  - May edit: `tests/unit/multiuser-worker-reliability.test.ts`
  - Validation: `npx vitest run tests/unit/multiuser-worker-reliability.test.ts -t "worker lease"`

- [x] P.2 实现 worker lease 类型、内存 repository 和 heartbeat/stale 查询。
  - May edit: `src/server/workers/worker-reliability.ts`
  - Validation: `npx vitest run tests/unit/multiuser-worker-reliability.test.ts`

- [x] P.3 同步 changeset 和 roadmap。
  - May edit: `changes/2026-05-16-worker-lease-heartbeat.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-worker-lease-heartbeat --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-worker-reliability.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [x] V.6 创建本地中文 commit，不 push。
