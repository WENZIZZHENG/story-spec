## S. 共享契约

- [x] S.1 冻结包管理策略：继续使用 `bun.lock`，不生成 `package-lock.json`。
- [x] S.2 冻结脚本入口：CI 安装依赖使用 Bun，但验证仍调用 `npm run verify`。
- [x] S.3 冻结范围：不升级依赖、不改业务代码、不手工编辑 `dist/**`。

## P. 实现任务

- [x] P.1 用 TDD 覆盖 CI 依赖安装策略。
  - May edit: `tests/unit/ci-workflow.test.ts`
  - Must not edit: `.github/workflows/ci.yml`
  - Depends on: S.1-S.3
  - Validation: `npx vitest run tests/unit/ci-workflow.test.ts` 先失败，失败原因应指向缺少 Bun frozen install。

- [x] P.2 更新 CI 使用 Bun frozen lockfile。
  - May edit: `.github/workflows/ci.yml`
  - Must not edit: `package.json`, `bun.lock`, `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/ci-workflow.test.ts`

- [x] P.3 同步本地开发文档和路线图状态。
  - May edit: `docs/local-development.md`, `docs/tech/platform-foundation-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`
  - Must not edit: `README.md`, `dist/**`
  - Depends on: P.2
  - Validation: `npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate align-ci-bun-lockfile --strict --json --no-interactive`。
- [x] V.2 运行相关项目验证：`npm run build`、`npm test`、`npm run check:changes`、`git diff --check`。
