# 单人 App 与多用户项目隔离路线图

## 状态

本机 Web 工作台第一阶段 Completed；多用户账号与项目隔离仍是 Planned 中期路线。本文登记“把 StorySpec 做成 App，并支持多人使用但项目默认隔离”的长期路线。新增待办决策：若终局是多用户 App，执行层采用“控制平面先行 + 执行引擎抽象 + OpenHands 优先适配”，Cline/Aider 作为用户侧补充入口，不作为多租户控制平面核心。2026-05-08 新增上线门槛待办：P0（身份/隔离/作业控制面/审计/配额）与 P1（runtime adapter、协作体验、可观测性、备份恢复）先于后续中期能力推进。实现前应按影响范围转为 OpenSpec change；本文不替代 OpenSpec artifacts。

详细可开发任务拆分见 [app-multiuser-development-tasks.md](app-multiuser-development-tasks.md)。本文只保留路线级目标、边界和优先级；开发时先读任务拆分，再转 OpenSpec。

## 目标技术架构

- 后端：Node.js + TypeScript，保留并复用现有 `src/application/*` 领域能力。
- API：新增多用户 server 进程，建议使用 Fastify；现有 `storyspec app` 本机 shell 保留为单机入口。
- 前端：多用户产品化阶段使用 Vite + React + TypeScript + TanStack Query；P0 先做 API/控制平面，不先重写本机 shell。
- 数据：PostgreSQL + Drizzle ORM 管理用户、项目、成员、会话、作业、审计、配额等元数据。
- 队列：Redis + BullMQ 处理 `AgentJob` 队列、重试、超时、取消和 worker 隔离。
- 文件：StorySpec 项目内容继续保留文件形态，通过 `ProjectStorage` 抽象访问，禁止客户端路径直通。
- 执行：`AgentRuntimeAdapter` 抽象，先 `LocalStorySpecRunner`，再 `OpenHandsRunner`。
- 安全：所有 API 统一执行 `userId + projectId` 授权，所有写入保持 candidate / preview / confirm / apply 门禁。

## 背景和目标

StorySpec 当前主要是本地 CLI、文件模板和 agent prompt 工作流，适合单个作者在本地维护小说项目。若要让更多人使用，需要先把核心创作流程 App 化，再引入多用户账号和项目隔离。

本路线的目标不是一开始做多人实时协作，而是先做“单人 App + 多用户账号 + 项目隔离”：

1. 每个用户可以创建和管理自己的故事项目。
2. App 提供可视化入口，覆盖灵感、长文资料、核心面板、大纲、任务、章节、参考作品反向拆解等主要流程。
3. 多用户之间默认数据隔离，用户 A 不能读取或修改用户 B 的项目。
4. 保留 StorySpec 的创作控制权原则：AI 只提供候选，进入正典、计划或正文前必须 preview / confirm / apply。

## 非目标

- 不做第一版多人实时协作编辑。
- 不做公开社区、作品广场、投稿平台或商业发布平台。
- 不做未经授权的数据共享、模型训练或作品展示。
- 不移除本地 CLI 和文件项目能力。
- 不把云端 App 做成用户无法导出的封闭平台。

## 已确认的第一阶段：本机 Web 工作台

本路线第一阶段已经收敛为“本机 Web 工作台”，不先做云端 SaaS，并已完成首个可用闭环。详细设计见 [../superpowers/specs/2026-05-06-local-single-user-app-workbench-design.md](../superpowers/specs/2026-05-06-local-single-user-app-workbench-design.md)。

### 第一阶段关键决策

- App 类型：本机 Web 工作台。
- 启动方式：新增 `storyspec app`，默认打开 `127.0.0.1` 本地服务。
- 项目入口：启动后选择一个 StorySpec 项目根目录，并记住最近打开的项目。
- 创建项目：App 内支持创建新项目，复用 `src/application/init-project.ts`。
- 默认 agent：`codex`。
- 技术栈：第一阶段已改为零依赖本机 shell，使用现有 Node HTTP server 托管静态 HTML/CSS/JS，并复用现有 TypeScript application/API 层；暂不引入 `Vite`、`React`、`Fastify`、`Tailwind CSS` 或 `shadcn/ui`，除非后续 OpenSpec 证明需要。
- 存储：第一阶段继续读写本地 StorySpec 项目文件，不引入数据库。
- 安全边界：本地服务只绑定 `127.0.0.1`，使用 session token；API 只能访问用户选择或创建过的项目根目录。
- 视觉方向：编辑台 / 档案控制台，避免营销页、通用 SaaS 模板感、紫蓝渐变、玻璃拟态和重动效。

### 第一阶段已完成批次

1. `add-local-single-user-app-workbench`：完成 `storyspec app` 本机服务地基、项目选择/创建 API、最近项目、当前项目状态 API、session token 和项目 allowlist。
2. `add-local-app-shell-ui`：完成本机服务 `/` 页面、项目抽屉、故事档案、确认通道、最近项目、打开/创建项目 UI，以及 `storyspec app --project <path>` 预打开。
3. `add-local-app-intake-and-core`：完成 App 内一句灵感保存、长文资料 preview-only 吸收、显式 confirmed 字段写入、核心缺口读取，以及对应页面入口。
4. `add-local-app-outline-task-views`：完成 App 内候选大纲列表、作者文本候选创建、候选比较、提升 dry-run 预览和只读任务板读取。
5. `add-local-app-chapter-entry`：完成 App 内章节草稿创建、草稿列表、草稿发布 dry-run 预览、Scene Card 初始化和章节级写后自检。

### 第一阶段完成状态

1. `storyspec app` 现在覆盖本机项目打开/创建、素材入口、核心缺口、候选大纲、任务板、章节草稿入口和写后自检。
2. 页面仍保持零依赖本机 HTML shell，不包含账号、云端、多用户、数据库或富文本编辑器。
3. 如果后续章节入口需要统一确认队列，可单独新建 `add-local-app-preview-apply-lane`；当前 dry-run/显式确认边界已由各入口各自保留。

### 第一阶段拆分

1. 已完成的第一阶段只建立本机单人工作台可用闭环，不代表云端 App 或多人账号系统已完成。
2. 后续如果继续 App 化，优先单独评估统一 preview / apply lane、前端框架化或多用户账号与项目隔离。
3. 账号系统、云端数据库、多用户项目隔离和部署成本边界必须另起 OpenSpec，不从本机工作台 change 中顺手实现。

## 新增优先级待办（面向 App + 多用户上线）

### P0 上线门槛

#### P0-1 身份与会话安全基线

- 类型：认证、会话安全、权限基线。
- 背景/问题：多用户场景下，如果没有稳定认证与会话失效机制，后续隔离与审计都不可靠。
- 已有基础：本机 App 已有 session token 与本地 allowlist 机制。
- 缺口：缺少用户身份、角色、会话生命周期和跨端注销语义。
- 建议方案：
  1. 定义 `User`、`Session`、`Role` 最小模型，先支持 owner/member。
  2. 引入会话有效期、刷新和显式失效（logout / revoke）。
  3. 高风险操作（apply、成员管理、导出删除）补二次确认或短时重认证门槛。
- 涉及文件/模块：未来 `src/server/auth/*`、`src/server/session/*`、`src/server/policies/*`、`tests/security/*`。
- 验收标准：未登录不可访问项目 API；会话过期后写操作失败并可恢复登录；权限不足时返回一致的拒绝语义。
- 不做/边界：不在本批次实现企业 SSO 或组织级 IAM。

#### P0-2 项目隔离与路径安全

- 类型：授权、数据隔离、文件系统安全。
- 背景/问题：项目隔离是多用户 App 的核心，一旦越权或路径逃逸会直接导致数据泄露。
- 已有基础：本机模式已有项目根目录 allowlist。
- 缺口：缺少强制 `userId + projectId` 授权校验和统一路径规范化策略。
- 建议方案：
  1. 所有项目读写入口统一走授权网关，拒绝“只传路径不传项目身份”。
  2. 统一路径规范化和越界检测（禁止 `..`、符号链接越界）。
  3. 对跨项目操作增加显式安全日志。
- 涉及文件/模块：未来 `src/server/projects/*`、`src/server/storage/*`、`src/application/*` 相关写入入口、`tests/security/*`。
- 验收标准：跨用户、跨项目、越界路径访问均失败；失败原因可追踪；合法路径不受影响。
- 不做/边界：不在本批次支持共享项目或跨租户协作。

#### P0-3 AgentJob 作业控制面

- 类型：任务编排、可靠执行、并发控制。
- 背景/问题：多用户 + 长任务下，直接同步执行会导致超时、重复写入和故障恢复困难。
- 已有基础：现有命令流程和本地执行能力已可复用。
- 缺口：缺少作业队列、幂等、超时、重试、取消、回放机制。
- 建议方案：
  1. 定义 `AgentJob` 状态机（queued/running/succeeded/failed/canceled/timeout）。
  2. 引入幂等键、重试策略、超时和取消语义。
  3. UI/API 暴露作业状态、错误摘要、重试入口。
- 涉及文件/模块：未来 `src/server/jobs/*`、`src/server/queue/*`、`src/application/*job*`、`tests/unit/*job*`、`tests/smoke/*job*`。
- 验收标准：长任务不阻塞请求；失败可重试且不重复写入；取消生效且状态一致。
- 不做/边界：不在本批次承诺复杂 DAG 编排或跨区域调度。

#### P0-4 审计追溯与 Apply 证据链

- 类型：审计、合规、变更追踪。
- 背景/问题：多用户环境必须回答“谁在何时通过什么来源改了什么”。
- 已有基础：preview / confirm / apply 门禁语义已在流程中存在。
- 缺口：缺少统一审计事件和可检索的 apply 证据链。
- 建议方案：
  1. 所有写入事件记录 `actor`、`project`、`source`、`diff-summary`、`timestamp`。
  2. 审计事件与 `AgentJob` 关联，支持按章节/故事/用户回溯。
  3. App 提供基础审计视图和导出接口。
- 涉及文件/模块：未来 `src/server/audit/*`、`src/server/jobs/*`、`src/app-server/*`、`docs/privacy.md`。
- 验收标准：任一 apply 都能追溯来源和操作者；审计记录可检索、可导出、不可静默篡改。
- 不做/边界：不在本批次实现企业 SIEM 深度集成。

#### P0-5 配额、限流与成本熔断

- 类型：成本治理、平台稳定性、资源保护。
- 背景/问题：多用户场景下，模型调用与长任务容易导致成本失控和系统拥塞。
- 已有基础：已有 `preview/apply` 门禁与局部 dry-run 语义。
- 缺口：缺少用户/项目级预算、速率限制、超限行为定义。
- 建议方案：
  1. 定义 `user/project` 两级配额（请求数、token、并发作业数）。
  2. 增加限流和熔断策略（排队、降级、拒绝）。
  3. 在 UI 提示“预计消耗”和“剩余预算”。
- 涉及文件/模块：未来 `src/server/quota/*`、`src/server/jobs/*`、`src/server/ai/*`、`src/app-server/*`。
- 验收标准：超限行为可预测；不会出现单用户压垮全局资源；用户能看到预算状态。
- 不做/边界：不在本批次上线计费结算系统。

### P1 值得优化

#### P1-1 Runtime Adapter 与 OpenHands 接入

- 类型：架构抽象、外部执行引擎集成。
- 目标：保持 StorySpec 业务语义不变的前提下，支持本地 runner 与 OpenHands runtime 可切换。
- 验收标准：同一作业请求可路由不同 runtime；headless 风险边界（自动批准）由平台侧门禁兜底。

#### P1-2 多用户协作体验基础层

- 类型：产品体验、项目管理。
- 目标：补齐项目切换、成员邀请、权限提示、审批入口等非实时协作体验。
- 验收标准：用户无需 CLI 也能完成项目加入、退出、权限确认和任务回流。

#### P1-3 可观测性与故障定位

- 类型：运维、稳定性、调试效率。
- 目标：结构化日志、请求/作业 trace、关键告警和健康检查。
- 验收标准：能在一次排障中定位“请求 -> 作业 -> runtime -> 写入结果”链路。

#### P1-4 备份恢复与数据生命周期

- 类型：可靠性、数据治理。
- 目标：项目快照、回滚点、导出删除闭环和保留策略。
- 验收标准：误操作后可按项目恢复；导出与删除流程可审计。

## P2 中期路线

### P2-0 多用户控制平面与执行引擎抽象（OpenHands 优先）

- 类型：架构、执行引擎、任务编排、隔离治理。
- 背景/问题：如果目标是“多人账号 + 项目隔离”的 App，单纯新增某个本地 coding agent integration 只能改善个人入口，不能解决多用户作业调度、隔离、审计和成本边界。
- 已有基础：本机工作台已具备项目入口、写入门禁和主要创作流程；`agent` 集成层已支持多工具命令分发。
- 缺口：缺少面向多用户的控制平面（User/Project/Job/Audit）与统一执行抽象，当前执行路径仍偏单机 CLI 调用。
- 建议方案：
  1. 先定义控制平面最小模型：`User`、`Project`、`Membership`（先 owner-only）、`AgentJob`、`AuditLog`。
  2. 在应用层新增执行抽象（例如 `AgentRuntimeAdapter`），先落地本地 runner，再接外部执行引擎。
  3. 外部执行引擎优先对齐 OpenHands（CLI headless 或 SDK），用于长任务、异步任务和隔离执行。
  4. Cline/Aider 仅作为客户端入口或 handoff 目标，不承载后端多租户执行职责。
- 涉及文件/模块：未来 `src/server/control-plane/*`、`src/server/jobs/*`、`src/server/agent-runtime/*`、`src/application/*job*`、`docs/tech/*`、`tests/unit/*`、`tests/smoke/*`。
- 参考项目/资料：
  - `OpenHands/OpenHands` 与 `OpenHands/OpenHands-CLI`：借鉴多形态执行（CLI/headless/服务化）和 agent runtime 思路；不照搬其完整平台。
  - `cline/cline`：借鉴 IDE 人机协作与工作流入口；不把编辑器扩展当成后端控制平面。
  - `Aider-AI/aider`：借鉴终端协作体验；不作为多用户任务编排后端。
- OpenSpec 输入：建议先新建 `design-multiuser-control-plane-and-agent-runtime`，再拆 `add-agent-runtime-adapter` 与 `integrate-openhands-runtime`。
- 验收标准：
  - 有明确的 `projectId + userId` 授权边界，任务执行全链路可审计。
  - 同一执行接口可在“本地 runner / OpenHands adapter”间切换，不改业务命令语义。
  - 长任务异步化后，App 能展示队列状态、失败原因和重试入口。
  - 现有 preview / confirm / apply 门禁不被绕过。
- 不做/边界：不在本批次实现团队实时协作、共享链接、商业计费或完整 SaaS 控制台。

### P2-1 单人 App 外壳与核心创作工作台

- 类型：App 化、UI 工作台、创作流程编排、API。
- 背景/问题：CLI 对作者有门槛，现有流程虽然完整，但需要用户理解文件、命令和 agent 入口。App 可以把“创建故事、吸收资料、查看缺口、生成预览、确认写入”变成可视化流程。
- 已有基础：`storyspec story:new`、`next`、`ingest`、`co:create`、`core`、`creative:report`、`preview/apply`、`tasks:board`、`scene:init`、`reference:reverse`、`outline-candidates-roadmap.md`。
- 缺口：缺少统一 UI、本地 API、App 状态模型、项目选择/创建入口、最近项目记忆和用户可见的确认门禁。
- 建议方案：
  1. 先实现 `storyspec app` 本地服务地基：项目根目录校验、最近项目记忆、创建项目、状态 API。
  2. 抽象本地 CLI 服务为可复用 application/API 层，避免 UI 直接拼 shell 命令。
  3. 已用零依赖本机 HTML shell 建立项目选择页和工作台首屏；后续只有在交互复杂度明显上升时，再通过新的 OpenSpec 评估是否引入前端框架。
  4. 建立 preview / confirm / apply 的前端交互组件，所有高影响写入都走同一门禁。
- 涉及文件/模块：未来可新增 `apps/web/`、`src/app-server/`、`src/application/local-app-*`、`src/cli/commands/app.command.ts`、`tests/unit/`、`tests/smoke/`、`docs/app/`。
- 参考项目/资料：
  - `Vite` 官方文档：借鉴轻量 React/TypeScript 前端构建；落地为本机 Web UI，不默认引入云端框架。
  - `Fastify` 官方文档：借鉴本地 API 服务和 TypeScript 友好插件边界；落地为 CLI 启动的本地 server。
  - `shadcn/ui`：借鉴组件组合和 Tailwind 设计方式；只引入需要的组件，不把未使用组件堆进仓库。
  - `Plot Bunni`：借鉴小说项目列表、作品工作台、章节/场景组织；不照搬 IndexedDB，StorySpec 仍以本地项目文件为事实源。
  - `Novel / Tiptap`：只作为后续章节编辑器参考，第一版不默认引入富文本编辑器。
- OpenSpec 输入：先新建 OpenSpec change `add-local-single-user-app-workbench`。proposal 需说明不移除 CLI；design 需定义本地服务、项目选择/创建、最近项目、状态 API、安全边界和首屏 UI。后续云端版再另起 `add-multiuser-project-isolation`。
- 验收标准：
  - 用户能运行 `storyspec app` 启动本地服务。
  - App 能打开已有 StorySpec 项目根目录，拒绝非 StorySpec 目录。
  - App 能创建新项目，默认 agent 为 `codex`，并复用 CLI 初始化产物。
  - App 能记住最近打开项目，记录在用户本机配置目录而不是项目仓库。
  - 工作台能展示当前项目状态和下一步建议。
  - App 不绕过 preview / confirm / apply。
  - 所有写入都能追溯到用户确认或明确来源。
  - 本地 CLI 仍可工作。
- 不做/边界：不做账号系统，不做多人协作，不做生产部署，不做数据库，不做富文本编辑器。

### P2-2 多用户账号与项目隔离

- 类型：账号、权限、数据隔离、存储、审计。
- 背景/问题：多人使用不是多人共同写同一本，而是多个作者各自使用同一 App。第一版必须解决用户身份、项目归属和数据隔离，否则容易出现隐私和正典污染风险。
- 已有基础：本地项目结构已天然按项目目录隔离；StorySpec 文件模型已有 story、spec、tracking、research、feedback 等边界。
- 缺口：缺少 User / Project / Story 所有权模型、认证、授权、租户隔离、审计日志、导入导出和删除策略。
- 建议方案：
  1. 定义数据模型：User、Workspace/Project、Story、ProjectMember（第一版只允许 owner）、Job、AuditLog。
  2. 所有 API 必须通过 userId + projectId 授权检查。
  3. 项目默认私有；没有显式授权时不能被其他用户读取。
  4. 支持导出为本地 StorySpec 项目包，保留用户退出能力。
  5. 支持删除项目和账号数据的基础流程。
- 涉及文件/模块：未来 `src/server/auth`、`src/server/projects`、`src/server/storage`、数据库 schema/migrations、API tests、security tests、docs/privacy.md。
- 参考项目/资料：参考成熟 SaaS 的租户隔离和 RBAC 设计原则；具体开源项目待 OpenSpec 阶段调研后确定。默认不做复杂组织/团队权限，只做 owner 私有项目。
- OpenSpec 输入：建议新建 OpenSpec change `add-multiuser-project-isolation`。proposal 需写清“多人使用”不等于“多人协作”；design 需定义授权检查、数据访问边界、导入导出和删除策略。
- 验收标准：
  - 用户只能看到自己拥有的项目。
  - 跨用户访问项目 API 必须失败。
  - AI job、preview、apply、research、outline、chapter 都带 project/user 边界。
  - 删除或导出项目有明确结果。
- 不做/边界：不做团队协作，不做共享链接，不做公开发布，不做实时编辑。

### P2-3 App 部署与 AI 成本边界

- 类型：部署、任务队列、AI 成本、配置、安全。
- 背景/问题：多人 App 会带来模型调用成本、任务排队、失败重试、配额和安全配置问题。若不先规划，容易把 CLI 的即时调用扩展成不可控的线上成本。
- 已有基础：当前 CLI 多数能力可本地执行；AI 主要由 agent / prompt 执行，不是统一后端任务系统。
- 缺口：缺少 job queue、模型调用配置、使用量限制、失败重试、日志和用户可见的“本次会消耗什么”提示。
- 建议方案：
  1. AI 相关动作全部进入 Job 模型，记录状态、输入摘要、输出、错误、创建人和项目。
  2. 第一版支持用户自带 API key 或管理员配置 provider，具体策略待产品决策。
  3. 对高成本动作加确认提示和速率限制。
  4. 所有 job 输出仍是候选，不直接进入正典。
- 涉及文件/模块：未来 `src/server/jobs`、`src/server/ai`、任务队列 adapter、配置文档、运维文档。
- 参考项目/资料：参考异步任务队列和 SaaS 用量限制设计；具体技术选型待 OpenSpec 阶段调研。
- OpenSpec 输入：可并入 `add-single-user-app-workbench` 的后续 change，或单独新建 `add-app-job-and-quota-boundaries`。
- 验收标准：
  - 长任务不阻塞页面。
  - 失败 job 可查看错误和重试。
  - 用户能看见任务状态和是否写入。
  - AI 输出不会绕过确认门禁。
- 不做/边界：不在第一版承诺计费系统、团队套餐或商业化后台。

## 建议实施顺序

1. 先做本机 Web 工作台，不上账号系统，只打通本地项目、项目选择/创建和工作台首屏。
2. 先完成 P0-1 至 P0-5 上线门槛，再进入公开多用户试运行。
3. 完成 P1 runtime adapter、协作体验、可观测性和备份恢复，降低运维风险。
4. 再补多用户控制平面和执行抽象细化，实现 OpenHands 优先接入，Cline/Aider 作为客户端补充。
5. 最后做部署、AI job 规模化、用量限制和线上运维边界。
6. 多人协作、团队权限、评论审批、共享链接和实时编辑另起路线，不并入本路线第一版。

## 风险与缓解

- 数据隐私：所有项目默认私有，必须支持导出和删除。
- 正典污染：App 仍沿用 preview / confirm / apply，不允许 AI 直接写入正式文件。
- 成本失控：AI job 需要队列、状态和限额，不做无限制后台生成。
- 架构膨胀：第一版不做团队协作和实时编辑，避免把 App 化路线变成完整 SaaS 平台重写。
- 本地能力断裂：保留 CLI 和导出能力，避免现有用户被迫迁移。

## 完成同步

- 实现前先转 OpenSpec change。
- 涉及架构、存储、部署、权限、安全和 API 行为时必须使用 OpenSpec-first。
- 若新增 App 文档或真实可用能力，更新 README / docs；未实现能力只留在本文。
- 若产生用户可见行为、模板契约、生成产物或公共接口变化，新增 changeset。
- 完成后更新本文状态，追加 [todo-archive.md](todo-archive.md) 归档条目，并从 [todo-index.md](todo-index.md) 移除或降级活跃路线。
