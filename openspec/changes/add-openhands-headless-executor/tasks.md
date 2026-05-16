## S. 共享契约

- [x] S.1 OpenHands headless executor 必须显式启用。
- [x] S.2 runner 输出仍是 preview-only candidate。
- [x] S.3 worker 命令支持 OpenHands command/prompt 配置。
- [x] S.4 不自动 apply、不解析持久化 stdout/stderr、不实现 HA。

## P. 实现任务

- [x] P.1 为 OpenHands runner headless executor 补红测试。
  - May edit: `tests/unit/multiuser-agent-runtime.test.ts`
  - Validation: `npx vitest run tests/unit/multiuser-agent-runtime.test.ts -t "OpenHands headless"`

- [x] P.2 实现 runner executor、计划和错误处理。
  - May edit: `src/server/agent-runtime/openhands-runner.ts`
  - Validation: `npx vitest run tests/unit/multiuser-agent-runtime.test.ts`

- [x] P.3 为 worker 命令环境配置补红测试。
  - May edit: `tests/unit/multiuser-worker-command.test.ts`
  - Validation: `npx vitest run tests/unit/multiuser-worker-command.test.ts -t "OpenHands headless"`

- [x] P.4 接入 worker 命令配置。
  - May edit: `src/cli/commands/multiuser-worker.command.ts`
  - Validation: `npx vitest run tests/unit/multiuser-worker-command.test.ts`

- [x] P.5 同步 `.env.example`、README、自托管文档、changeset 和 roadmap。
  - May edit: `.env.example`, `README.md`, `docs/deploy/self-hosted.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, `changes/2026-05-16-openhands-headless-executor.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-openhands-headless-executor --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-agent-runtime.test.ts tests/unit/multiuser-worker-command.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [x] V.6 创建本地中文 commit，不 push。
