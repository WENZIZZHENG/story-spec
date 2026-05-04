---
change_type: patch
scope: cli,application,docs,tests
---

# tasks/context/write 缺口引导

## CLI 行为

- `storyspec next` 在 planned 阶段不再提示“继续运行平台对应 tasks 命令”，改为明确指向 `/storyspec-tasks`、`storyspec status` 和 `storyspec tasks:board <story>`。
- `context:pack`、`tasks:board` 和写作状态检查在缺少 `tasks.md` 时，会提示先在 agent 中执行 `/storyspec-tasks` 生成 `stories/<story>/tasks.md`。
- `draft:new` 创建草稿后输出写作前检查命令，提醒先确认任务看板、Scene Card 和 Context Pack。

## 模板契约

- 不修改 agent tasks 模板。
- `tasks.md` 仍由 agent 命令根据 `specification.md` 和 `creative-plan.md` 生成。

## 生成产物

- 不新增 `storyspec preview tasks` 或 CLI 内置任务生成器。
- README 与 quickstart 明确 agent-assisted tasks 生成路径，以及 CLI-only 的检查、上下文包和草稿步骤。

## 验证

- 新增或更新 `tests/unit/story-onboarding.test.ts`、`tests/unit/export-task-board.test.ts`、`tests/unit/manage-context-packs.test.ts`、`tests/unit/manage-drafts.test.ts`、`tests/unit/check-writing-state.test.ts`。
- 已运行 `npm run build` 与 `npx vitest run tests/unit/story-onboarding.test.ts tests/unit/export-task-board.test.ts tests/unit/manage-context-packs.test.ts tests/unit/manage-drafts.test.ts tests/unit/check-writing-state.test.ts tests/unit/get-project-status.test.ts`。
