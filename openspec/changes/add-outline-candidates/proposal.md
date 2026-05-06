## Why

作者在规划长篇小说时，经常需要保留当前正式 `creative-plan.md`，同时尝试多个不同大纲方向。现有 `storyspec preview plan` 适合一次写入前预览，但不适合长期保留多个候选；现有 `branch:*` 更偏剧情执行层 what-if，通常会牵动 scene、任务或正文。StorySpec 需要一个更轻、更靠前的规划层候选库，让作者能先保存、比较，再显式选择是否提升。

## What Changes

- 新增 `stories/<story>/outlines/<outline-id>/` 候选大纲目录，保存候选正文、摘要、风险和元数据。
- 新增 `storyspec outline:fork`，从当前正式 `creative-plan.md` 复制候选，不覆盖正式大纲。
- 新增 `storyspec outline:new`，从作者输入文本或本地文件创建候选大纲，不接入 LLM，不自动定稿。
- 新增 `storyspec outline:list`，展示候选状态、来源、创建时间和提升记录。
- 新增 `storyspec outline:compare`，对比两份候选在主线目标、人物弧线、节奏、风险和读者承诺上的差异。
- 新增 `storyspec outline:promote`，默认 dry-run；只有传入 `--yes` 才把候选 `creative-plan.md` 覆盖到正式 `creative-plan.md`。

## Non-goals

- 不自动修改正文、`tasks.md`、Scene Card、Context Pack、tracking 或 canon。
- 不把候选大纲等同剧情执行分支、Git 分支或多人协作版本控制。
- 不删除旧候选，不默认覆盖正式大纲。
- 不接入 AI 生成大纲；第一版只保存作者提供的候选文本或已有正式计划副本。
- 不绕过 preview / confirm / apply；提升必须有明确确认门禁。

## Impact

影响应用层大纲候选服务、CLI 命令注册、单元测试、CLI smoke、README/docs、changeset 和待办归档。候选目录属于用户项目数据，不是仓库源目录；`dist/**` 不手工编辑。

## Capabilities

- `outline-candidates`
