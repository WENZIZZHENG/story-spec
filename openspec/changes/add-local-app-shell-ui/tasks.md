## S. 共享契约

- [x] S.1 冻结范围：本 change 只做零依赖本机工作台 shell、项目选择/创建 UI、当前项目状态首屏和 `--project` 预打开。
- [x] S.2 冻结安全边界：API token 和 allowlist 不放松，页面不新增高影响写入。
- [x] S.3 冻结视觉方向：编辑台 / 档案控制台；不用营销 hero、紫蓝渐变、玻璃拟态或重动效。

## P. 实现任务

- [x] P.1 用 TDD 实现本机工作台 HTML 渲染。
  - May edit: `tests/unit/local-app-html.test.ts`, `src/app-server/local-app-html.ts`
  - Must not edit: `dist/**`, `src/cli/**`
  - Depends on: S.1, S.3
  - Validation: 先运行新增单测看到模块缺失失败，再实现最小 HTML/CSS/JS 通过。

- [x] P.2 用 TDD 接入 HTTP `/` 页面并保持 API token 校验。
  - May edit: `tests/unit/local-app-http-server.test.ts`, `src/app-server/local-app-http-server.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1, S.2
  - Validation: `npx vitest run tests/unit/local-app-http-server.test.ts`

- [x] P.3 用 TDD 接入 `storyspec app --project` 预打开。
  - May edit: `tests/unit/local-app-command.test.ts`, `src/cli/commands/app.command.ts`
  - Must not edit: `dist/**`
  - Depends on: P.2
  - Validation: `npx vitest run tests/unit/local-app-command.test.ts`

- [x] P.4 同步 README、changeset、App 路线图和待办状态。
  - May edit: `README.md`, `changes/*.md`, `docs/tech/app-multiuser-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/todo-archive.md`
  - Must not edit: `dist/**`
  - Depends on: P.3
  - Validation: `npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-local-app-shell-ui --strict --json --no-interactive`。
- [x] V.2 运行相关 unit、相关 smoke、`npm run build`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
