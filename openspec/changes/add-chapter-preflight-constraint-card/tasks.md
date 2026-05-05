## S. 共享契约

- [x] S.1 冻结章节前置约束卡第一版范围：只改模板、agent guide 和 command prompt，不新增 CLI，不自动推断故事事实。
- [x] S.2 明确确认边界：约束卡是写前确认材料，未确认内容只能标为待确认，不得写入 canon、tracking 或正文。

## P. 可并行实现任务

- [x] P.1 用 TDD 覆盖章节卡模板包含约束卡结构。
  - May edit: `tests/unit/authoring-templates.test.ts`, `templates/authoring/chapter-card.md`
  - Must not edit: `dist/**`, `stories/**`
  - Depends on: S.1, S.2
  - Validation: 先运行新增测试看到模板缺少约束卡字段而失败，再更新模板并运行测试通过。

- [x] P.2 用 TDD 覆盖 write command 生成产物包含约束卡确认流程。
  - May edit: `tests/unit/build-commands.test.ts`, `templates/commands/write.md`, `templates/commands/write.prompt.md`
  - Must not edit: `dist/**`
  - Depends on: S.1, S.2
  - Validation: 先运行 `npx vitest run tests/unit/build-commands.test.ts` 看到新增断言失败，再更新模板并运行测试通过。

- [x] P.3 同步 Scene Card 工作流、继续创作入口和 agent guide。
  - May edit: `templates/commands/scene.md`, `templates/CONTINUE.md`, `agent-guides/story-creation-guide.md`
  - Must not edit: `README.md` 中尚未实现 CLI 的可用命令表、`dist/**`
  - Depends on: P.1, P.2
  - Validation: 文本检查确认只承诺模板/prompt 流程，不承诺 `chapter:preflight` CLI 已可用。

- [x] P.4 重建命令产物和同步待办/changeset。
  - May edit: `dist/**` generated command artifacts, `tests/fixtures/command-artifacts.manifest.json`, `docs/tech/chapter-maintenance-automation-roadmap.md`, `changes/*.md`
  - Must not edit: 用户故事数据目录
  - Depends on: P.2, P.3
  - Validation: 运行 `npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`。

## V. 集成验证与记录

- [x] V.1 运行 OpenSpec 严格校验：`openspec validate add-chapter-preflight-constraint-card --strict --json --no-interactive`。
- [x] V.2 运行相关单元测试、`npm run build`、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`、`git diff --check`。
- [x] V.3 新增 changeset 记录真实可用能力和边界。
- [x] V.4 更新活跃待办状态，说明第一版已完成，CLI 化留作后续评估。
- [x] V.5 创建本地中文 commit，不 push。
