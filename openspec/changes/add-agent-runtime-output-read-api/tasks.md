## S. 共享契约

- [x] S.1 output read API 必须受 session/project/job guard 保护。
- [x] S.2 API 只返回 preview-only runtime output records。
- [x] S.3 API 不创建、执行、重试、取消或 apply job。

## P. 实现任务

- [x] P.1 为 job output 只读 API 补红测试。
  - May edit: `tests/unit/multiuser-server.test.ts`
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts -t "runtime output"`

- [x] P.2 实现 server route 和 input dependency。
  - May edit: `src/server/http/multiuser-server.ts`
  - Validation: `npx vitest run tests/unit/multiuser-server.test.ts`

- [x] P.3 同步 changeset 和 roadmap。
  - May edit: `changes/2026-05-16-agent-runtime-output-read-api.md`, `docs/tech/multiuser-platform-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, this `tasks.md`
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 `npx openspec validate add-agent-runtime-output-read-api --strict --json --no-interactive`
- [x] V.2 `npx vitest run tests/unit/multiuser-server.test.ts`
- [x] V.3 `npm run build`
- [x] V.4 `npm run check:changes`
- [x] V.5 `git diff --check`
- [ ] V.6 创建本地中文 commit，不 push。
