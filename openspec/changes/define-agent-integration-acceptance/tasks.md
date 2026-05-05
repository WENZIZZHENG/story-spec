## S. 共享契约

- [x] S.1 冻结范围：只交付准入清单和测试 scaffold，不新增具体 agent。
- [x] S.2 冻结兼容性：不改变 renderer 输出、命令生成产物或 legacy `--ai` 映射。

## P. 实现任务

- [x] P.1 用 TDD 覆盖 agent acceptance 检查入口和当前 registry 全量通过。
  - May edit: `tests/unit/agent-registry.test.ts`
  - Must not edit: `src/agent/registry.ts`
  - Depends on: S.1
  - Validation: 先运行目标单测看到 `src/agent/acceptance.js` 模块不存在。

- [x] P.2 实现 `src/agent/acceptance.ts` 的准入检查函数和清单常量。
  - May edit: `src/agent/acceptance.ts`
  - Must not edit: `src/agent/registry.ts`
  - Depends on: P.1
  - Validation: 目标单测通过。

- [x] P.3 新增技术文档，说明新增 agent 的开发清单、测试命令和文档同步要求。
  - May edit: `docs/tech/agent-integration-acceptance.md`
  - Must not edit: README 未涉及的未实现 agent
  - Depends on: P.2
  - Validation: 文档链接可从 roadmap 追踪。

- [x] P.4 同步 changeset、路线状态和待办入口。
  - May edit: `changes/*.md`, `docs/tech/agent-ci-quality-roadmap.md`, `docs/tech/todo-index.md`
  - Must not edit: 已归档路线
  - Depends on: P.3
  - Validation: `npm run check:changes`、`git diff --check`。

## V. 集成验证

- [x] V.1 运行 OpenSpec 严格校验：`openspec validate define-agent-integration-acceptance --strict --json --no-interactive`。
- [x] V.2 运行 `npm run build`、`npx vitest run tests/unit/agent-registry.test.ts tests/unit/platform-renderers.test.ts`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
