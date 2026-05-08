## S. 共享契约

- [x] S.1 冻结范围：只做启动引导、端口回退和 doctor 自检，不引入多用户、数据库或云端。
- [x] S.2 冻结安全：本机 App 仍默认绑定 loopback，仍使用 session token，不输出 token 明文。
- [x] S.3 冻结输出：`--json` 字段稳定，文本输出可读但不作为机器契约。

## P. 实现任务

- [x] P.1 用 TDD 定义启动结果渲染和端口回退行为。
  - May edit: `tests/unit/local-app-command.test.ts`, `src/cli/commands/app.command.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1-S.3
  - Validation: `npx vitest run tests/unit/local-app-command.test.ts`

- [x] P.2 用 TDD 新增 `storyspec doctor` 应用/命令。
  - May edit: `tests/unit/doctor-command.test.ts`, `src/cli/commands/doctor.command.ts`, `src/cli/program.ts`
  - Must not edit: `dist/**`
  - Depends on: S.1
  - Validation: `npx vitest run tests/unit/doctor-command.test.ts`

- [x] P.3 更新 CLI help smoke 和 README 启动入口说明。
  - May edit: `tests/smoke/cli-commands.test.ts`, `README.md`
  - Must not edit: `dist/**`
  - Depends on: P.1-P.2
  - Validation: `npm run build && npx vitest run tests/smoke/cli-commands.test.ts`

- [x] P.4 同步 changeset、待办和归档。
  - May edit: `changes/*.md`, `docs/tech/app-startup-experience-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/todo-archive.md`
  - Must not edit: `dist/**`
  - Depends on: P.1-P.3
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate improve-app-startup-experience --strict --json --no-interactive`。
- [x] V.2 运行相关 unit/smoke、`npm run build`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
