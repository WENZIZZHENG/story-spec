## Why

`法术编译纪元` dogfood 连续三次暴露出同一类体验缺口：作者重新打开项目时，需要手动在 `CONTINUE.md`、故事面板、伏笔清单、章节卡、tracking JSON 和验证脚本之间拼接“下一步该做什么”。这些做法已经在实例中验证有效，应该沉淀为 StorySpec 新建和升级项目都能获得的通用继续创作工具包。

这次变更的重点不是复制某个故事的正文或正典，而是把“继续创作入口、故事级状态面板、开放承诺面板、追踪回填清单、本地验证入口”抽象成可复用模板和校验规则，让作者更容易从断点进入下一章。

## What Changes

- 新增作者继续创作工具包模板，初始化项目时写入根目录 `CONTINUE.md`，并把故事级 `story-dashboard.md`、`open-promises.md`、`tracking-update-checklist.md`、`chapter-cards/chapter-template.md` 放入 `.specify/templates/authoring/`。
- 升级项目时通过现有 `--templates` / `--scripts` 路径下发工具包模板和本地验证脚本，不覆盖 `stories/*`、`spec/tracking` 或 `spec/knowledge` 的用户数据。
- 扩展项目验证，检查新项目是否安装继续创作入口、作者工具包模板和本地验证脚本；缺失项作为 warning，避免旧项目被硬阻断。
- 更新写作状态 checklist 和相关文档，让作者可以从 `storyspec status`、`handoff`、`validate` 与本地脚本之间获得一致的继续创作路径。
- 将 dogfood 后续优化项登记到技术路线，并新增 change record。

## Capabilities

### New Capabilities

- `authoring-continuation-kit`: 继续创作工具包的初始化、升级、模板边界和验证要求。

### Modified Capabilities

- 

## Impact

影响范围包括 `templates/`、`scripts/`、`src/application/init-project.ts`、`src/application/upgrade-project.ts`、`src/application/validate-project.ts`、脚本运行时、单元测试、技术待办文档和 `changes/*.md`。不引入新运行时依赖，不手工编辑 `dist/`，不把实例项目的故事正文、人物关系或世界设定写入源项目模板。
