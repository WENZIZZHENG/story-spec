## S. 共享契约

- [x] S.1 runtime output record 必须保持 preview-only，不自动 apply。
- [x] S.2 output record 必须能保存 summary、candidateRef、artifacts、logs、traceId 和 createdAt。
- [x] S.3 OpenHands stdout/stderr 只能以 bounded preview artifact/log 形式回传。

## P. 实现任务

- [x] P.1 为 runtime output record repository 和 run 保存路径补红测试。
  - May edit: `tests/unit/multiuser-agent-runtime.test.ts`
  - Validation: `npx vitest run tests/unit/multiuser-agent-runtime.test.ts -t "runtime output"`

- [x] P.2 实现 runtime output record 类型、内存 repository 和 `runAgentJobWithRuntime()` 保存路径。
  - May edit: `src/server/agent-runtime/agent-runtime.ts`
  - Validation: `npx vitest run tests/unit/multiuser-agent-runtime.test.ts`

- [x] P.3 为 OpenHands headless preview artifacts/logs 补测试并实现。
  - May edit: `src/server/agent-runtime/openhands-runner.ts`, `tests/unit/multiuser-agent-runtime.test.ts`
  - Validation: `npx vitest run tests/unit/multiuser-agent-runtime.test.ts -t "OpenHands"`

- [x] P.4 同步 changeset 和 roadmap。
  - May edit: `changes/2026-05-16-agent-runtime-output-records.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-agent-runtime-output-records --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-agent-runtime.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [x] V.6 创建本地中文 commit，不 push。
