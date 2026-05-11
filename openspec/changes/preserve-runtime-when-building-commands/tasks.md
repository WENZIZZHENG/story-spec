## S. 共享契约

- [x] S.1 确认默认 agent command artifacts 仍输出到 `dist/<agent>`，不迁移 registry 路径。
- [x] S.2 确认默认 `build:commands` 必须保留 compiled runtime；自定义 `outDir` 必须保持全量清理。
- [x] S.3 确认本任务不修改 command template 语义，不手工提交 `dist/**`。

## P. 实现任务

- [x] P.1 用 TDD 覆盖默认 `dist` 下保留 runtime 的行为。
  - May edit: `tests/unit/build-commands.test.ts`
  - Must not edit: `src/prompt/build-commands.ts`
  - Depends on: S.1-S.3
  - Validation: `npx vitest run tests/unit/build-commands.test.ts -t "preserves compiled runtime"`

- [x] P.2 更新 `buildCommandArtifacts` 的清理边界。
  - May edit: `src/prompt/build-commands.ts`
  - Must not edit: `src/agent/registry.ts`, `package.json`, `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/build-commands.test.ts -t "preserves compiled runtime"`

- [x] P.3 同步本地开发文档、技术架构和路线图状态。
  - May edit: `docs/local-development.md`, `docs/tech/architecture.md`, `docs/tech/platform-foundation-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/online-app-platform-roadmap.md`, `changes/*.md`
  - Must not edit: `README.md` unless事实边界需要同步
  - Depends on: P.2
  - Validation: `npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate preserve-runtime-when-building-commands --strict --json --no-interactive`。
- [x] V.2 运行相关项目验证：`npm run build`、`npm run build:commands`、`node dist/cli.js --help`、`npm run check:command-manifest`、`npm test`、`git diff --check`。
