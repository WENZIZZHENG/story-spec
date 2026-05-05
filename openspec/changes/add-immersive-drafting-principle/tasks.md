## S. 共享契约

- [x] S.1 冻结范围：只改模板、agent guide、command prompt、测试和文档，不新增 CLI，不改故事实例数据。
- [x] S.2 明确边界：写中沉浸不取消约束卡，约束卡仍用于写前确认和写后硬约束自检。

## P. 实现任务

- [x] P.1 用 TDD 覆盖章节卡模板包含写中沉浸原则。
  - May edit: `tests/unit/authoring-templates.test.ts`, `templates/authoring/chapter-card.md`
  - Validation: 先运行目标单测看到新增断言失败，再更新模板并运行通过。

- [x] P.2 用 TDD 覆盖 write command 生成产物包含写中沉浸原则。
  - May edit: `tests/unit/build-commands.test.ts`, `templates/commands/write.md`, `templates/commands/write.prompt.md`
  - Validation: 先运行目标单测看到新增断言失败，再更新模板并运行通过。

- [x] P.3 同步 Scene Card 工作流、继续创作入口和 agent guide。
  - May edit: `templates/commands/scene.md`, `templates/CONTINUE.md`, `agent-guides/story-creation-guide.md`, `docs/agent-guides/story-creation-guide.md`
  - Validation: 文本检查确认只承诺模板/prompt 流程，不承诺新 CLI。

- [x] P.4 重建命令产物并同步 changeset / 待办 / 归档。
  - May edit: `dist/**`, `tests/fixtures/command-artifacts.manifest.json`, `changes/*.md`, `docs/tech/immersive-drafting-roadmap.md`, `docs/tech/todo-index.md`, `docs/tech/todo-archive.md`
  - Validation: `npm run build:commands`, `npm run check:command-manifest`, `npm run check:changes`。

## V. 验证

- [x] V.1 运行 OpenSpec 严格校验：`openspec validate add-immersive-drafting-principle --strict --json --no-interactive`。
- [x] V.2 运行相关单测、`npm run build`、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`、`git diff --check`。
- [x] V.3 创建本地中文 commit，不 push。
