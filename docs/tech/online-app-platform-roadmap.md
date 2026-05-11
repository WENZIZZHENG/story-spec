# 完整 App 与多人在线写作平台路线图

## 状态

Planned。本文把 2026-05-11 项目体检结论和“多人在线写作平台 / 完整 App”缺口合并为下一条活跃候选路线。它是 OpenSpec 的上游待办入口，不直接表示这些能力已经实现；进入开发前必须把选中的任务转成独立 OpenSpec change。

## 当前主线

先把构建、依赖、命令产物和多用户运行地基收稳，再把 StorySpec 从“本机 CLI + 实验性本机工作台 + 多用户控制面基础”推进为“可自托管的多人写作 App”。任何多人协作、富文本、实时编辑、agent 自动执行或正典合并能力，都必须继续保留作者确认、preview / confirm / apply、来源追踪和可回滚边界。

## 背景和体检证据

- 2026-05-11 体检通过：`npm run build`、`npm test`、`npm run test:smoke`、`npm run test:coverage`、`npm run check:changes`、`npm run check:command-manifest`。
- 覆盖率基线：overall statements 85.93%，branches 78.91%，functions 92.33%，lines 85.93%；但 `src/plugins/manager.ts`、`src/utils/interactive.ts`、多用户真实 driver / worker 边界和部分命令外壳仍是测试盲区。
- 当前 `storyspec app` 已覆盖本机服务地基、零依赖工作台 shell、项目抽屉、最近项目、创作入口、核心缺口、多大纲候选、只读任务板、章节写作通道、章节草稿入口、写后自检和继续创作回流。
- 当前 `storyspec server` 已有多用户控制平面基础、session/project guard、项目/成员/job 列表、job 控制、审计/配额守卫、runtime adapter foundation、数据库 schema/migration plan 和最小自托管说明。
- 仍未完成：真实 PostgreSQL driver/连接池、Redis/BullMQ worker、真实 OpenHands/agent 执行、账号/团队完整产品流、浏览器端完整前端、实时协同编辑、评论/审批/通知、生产级部署运维。

## 非目标

- 不把本文内容写进 README 的“已可用能力”。
- 不在一个 OpenSpec 里一次性实现完整 SaaS。
- 不绕过 StorySpec 的作者确认、候选与正典边界。
- 不默认引入大型前端框架、CRDT、数据库 driver 或队列依赖；具体依赖必须在对应 OpenSpec 中单独论证。
- 不承诺商业计费、企业高可用、Kubernetes 或公开社区能力。

## 参考资料校准

- 参考资料：Yjs 官方文档（https://docs.yjs.dev/）
  - 借鉴点：shared types、awareness、离线与实时协同的数据模型。
  - 不照搬：不把所有 StorySpec 文件直接变成 CRDT 文档；正典、tracking 和任务状态仍需要 preview / apply 门禁。
  - 落地方式：只在浏览器编辑会话、评论草稿、章节草稿协作中评估 CRDT；正式故事产物继续有明确写入事务和审计记录。
- 参考资料：Tiptap Collaboration / Hocuspocus 官方文档（https://tiptap.dev/docs/hocuspocus/）
  - 借鉴点：富文本编辑器、WebSocket 协作服务、provider 分层和多人 presence。
  - 不照搬：不把 Tiptap 作为默认结论；StorySpec 也可以先用 Markdown/结构化表单完成多人审批。
  - 落地方式：前端框架化和实时编辑任务中，把 Tiptap/Hocuspocus 作为候选实现之一比较。
- 参考资料：ProseMirror 官方文档（https://prosemirror.net/docs/guide/）
  - 借鉴点：schema、transaction、插件化编辑器模型。
  - 不照搬：不把编辑器内部 schema 直接等同于 StorySpec 的故事 schema。
  - 落地方式：富文本/Markdown 混合编辑器任务中，用它校准“编辑器状态”和“故事产物状态”的边界。
- 参考资料：Liveblocks 官方文档（https://liveblocks.io/docs）
  - 借鉴点：presence、comments、notifications、协作 App 常见能力边界。
  - 不照搬：默认不引入托管服务；自托管路线优先。
  - 落地方式：用作产品能力清单参考，具体实现优先走本仓库已有 server / audit / quota / job 基础。

## 完整功能缺口清单

本节把“多人在线写作平台 / 完整 App”仍缺的功能按产品能力列全。它不是一次性实现清单；后续开发应从本节中挑选单一主题，转成独立 OpenSpec change，再进入设计和实现。

### 1. 账号、团队和权限体系

- 缺少用户注册、登录、登出、session 续期和 token 撤销的完整产品流。
- 缺少工作区 / 团队 / 项目三层模型，当前多用户基础主要停留在 project membership。
- 缺少邀请协作：邀请链接、邮箱邀请、撤销邀请、过期邀请和邀请接受记录。
- 缺少角色权限矩阵：owner、editor、writer、reviewer、viewer、agent-runner 等角色需要明确可读、可写、可审批、可运行 agent 的范围。
- 缺少故事级权限：能否查看故事、编辑设定、运行 agent、发布章节、修改 creative-plan。
- 缺少章节级权限：某人只能写某卷、某章、某条支线，或只能评论不能修改。
- 缺少高风险操作权限：谁能 apply 正典、覆盖 `creative-plan.md`、提升候选大纲、删除项目、执行 agent job。
- 缺少权限 UI：用户需要看到按钮禁用原因和申请权限入口，而不是只收到 403。
- 验收标准：权限矩阵覆盖项目、故事、章节、候选、评论、agent job、导出、删除；跨用户访问失败；敏感动作进入 audit。
- 不做/边界：不先做商业计费和公开社区；权限体系必须先保护作者控制权。

### 2. 真实持久化和数据层

- 缺少真实 PostgreSQL driver、连接池和 server wiring；当前已有 schema、migration plan 和 repository adapter，但仍未接真实数据库。
- 缺少 migration runner：初始化、升级、重复执行、失败回滚和版本记录。
- 缺少事务边界：apply 正典、创建 job、写 audit、扣 quota 必须能作为一致事务处理。
- 缺少真实 repository：session、project、membership、agent job、audit、quota 都需要 database-backed 实现。
- 缺少数据库 integration tests，不能只依赖 memory repository 证明多用户能力。
- 缺少 `/ready` 数据库状态：连接失败、迁移未执行、schema 版本不匹配都应可见。
- 缺少数据备份、恢复、导出包校验和项目删除执行器。
- 缺少多租户隔离验证：用户 A 不能通过路径解析、job id、导出接口或错误信息探测用户 B 的项目。
- 验收标准：本地 compose 可启动 PostgreSQL-backed server；迁移可重复运行；数据库状态进入 ready；跨用户数据访问失败。
- 不做/边界：不默认引入复杂 ORM；是否引入 ORM 必须另行论证。

### 3. Worker 队列和 agent 真实执行

- 缺少 Redis / BullMQ 或等价队列；当前 Redis/BullMQ 仍是部署占位。
- 缺少独立 worker 进程，server 只能承担控制面，不能长期阻塞执行 agent job。
- 缺少完整 job lifecycle：queued、running、succeeded、failed、cancelled、retrying、timed-out。
- 缺少幂等键：重复提交同一请求不能重复生成或重复写候选。
- 缺少取消语义：取消时需要说明 runner 是否已停止、输出是否保留、状态如何落库。
- 缺少重试、超时、并发限制和配额消耗规则。
- 缺少运行日志：stdout/stderr、阶段进度、trace id、runner error code。
- 缺少 agent 输出落库模型：输出必须先成为 candidate / preview，不能直接写正典。
- 缺少真实 OpenHands 或其他 agent runtime 的 headless 执行接入；当前 OpenHandsRunner 仍是 PoC adapter。
- 验收标准：创建 job 后由 worker 异步处理；取消/重试状态明确；失败不会 apply；所有候选可追溯到 job/audit。
- 不做/边界：agent job 不得自动覆盖正式故事文件。

### 4. 完整前端 App 架构

- 缺少独立前端项目结构，例如 `web/` 或 `app/`。
- 缺少路由：项目列表、故事工作台、章节编辑、设定库、任务板、审稿、设置。
- 缺少 API client：统一处理鉴权、错误、loading、重试和 request id。
- 缺少登录态、权限态、空状态、错误状态和服务离线状态。
- 缺少全局导航：项目切换、故事切换、最近项目、搜索和命令面板。
- 缺少完整 App shell：侧边栏、顶部栏、状态提示、通知入口和当前写入模式提示。
- 缺少 E2E 测试：登录、打开项目、创建故事、编辑草稿、提交候选、审批 apply。
- 缺少可维护组件边界；当前 `src/app-server/local-app-html.ts` 适合本机实验页面，不适合作为长期 App 前端。
- 验收标准：前端入口能登录或绑定 session，按权限展示项目/故事/章节；API 错误统一呈现；本机 App fallback 不被破坏。
- 不做/边界：第一步不做实时协同和富文本编辑器，先做信息架构和 API contract。

### 5. 写作编辑器

- 缺少浏览器端章节草稿编辑器。
- 缺少 Markdown / 富文本 / 结构化表单的选型结论。
- 缺少自动保存、本地草稿缓存、恢复未保存内容和编辑锁/冲突提示。
- 缺少字数统计、章节目标、场景目标、节奏提示和当前任务边界。
- 缺少左侧故事上下文：Scene Card、任务、角色、世界观、伏笔、读者承诺。
- 缺少右侧审稿反馈：连续性、风格、人物动机、伏笔回收、世界观一致性。
- 缺少章节小样预览、完整正文、发布 dry-run 的 UI。
- 缺少草稿与正式章节 diff、版本历史、恢复旧版本和版本命名。
- 缺少移动端或窄屏编辑体验。
- 缺少粘贴长文清洗、结构识别和“候选而非正典”提示。
- 验收标准：编辑器第一版只能编辑草稿和评论；正式 content 写入仍走 `draft:promote` / apply；所有自动保存都不会污染正典。
- 不做/边界：实时编辑文档只是草稿态，不把 CRDT 文档直接当正典。

### 6. 多人协作能力

- 缺少在线 presence：谁正在看哪个项目、故事、章节或候选。
- 缺少光标 / 选区同步和编辑状态提示。
- 缺少评论线程：能绑定到故事、章节、段落、任务、候选大纲、设定项或 agent 输出。
- 缺少 `@mention`、评论分派、评论解决和重新打开。
- 缺少审批状态：待审、需修改、通过、拒绝、已应用。
- 缺少活动流：谁创建候选、谁评论、谁应用、谁回滚、哪个 agent 完成了什么。
- 缺少通知中心和通知偏好：评论、提及、审批、agent 完成、任务变更可以分别开关。
- 缺少协作任务联动：评论转任务、审稿意见转修订项、任务完成后回链到评论。
- 缺少审稿面板：编辑、世界观、连续性、风格、读者承诺等视角可组合。
- 缺少多人冲突提示：别人已经改过这一章时，当前候选需要重新对比。
- 验收标准：评论和审批不会直接写正典；协作事件进入 audit/activity；用户能从通知回到具体证据位置。
- 不做/边界：不默认引入托管协作服务；自托管优先。

### 7. StorySpec 正典合并协议

- 缺少统一 candidate 对象模型：AI 建议、作者草稿、编辑修改、参考拆解候选都应可区分来源。
- 缺少 apply request：申请把候选写入正式文件，需要记录发起人、审批人、来源、diff 和风险摘要。
- 缺少 canon patch：明确会改哪些 `specification.md`、`creative-plan.md`、content、tracking、world/canon 文件。
- 缺少风险摘要：会不会覆盖作者确认内容、改变角色关系、引入未确认设定、破坏章节任务。
- 缺少来源追踪：内容来自作者、AI、编辑、参考拆解还是导入资料。
- 缺少审批链：谁确认候选可以进入正典，谁只能评论，谁能要求修改。
- 缺少冲突检测：基于文件版本、故事阶段、正典事实、任务状态、章节状态判断是否可应用。
- 缺少回滚入口：apply 后能撤回到上个版本，并保留撤回原因。
- 缺少部分应用：只接受候选里的某几项，不整包应用。
- 缺少多候选对比：两个大纲、两个章节版本、两个角色关系推进方案可以并排比较。
- 缺少正典锁：某些设定已冻结，普通协作者或 agent 不能修改。
- 缺少“稍后决定”回流：多人评论后仍允许作者保持 deferred 状态，不被系统当作已确认。
- 验收标准：两个用户/agent 对同一章节提出候选时不会静默覆盖；正式产物只通过可审计 apply 修改；所有 apply 都可解释、可追踪、可回滚。
- 不做/边界：这是 StorySpec 的核心边界，优先级高于实时编辑炫技。

### 8. 项目与故事工作台

- 缺少完整项目首页：当前阶段、最近活动、阻塞项、推荐下一步、风险提示。
- 缺少故事档案视图：idea、核心要素、角色、势力、世界观、能力体系、关系线。
- 缺少章节总览：卷、章、状态、字数、任务完成度、审稿状态、发布状态。
- 缺少大纲视图：正式大纲、候选大纲、比较、提升记录和风险说明。
- 缺少任务板产品化：任务负责人、依赖、关联章节、阻塞原因、状态历史。
- 缺少伏笔 / 承诺看板：建立、推进、回收、过期风险和证据路径。
- 缺少角色关系图：确认关系、候选关系、变化证据和章节影响。
- 缺少世界观资料库：WorldFact、CanonFact、Research Source、引用关系。
- 缺少搜索：全文搜索、设定搜索、任务搜索、评论搜索、候选搜索。
- 缺少命令面板：把 CLI 能力转成 App action，同时保留写入边界。
- 缺少状态解释：candidate、preview、dry-run、apply、blocked 在 UI 中统一说明。
- 验收标准：作者重新打开项目后能在一个工作台判断“当前故事长成什么、卡在哪里、下一步做什么、会不会写入文件”。
- 不做/边界：工作台不得把未确认候选展示成已完成正典。

### 9. 导入、导出和发布链路

- 缺少导入现有 StorySpec 项目的 Web 流程。
- 缺少导入 Markdown、txt、docx 等正文或资料文件。
- 缺少导入设定表格、角色表、章节列表和研究资料。
- 缺少项目包导出和导出包校验。
- 缺少章节正文导出、Markdown 合集导出、审稿报告导出。
- 缺少 EPUB / PDF 等发布格式研究与生成链路。
- 缺少导出给其他 agent 的 context pack UI。
- 缺少发布前检查：缺章、未回收伏笔、未确认候选、任务未完成、正典冲突。
- 缺少发布 dry-run：展示会包含哪些章节、元数据、版本和风险。
- 验收标准：导入默认只生成候选或预览；导出可复现、可校验；发布前检查能阻断高风险未确认内容。
- 不做/边界：导入资料不能自动变正典。

### 10. 安全和数据保护

- 缺少明确登录策略：密码、OAuth、magic link 或自托管 token 模式需要产品决策。
- 缺少 CSRF、CORS、session cookie、same-site 和 secure cookie 策略。
- 缺少 rate limit 和暴力尝试防护。
- 缺少文件上传限制：大小、类型、路径、扫描和错误提示。
- 缺少敏感操作二次确认：删除、apply 正典、运行高成本 agent、导出项目。
- 缺少不可篡改或至少受保护的 audit log 策略。
- 缺少备份访问控制和密钥管理。
- 缺少删除流程：删除计划、二次确认、执行、可恢复窗口、最终清理。
- 缺少管理员工具：封禁 session、撤销 token、查看异常任务、冻结项目。
- 缺少 secret 管理：数据库、队列、agent runtime key、session secret。
- 缺少安全回归测试：越权访问、路径逃逸、重复提交、过期 token、跨项目 job 查询。
- 验收标准：所有高风险 API 有权限检查和审计；跨租户访问失败；删除和 apply 都有二次确认或等价门禁。
- 不做/边界：不为了方便协作降低作者控制权和数据隔离。

### 11. 生产部署和运维

- 缺少清晰部署拓扑：web、api、worker、PostgreSQL、Redis、文件存储。
- 缺少 `.env` 完整说明、启动前校验和错误提示。
- 缺少分层 health/ready：应用、数据库、队列、文件存储、worker。
- 缺少结构化日志和日志级别配置。
- 缺少 metrics：请求耗时、job 成功率、队列长度、错误率、数据库连接状态。
- 缺少 trace id 贯穿 HTTP request、job、audit 和 runtime log。
- 缺少数据库迁移回滚和升级失败恢复策略。
- 缺少版本升级说明和兼容矩阵。
- 缺少备份恢复演练文档。
- 缺少 Docker image 构建和发布策略。
- 缺少 Windows / Linux 自托管差异说明。
- 缺少资源限制：最大项目数、最大文件、最大并发 job、最大导入大小。
- 验收标准：自托管用户能按文档启动、升级、排错、备份、恢复；ready 能准确反映关键依赖状态。
- 不做/边界：不承诺 Kubernetes、企业高可用或 SLA，除非后续另起路线。

### 12. 测试体系

- 缺少 API contract tests，保证前端和 server 的字段契约稳定。
- 缺少真实数据库 integration tests。
- 缺少 worker queue tests：重试、取消、超时、幂等、失败恢复。
- 缺少权限矩阵测试：每个角色对关键资源和操作的允许/拒绝。
- 缺少多用户并发测试：两个用户同时评论、编辑候选、提交 apply request。
- 缺少 Playwright E2E：登录、项目、故事、编辑器、评论、审批、apply。
- 缺少前端视觉回归或关键截图检查。
- 缺少 migration tests：从旧 schema 到新 schema 的升级。
- 缺少备份恢复测试。
- 缺少安全回归：越权、路径逃逸、重复提交、过期 token。
- 缺少负载测试：多项目、多 job、长章节、大纲比较和大资料导入。
- 缺少浏览器兼容测试。
- 验收标准：每个多人平台 OpenSpec 都必须至少选择 unit / integration / e2e / security 中匹配风险的一组验证。
- 不做/边界：不以 coverage 数字替代关键行为场景。

### 13. 维护性和技术债

- `src/app-server/local-app-html.ts` 需要拆成页面区块、静态资源、API client 和状态渲染。
- `src/app-server/local-app-server.ts` 需要按项目、故事 intake、大纲任务、章节、review/resume 等 route group 拆分。
- `src/cli/commands/workbench.command.ts` 需要按命令族拆分，避免后续继续膨胀。
- `src/plugins/manager.ts` 需要拆 install plan、hook、source resolution、版本依赖和 apply 操作。
- `src/utils/interactive.ts` 覆盖率低，若继续保留交互式入口，应补测试或收敛职责。
- 命令产物和 compiled runtime 需要分离，避免 `build:commands` 影响 `dist/cli.js`。
- 包管理器策略需要统一，避免 `bun.lock` 与 npm install 行为分叉。
- 依赖升级需要分组和兼容矩阵。
- 文档事实边界检查需要持续执行，避免把路线图写成已实现功能。
- OpenSpec 完成后的归档规则需要继续执行，防止 todo-index 和 archive 分叉。
- 验收标准：拆分不改变 CLI 输出和 App 行为；现有 smoke 不退化；每次重构都有目标模块测试。
- 不做/边界：不做无关重构；只拆后续平台开发会直接触碰的模块。

### 14. 插件、类型包和团队模板

- 缺少团队级 preset：团队可统一启用题材包、审稿规则、写作偏好。
- 缺少项目模板：新项目从团队模板创建，不只从默认模板创建。
- 缺少类型包版本 pin：项目记录使用哪个 preset/extension 版本。
- 缺少插件启用、禁用、升级、回滚的 UI 和审计。
- 缺少插件权限声明：插件能读写哪些目录、能否提供 agent command、能否影响 App 行为。
- 缺少团队共享知识库：研究资料、风格偏好、审稿标准可复用。
- 缺少 preset 对项目的影响预览：启用前展示会新增/覆盖哪些模板和规则。
- 缺少插件安全边界：插件不能绕过项目权限、apply 门禁和 audit。
- 验收标准：插件/类型包在多人项目中可追溯、可禁用、可回滚；启用影响先预览再应用。
- 不做/边界：不做公开 marketplace，先做自托管团队级生态。

### 15. 计费、公开协作和企业能力

- 可能需要订阅、团队席位、用量统计和配额计费。
- 可能需要公开分享链接和只读公开项目。
- 可能需要企业 SSO、组织管理、审计导出和数据保留策略。
- 可能需要 SLA、高可用、多区域备份和 Kubernetes 部署。
- 这些能力当前缺用户需求证据，且会显著增加产品和合规复杂度。
- 验收标准：只有在出现明确用户场景、数据合规和部署需求证据后，才另起路线。
- 不做/边界：当前不进入活跃开发，不阻塞自托管多人基础。

## P0 立即处理

### P0-1 依赖安装与 CI 可复现性

- 类型：构建、CI、依赖治理
- 背景/问题：仓库锁文件是 `bun.lock`，但 CI 当前使用 `npm install --package-lock=false --ignore-scripts`，无法真正锁定依赖版本；本地也可能在 Node/npm 版本差异下装出不同依赖树。
- 已有基础：`bun.lock`、`.github/workflows/ci.yml`、`package.json` npm scripts、Node 20/22 CI 矩阵。
- 缺口：缺少明确的包管理器决策和 frozen install 验证；`npm audit` 在无 package-lock 时无法直接运行。
- 建议方案：
  1. 在 OpenSpec 中先确认包管理策略：继续 Bun lockfile，或迁移到 npm lockfile。
  2. 若继续 Bun，CI 改为安装 Bun 并使用 frozen lockfile；若迁移 npm，则生成并提交 `package-lock.json`，同时调整项目级 AGENTS 约定。
  3. 增加依赖安全检查策略，明确用 npm audit、bun audit 或第三方扫描。
- 涉及文件/模块：`.github/workflows/ci.yml`、`package.json`、`bun.lock`、可能新增 `package-lock.json`、`docs/local-development.md`、`AGENTS.md`。
- 验收标准：CI 和本地安装使用同一锁定策略；全新 checkout 能在 Ubuntu/Windows、Node 20/22 下稳定通过 `npm run verify` 或等价命令；安全扫描命令有文档入口。
- 参考项目/资料：npm / Bun 官方 install 与 lockfile 文档；当前仓库 CI。
- 不做/边界：本任务不升级依赖 major，不改变业务代码。

### P0-2 命令产物与 compiled runtime 分离

- 类型：构建、生成产物、验证链路
- 背景/问题：单独运行 `npm run build:commands` 会重建 ignored `dist/` 并移除 `dist/cli.js`、runtime bundle；随后直接运行 `npm run check:command-manifest` 会因为 manifest 生成依赖当前 compiled runtime 而失败。`verify` 通过二次 `npm run build` 规避了问题，但单独命令顺序容易踩坑。
- 已有基础：`src/prompt/build-commands.ts`、`scripts/build/command-artifact-manifest.ts`、`docs/local-development.md` 已提醒 smoke 前重跑 build。
- 缺口：命令产物输出目录和 TypeScript 编译产物耦合在 `dist/`；manifest 检查依赖临时状态。
- 建议方案：
  1. 将 agent command artifacts 输出到独立目录，例如 `dist-command-artifacts/` 或 `dist/agents/`，避免删除 compiled runtime。
  2. 或让 `build:commands` 先保留 runtime bundle，再清理 agent 子目录。
  3. 更新 manifest 检查，使其从确定的 build 输出读取 runtime，而不是依赖刚被重建的 `dist` 状态。
  4. 同步 `prepare`、`prepublishOnly`、README 和本地开发文档。
- 涉及文件/模块：`src/prompt/build-commands.ts`、`scripts/build/build-commands.ts`、`scripts/build/command-artifact-manifest.ts`、`package.json`、`docs/local-development.md`、`docs/tech/architecture.md`、相关 unit/smoke。
- 验收标准：任意顺序运行 `npm run build`、`npm run build:commands`、`npm run check:command-manifest` 不会因 compiled runtime 被删除而失败；`node dist/cli.js --help` 在推荐构建路径后可用；manifest 变化仍可被捕获。
- 参考项目/资料：当前 `verify` 顺序和 `docs/local-development.md` 的手工规避说明。
- 不做/边界：不手工提交完整 `dist`。

### P0-3 README 高频命令去重与事实边界巡检

- 类型：文档、事实源
- 背景/问题：README 高频命令表中 `storyspec server` 出现重复行；这不影响功能，但会削弱“文档只讲真实可用能力”的可信度。
- 已有基础：`README.md`、`docs/commands.md`、`docs/tech/todo-index.md`、`docs/tech/todo-archive.md` 已有事实边界规则。
- 缺口：缺少轻量文档巡检，把重复命令行、已完成路线残留在当前待办、实验性能力表述过满等问题一起收口。
- 建议方案：做一轮文档-only OpenSpec 或小修，去重 README，检查 `server`、`app`、多用户、富文本、云端、实时协作相关措辞，确保未实现能力只出现在 roadmap 或边界说明中。
- 涉及文件/模块：`README.md`、`docs/commands.md`、`docs/quickstart.md`、`docs/tech/todo-index.md`。
- 验收标准：高频命令无重复；README 不承诺账号、云端、完整 SaaS、真实 worker 或富文本；`git diff --check` 与 `npm run check:changes` 通过。
- 参考项目/资料：`openspec/changes/align-doc-fact-boundaries`。
- 不做/边界：不新增产品能力。

## P1 近期增强

### P1-0 完整 App 产品体验与界面重设计

- 类型：产品体验、信息架构、UI/UX 设计
- 背景/问题：当前 `storyspec app` 仍是实验性本机工作台，页面信息层级、入口说明和操作反馈不足；用户打开 Web 后不容易判断“下一步该做什么”“哪些内容只是候选”“哪些动作会写入正式故事”。如果直接进入前端架构重写，容易把不清晰的产品模型固化到路由、API 和数据模型里。
- 已有基础：`src/app-server/local-app-html.ts`、本机 App API、server 控制面 API、preview / confirm / apply 流程、已归档的新用户引导和创作导航路线、归档设计能力 `ui-ux-designer` / `frontend-design` / `ui-ux-pro-max`。
- 缺口：缺少完整 App 的产品定位、用户旅程、信息架构、主导航、页面地图、首程引导、空状态、权限反馈、协作状态语言和视觉方向；`candidate`、`preview`、`dry-run`、`apply`、`blocked`、`deferred` 等技术状态还没有转成用户能直接理解的界面文案。
- 建议方案：
  1. 先产出产品体验设计规格，再进入前端架构和 API 契约实现。
  2. 明确核心角色和使用路径：作者、编辑、审稿者、只读成员、agent-runner 分别如何创建项目、进入故事、处理候选、评论、审批和应用正典。
  3. 设计完整 App 信息架构：工作区、项目、故事、章节、设定库、任务、审稿、成员、设置。
  4. 先画低保真页面结构和交互流：Dashboard、Project Workspace、Writing Editor、Canon Review、Agent Task Center、Team / Permissions。
  5. 定义视觉方向：专业创作工作台、编辑部协作、清晰状态面板；避免把 App 做成营销首页、装饰性卡片堆叠或只靠技术词解释流程。
  6. 制定状态和空状态文案，把候选、预览、试运行、应用、阻塞、稍后决定等状态统一成可读、可审计、可回退的用户语言。
- 涉及文件/模块：`src/app-server/local-app-html.ts`、`src/app-server/local-app-server.ts`、`src/server/http/*`、未来 `app/` 或 `web/`、后续设计规格文档。
- 验收标准：设计规格覆盖目标用户、核心路径、主导航、页面地图、关键状态、空状态、权限反馈和响应式边界；一个没读过文档的新用户能在 3 分钟内完成创建故事、找到章节入口、理解候选不会自动写入、知道在哪里审阅并应用结果；P1-4 前端架构任务必须引用本任务产物。
- 参考项目/资料：当前本机 App 流程和已归档 StorySpec 首程引导路线；归档 `ui-ux-designer`、`frontend-design`、`ui-ux-pro-max` 只作为设计方法和可访问性检查参考，不直接决定前端技术栈。
- 不做/边界：本任务不写业务代码、不选择最终前端框架、不实现实时协同或富文本编辑器；它只定义完整 App 的产品体验和界面设计方向。

### P1-1 多人平台产品边界与角色模型

- 类型：产品范围、权限、数据模型
- 背景/问题：当前 server 已有控制面基础，但“多人在线写作平台”需要先定义用户、团队、项目、故事、章节、角色权限、协作边界和作者控制权，不然容易把多人协作做成共享文件夹。
- 已有基础：session/project guard、membership、project metadata、audit/quota、job list、项目删除计划。
- 缺口：缺少面向完整 App 的产品层概念，例如 workspace/team、owner/editor/reviewer/viewer、故事级和章节级权限、邀请流程、项目可见性、离线导出与删除确认。
- 建议方案：
  1. 新建 OpenSpec 定义平台对象模型和权限矩阵。
  2. 明确“谁能创建候选、谁能评论、谁能 apply 正典、谁能发布章节、谁能运行 agent job”。
  3. 把权限检查接到现有 project guard、audit 和 quota。
- 涉及文件/模块：`src/server/auth/*`、`src/server/projects/*`、`src/server/audit/*`、`src/server/quota/*`、`docs/deploy/self-hosted.md`。
- 验收标准：权限矩阵覆盖项目、故事、章节、候选、评论、agent job、导出/删除；跨用户访问失败；敏感动作进入 audit；README 只写基础或实验性状态。
- 参考项目/资料：Liveblocks docs 的协作 App 能力清单；当前多用户 OpenSpec changes。
- 不做/边界：不做商业计费或公开社区。

### P1-2 真实 PostgreSQL driver、迁移执行与数据访问层

- 类型：存储、部署、可靠性
- 背景/问题：当前已定义 PostgreSQL schema、migration plan 和 repository adapter，但还没有真实 driver/连接池；多用户平台无法只依赖内存 repository。
- 已有基础：`src/server/db/schema.ts`、`src/server/db/repositories.ts`、`docker-compose.yml`、`docs/deploy/self-hosted.md`。
- 缺口：缺真实连接、迁移命令、事务边界、测试数据库 fixture、连接错误处理和部署配置。
- 建议方案：
  1. 接入 PostgreSQL driver 和连接池。
  2. 增加 migration runner，并在 server startup 或独立命令中可控执行。
  3. 为 sessions/projects/memberships/jobs/audit/quota 增加真实 repository integration tests。
  4. 更新 docker compose 和自托管说明。
- 涉及文件/模块：`src/server/db/*`、`src/server/http/multiuser-server.ts`、`docker-compose.yml`、`.env.example`、`docs/deploy/self-hosted.md`、tests。
- 验收标准：本地 compose 可启动 PostgreSQL-backed server；`/health`、`/ready` 能区分应用和数据库状态；迁移可重复运行；数据库测试不依赖内存替身。
- 参考项目/资料：PostgreSQL 官方文档；当前 `add-multiuser-database-foundation`。
- 不做/边界：不在本任务引入复杂 ORM，除非 OpenSpec 证明收益高于维护成本。

### P1-3 Redis/BullMQ worker 与 agent job 真实执行队列

- 类型：任务调度、agent runtime、可观测性
- 背景/问题：当前有 job 控制面、审计/配额守卫和 runtime adapter foundation，但 Redis/BullMQ worker 仍是部署占位，OpenHandsRunner 也是 PoC adapter。
- 已有基础：`src/server/jobs/agent-job.ts`、`src/server/agent-runtime/*`、`src/server/quota/*`、`src/server/audit/*`、job API。
- 缺口：缺少真实队列、worker 进程、重试/取消语义、幂等键、运行日志、产物回传、预览结果落库和失败恢复。
- 建议方案：
  1. 先实现本地 runner worker，所有输出默认 preview-only。
  2. 再接 Redis/BullMQ 队列，补取消、重试、超时、并发限制和配额消耗。
  3. 最后评估 OpenHands 或其他 agent runtime 的真实 headless 执行。
- 涉及文件/模块：`src/server/jobs/*`、`src/server/agent-runtime/*`、`src/server/audit/*`、`src/server/quota/*`、`docker-compose.yml`、tests。
- 验收标准：创建 job 后由 worker 异步处理；取消和重试有明确状态转移；失败不会 apply 正文或正典；所有写入候选都能追溯到 job/audit。
- 参考项目/资料：BullMQ 官方文档；当前 `add-multiuser-agent-job-foundation` 和 `add-multiuser-runtime-app-observability`。
- 不做/边界：不让 agent job 自动覆盖正式故事文件。

### P1-4 完整 App 前端架构与 API 契约

- 类型：前端架构、API、产品体验
- 背景/问题：当前 `storyspec app` 是零依赖本机页面，能证明工作台流程，但不适合作为长期多人在线 App 的前端承载层。
- 已有基础：`src/app-server/local-app-html.ts`、`src/app-server/local-app-server.ts`、本机 App API、server 控制面 API。
- 缺口：缺少前端框架、路由、状态管理、API client、错误边界、登录态、权限态、加载态、端到端测试和可维护组件边界。
- 建议方案：
  1. 先写 App IA 和 API 契约：项目列表、故事工作台、章节写作、候选/评论、任务/审稿、设置。
  2. 再选择前端栈，优先小步迁移，不一次性重写本机工作台。
  3. 把现有 1197 行 `local-app-html.ts` 拆为可替换 shell 或静态 fallback。
- 涉及文件/模块：`src/app-server/*`、`src/server/http/*`、未来 `app/` 或 `web/`、tests/e2e。
- 验收标准：前端入口能登录或绑定 session，按权限展示项目/故事/章节；API 错误有统一呈现；本机 App fallback 不被破坏；Playwright 或等价 e2e 覆盖首屏和核心路径。
- 参考项目/资料：Liveblocks docs 的 comments/presence/notifications 作为协作体验清单；StorySpec 当前 App OpenSpec。
- 不做/边界：不在第一步做富文本编辑器或实时协同。

### P1-5 协同写作数据模型与正典合并协议

- 类型：协作模型、正典保护、版本管理
- 背景/问题：多人在线写作的核心难点不是“多人同时输入文字”，而是谁的候选可以进入正典、冲突如何处理、评论如何关联证据、agent 输出如何被审阅。
- 已有基础：preview/apply、clarifications、outline candidates、draft promote dry-run、audit、job output preview-only。
- 缺口：缺少统一的 collaboration object 模型：draft session、proposal、comment thread、review decision、apply request、canon patch、version snapshot。
- 建议方案：
  1. 定义候选/评论/审批/应用的状态机。
  2. 区分实时编辑草稿和正式故事产物；正式产物只通过可审计 apply。
  3. 增加冲突检测：基于文件版本、故事阶段、正典事实和任务状态判断是否可应用。
- 涉及文件/模块：`src/application/preview-apply.ts`、`src/application/manage-drafts.ts`、`src/server/audit/*`、`src/server/jobs/*`、未来 collaboration domain。
- 验收标准：两个用户/agent 对同一章节提出候选时不会静默覆盖；apply 请求包含来源、diff、风险、审批人和回滚入口；正式 `specification.md`、`creative-plan.md`、content、tracking 继续受门禁保护。
- 参考项目/资料：Yjs shared types 与 ProseMirror transaction 模型作为实时编辑参考；StorySpec preview/apply 作为正式写入参考。
- 不做/边界：不把 CRDT 文档直接当作正典。

## P2 体验、维护和质量

### P2-1 富文本 / Markdown 混合编辑器评估

- 类型：编辑器、研究、用户体验
- 背景/问题：完整 App 需要浏览器端编辑体验，但 StorySpec 当前产物以 Markdown、YAML、JSON 和任务文档为主；直接上富文本可能破坏可审计产物。
- 已有基础：章节草稿、draft promote dry-run、compile manuscript、style lint、review loop。
- 缺口：缺少编辑器选型、Markdown AST/ProseMirror schema 映射、结构化片段和正文文件的同步策略。
- 建议方案：先做研究 OpenSpec，对比纯 Markdown editor、ProseMirror/Tiptap、Monaco/CodeMirror、结构化表单四种方案；第一阶段只允许编辑草稿和评论，不直接编辑正式正典。
- 涉及文件/模块：未来 web editor、`src/application/manage-drafts.ts`、`src/application/compile-manuscript.ts`、style/review modules。
- 验收标准：选型报告明确 schema、存储、协作、导出和测试策略；至少一个章节草稿编辑 PoC 不污染正式 content。
- 参考项目/资料：Tiptap、ProseMirror、Yjs 官方文档。
- 不做/边界：不在研究阶段承诺最终编辑器依赖。

### P2-2 评论、审批、通知和活动流

- 类型：协作体验、审稿流程
- 背景/问题：多人平台需要让作者、编辑、审稿者和 agent 围绕候选内容讨论，而不是只共享文件。
- 已有基础：review findings、feedback import/triage、audit log、tasks board。
- 缺口：缺评论线程、行内/段落锚点、审批状态、通知偏好、活动流和任务联动。
- 建议方案：先实现项目内 activity/audit 可读流，再实现 comment thread 和 review decision，最后接通知。
- 涉及文件/模块：`src/application/manage-feedback.ts`、`src/application/review-project.ts`、`src/server/audit/*`、未来 collaboration/comment domain。
- 验收标准：评论可锚定到故事、章节、候选或任务；审批能转成 apply request 或 task；通知可关闭；审计记录可追溯。
- 参考项目/资料：Liveblocks comments/notifications 作为体验边界参考。
- 不做/边界：不引入邮件/短信等外部通知，除非另开 OpenSpec。

### P2-3 生产级可观测性、备份和数据生命周期

- 类型：部署、运维、数据安全
- 背景/问题：自托管多人平台必须知道服务是否健康、任务为什么失败、项目如何备份、删除如何二次确认和恢复。
- 已有基础：health/ready、audit、project snapshot/export/delete plan、自托管说明。
- 缺口：缺结构化日志、metrics/tracing、备份/恢复演练、保留策略、导出包校验和删除执行器。
- 建议方案：把 observability 和 lifecycle 拆成两个 OpenSpec：先日志/metrics/ready，再备份/恢复/删除执行。
- 涉及文件/模块：`src/server/http/*`、`src/server/projects/project-lifecycle.ts`、`src/server/audit/*`、`docs/deploy/self-hosted.md`。
- 验收标准：ready 能暴露数据库/队列状态；job 和请求有 trace id；项目导出可校验；删除必须二次确认并写 audit。
- 参考项目/资料：当前 `add-multiuser-data-deploy-security`。
- 不做/边界：不承诺企业级 HA。

### P2-4 大文件拆分与测试盲区收口

- 类型：维护性、测试
- 背景/问题：`local-app-html.ts`、`local-app-server.ts`、`workbench.command.ts`、`plugins/manager.ts` 文件偏大；后续多人 App 开发会放大理解和冲突成本。
- 已有基础：unit/smoke 覆盖整体较好；coverage 已暴露 plugin manager、interactive utils、部分 run/review/style 分支盲区。
- 缺口：缺少按模块拆分计划和覆盖率分阶段目标。
- 建议方案：
  1. 将本机 App HTML 拆为 render section / static assets / API client string。
  2. 将 App server routes 拆为项目、故事 intake、大纲任务、章节、review/resume。
  3. 将 Workbench CLI 按命令族拆分。
  4. 为 plugin manager 的 source 解析、hook 错误、force 覆盖和版本范围补测试。
- 涉及文件/模块：`src/app-server/local-app-html.ts`、`src/app-server/local-app-server.ts`、`src/cli/commands/workbench.command.ts`、`src/plugins/manager.ts`、`src/utils/interactive.ts`、tests。
- 验收标准：单文件职责变清；现有 smoke 不退化；plugin manager statements 明显提升；拆分不改变 CLI 输出。
- 参考项目/资料：当前 coverage 报告、`docs/tech/architecture.md` 模块边界。
- 不做/边界：不做无关重构；不把本机 App 一次性迁到完整前端框架。

### P2-5 依赖升级和兼容矩阵

- 类型：依赖维护、兼容性
- 背景/问题：`npm outdated` 显示 Commander typings、Vitest coverage、glob、inquirer、ora、TypeScript 等存在 major 或 minor 更新；直接升级可能影响 CLI 行为、测试和 ESM。
- 已有基础：Node 20/22 CI、unit/smoke、command manifest。
- 缺口：缺少“先小后大”的依赖升级路线和回滚策略。
- 建议方案：先升级 patch/minor，再单独评估 major；每次升级必须跑 build、unit、smoke、manifest 和 Windows/Ubuntu CI。
- 涉及文件/模块：`package.json`、锁文件、CI、CLI command tests。
- 验收标准：依赖升级 PR 有分组、风险说明和验证命令；Node 20/22 均通过；CLI help 和 JSON 输出无非预期变化。
- 参考项目/资料：各依赖 release notes，进入实现前联网核验。
- 不做/边界：不把依赖升级和功能开发混在一个 change。

## P3 研究储备

### P3-1 离线优先、PWA 与本地缓存

- 类型：研究、前端体验
- 背景/问题：小说写作存在断网、本地保存和长时间编辑需求；完整 App 若只依赖实时连接，体验会脆弱。
- 建议方案：研究 IndexedDB、本地草稿缓存、冲突恢复、导出备份和“离线只能写候选，不自动 apply”的边界。
- 验收标准：输出研究记录和 PoC 计划；明确离线写入不会绕过正典门禁。
- 不做/边界：不在多人基础未稳前实现完整离线同步。

### P3-2 插件/类型包市场与团队模板

- 类型：生态、产品化
- 背景/问题：当前已有 plugins、extension、preset，但还不是在线平台中的团队模板和插件市场。
- 建议方案：先定义团队级启用、版本 pin、审核、禁用和回滚模型，再考虑 UI。
- 验收标准：插件启用不会绕过项目权限和写入门禁。
- 不做/边界：不做公开 marketplace。

### P3-3 计费、公开协作和企业部署

- 类型：长期研究
- 背景/问题：完整 SaaS 通常需要计费、组织管理、公开邀请、企业部署和 SLA，但这些不是当前自托管基础的下一步。
- 建议方案：只在真实用户需求明确后另起路线。
- 验收标准：有用户场景、数据合规和部署需求证据后再规划。
- 不做/边界：当前不进入活跃开发。

## 建议推进顺序

1. P0-1 依赖安装与 CI 可复现性。
2. P0-2 命令产物与 compiled runtime 分离。
3. P0-3 README 高频命令去重与事实边界巡检。
4. P1-0 完整 App 产品体验与界面重设计。
5. P1-1 多人平台产品边界与角色模型。
6. P1-2 真实 PostgreSQL driver、迁移执行与数据访问层。
7. P1-3 Redis/BullMQ worker 与 agent job 真实执行队列。
8. P1-4 完整 App 前端架构与 API 契约。
9. P1-5 协同写作数据模型与正典合并协议。
10. P2/P3 按真实用户反馈和平台风险拆分推进。

## 完成同步

- 每个 P0/P1 任务进入实现前必须新建或关联 OpenSpec change。
- 涉及 CLI、公共 API、模板契约、生成产物或用户文档时，新增 `changes/*.md`。
- 完成批次后更新本文状态，并在 `todo-archive.md` 增加归档证据。
- `todo-index.md` 只保留仍未完成的 Planned / Active 入口。
