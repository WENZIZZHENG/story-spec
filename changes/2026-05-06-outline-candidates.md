---
change_type: minor
scope: cli,application,docs
---

# 多大纲候选与提升

## CLI 行为

- 新增 `storyspec outline:fork <story> --from current --title <title>`，从当前正式 `creative-plan.md` 创建候选大纲，不覆盖正式大纲。
- 新增 `storyspec outline:new <story> --title <title> --text/--file`，从作者提供的文本或本地文件保存候选大纲。
- 新增 `storyspec outline:list <story>` 和 `storyspec outline:compare <story> <a> <b>`，用于列出候选并比较主线目标、人物弧线、节奏、风险和读者承诺。
- 新增 `storyspec outline:promote <story> <outline-id>`，默认 dry-run；只有 `--yes` 才覆盖正式 `creative-plan.md`。

## 模板契约

无模板契约变化。本次不修改 `templates/commands/*.md`、agent prompt 模板或命令生成 manifest。

## 生成产物

- 用户项目可新增 `stories/<story>/outlines/<outline-id>/creative-plan.md`、`summary.md`、`risks.md` 和 `outline.json`。
- `outline:promote --yes` 只覆盖 `stories/<story>/creative-plan.md`，不会自动修改正文、`tasks.md`、Scene Card、Context Pack、tracking 或 canon。
- 本次不手工编辑 `dist/**`。

## 文档

- README 增加 `outline:*` 命令、候选目录产物和 preview-first 边界说明。
- 待办归档记录多大纲候选路线已完成。

## 验证

- `npx openspec validate add-outline-candidates --strict --json --no-interactive`
- `npx vitest run tests/unit/manage-outline-candidates.test.ts`
- `npm run build`
- `npx vitest run tests/smoke/cli-commands.test.ts -t "manages outline candidates"`
