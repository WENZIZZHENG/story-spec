---
change_type: minor
scope: cli,templates,scripts,validation,tests,openspec,todo
---

# 继续创作工具包

## CLI 行为

- `storyspec init` 会从模板源复制根目录 `CONTINUE.md`，让新项目拥有项目级继续创作入口。
- `storyspec upgrade --templates --scripts` 会刷新 `.specify/templates/CONTINUE.md`、`.specify/templates/authoring/*` 和 `.specify/scripts/*/validate-local.*`；根目录已有 `CONTINUE.md` 时保留故事级入口，缺失时才安装通用入口。
- `storyspec validate` 会对缺失继续创作工具包的旧项目给出 warning，并提示运行 `storyspec upgrade --templates --scripts`；这些 warning 不会单独让项目失败。
- 写作状态 checklist 增加 `CONTINUE.md`、`storyspec handoff`、`storyspec validate` 和本地验证脚本入口。

## 模板契约

- 新增 `templates/CONTINUE.md`，作为项目级导航，不作为正典来源。
- 新增 `templates/authoring/story-dashboard.md`、`open-promises.md`、`tracking-update-checklist.md` 和 `chapter-card.md`。
- 故事级模板只放入 `.specify/templates/authoring/`，不会自动写入 `stories/*`。
- 模板要求区分作者已确认、正文已发生、agent 建议和待确认内容，不把候选规划静默写入 canon。

## 生成产物

- 新项目会生成根目录 `CONTINUE.md`。
- 新项目和升级项目会获得 `.specify/templates/authoring/` 工具包模板。
- 新项目和升级项目会获得 `.specify/scripts/powershell/validate-local.ps1` 与 `.specify/scripts/bash/validate-local.sh`。
- 升级刷新工具包时继续保护 `stories/*`、`spec/tracking/*` 与 `spec/knowledge/*`。

## 验证

- `openspec validate dogfood-authoring-continuation-kit --strict --json --no-interactive`
- `npm test -- tests/unit/init-project.test.ts tests/unit/upgrade-project.test.ts tests/unit/validate-local.test.ts tests/unit/validate-project.test.ts tests/unit/check-writing-state.test.ts`
- `npm run build`
- `npm run check:changes`
