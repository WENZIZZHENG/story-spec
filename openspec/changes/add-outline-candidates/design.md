## 设计

本 change 实现轻量“多大纲候选库”。它位于正式 `creative-plan.md` 之前或旁边，帮助作者保留多个规划方向；它不是剧情分支，不自动生成任务，也不进入正文执行层。

## 源文件边界

- 新增 `src/application/manage-outline-candidates.ts`：候选目录、元数据、fork/new/list/compare/promote 应用服务和渲染。
- 新增 `src/cli/commands/outline.command.ts` 并在 `src/cli/program.ts` 注册。
- 新增或修改 `tests/unit/*outline*`、`tests/smoke/cli-commands.test.ts`。
- 同步 `README.md`、`docs/tech/*` 和 `changes/*.md`。
- 不手工编辑 `dist/**`。

## 候选目录和元数据

候选目录：

```text
stories/<story>/outlines/<outline-id>/
  creative-plan.md
  summary.md
  risks.md
  outline.json
```

`outline.json` 第一版 schema：

```json
{
  "schemaVersion": "1.0",
  "id": "academy-line",
  "title": "学院线加强版",
  "story": "demo",
  "status": "candidate",
  "source": "current-plan",
  "sourcePath": "stories/demo/creative-plan.md",
  "createdAt": "2026-05-06T00:00:00.000Z",
  "updatedAt": "2026-05-06T00:00:00.000Z",
  "promotedAt": null,
  "summary": "从当前正式大纲 fork。",
  "risks": [
    "提升后需要重新检查 tasks、Scene Card 和 Context Pack。"
  ]
}
```

状态第一版只使用 `candidate` 与 `promoted`。提升不会删除旧候选。

## 命令行为

- `storyspec outline:fork <story> --from current --title "<标题>"`：读取正式 `creative-plan.md`，写入候选目录；正式大纲保持不变。第一版只支持 `--from current`。
- `storyspec outline:new <story> --title "<标题>" --text "<方向>"`：将作者输入保存为候选 `creative-plan.md`。
- `storyspec outline:new <story> --title "<标题>" --file <path>`：读取本地文件内容保存为候选；文件路径解析到当前工作目录或绝对路径，不把来源文件写入仓库。
- `storyspec outline:list <story>`：读取 `outlines/*/outline.json`，按更新时间倒序展示。
- `storyspec outline:compare <story> <outline-a> <outline-b>`：读取两份候选正文，输出结构化比较。第一版采用确定性文本抽取：按常见章节标题和关键词归纳“主线目标、人物弧线、节奏、风险、读者承诺”；缺失项显示“未明确”，不调用 LLM。
- `storyspec outline:promote <story> <outline-id> --yes`：默认 dry-run，只展示目标、源候选和后续检查提醒；传入 `--yes` 后才覆盖正式 `creative-plan.md`，并把候选状态更新为 `promoted`。

## preview / confirm / apply 边界

大纲候选涉及创作计划和高影响结构选择，因此必须保留作者确认：

- `outline:fork` 和 `outline:new` 只创建候选，不修改正式 `creative-plan.md`。
- `outline:promote` 默认 dry-run；`--yes` 是确认门禁。
- promote 只覆盖正式 `creative-plan.md`，不修改正文、`tasks.md`、Scene Card、Context Pack、tracking 或 canon。
- promote 输出必须提醒作者重新检查或生成 tasks、Scene Card 和 Context Pack，因为正式计划已经改变。

## 错误处理

- 没有故事目录时沿用 `selectStoryProject()` 的错误。
- `outline:fork --from current` 缺少正式 `creative-plan.md` 时返回明确错误。
- `outline:new` 必须且只能提供 `--text` 或 `--file` 之一。
- 候选 ID 使用标题 slug，冲突时追加序号。
- 找不到候选或候选缺少 `creative-plan.md` 时阻止 compare/promote。

## 文档边界

README 只写 CLI 已可用命令和安全边界，不承诺 AI 自动生成、多用户协作或完整 Web UI 大纲管理。待办归档需保留验证命令和 commit。
