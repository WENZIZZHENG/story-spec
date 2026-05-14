## S. 共享契约

- [x] S.1 定义 worker failure record、retryable/dead-letter/ignored 决策和 maxAttempts 策略。
- [x] S.2 worker 失败路径必须记录 failure record。
- [x] S.3 保持边界：不自动重入队、不实现 dashboard/HA、不写正式文件。

## P. 实现任务

- [x] P.1 新增 worker 可靠性策略模型和测试。
  - May edit: `src/server/workers/worker-reliability.ts`, `tests/unit/multiuser-worker-reliability.test.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1
  - Validation: `npx vitest run tests/unit/multiuser-worker-reliability.test.ts`

- [x] P.2 将 worker runner 失败路径接入 failure record。
  - May edit: `src/server/workers/agent-job-worker.ts`, `tests/unit/multiuser-worker-queue.test.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-worker-queue.test.ts`

- [x] P.3 同步路线图和 changeset。
  - May edit: `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/online-app-platform-roadmap.md`, `docs/tech/todo-index.md`, `changes/2026-05-14-worker-reliability-policy.md`, `openspec/changes/add-worker-reliability-policy/tasks.md`
  - Must not edit: `dist/**`
  - Depends on: P.1-P.2
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-worker-reliability-policy --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-worker-reliability.test.ts tests/unit/multiuser-worker-queue.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [x] V.6 创建本地中文 commit，不 push。
