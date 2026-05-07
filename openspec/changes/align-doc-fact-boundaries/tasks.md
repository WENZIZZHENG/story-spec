## S. 共享契约

- [x] S.1 冻结范围：docs-only，不改 CLI/App/API/模板行为。
- [x] S.2 文档口径：README、docs 和待办只写真实可用能力；未实现多用户账号和云端能力只能留在 Planned 路线。

## P. 实现任务

- [x] P.1 同步章节写作链路文档。
  - May edit: `docs/commands.md`, `docs/workflow.md`, `docs/quickstart.md`, `docs/index.md`
  - Must not edit: `src/**`, `templates/**`, `dist/**`
  - Depends on: S.1, S.2
  - Validation: 文档中不再出现 beat 后直接进入正文的旧口径。

- [x] P.2 同步待办和归档状态。
  - May edit: `docs/tech/project-optimization-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/todo-archive.md`, `openspec/changes/enhance-reference-reverse-development/tasks.md`
  - Must not edit: `src/**`, `templates/**`, `dist/**`
  - Depends on: P.1
  - Validation: P2-4 标记 Completed；todo-index 不再保留项目优化建议池未完成 P2 子项。

- [x] P.3 新增 changeset 并复核文档承诺。
  - May edit: `changes/*.md`
  - Must not edit: `src/**`, `templates/**`, `dist/**`
  - Depends on: P.1, P.2
  - Validation: `npm run check:changes` 通过。

## V. 验证

- [x] V.1 运行 OpenSpec 严格校验：`npx openspec validate align-doc-fact-boundaries --strict --json --no-interactive`。
- [x] V.2 运行文档关键词检查、`npm run check:changes` 和 `git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
