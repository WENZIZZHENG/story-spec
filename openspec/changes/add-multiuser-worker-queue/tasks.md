## S. 共享契约

- [x] S.1 定义 `AgentJobQueue`、payload、ready state 和 preview-only worker 边界。
- [x] S.2 冻结语义：server 创建新 job 后只 enqueue；worker 才执行 runtime；取消后的 job 不执行。
- [x] S.3 BullMQ/Redis adapter 必须可通过 fake client 测试，不强制本机启动 Redis。
- [x] S.4 `storyspec worker` 只运行独立 worker，不启动 HTTP server。
- [x] S.5 保持边界：不自动 apply 正文/正典，不实现完整 OpenHands 执行或完整 SaaS。

## P. 实现任务

- [x] P.1 新增 queue adapter 和 worker runner 测试及实现。
  - May edit: `tests/unit/multiuser-worker-queue.test.ts`, `src/server/queue/*`, `src/server/workers/*`
  - Must not edit: `dist/**`
  - Depends on: S.1-S.3
  - Validation: `npx vitest run tests/unit/multiuser-worker-queue.test.ts`

- [x] P.2 将 server 创建 job 接入 queue，并扩展 `/ready.queue`。
  - May edit: `src/server/http/multiuser-server.ts`, `tests/unit/multiuser-server.test.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts`

- [x] P.3 新增 `storyspec worker` CLI wiring。
  - May edit: `src/cli/program.ts`, `src/cli/commands/multiuser-worker.command.ts`, `tests/unit/multiuser-worker-command.test.ts`, `package.json`, `bun.lock`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npm run build && npx vitest run tests/unit/multiuser-worker-command.test.ts`

- [x] P.4 同步部署、README、changeset 和路线图状态。
  - May edit: `README.md`, `docker-compose.yml`, `.env.example`, `docs/deploy/self-hosted.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, `changes/2026-05-13-multiuser-worker-queue.md`, `tests/unit/readme-fact-boundaries.test.ts`, `openspec/changes/add-multiuser-worker-queue/tasks.md`
  - Must not edit: `dist/**`
  - Depends on: P.1-P.3
  - Validation: `npm run check:changes && npx vitest run tests/unit/readme-fact-boundaries.test.ts && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-multiuser-worker-queue --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-worker-queue.test.ts tests/unit/multiuser-server.test.ts tests/unit/multiuser-worker-command.test.ts tests/unit/multiuser-agent-runtime.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [x] V.6 创建本地中文 commit，不 push。
