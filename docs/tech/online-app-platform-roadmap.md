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
4. P1-1 多人平台产品边界与角色模型。
5. P1-2 真实 PostgreSQL driver、迁移执行与数据访问层。
6. P1-3 Redis/BullMQ worker 与 agent job 真实执行队列。
7. P1-4 完整 App 前端架构与 API 契约。
8. P1-5 协同写作数据模型与正典合并协议。
9. P2/P3 按真实用户反馈和平台风险拆分推进。

## 完成同步

- 每个 P0/P1 任务进入实现前必须新建或关联 OpenSpec change。
- 涉及 CLI、公共 API、模板契约、生成产物或用户文档时，新增 `changes/*.md`。
- 完成批次后更新本文状态，并在 `todo-archive.md` 增加归档证据。
- `todo-index.md` 只保留仍未完成的 Planned / Active 入口。
