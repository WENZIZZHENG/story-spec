# 单人 App 与多用户项目隔离路线图

## 状态

Planned。本文登记“把 StorySpec 做成 App，并支持多人使用但项目默认隔离”的长期路线。实现前应按影响范围转为 OpenSpec change；本文不替代 OpenSpec artifacts。

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

## P2 中期路线

### P2-1 单人 App 外壳与核心创作工作台

- 类型：App 化、UI 工作台、创作流程编排、API。
- 背景/问题：CLI 对作者有门槛，现有流程虽然完整，但需要用户理解文件、命令和 agent 入口。App 可以把“创建故事、吸收资料、查看缺口、生成预览、确认写入”变成可视化流程。
- 已有基础：`storyspec story:new`、`next`、`ingest`、`co:create`、`core`、`creative:report`、`preview/apply`、`tasks:board`、`scene:init`、`reference:reverse`、`outline-candidates-roadmap.md`。
- 缺口：缺少统一 UI、后端 API、App 状态模型、异步 AI 任务队列和用户可见的确认门禁。
- 建议方案：
  1. 先定义 App 信息架构：故事列表、故事工作台、资料输入、核心面板、大纲候选、任务板、章节写作、报告与验证。
  2. 抽象本地 CLI 服务为可复用 application/API 层，避免 UI 直接拼 shell 命令。
  3. 建立 preview / confirm / apply 的前端交互组件，所有高影响写入都走同一门禁。
  4. AI 生成任务走异步 job，不阻塞页面。
- 涉及文件/模块：未来可新增 `apps/web/`、`src/server/`、`src/application/` API adapter、`src/domain/` 共享模型、`tests/unit/`、`tests/e2e/`、`docs/app/`。
- 参考项目/资料：现有 StorySpec CLI/application 层；参考项目待调研，重点看开源写作工具或文档工作台的项目/文档组织、任务队列和导入导出方式。默认先作为设计参考，不默认引入依赖。
- OpenSpec 输入：建议新建 OpenSpec change `add-single-user-app-workbench`。proposal 需说明不移除 CLI；design 需定义 App 页面、API 边界、preview/apply 交互、job 状态和导入导出策略。
- 验收标准：
  - 用户能在 App 中创建故事、输入灵感或长文资料、查看核心缺口和生成预览。
  - App 不绕过 preview / confirm / apply。
  - 所有写入都能追溯到用户确认或明确来源。
  - 本地 CLI 仍可工作。
- 不做/边界：不做账号系统，不做多人协作，不做生产部署。

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

1. 先做单人 App 工作台，不上账号系统，只打通本地项目或单用户后端。
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
