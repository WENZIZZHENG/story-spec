# 协作写作与正典合并路线图

## 状态

Active。本文承接多人协作、候选审阅、正典合并、评论审批、导入导出、团队模板和长期商业能力。它必须建立在作者控制权、来源追踪和 preview / confirm / apply 边界之上。

## 覆盖功能缺口

- 多人协作能力：presence、评论线程、提及、审批状态、活动流、通知偏好、审稿面板和冲突提示。
- StorySpec 正典合并协议：candidate 对象、apply request、canon patch、风险摘要、来源追踪、审批链、冲突检测、回滚、部分应用、多候选对比、正典锁和 deferred 回流。
- 导入、导出和发布链路：Web 导入、资料导入、项目包导出、章节导出、EPUB/PDF 研究、context pack UI、发布前检查和发布 dry-run。
- 插件、类型包和团队模板：团队级 preset、项目模板、版本 pin、启用/禁用/回滚 UI、权限声明、共享知识库和安全边界。
- 计费、公开协作和企业能力：当前只保留长期研究，不阻塞自托管多人基础。

## P1-6 协同写作数据模型与正典合并协议

- 类型：协作模型、正典保护、版本管理
- 状态：已完成首批协议底座、HTTP 控制面与 PostgreSQL repository（2026-05-14）。`add-collaboration-canon-merge-protocol` 已新增 proposal、comment thread、review decision、apply request、canon patch、version snapshot、内存 repository 和 apply gate；`add-collaboration-canon-api-control-plane` 已把 proposal/review/patch/apply-request mutation 接入 multiuser server、项目权限守卫、readiness 和 audit log；`add-collaboration-canon-postgres-repository` 已新增协作表、migration v2、数据库 repository 和 server wiring；后续仍需评论/审批 UI、活动流、通知和真实 apply executor。
- 背景/问题：多人在线写作的核心难点不是“多人同时输入文字”，而是谁的候选可以进入正典、冲突如何处理、评论如何关联证据、agent 输出如何被审阅。
- 已有基础：preview/apply、clarifications、outline candidates、draft promote dry-run、audit、job output preview-only。
- 缺口：首批对象模型、HTTP mutation 和 PostgreSQL repository 已完成；仍缺 draft session、评论/审批 UI、活动流、通知、apply executor、回滚执行和部分应用。
- 建议方案：
  1. 定义候选/评论/审批/应用的状态机。
  2. 区分实时编辑草稿和正式故事产物；正式产物只通过可审计 apply。
  3. 增加冲突检测：基于文件版本、故事阶段、正典事实和任务状态判断是否可应用。
- 涉及文件/模块：`src/application/preview-apply.ts`、`src/application/manage-drafts.ts`、`src/server/audit/*`、`src/server/jobs/*`、`src/server/collaboration/*`、`src/server/http/multiuser-server.ts`。
- 验收标准：两个用户/agent 对同一章节提出候选时不会静默覆盖；apply 请求包含来源、diff、风险、审批人和回滚入口；正式 `specification.md`、`creative-plan.md`、content、tracking 继续受门禁保护。首批底座已覆盖 apply gate、blocked reasons、HTTP mutation 和 PostgreSQL repository；后续验收需要补真实 apply executor。
- 参考项目/资料：Yjs shared types 与 ProseMirror transaction 模型作为实时编辑参考；StorySpec preview/apply 作为正式写入参考。
- 不做/边界：不把 CRDT 文档直接当作正典；这是 StorySpec 的核心边界，优先级高于实时编辑炫技。

## P2-1 评论、审批、通知和活动流

- 类型：协作体验、审稿流程
- 背景/问题：多人平台需要让作者、编辑、审稿者和 agent 围绕候选内容讨论，而不是只共享文件。
- 已有基础：review findings、feedback import/triage、audit log、tasks board。
- 缺口：缺评论线程、行内/段落锚点、审批状态、通知偏好、活动流和任务联动。
- 建议方案：先实现项目内 activity/audit 可读流，再实现 comment thread 和 review decision，最后接通知。
- 涉及文件/模块：`src/application/manage-feedback.ts`、`src/application/review-project.ts`、`src/server/audit/*`、未来 collaboration/comment domain。
- 验收标准：评论可锚定到故事、章节、候选或任务；审批能转成 apply request 或 task；通知可关闭；审计记录可追溯。
- 参考项目/资料：Liveblocks comments/notifications 作为体验边界参考。
- 不做/边界：不引入邮件/短信等外部通知，除非另开 OpenSpec；评论和审批不会直接写正典。

## P2-2 导入、导出和发布链路

- 类型：导入导出、发布、正典保护
- 背景/问题：完整 App 需要导入现有项目、资料和正文，也需要导出项目包、章节合集、审稿报告和发布 dry-run，但导入资料不能静默变成正典。
- 已有基础：项目 snapshot/export/delete plan、compile manuscript、context pack、preview/apply。
- 缺口：缺少 Web 导入流程、Markdown/txt/docx 导入、设定表格导入、导出包校验、EPUB/PDF 研究、context pack UI、发布前检查和发布 dry-run。
- 建议方案：先实现导入预览和导出包校验，再研究发布格式；所有导入默认生成候选或预览，发布前检查必须能阻断高风险未确认内容。
- 涉及文件/模块：`src/application/compile-manuscript.ts`、`src/application/manage-context-packs.ts`、`src/server/projects/*`、未来 web import/export UI。
- 验收标准：导入默认只生成候选或预览；导出可复现、可校验；发布前检查能阻断缺章、未回收伏笔、未确认候选、任务未完成和正典冲突。
- 不做/边界：导入资料不能自动变正典；不在本任务承诺完整 EPUB/PDF 发布链。

## P3-1 插件、类型包和团队模板

- 类型：生态、产品化
- 背景/问题：当前已有 plugins、extension、preset，但还不是在线平台中的团队模板和插件市场。
- 缺口：缺团队级 preset、项目模板、类型包版本 pin、插件启用/禁用/升级/回滚 UI 和审计、插件权限声明、团队共享知识库、影响预览和安全边界。
- 建议方案：先定义团队级启用、版本 pin、审核、禁用和回滚模型，再考虑 UI。
- 验收标准：插件/类型包在多人项目中可追溯、可禁用、可回滚；启用影响先预览再应用；插件启用不会绕过项目权限和写入门禁。
- 不做/边界：不做公开 marketplace，先做自托管团队级生态。

## P3-2 计费、公开协作和企业部署

- 类型：长期研究
- 背景/问题：完整 SaaS 通常需要计费、组织管理、公开邀请、企业部署和 SLA，但这些不是当前自托管基础的下一步。
- 可能能力：订阅、团队席位、用量统计、公开分享链接、企业 SSO、组织管理、审计导出、数据保留策略、高可用、多区域备份和 Kubernetes 部署。
- 建议方案：只在真实用户需求明确后另起路线。
- 验收标准：有用户场景、数据合规和部署需求证据后再规划。
- 不做/边界：当前不进入活跃开发，不阻塞自托管多人基础。
