# 多大纲候选与提升路线图

## 状态

Completed。本文登记“保留当前正式大纲，同时新增多个候选大纲并供作者选择”的已完成路线。实现主记录见 `openspec/changes/add-outline-candidates`，用户可见变更见 `changes/2026-05-06-outline-candidates.md`。

## 背景和目标

作者在规划长篇小说时，常会想保留当前 `creative-plan.md`，同时尝试多个方向，例如“学院线加强版”“边境冒险版”“感情线慢热版”或“反派提前揭示版”。当前 StorySpec 已有 `storyspec preview plan` 和 `storyspec branch:*`：

- `preview plan` 适合生成一次写入前预览，但不适合长期保留多个候选大纲。
- `branch:*` 适合剧情执行层 what-if，通常会涉及 scene、任务、正文影响，不够轻。

目标是新增一个轻量的大纲候选库：正式大纲不被覆盖，候选大纲可以创建、列表展示、比较，并在作者显式确认后提升为正式 `creative-plan.md`。

## 非目标

- 不自动修改正文、任务、Scene Card 或 tracking。
- 不把候选大纲默认写成正式 `creative-plan.md`。
- 不删除旧大纲或旧候选。
- 不把大纲候选和剧情执行分支混成同一概念。
- 不引入复杂版本控制系统、Git 分支替代方案或多人协作锁。

## P1 近期增强

### P1-1 大纲候选库与提升门禁

- 类型：创作规划、版本候选、preview/apply、CLI、agent prompt。
- 背景/问题：作者需要在规划阶段保留当前正式大纲，同时探索多个候选路线。没有候选库时，要么覆盖 `creative-plan.md`，要么把候选散落在聊天记录或临时文件中，后续难以比较和提升。
- 已有基础：`stories/<story>/creative-plan.md` 是正式创作计划；`storyspec preview plan` 已有写入前预览和 apply 门禁；`storyspec branch:*` 已有 what-if 分支管理和 compare 思路；`creative:report` 已能读取卷计划摘要并展示结构视图。
- 缺口：缺少 `stories/<story>/outlines/` 候选目录、候选元数据、候选列表、候选比较和候选提升为正式大纲的安全门禁。
- 建议方案：
  1. 新增候选目录结构：`stories/<story>/outlines/<outline-id>/creative-plan.md`、`summary.md`、`risks.md` 和 `outline.json`。
  2. 新增 CLI：
     - `storyspec outline:fork <story> --from current --title "<标题>"`：从当前正式 `creative-plan.md` 复制出候选，不覆盖正式大纲。
     - `storyspec outline:new <story> --title "<标题>" --text "<方向>"` 或 `--file <path>`：基于作者输入生成候选大纲预览。
     - `storyspec outline:list <story>`：列出候选、状态、来源、创建时间、是否来自当前正式大纲。
     - `storyspec outline:compare <story> <outline-a> <outline-b>`：比较主线目标、人物弧线、节奏、风险和读者承诺变化。
     - `storyspec outline:promote <story> <outline-id> --yes`：把候选提升为正式 `creative-plan.md`；默认 dry-run。
  3. 提升后只提示需要重新检查 tasks、Scene Card 和 Context Pack，不自动改正文或任务。
  4. 为 agent 新增或同步 prompt：候选大纲只能作为 candidate，提升前必须 preview / confirm / apply。
- 涉及文件/模块：`src/application/` 新增 outline candidate 服务；`src/cli/commands/` 新增 outline 命令；`templates/commands/` 可新增 `outline.md` 或 command spec；`tests/unit/`、`tests/smoke/`；`README.md`、`docs/commands.md`、`docs/workflow.md`；`tests/fixtures/command-artifacts.manifest.json`。
- 参考项目/资料：现有 `storyspec preview plan` / `apply` 写入门禁、`storyspec branch:*` 的 what-if compare、`creative:report` 的卷计划摘要读取、Git 分支“先保留再切换”的概念作为设计参考。默认不引入外部依赖；本任务关注本地文件模型和确认流程。
- OpenSpec 输入：新建 OpenSpec change `add-outline-candidates`。proposal 需说明它不是剧情分支和 Git 分支；design 需定义候选目录、metadata schema、命令行为、promote dry-run、与 tasks/Scene Card 的后续检查关系；tasks 至少包含领域模型、CLI、测试 fixture、agent command、README/docs、changeset 和待办状态更新。
- 验收标准：
  - `outline:fork` 可从当前 `creative-plan.md` 创建候选，正式大纲内容不变。
  - `outline:new` 可从作者输入生成候选，不直接覆盖 `creative-plan.md`。
  - `outline:list` 能展示多个候选及其状态。
  - `outline:compare` 能输出两份候选在主线目标、人物弧线、节奏、风险、读者承诺上的差异。
  - `outline:promote` 默认只预览；只有 `--yes` 才覆盖正式 `creative-plan.md`。
  - 提升后明确提示重新检查或生成 tasks、Scene Card、Context Pack。
- 验收命令：`npm run build`、相关 unit、相关 CLI smoke、`npm run check:changes`、`git diff --check`。若新增或修改 agent command，额外运行 `npm run build:commands` 和 `npm run check:command-manifest`。
- 不做/边界：不修改正文，不自动重写 `tasks.md`，不删除旧候选，不把候选写入 canon，不把大纲候选当作已确认正典事实。

## 建议实施顺序

1. 第一版先做 `outline:fork`、`outline:list`、`outline:promote`，解决“保留当前大纲，再选一个”的核心痛点。
2. 第二步做 `outline:new`，允许从作者输入生成新候选。
3. 第三步做 `outline:compare`，比较多个候选的风味、代价、风险和读者承诺变化。

## 完成同步

- 实现前先转 OpenSpec change。
- 若新增 CLI 或 agent command，更新 README / docs / commands / agent guide 中的真实可用能力。
- 若修改命令模板，运行 `npm run build:commands` 和 `npm run check:command-manifest`。
- 涉及用户可见行为或模板契约时新增 changeset。
- 完成后更新本文状态，追加 [todo-archive.md](todo-archive.md) 归档条目，并从 [todo-index.md](todo-index.md) 移除活跃路线。
