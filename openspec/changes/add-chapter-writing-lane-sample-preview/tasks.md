## S. 共享契约

- [x] S.1 冻结范围：本 change 只做章节写作通道状态和章节小样确认阶段。
- [x] S.2 冻结边界：不做富文本编辑器，不自动调用 AI，不让小样自动进入正文、tracking、canon 或 tasks。
- [x] S.3 冻结安全：新增 App API 必须要求 token，且只作用于当前 session 已打开或创建的项目。

## P. 实现任务

- [x] P.1 用 TDD 实现章节写作通道 core。
  - May edit: `tests/unit/local-app-server.test.ts`, `src/app-server/local-app-server.ts`
  - Must not edit: `dist/**`, `src/app-server/local-app-html.ts`
  - Depends on: S.1, S.2, S.3
  - Validation: 先运行新增 core 单测看到方法缺失失败，再实现最小代码通过。

- [x] P.2 用 TDD 接入 HTTP `/api/chapters/lane`。
  - May edit: `tests/unit/local-app-http-server.test.ts`, `src/app-server/local-app-http-server.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/local-app-http-server.test.ts`

- [x] P.3 用 TDD 更新本机 App 章节入口 UI。
  - May edit: `tests/unit/local-app-html.test.ts`, `src/app-server/local-app-html.ts`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npx vitest run tests/unit/local-app-html.test.ts`

- [x] P.4 用 TDD 更新 `/write` 生成产物和章节卡模板，加入章节小样阶段。
  - May edit: `tests/unit/build-commands.test.ts`, `tests/unit/authoring-templates.test.ts`, `templates/commands/write.md`, `templates/commands/write.prompt.md`, `templates/authoring/chapter-card.md`
  - Must not edit: `dist/**` 手工产物
  - Depends on: S.2
  - Validation: 先运行目标单测看到新增断言失败，再更新模板并运行通过。

- [x] P.5 同步 agent guide、CLI 注入、README、changeset、待办和归档。
  - May edit: `docs/agent-guides/story-creation-guide.md`, `agent-guides/story-creation-guide.md`, `src/cli/commands/app.command.ts`, `README.md`, `changes/*.md`, `docs/tech/project-optimization-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/todo-archive.md`
  - Must not edit: `dist/**` 手工产物
  - Depends on: P.1-P.4
  - Validation: `npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-chapter-writing-lane-sample-preview --strict --json --no-interactive`。
- [x] V.2 运行相关 unit、相关 smoke、`npm run build`、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
