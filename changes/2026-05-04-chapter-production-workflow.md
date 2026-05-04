---
change_type: minor
scope: cli,application,domain,templates,docs,tests
---

# 章节生产流程收尾基线

## CLI 行为

- `scene:check` 新增 `--fix-paths`，可把 Scene Card 中高置信的 `stories/<story>/...` 路径修复为相对 story root 的路径。
- 新增 `task:finish <taskId> [story]`，默认预览章节任务收尾计划，`--apply` 后更新 `tasks.md` 并刷新 `task-board.json`。
- 新增 `maint:context --topic todo|chapter|release --brief`，输出维护入口、当前路线、简短规则和推荐验证命令，支持 `--json`。
- 新增 `docs:finish --message <commit_message>`，为文档-only 变更输出 `git diff --check`、placeholder 扫描、Git 状态和建议提交命令，支持 `--json`。

## 模板契约

- Scene Card 模板中的 `requiredReads`、`allowedWrites`、`draftPath` 改为相对 story root，不再生成 `stories/*/...` 前缀。

## 作者控制

- 新增流程压缩命令默认只预览或只读。
- 只有显式 `--apply` 才会同步写作任务状态；本批不自动创建 Git commit。

## 生成产物

- 本批新增 CLI 入口，命令构建产物需要通过 `npm run build:commands` 与 `npm run check:command-manifest` 重新验证。
- 不新增用户项目内的默认生成目录或临时稿件产物。

## 验证

- 新增 `tests/unit/story-structure.test.ts`、`tests/unit/inspect-story-structure.test.ts`、`tests/unit/create-scene-card.test.ts` 覆盖路径诊断和修复。
- 新增 `tests/unit/finish-writing-task.test.ts` 覆盖章节任务收尾预览与应用。
- 新增 `tests/unit/maintenance-context.test.ts`、`tests/unit/finish-docs-change.test.ts` 覆盖维护上下文和文档收尾预览。
