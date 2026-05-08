## S. 共享契约

- [x] S.1 冻结范围：只做纯 TypeScript 授权守卫和路径规范化，不引入 HTTP、数据库或队列。
- [x] S.2 冻结边界：所有项目访问都必须以 `userId + projectId` 为输入，不能只靠路径。
- [x] S.3 冻结本机兼容：不修改 `storyspec app` 本机单人工作台。

## P. 实现任务

- [x] P.1 用 TDD 覆盖项目访问授权。
  - May edit: `tests/unit/multiuser-project-security.test.ts`
  - Must not edit: `src/server/projects/project-security.ts`
  - Depends on: S.1-S.3
  - Validation: 先运行目标单测，看到模块不存在或导出缺失失败。

- [x] P.2 实现 `project-security.ts` 的最小模型和 `requireProjectAccess()`。
  - May edit: `src/server/projects/project-security.ts`
  - Must not edit: `src/app-server/**`, `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-project-security.test.ts`

- [x] P.3 用 TDD 覆盖 `ProjectStorage` 路径规范化。
  - May edit: `tests/unit/multiuser-project-security.test.ts`
  - Must not edit: `src/app-server/**`, `dist/**`
  - Depends on: P.2
  - Validation: 目标单测先失败。

- [x] P.4 实现 `createProjectStorage()` 并同步 changeset。
  - May edit: `src/server/projects/project-security.ts`, `changes/*.md`
  - Must not edit: `src/app-server/**`, `dist/**`
  - Depends on: P.3
  - Validation: `npm run build && npx vitest run tests/unit/multiuser-project-security.test.ts && npm run check:changes`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-multiuser-project-security-foundation --strict --json --no-interactive`。
- [x] V.2 运行目标 unit、`npm run build`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
