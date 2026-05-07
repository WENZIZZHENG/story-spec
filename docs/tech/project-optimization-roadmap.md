# 项目优化建议池路线图

## 状态

Partially completed。P0 写作链路收紧和章节小样预览已通过 `openspec/changes/add-chapter-writing-lane-sample-preview` 实现并归档；P2 状态语义统一和项目回流闭环已通过 `openspec/changes/add-status-resume-lane` 实现并归档；P2 反向拆解增强已通过 `openspec/changes/enhance-reference-reverse-development` 实现并归档；本文继续保留文档收口和 P3 关联路线，作为之后拆分和 OpenSpec 激活的前置入口。其中多用户账号与项目隔离已有独立路线，本文只作横向关联，不重复展开权限设计。

## 背景和目标

StorySpec 当前已经完成本机 Web 工作台第一阶段，核心创作流程和主要文档契约也已基本收口。接下来更值得做的，不是再扩一个大功能，而是把用户最容易感到“卡一下”的横向体验整理成明确待办：

1. 让 CLI、App、README 和路线文档对同一件事说同一种话。
2. 让作者更容易回到上一次的项目、状态和下一步。
3. 让 `outline -> tasks -> scene -> sample -> draft -> review` 的写作链路更顺，并在完整正文前加入章节小样预览。
4. 让参考作品反向拆解继续增强，但不越过原创边界。
5. 让文档只描述真实可用能力，减少承诺和实现状态不一致。
6. 保留多用户账号与项目隔离作为后续独立路线，不混进本机单人工作台主线。

## 非目标

- 不在本文直接实现代码。
- 不把已完成能力重新写一遍。
- 不把讨论结论写成已完成能力。
- 不把多用户路线并入本机单人 App 第一阶段。
- 不在本文引入新的外部依赖或前端框架。

## P0 已完成

### P0-1 写作链路收紧

- 类型：工作流、章节生产、任务衔接
- 状态：Completed，2026-05-07。完成证据见 `changes/2026-05-07-chapter-writing-lane-sample-preview.md` 和 `openspec/changes/add-chapter-writing-lane-sample-preview`。
- 背景/问题：当前已经有 outline、tasks、scene、draft、review 等能力，但作者仍可能需要在多个命令和页面之间来回确认，链路感不够强。尤其进入章节写作时，如果上下文、Scene Card、任务和草稿状态没有自然串起来，用户会被迫自己判断下一步。
- 已有基础：章节生产流程、Scene Card、任务板、草稿入口和写后自检已经完成；本机 App 也已有章节草稿创建、草稿列表、草稿发布 dry-run、Scene Card 初始化和章节级写后自检入口。
- 缺口：缺少把“从大纲到正文”讲成一条更顺手的主线，而不是一组彼此独立的命令；也缺少每一步完成后的下一跳提示和缺口说明。
- 已实现方案：新增只读章节写作通道，按 `outline -> tasks -> scene -> sample -> draft -> review` 展示每一步状态、下一跳提示、阻断原因、可执行命令或 App 行动入口。章节写作入口会提示当前卡在大纲、任务、Scene Card、小样、草稿还是 review，而不是只暴露孤立命令。
- 涉及文件/模块：`src/application/manage-outline-candidates.ts`、`src/application/export-task-board.ts`、`src/application/create-scene-card.ts`、`src/application/manage-drafts.ts`、`src/application/review-project.ts`、`src/app-server/local-app-server.ts`、`src/app-server/local-app-html.ts`、相关 README/docs。
- 验收标准：作者能顺着一个明确路径完成从候选大纲到章节草稿的流转；每一步能看到当前状态、下一步动作、阻断原因和不会自动写入的边界。
- 参考资料：`docs/tech/archive/completed-roadmaps/chapter-production-workflow-roadmap.md`、`docs/tech/archive/completed-roadmaps/immersive-drafting-roadmap.md`、`docs/tech/app-multiuser-roadmap.md` 的本机 App 第一阶段记录。
- OpenSpec 输入：已落地为 `add-chapter-writing-lane-sample-preview`。
- 不做/边界：不把正文写作改成富文本编辑器或重 UI 组件；不绕过 Scene Card、任务门禁或 preview / confirm / apply。

### P0-2 章节小样预览与确认扩写

- 类型：章节写作、预览确认、正文生成控制
- 状态：Completed，2026-05-07。完成证据见 `changes/2026-05-07-chapter-writing-lane-sample-preview.md` 和 `openspec/changes/add-chapter-writing-lane-sample-preview`。
- 背景/问题：当前章节写作已经有“约束卡 -> beat 预览 -> 正文块 -> 写后自检”，但 beat 只是方向预览，不能让作者提前感受本章读起来的情绪、身体感、叙事口吻和场景质地。一次性生成完整章节后再修改，返工成本高，也容易在正文已生成后才发现人物反应、尺度、爽点或节奏不对。
- 已有基础：`templates/commands/write.md` 和 `templates/commands/write.prompt.md` 已要求章节前置约束卡、3-6 条 scene beat、写中沉浸、分块正文和写后自检；`storyspec draft:new` / `draft:list` / `draft:promote` 已提供章节草稿与发布 dry-run；本机 App 已接入章节草稿入口和章节级写后自检。
- 缺口：缺少“章节小样”这一中间产物。系统现在能说明本章准备写什么，也能生成完整正文，但不能先输出一版 800-1500 字左右的精简预览稿，让作者低成本确认读感和修改方向。
- 已实现方案：
  1. 在章节流程中加入 `阶段 1.5 - 章节小样`：约束卡和 beat 确认后，先生成一段精简预览稿，像缩略正文而不是纯大纲。
  2. 小样只用于确认本章读感、情绪顺序、人物反应、冲突推进、尺度边界和文风方向，不更新 tracking，不写入正式正文，不算正典。
  3. 作者可以选择确认、要求改写小样、补充约束或退回 beat；只有小样确认后，才进入完整章节分块生成。
  4. 完整章节生成时以确认后的小样为创作依据，但仍要遵守 Scene Card、任务边界、约束卡和写后自检。
- 涉及文件/模块：`templates/commands/write.md`、`templates/commands/write.prompt.md`、`templates/authoring/chapter-card.md`、`docs/agent-guides/story-creation-guide.md`、`src/application/manage-drafts.ts`、`src/app-server/local-app-server.ts`、`src/app-server/local-app-html.ts`、相关 command artifact tests。
- 验收标准：章节写作流程能清楚展示“约束卡 -> beat 预览 -> 章节小样 -> 完整正文 -> 自检”；小样默认不写入正式正文、不更新 tracking；作者确认或改写小样后，完整章节能按确认版本扩写；文档和 prompt 不把小样说成已完成章节。
- 参考资料：`docs/tech/archive/completed-roadmaps/immersive-drafting-roadmap.md`、现有 `/write` 阶段性反馈契约、`draft:promote` dry-run 边界、本次讨论中的“先看精简版，再决定怎么改，最后生成完整章节”。
- OpenSpec 输入：已落地为 `add-chapter-writing-lane-sample-preview`。
- 不做/边界：不取消 beat 预览；不让小样自动进入正文、canon 或 tracking；不把小样变成另一个完整草稿版本管理系统；不降低高风险内容和作者确认门禁。

## P2 已完成

### P2-1 状态语义统一

- 类型：文案、流程、一致性
- 状态：Completed，2026-05-07。完成证据见 `changes/2026-05-07-status-resume-lane.md` 和 `openspec/changes/add-status-resume-lane`。
- 背景/问题：`preview / confirm / apply`、`dry-run`、`blocked`、`Active`、`Planned` 等说法散在 CLI、App、README 和路线文档中，容易让作者误判“现在到底能不能写入、能不能发布、是不是已经完成”。
- 已有基础：本机 App 已有明确 session token、项目 allowlist、preview/apply 门禁和任务/章节的 dry-run 边界。
- 缺口：缺少一套统一口径，把“候选、预览、确认、写入、阻断”对外说明成同一个体系。
- 已实现方案：新增继续创作回流摘要和状态词表，统一解释 `candidate`、`preview`、`apply`、`dry-run`、`blocked`、`read-only`、`active`、`planned`；README 和 App 同步同一套写入边界。
- 涉及文件/模块：`README.md`、`docs/tech/todo-index.md`、`docs/tech/todo-archive.md`、`docs/tech/app-multiuser-roadmap.md`、`docs/tech/project-optimization-roadmap.md`、App 相关命令与页面文案。
- 验收标准：同一状态在不同入口的命名、含义和说明一致；不会再出现“文档写已完成、页面还是预览”的歧义。
- 参考资料：本次讨论记录、现有 `preview/apply` 相关实现、`todo-index.md` 和 `README.md`。
- 不做/边界：不改变现有门禁策略，只做语义和呈现收口。

### P2-2 项目回流闭环

- 类型：导航、状态回访、效率
- 状态：Completed，2026-05-07。完成证据见 `changes/2026-05-07-status-resume-lane.md` 和 `openspec/changes/add-status-resume-lane`。
- 背景/问题：作者在关闭页面或切换项目后，往往需要很快回到“最近项目、当前状态、下一步”三件事；如果入口分散，就会重新找路。
- 已有基础：`storyspec app` 已有最近项目、项目抽屉、当前项目状态和启动后打开项目能力。
- 缺口：缺少更顺滑的回流路径，例如最近项目、当前项目状态、下一步建议和继续创作入口之间的统一跳转体验。
- 已实现方案：新增 `ProjectStatus.resume`，本机 App 新增 `/api/projects/current/resume` 和“继续创作”卡，打开或创建项目后可直接看到当前状态、推荐下一步、可复制命令、写入模式和状态词解释。
- 涉及文件/模块：`src/app-server/local-app-server.ts`、`src/app-server/local-app-html.ts`、`src/cli/commands/app.command.ts`、`src/application/get-project-status.ts`、`src/application/*next*` 相关模块。
- 验收标准：用户重新打开 App 后，可以在不记命令的情况下回到上次项目，并明确看到下一步要做什么。
- 参考资料：`docs/tech/app-multiuser-roadmap.md`、当前本机 App 实现、`storyspec next` 和 `storyspec status` 的现有输出。
- 不做/边界：不把它做成云端同步或账号系统。

### P2-3 反向拆解增强

- 类型：资料内化、原创边界、创作输入
- 状态：Completed，2026-05-07。完成证据见 `changes/2026-05-07-reference-reverse-development.md` 和 `openspec/changes/enhance-reference-reverse-development`。
- 背景/问题：`reference:reverse` 第一版已经能做 preview-only 的反向拆解，但作者还需要更细地区分“喜欢什么”“不能照搬什么”“可以怎么原创化”。
- 已有基础：参考作品反向拆解 preview-only 流程、本地 research 资料管理、candidate / preview / confirm / apply 边界。
- 已实现方案：`storyspec reference:reverse` 新增结构吸引力、读者承诺、修复方向和原创化指南；JSON 与文本输出同步暴露新增层，agent prompt 也要求输出这些分区。
- 涉及文件/模块：`src/application/reverse-reference.ts`、`tests/unit/reverse-reference.test.ts`、`tests/smoke/reference-reverse-cli.test.ts`、`templates/commands/reference-reverse.prompt.md`、README 和 changeset。
- 验收标准：输出能清楚区分喜欢点、原作依赖项、高风险相似项、可原创化结构、读者承诺、修复方向和原创化指南；仍不下载原作、不生成续写正文、不写入正典。
- 参考资料：`docs/tech/archive/completed-roadmaps/reference-reverse-roadmap.md`、现有 `research:*` 和 `reference:reverse` 实现。
- 不做/边界：不下载或抓取原作文本，不生成未经授权的续写正文，不把专有设定直接写入正典。

## P2 体验与收口

### P2-4 文档收口

- 类型：文档、事实源、用户承诺
- 背景/问题：项目已经走过多轮功能迭代，最容易出问题的是“文档先写成了能力承诺，但实现还没跟上”，或者不同文档重复描述同一件事。
- 已有基础：README、changeset、todo-index、todo-archive 和各专题 roadmap 已经构成基本文档体系。
- 缺口：需要继续收紧“哪些是已实现能力、哪些只是待办、哪些只是归档证据”的边界。
- 建议方案：逐步清理 README、docs/commands、docs/workflow、todo-index 和 todo-archive 的重复描述，保留真实可用能力和明确待办。
- 涉及文件/模块：`README.md`、`docs/commands.md`、`docs/workflow.md`、`docs/tech/todo-index.md`、`docs/tech/todo-archive.md`、`changes/*.md`。
- 验收标准：用户文档和待办文档之间不再互相打架；README 只讲真实可用能力。
- 参考资料：现有 README、todo-governance、todo-index 和完成归档条目。
- 不做/边界：不把未实现能力写进 README，也不把 changeset 当成待办。

## P3 关联路线

### P3-1 多用户账号与项目隔离

- 类型：权限、数据隔离、存储、部署
- 状态：已有独立路线 [单人 App 与多用户项目隔离路线图](app-multiuser-roadmap.md)
- 本路线关系：本路线只作为横向优化建议池的关联入口，不重复展开账号模型、授权检查和隔离设计。
- 验收参考：项目默认私有、跨用户访问失败、导出与删除有明确结果。
- 参考资料：`docs/tech/app-multiuser-roadmap.md`
- 不做/边界：不在本路线里实现团队协作、公开社区或实时编辑。

## 建议推进顺序

1. P0 已完成：写作链路收紧，以及章节小样预览与确认扩写。
2. P2 已完成：状态语义统一和项目回流闭环。
3. P2 反向拆解增强已完成。
4. 后续优先做文档收口。
5. 多用户账号与项目隔离按 `app-multiuser-roadmap.md` 独立推进。

## 完成同步

- 任何一项进入实现前，先转成对应的 OpenSpec change。
- 若新增用户可见行为、模板契约或文档承诺，更新 README / docs / changeset。
- 当某项真正完成后，回填到 `todo-archive.md`，并从 `todo-index.md` 的活跃入口中移除。
