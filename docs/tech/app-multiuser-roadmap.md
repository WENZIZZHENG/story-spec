# 单人 App 与多用户项目隔离路线图

## 状态

Active。本文登记“把 StorySpec 做成 App，并支持多人使用但项目默认隔离”的长期路线。实现前应按影响范围转为 OpenSpec change；本文不替代 OpenSpec artifacts。

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

本路线第一阶段已经收敛为“本机 Web 工作台”，不先做云端 SaaS。详细设计见 [../superpowers/specs/2026-05-06-local-single-user-app-workbench-design.md](../superpowers/specs/2026-05-06-local-single-user-app-workbench-design.md)。

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

### 第一阶段下一步

1. `add-local-app-outline-task-views`：接入多大纲候选、任务板和预览确认队列。
2. `add-local-app-chapter-entry`：接入章节草稿入口和写后自检，不默认引入完整富文本编辑器。
3. `add-local-app-preview-apply-lane`：如大纲/任务视图需要统一确认体验，可单独补正式 preview / apply 交互队列；不要混进普通读取视图。

### 第一阶段拆分

1. 已完成的 `add-local-single-user-app-workbench` 和 `add-local-app-shell-ui` 只建立本机 App 地基与首屏 shell，不代表完整 App 已完成。
2. 接下来优先 `add-local-app-outline-task-views`，把已实现的多大纲候选、任务板和确认队列读写边界接入页面。
3. 再做 `add-local-app-chapter-entry`，逐步把章节入口迁入页面。
4. 第一阶段完成前，不推进账号系统、云端数据库、多用户项目隔离或部署成本边界。

## P2 中期路线

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
2. 再做多用户账号和项目隔离，把单用户项目迁移到 owner 私有项目模型。
3. 最后做部署、AI job、用量限制和线上运维边界。
4. 多人协作、团队权限、评论审批、共享链接和实时编辑另起路线，不并入本路线第一版。

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
