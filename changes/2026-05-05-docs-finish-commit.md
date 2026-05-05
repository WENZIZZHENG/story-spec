---
change_type: minor
scope: cli,application,infrastructure,tests,openspec,todo
---

# docs:finish 本地提交

## CLI 行为

- `storyspec docs:finish` 默认保持预览模式，只输出文档-only 收尾检查和可选提交建议。
- `storyspec docs:finish --commit --message <commit_message>` 会执行 `git diff --check` 和 placeholder 扫描，通过后尝试创建本地 commit。
- 检查失败、Git 不可用、没有可提交改动或存在非文档-only change 时不会提交，并在 JSON / 摘要中说明原因。

## 模板契约

- 不修改写作模板、command prompt 模板或用户项目生成模板。
- 文档-only 边界限于 `docs/**`、`changes/*.md`、`openspec/changes/**`、`README.md`、`AGENTS.md` 和 `SDD.md` 等文档/规范记录。
- placeholder 扫描继续使用 `TBD`、`TODO`、`待定` 作为阻断标记。

## 生成产物

- 不新增模板生成产物。
- `dist/` 仍由 `npm run build` 生成，不手工维护。
- Git status adapter 现在使用 `git status --short --untracked-files=all`，让未跟踪目录展开为具体文件后再做安全判断。

## 验证

- `openspec validate add-docs-finish-commit --strict --json --no-interactive`
- `npx vitest run tests/unit/finish-docs-change.test.ts tests/unit/finish-writing-task.test.ts`
- `npx vitest run tests/smoke/cli-commands.test.ts -t "creates a local commit from docs finish when requested|creates a local commit from task finish when requested"`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
