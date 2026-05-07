# 项目优化建议池路线图

## 状态

Planned。本文收纳本轮讨论出的项目优化建议，作为后续拆分和 OpenSpec 激活的前置入口；其中多用户账号与项目隔离已有独立路线，本文只作横向关联，不重复展开权限设计。

## 背景和目标

StorySpec 当前已经完成本机 Web 工作台第一阶段，核心创作流程和主要文档契约也已基本收口。接下来更值得做的，不是再扩一个大功能，而是把用户最容易感到“卡一下”的横向体验整理成明确待办：

1. 让 CLI、App、README 和路线文档对同一件事说同一种话。
2. 让作者更容易回到上一次的项目、状态和下一步。
3. 让 `outline -> tasks -> scene -> draft -> review` 的写作链路更顺。
4. 让参考作品反向拆解继续增强，但不越过原创边界。
5. 让文档只描述真实可用能力，减少承诺和实现状态不一致。
6. 保留多用户账号与项目隔离作为后续独立路线，不混进本机单人工作台主线。

## 非目标

- 不在本文直接实现代码。
- 不把已完成能力重新写一遍。
- 不把讨论结论写成已完成能力。
- 不把多用户路线并入本机单人 App 第一阶段。
- 不在本文引入新的外部依赖或前端框架。

## P2 体验与收口

### P2-1 状态语义统一

- 类型：文案、流程、一致性
- 背景/问题：`preview / confirm / apply`、`dry-run`、`blocked`、`Active`、`Planned` 等说法散在 CLI、App、README 和路线文档中，容易让作者误判“现在到底能不能写入、能不能发布、是不是已经完成”。
- 已有基础：本机 App 已有明确 session token、项目 allowlist、preview/apply 门禁和任务/章节的 dry-run 边界。
- 缺口：缺少一套统一口径，把“候选、预览、确认、写入、阻断”对外说明成同一个体系。
- 建议方案：梳理 CLI、App、README、todo-index、todo-archive 和相关路线文档中的状态词，统一成一套对外可读的词汇和解释。
- 涉及文件/模块：`README.md`、`docs/tech/todo-index.md`、`docs/tech/todo-archive.md`、`docs/tech/app-multiuser-roadmap.md`、`docs/tech/project-optimization-roadmap.md`、App 相关命令与页面文案。
- 验收标准：同一状态在不同入口的命名、含义和说明一致；不会再出现“文档写已完成、页面还是预览”的歧义。
- 参考资料：本次讨论记录、现有 `preview/apply` 相关实现、`todo-index.md` 和 `README.md`。
- 不做/边界：不改变现有门禁策略，只做语义和呈现收口。

### P2-2 项目回流闭环

- 类型：导航、状态回访、效率
- 背景/问题：作者在关闭页面或切换项目后，往往需要很快回到“最近项目、当前状态、下一步”三件事；如果入口分散，就会重新找路。
- 已有基础：`storyspec app` 已有最近项目、项目抽屉、当前项目状态和启动后打开项目能力。
- 缺口：缺少更顺滑的回流路径，例如最近项目、当前项目状态、下一步建议和继续创作入口之间的统一跳转体验。
- 建议方案：把“最近项目 -> 当前状态 -> 下一步 -> 继续创作”整理成单一回流链路，并在 App 和 CLI 里对齐提示。
- 涉及文件/模块：`src/app-server/local-app-server.ts`、`src/app-server/local-app-html.ts`、`src/cli/commands/app.command.ts`、`src/application/get-project-status.ts`、`src/application/*next*` 相关模块。
- 验收标准：用户重新打开 App 后，可以在不记命令的情况下回到上次项目，并明确看到下一步要做什么。
- 参考资料：`docs/tech/app-multiuser-roadmap.md`、当前本机 App 实现、`storyspec next` 和 `storyspec status` 的现有输出。
- 不做/边界：不把它做成云端同步或账号系统。

### P2-3 写作链路收紧

- 类型：工作流、章节生产、任务衔接
- 背景/问题：当前已经有 outline、tasks、scene、draft、review 等能力，但作者仍可能需要在多个命令和页面之间来回确认，链路感不够强。
- 已有基础：章节生产流程、Scene Card、任务板、草稿入口和写后自检已经完成。
- 缺口：缺少把“从大纲到正文”讲成一条更顺手的主线，而不是一组彼此独立的命令。
- 建议方案：围绕 `outline -> tasks -> scene -> draft -> review` 的顺序，补齐每一步的下一跳提示和缺口说明，减少作者反复判断去哪里。
- 涉及文件/模块：`src/application/manage-outline-candidates.ts`、`src/application/export-task-board.ts`、`src/application/create-scene-card.ts`、`src/application/manage-drafts.ts`、`src/application/review-project.ts`、相关 README/docs。
- 验收标准：作者能顺着一个明确路径完成从候选大纲到章节草稿的流转，不需要额外猜命令。
- 参考资料：`docs/tech/archive/completed-roadmaps/chapter-production-workflow-roadmap.md`、`docs/tech/archive/completed-roadmaps/immersive-drafting-roadmap.md`。
- 不做/边界：不把正文写作改成富文本编辑器或重 UI 组件。

### P2-4 反向拆解增强

- 类型：资料内化、原创边界、创作输入
- 背景/问题：`reference:reverse` 第一版已经能做 preview-only 的反向拆解，但作者还可能希望它更好地帮助“保留喜欢的结构、剔除讨厌的内容、继续原创开发”。
- 已有基础：参考作品反向拆解 preview-only 流程、本地 research 资料管理、candidate / preview / confirm / apply 边界。
- 缺口：缺少更细的“结构吸引力、原作依赖项、高风险相似项、可原创化结构、读者承诺、修复方向”表达层。
- 建议方案：在不越过版权和原创边界的前提下，继续增强反向拆解的结构化输出，让它更适合后续原创开发。
- 涉及文件/模块：`src/application/` 中 research、ingest、preview 相关模块，`src/cli/commands/`，`templates/commands/`，`docs/creative-control.md`。
- 验收标准：后续增强能更清楚地区分“喜欢什么”“不能照搬什么”“可以怎么原创化”。
- 参考资料：`docs/tech/archive/completed-roadmaps/reference-reverse-roadmap.md`、现有 `research:*` 和 `reference:reverse` 实现。
- 不做/边界：不下载或抓取原作文本，不生成未经授权的续写正文，不把专有设定直接写入正典。

### P2-5 文档收口

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

1. 先做状态语义统一和项目回流闭环。
2. 再做写作链路收紧和反向拆解增强。
3. 最后做文档收口。
4. 多用户账号与项目隔离按 `app-multiuser-roadmap.md` 独立推进。

## 完成同步

- 任何一项进入实现前，先转成对应的 OpenSpec change。
- 若新增用户可见行为、模板契约或文档承诺，更新 README / docs / changeset。
- 当某项真正完成后，回填到 `todo-archive.md`，并从 `todo-index.md` 的活跃入口中移除。
