## S. 共享契约

- [x] S.1 冻结继续创作工具包文件清单：根目录 `CONTINUE.md`、`.specify/templates/authoring/story-dashboard.md`、`open-promises.md`、`tracking-update-checklist.md`、`chapter-card.md`、`.specify/scripts/powershell/validate-local.ps1`、`.specify/scripts/bash/validate-local.sh`。
- [x] S.2 明确迁移边界：工具包模板不能包含 `法术编译纪元` 的正文、人物事实、世界观事实或 tracking 事实；升级不得覆盖 `stories/*`、`spec/tracking/*`、`spec/knowledge/*`。

## P. 可并行实现任务

- [x] P.1 用 TDD 覆盖初始化和升级复制继续创作工具包。
  - May edit: `tests/unit/init-project.test.ts`, `tests/unit/upgrade-project.test.ts`, `src/application/init-project.ts`, `src/application/upgrade-project.ts`, `templates/**`, `scripts/**`
  - Must not edit: `dist/**`, `stories/**`, `spec/tracking/**`, `spec/knowledge/**`
  - Depends on: S.1, S.2
  - Validation: 先运行相关 Vitest 看到新增断言失败，再实现并运行相关测试通过。

- [x] P.2 新增通用继续创作模板内容。
  - May edit: `templates/CONTINUE.md`, `templates/authoring/story-dashboard.md`, `templates/authoring/open-promises.md`, `templates/authoring/tracking-update-checklist.md`, `templates/authoring/chapter-card.md`
  - Must not edit: `D:/project/CherryStudio_codex/法术编译纪元/**`, `dist/**`
  - Depends on: S.1, S.2
  - Validation: 模板不包含实例故事专名，且包含作者已确认 / 正文已发生 / agent 建议 / 待确认边界。

- [x] P.3 用 TDD 新增本地验证脚本运行时和跨平台脚本入口。
  - May edit: `tests/unit/script-runtime.test.ts` 或相关 runtime 测试、`src/script-runtime.ts`, `scripts/powershell/validate-local.ps1`, `scripts/bash/validate-local.sh`
  - Must not edit: `src/application/validate-project.ts` 的项目校验规则、`dist/**`
  - Depends on: S.1
  - Validation: 先运行 runtime 单测看到新增命令失败，再实现并运行相关测试通过。

- [x] P.4 用 TDD 扩展 `storyspec validate` 的工具包缺失 warning。
  - May edit: `tests/unit/validate-project.test.ts`, `src/application/validate-project.ts`
  - Must not edit: 模板正文、脚本运行时、tracking schema
  - Depends on: S.1
  - Validation: 新增旧项目缺失工具包 warning 测试，确认 `valid` 在无 error 时仍为 true。

- [x] P.5 补充写作状态与继续创作文档串联。
  - May edit: `src/application/check-writing-state.ts`, `tests/unit/check-writing-state.test.ts`, `docs/tech/experience-followup-roadmap.md`, `docs/tech/todo-index.md`
  - Must not edit: `README.md` 中尚未实现的未来能力承诺、`dist/**`
  - Depends on: P.2, P.3
  - Validation: checklist 输出包含 `CONTINUE.md`、`handoff` 或 `validate-local` 的可执行下一步；技术待办索引可定位后续增强。

## V. 集成验证与记录

- [x] V.1 运行 OpenSpec 严格校验：`openspec validate dogfood-authoring-continuation-kit --strict --json --no-interactive`。
- [x] V.2 运行相关单元测试、`npm run build`、`npm run check:changes`；若改命令模板，再运行 `npm run build:commands` 和 `npm run check:command-manifest`。
- [x] V.3 新增 `changes/YYYY-MM-DD-*.md` 记录真实可用能力、验证命令和边界。
- [x] V.4 检查 `git diff --check` 和 `git status --short`，确认没有修改实例项目或生成产物。
- [x] V.5 创建本地中文 commit，不 push。
