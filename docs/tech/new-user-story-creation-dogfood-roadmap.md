# 新用户小说创建端到端体验路线图

## 状态

Active。本文记录 2026-05-04 从“刚接触 StorySpec 的作者”视角完成一次端到端 dogfood 的问题和后续优化任务。

## 走查目标

验证一个新用户从“这个项目适不适合我”开始，能否按系统引导完成：

1. 理解 StorySpec 是否适合自己。
2. 初始化小说项目。
3. 保存一句话创意。
4. 通过共创入口补齐第一版 StorySpec。
5. 生成并应用 specification / creative-plan。
6. 知道如何继续到 tasks、Scene Card 和章节草稿。

本路线的主目标是让 StorySpec 的第一次使用体验从“读命令说明和项目管理输出”变成“被带进故事、能顺手产出第一版作品骨架”。

## 走查证据

临时项目：

```text
C:\Users\Admin\AppData\Local\Temp\storyspec-dogfood-20260504-095608\星尘驿站
```

走查故事：

```text
退休星舰导航员在宇宙边境开了一间给迷路灵魂和破损飞船歇脚的驿站；轻松治愈，慢热群像，背后有一场被遗忘的星际战争。
```

已实跑命令：

```powershell
node dist/cli.js --help
node dist/cli.js init 星尘驿站 --agent codex --method three-act
node dist/cli.js status
node dist/cli.js story:new 星尘驿站 --idea "..."
node dist/cli.js next 星尘驿站
node dist/cli.js interview 星尘驿站 --focus stage
node dist/cli.js interview 星尘驿站 --focus stage --premise "..."
node dist/cli.js interview 星尘驿站 --focus stage --premise "..." --answers "..."
node dist/cli.js creative:report 星尘驿站
node dist/cli.js preview specify 星尘驿站
node dist/cli.js apply specify-星尘驿站-20260504-1777859903471 --yes
node dist/cli.js preview plan 星尘驿站
node dist/cli.js apply plan-星尘驿站-20260504-1777859945614 --yes --draft
node dist/cli.js context:pack 星尘驿站
node dist/cli.js scene:init 星尘驿站
node dist/cli.js draft:new 星尘驿站 --chapter 001
node dist/cli.js tasks:board 星尘驿站
node dist/cli.js validate
```

## 非目标

- 本路线不要求一次性实现完整 GUI 或 Web 工作台。
- 不删除 preview / confirm / apply 保护机制。
- 不让 AI 候选绕过用户确认进入正典。
- 不把所有输出都压缩成极简模式；高级信息可以存在，但不能压过首次路径。

## P0 立即处理

### P0-1 统一首次路径，不再让 init/status/help 把用户带回旧七步命令

- 类型：CLI 引导、文档契约、模板一致性
- 背景/问题：中心协议已经要求“先选择创作入口”，但新用户实跑 `init` 后看到的是 `/storyspec-constitution -> /storyspec-specify -> /storyspec-clarify -> /storyspec-plan -> /storyspec-tasks -> /storyspec-write`。`status` 在空项目时建议 `/specify`，`--help` 的核心创作命令仍是 `/method /style /story /outline /track-init /write`。用户会被带离 `story:new -> next -> interview -> preview/apply` 的新流程。
- 已有基础：[story-creation-guide.md](../agent-guides/story-creation-guide.md) 已改为入口优先；`story:new`、`next`、`interview`、`preview`、`apply` 已可用。
- 缺口：CLI 初始化输出、状态建议、help 文案和 agent prompt 仍存在旧入口。
- 建议方案：
  1. 把 `init` 成功后的推荐流程改为 `story:new -> next -> interview -> creative:report -> preview specify -> apply`。
  2. `status` 在无故事时建议 `storyspec story:new`，有 idea 但无澄清时建议可复制的 `storyspec next <story>`。
  3. `--help` 的“核心创作命令”改为当前真实推荐路径，并把 slash commands 标为 agent 内部可选路径。
  4. 同步 `.codex/prompts/storyspec-*.md` 中“七步方法论”的入口说明，避免 agent 再把用户带回旧流程。
- 涉及文件/模块：
  - `src/cli/commands/init.command.ts`
  - `src/cli/program.ts`
  - `src/application/get-project-status.ts`
  - `templates/commands/*.md`
  - `README.md`
  - `docs/quickstart.md`
- 验收标准：
  - 新项目初始化完成后，第一屏明确推荐保存创意和选择创作入口。
  - 空项目 `storyspec status` 不再建议 `/specify` 作为第一步。
  - `storyspec --help` 的示例命令与 quickstart 和 agent guide 一致。
  - 相关 CLI 输出有单测或快照覆盖。
- 参考项目/资料：
  - 参考资料：本仓库 [story-creation-guide.md](../agent-guides/story-creation-guide.md)。
  - 借鉴点：先进入故事入口，命令只作为落地方式。
  - 不照搬：不把 agent 对话协议全文塞进 CLI 输出。
  - 落地方式：CLI 输出只给一条主路径和 2-3 条可选分支。
- 不做/边界：不移除旧 slash commands；只调整首次推荐优先级和文案。

### P0-2 修复 next 推荐命令不可复制即用的问题

- 类型：CLI 导航、非交互可用性
- 背景/问题：`storyspec next 星尘驿站` 推荐 `storyspec interview 星尘驿站 --focus stage`，但在非交互环境直接运行会失败：`非交互环境请传入 --premise "一句话创意"`。新手照抄第一条推荐就被阻断。
- 已有基础：`stories/<story>/idea.md` 已保存原始创意，理论上可作为 premise 来源。
- 缺口：`next` 渲染推荐命令时没有补 `--premise`，`interview` 也没有从 `idea.md` 自动回退。
- 建议方案：
  1. `interview` 在非交互环境未传 `--premise` 时，优先读取 `stories/<story>/idea.md`。
  2. 若无法读取 idea，再提示用户补 `--premise`，并给出完整示例。
  3. `next` 输出的推荐命令必须是当前环境下可复制即用的命令。
  4. JSON 输出中增加 `copyableCommand` 和 `requiresPremise` 字段，供 agent/UI 使用。
- 涉及文件/模块：
  - `src/application/story-onboarding.ts`
  - `src/application/interview-story.ts`
  - `src/cli/commands/interview.command.ts`
  - `tests/unit/story-onboarding.test.ts`
  - `tests/unit/interview-story.test.ts`
- 验收标准：
  - 用户运行 `story:new` 后，直接复制 `next` 的第一条 `interview` 命令不会失败。
  - 没有 idea.md 时，错误提示包含一条完整可复制命令。
  - 非交互场景有单测覆盖。
- 参考项目/资料：
  - 参考项目：Inquirer.js。
  - 借鉴点：交互问题在非交互环境要提供默认值、清晰错误和可恢复路径。
  - 不照搬：不要求 StorySpec 全部变成 TTY wizard。
  - 落地方式：CLI 命令推荐要自带必要上下文。
- 不做/边界：不把 `idea.md` 自动写成正典，只作为 premise 上下文。

### P0-3 移除与当前故事不匹配的固定示例污染（已完成，2026-05-04）

- 类型：内容质量、模板治理、创作控制权
- 背景/问题：用户输入的是“星际边境驿站、治愈群像”，但 `clarifications.md`、`creative-plan.md` 里出现大量“晏无、编程施法、学院工坊、贵族许可、边境小城”等另一个故事的固定示例。用户会觉得系统在套模板，甚至担心 AI 候选污染自己的故事。
- 已有基础：clarifications 已区分 `confirmed: true` 和 `confirmed: false`，preview/apply 能阻止未确认内容进入 specification。
- 缺口：示例渲染不按当前 premise 适配；plan 草案仍列出不相关候选；示例和候选在阅读上压过用户已确认内容。
- 建议方案：
  1. 将固定示例拆成类型无关模板或按 premise 动态生成占位示例。
  2. 渲染 `clarifications.md` 时，若示例与当前 premise 关键词明显不匹配，降级为“参考格式示例”，不放在主阅读区。
  3. `preview plan` 的 AI 候选分叉只引用当前故事生成/确认过的候选，不复用不相关模板。
  4. 增加测试：以“星际驿站”输入运行 stage interview，输出不得出现“晏无/编程施法/学院工坊”等固定词。
- 涉及文件/模块：
  - `templates/clarification/*.yaml`
  - `src/application/interview-story.ts`
  - `src/application/preview-apply.ts`
  - `src/application/creative-report.ts`
  - `tests/unit/interview-story.test.ts`
  - `tests/unit/preview-apply.test.ts`
- 验收标准：
  - 不同题材的 dogfood fixture 不会出现另一个题材的专名。
  - 未确认示例仍可帮助作者，但不能进入正典、报告摘要或计划主干。
  - `creative-plan.md` 的候选分叉与当前故事 premise 相关。
- 参考项目/资料：
  - 参考项目：GitHub Issue Forms。
  - 借鉴点：模板可以提供结构，但默认值不能伪装成用户当前问题。
  - 不照搬：不把小说创作变成固定表单。
  - 落地方式：示例只作为格式引导，故事内容必须来自当前 premise 或用户确认。
- 不做/边界：不取消示例分叉能力；只修复固定样例污染和渲染层级。

完成记录：

- 完成内容：通用 clarification 模板、cozy 示例和共创入口卡已移除“晏无、编程施法、学院工坊、贵族许可、边境小城、第三次寂静”等固定故事词，改为题材无关的格式示例。
- 验证方式：新增“星尘驿站”访谈和 plan preview 回归测试；运行构建、相关单测、changes 检查、diff 检查和 CLI 冒烟。
- 生成产物：新增 `changes/2026-05-04-remove-template-example-pollution.md` 记录模板/CLI 输出契约变化。
- 后续遗留：本任务不做按 premise 动态生成示例；如果后续要更贴合不同题材，可另开“动态示例适配”任务。

## P1 近期增强

### P1-1 降低 next 输出信息密度，提供新手默认视图（已完成，2026-05-04）

- 类型：信息架构、CLI 体验
- 背景/问题：`next` 一次输出推荐动作、创作模式、今日创作模式、最小快乐闭环、十个入口卡、作者画像、核心要素、缺口和结构问题。内容有价值，但对第一次使用者过载，真正推荐的第一步被淹没。
- 已有基础：`getStoryNext` 已有结构化数据和 JSON 输出。
- 缺口：缺少 progressive disclosure，所有信息默认全量展开。
- 建议方案：
  1. 默认只显示：当前阶段、推荐 1 条主动作、2 条可选入口、为什么推荐、下一条可复制命令。
  2. 增加 `--verbose` 或 `--all` 展开完整入口卡。
  3. 今日创作模式单独用 `storyspec next --modes` 或 `storyspec workbench` 展示。
  4. JSON 保持完整，文本输出分层。
- 涉及文件/模块：
  - `src/application/story-onboarding.ts`
  - `src/cli/commands/story-onboarding.command.ts`
  - `tests/unit/story-onboarding.test.ts`
- 验收标准：
  - 默认 `next` 输出不超过一个终端屏的主要内容。
  - 新用户能在 5 秒内看到“下一步复制这条命令”。
  - `--verbose` 仍能查看完整入口卡。
- 参考项目/资料：
  - 参考项目：Inquirer.js。
  - 借鉴点：先给少量可选项，详细说明按需展开。
  - 不照搬：不强制进入交互式选择。
  - 落地方式：文本渲染默认只展示最相关入口。
- 不做/边界：不删除入口卡字段和完整诊断能力。

完成记录：

- 完成内容：`storyspec next` 默认改成精简视图，只显示一条最推荐可复制命令、两个可选入口、当前缺口和展开提示；`--verbose` 展开完整工作台；`--modes` 单独展示今日创作模式。
- 验证方式：新增默认/verbose/modes 三类渲染测试；运行 `npm run build`、相关单测、`npm run check:changes`、`git diff --check`，并用 CLI 冒烟确认三种输出层级符合预期。
- 生成产物：新增 `changes/2026-05-04-next-progressive-disclosure.md`。
- 后续遗留：`--all` 目前等同于 `--verbose`；如果后续还要进一步压缩默认视图，可再单独拆出更严格的极简模式。

### P1-2 让 specification/apply 产物真正像第一版 StorySpec

- 类型：规格文档、创作产物质量
- 背景/问题：`apply specify` 后生成的 `specification.md` 标题仍是“规格预览”，内容主要是“原始创意 + 用户已确认列表 + 写作边界”，不像可指导创作的第一版 StorySpec。用户期待“作品骨架”，实际得到的是记录表。
- 已有基础：确认答案、required 状态和 preview/apply 流程已存在。
- 缺口：缺少面向作者阅读的 StorySpec v0 结构，例如作品定位、一句话故事、主角核心、关键冲突、世界规则、文风约束和下一步入口。
- 建议方案：
  1. `preview specify` 生成 StorySpec v0 草案结构，固定区分“作者已确认 / agent 建议 / 待确认”。
  2. apply 后标题改为“故事规格”或“StorySpec v0”，不再叫“预览”。
  3. 对已确认答案做归类和轻量重写，但保留来源路径。
  4. 若信息不足，保留 `[需要澄清]`，不要补假设。
- 涉及文件/模块：
  - `src/application/preview-apply.ts`
  - `src/domain/story-core-elements.ts`
  - `tests/unit/preview-apply.test.ts`
  - `docs/quickstart.md`
- 验收标准：
  - `specification.md` 第一屏能让作者理解“这本书是什么”。
  - 文档包含已确认、AI 建议、待确认三层。
  - 不再出现“本文件由 preview 生成；只有 apply 后才进入正式 specification”这类 apply 后矛盾文案。
- 参考项目/资料：
  - 参考资料：本仓库中心协议的“生成第一版 StorySpec”章节。
  - 借鉴点：草案是创作控制台，不是原始字段转储。
  - 不照搬：不要求一次生成完整九章规格。
  - 落地方式：先做 v0 轻量结构。
- 不做/边界：不绕过用户确认；不把 AI 建议改写成正典。

### P1-3 优化 creative:report/status 的摘要去重和成熟度解释

- 类型：报告质量、状态解释
- 背景/问题：`creative:report` 和 `status` 的“当前风味/摘要”多次重复拼接同一答案；已确认 6 个答案后仍大段提示“项目框架已建立，但小说灵魂仍待共创”或“还差主角/舞台”，容易让作者觉得自己的回答没有价值。
- 已有基础：核心要素面板能识别 partial/missing/confirmed。
- 缺口：摘要去重不足，成熟度提示缺少鼓励性和具体补洞路径。
- 建议方案：
  1. 摘要合成按核心要素去重，不重复 unit-shape、stage 等答案。
  2. partial 状态要说明“已确认了什么 / 还差什么 / 为什么值得补”。
  3. `status` 只展示 Top 3 缺口，更多内容放 `creative:report --verbose`。
  4. 让创作回声更贴近当前故事语言，不输出机械拼接。
- 涉及文件/模块：
  - `src/application/creative-report.ts`
  - `src/application/get-project-status.ts`
  - `tests/unit/creative-report.test.ts`
  - `tests/unit/get-project-status.test.ts`
- 验收标准：
  - 同一答案不会在摘要中重复出现。
  - 已确认内容被明确肯定，缺口提示具体可行动。
  - 报告不再把用户已提供的故事骨架描述成“仍没有灵魂”。
- 参考项目/资料：
  - 参考项目：Linear / GitHub issue status views。
  - 借鉴点：状态报告应先给当前进度，再给最小下一步。
  - 不照搬：不引入外部依赖或任务系统。
  - 落地方式：摘要分为“已成形 / 还缺 / 下一步”。
- 不做/边界：不降低成熟度门禁，只优化解释方式。

### P1-4 打通从 plan 到 tasks/context/write 的可执行路径

- 类型：工作流衔接、写作入口
- 背景/问题：`preview plan` 和 `apply --draft` 可用，但之后 `context:pack` 和 `tasks:board` 都因缺少 `tasks.md` 失败；`status` 建议 `/tasks`，但 CLI 没有生成 tasks.md 的等价命令，只有 agent prompt 和 board 读取命令。`draft:new` 可以创建空草稿，但没有提醒缺 tasks/Scene Card/context。
- 已有基础：`.codex/prompts/storyspec-tasks.md` 有任务生成规范；`tasks:board` 能读已有 tasks.md；`draft:new` 能创建草稿。
- 缺口：CLI 端没有“生成 tasks 预览/草案”的路径，失败提示也没有告诉用户下一步怎么补。
- 建议方案：
  1. 新增或明确 CLI 命令：`storyspec preview tasks <story>` / `storyspec apply <tasks-preview> --yes`，或让 `tasks:board` 在缺 tasks.md 时输出生成建议。
  2. `context:pack` 缺 tasks.md 时提示先运行对应 tasks 生成命令或 agent `/storyspec-tasks`。
  3. `draft:new` 创建空草稿后输出“仍需 Scene Card / tasks / context pack”的状态提醒。
  4. 文档中明确 CLI-only 与 agent-assisted 两条路径。
- 涉及文件/模块：
  - `src/cli/commands/tasks-board.command.ts`
  - `src/application/export-task-board.ts`
  - `src/application/manage-context-packs.ts`
  - `src/application/manage-drafts.ts`
  - `templates/commands/tasks.md`
  - `docs/quickstart.md`
- 验收标准：
  - plan apply 后，用户能看到一条明确路径生成 tasks.md。
  - 缺 tasks.md 的错误提示包含可复制修复命令。
  - draft 创建不会让用户误以为已经可以开始正文。
- 参考项目/资料：
  - 参考项目：Cucumber.js。
  - 借鉴点：从规格到可执行场景要有明确中间产物和失败原因。
  - 不照搬：不引入 Gherkin 语法。
  - 落地方式：tasks 是写作执行的 gate，缺失时要能自动指路。
- 不做/边界：不让正文写作绕过 tasks 和 Scene Card 门禁。

## P2 体验和效率

### P2-1 改善初始化输出顺序和成功反馈

- 类型：CLI 输出 polish
- 背景/问题：`init` 输出中“接下来”长列表出现在 `- 正在初始化小说项目...` 和“创建成功”之前，阅读顺序像任务还没结束。新用户容易误判是否已经成功。
- 建议方案：先显示 spinner 和成功，再显示下一步；长列表收缩为主路径 + 查看更多。
- 涉及文件/模块：`src/cli/commands/init.command.ts`
- 验收标准：初始化输出顺序为“开始 -> 成功 -> 下一步”。
- 不做/边界：不改变初始化实际行为。

### P2-2 让 Scene Card 模板使用当前故事上下文

- 类型：模板质量、写作前置
- 背景/问题：`scene:init` 创建的 `scene-001.yaml` 仍是“起始地点 / world.example.rule / canon.example.fact”等占位，未引用当前 `specification.md` 中的驿站、岑舟、航务局等内容。
- 建议方案：有 specification/clarifications 时，Scene Card 默认填入当前故事候选上下文；无法推断时再保留占位。
- 涉及文件/模块：`src/application/story-structure.ts`、`templates/scenes/scene-001.yaml`
- 验收标准：对 dogfood 故事生成的 Scene Card 至少包含故事名、已确认舞台和主角候选。
- 不做/边界：自动填入内容标记为候选，不直接写 canon。

## 完成同步

完成本路线任一批次后：

- 更新本文对应任务状态和证据。
- 如涉及 CLI 行为、模板契约或生成产物，新增 `changes/*.md`。
- 同步 `README.md` / `docs/quickstart.md` 中的真实推荐流程。
- 运行与变更匹配的 `npm run build`、相关单测、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes` 或 `git diff --check`。
- 路线全部完成后，按 [todo-governance.md](todo-governance.md) 归档到 [todo-archive.md](todo-archive.md)。
