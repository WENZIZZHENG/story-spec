## S. 共享契约

- [x] S.1 冻结范围：做生命周期计划、部署配置文档和安全回归。
- [x] S.2 冻结安全：删除只产出计划和审计，不直接删除磁盘文件。
- [x] S.3 冻结事实：部署文档必须说明真实 PostgreSQL/Redis worker 尚未接入。

## P. 实现任务

- [x] P.1 用 TDD 覆盖项目快照、导出、删除计划和审计。
  - May edit: `tests/unit/multiuser-project-lifecycle.test.ts`
  - Must not edit: `src/server/projects/project-lifecycle.ts`
  - Depends on: S.1-S.3
  - Validation: 目标测试先失败。

- [x] P.2 实现项目生命周期计划服务。
  - May edit: `src/server/projects/project-lifecycle.ts`
  - Must not edit: `dist/**`
  - Depends on: P.1
  - Validation: `npx vitest run tests/unit/multiuser-project-lifecycle.test.ts`

- [x] P.3 新增安全回归测试。
  - May edit: `tests/security/multiuser-security.test.ts`
  - Must not edit: `src/**`
  - Depends on: P.2
  - Validation: 目标测试应通过已有安全守卫。

- [x] P.4 新增自托管配置和部署文档。
  - May edit: `docker-compose.yml`, `.env.example`, `docs/deploy/self-hosted.md`
  - Must not edit: `package-lock.json`, `dist/**`
  - Depends on: P.3
  - Validation: 文档事实边界检查、`git diff --check`

- [x] P.5 同步 changeset、todo 和 roadmap。
  - May edit: `changes/*.md`, `docs/tech/app-multiuser-roadmap.md`, `docs/tech/app-multiuser-development-tasks.md`, `docs/tech/todo-index.md`
  - Must not edit: `dist/**`
  - Depends on: P.4
  - Validation: `npm run check:changes && git diff --check`

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate add-multiuser-data-deploy-security --strict --json --no-interactive`。
- [x] V.2 运行相关 unit/security、`npm run build`、`npm run check:changes`、`git diff --check`。
