# 多用户 App 可开发任务拆分

## 状态

Active。本文把 [单人 App 与多用户项目隔离路线图](app-multiuser-roadmap.md) 拆成可直接转 OpenSpec / implementation tasks 的开发批次。本文不代表功能已实现；任何批次进入代码前必须先创建或关联 OpenSpec change。

## 目标技术架构

- 语言与运行时：Node.js + TypeScript，继续复用现有 `src/application/*` 领域能力。
- API 服务：新增多用户 server 进程，建议使用 Fastify；现有 `storyspec app` 本机 Node HTTP shell 保留，不作为多用户生产服务。
- 前端：多用户 App 进入真实产品化阶段后使用 Vite + React + TypeScript + TanStack Query；第一批 P0 先以 API/控制平面为主，不先重写本机 shell。
- 数据库：PostgreSQL 保存用户、项目、成员、会话、作业、审计、配额等元数据；建议用 Drizzle ORM 管理 schema 和 migration。
- 文件存储：StorySpec 正文、tracking、research 等仍保留文件形态；通过 `ProjectStorage` 抽象访问，第一版使用服务端 data root，本地/对象存储后续适配。
- 队列：Redis + BullMQ 处理 `AgentJob` 队列、重试、超时、取消和 worker 隔离。
- 执行层：`AgentRuntimeAdapter` 抽象，先实现 `LocalStorySpecRunner`，再接 `OpenHandsRunner`；所有输出仍走 candidate / preview / confirm / apply。
- 安全：所有 API 统一走 `userId + projectId` 授权；所有项目路径通过 `ProjectStorage` 规范化，禁止直接信任客户端路径。
- 可观测性：结构化日志、请求 ID、job trace、health check；作业链路必须能从请求追到 runtime 和写入结果。

## 总体开发顺序

1. `MU-00` OpenSpec 与架构基线。
2. `MU-01` 到 `MU-06` 完成 P0 上线门槛。
3. `MU-07` 到 `MU-10` 完成 runtime 与 OpenHands 接入基础。
4. `MU-11` 到 `MU-14` 完成备份恢复、部署、安全回归、文档和归档收口。

## P0 上线门槛

### MU-00 OpenSpec 与架构基线

- 对应待办：所有多用户 App P0/P1。
- 目标：先固化数据模型、模块边界、API 边界和迁移策略。
- 涉及模块：`openspec/changes/design-multiuser-control-plane-and-agent-runtime`、`docs/tech/app-multiuser-roadmap.md`、本文。
- 开发产物：
  1. `proposal.md`：说明多用户 App、项目隔离、Job、审计、配额和 runtime adapter 的范围。
  2. `design.md`：定义 server 分层、PostgreSQL schema、Redis/BullMQ、ProjectStorage、AgentRuntimeAdapter。
  3. `tasks.md`：把本文任务转成可勾选实现项。
- 验收标准：OpenSpec 通过项目约定校验；后续代码实现能引用明确 change ID。
- 边界：不在本任务写业务代码。

### MU-01 多用户 server 骨架

- 对应待办：P0-1、P0-2、P0-3 的基础设施。
- 目标：建立独立于本机 `storyspec app` 的多用户服务入口。
- 涉及模块：未来 `src/server/index.ts`、`src/server/http/*`、`src/server/config/*`、`package.json` scripts。
- 开发产物：
  1. 新增 server 启动入口与配置加载。
  2. 新增 health check、request id、错误响应格式。
  3. 新增基础测试和启动 smoke。
- 验收标准：`npm run build` 通过；server 可在测试环境启动；错误响应结构稳定。
- 边界：不接真实登录、不接作业执行。

### MU-02 数据库 schema 与迁移框架

- 对应待办：P0-1 至 P0-5。
- 目标：建立 PostgreSQL 元数据基座。
- 涉及模块：未来 `src/server/db/*`、`migrations/*`、`tests/unit/*db*`。
- 开发产物：
  1. 用户、会话、项目、成员、作业、审计、配额表。
  2. migration 命令与测试数据库初始化脚本。
  3. repository 层接口，业务层不直接拼 SQL。
- 验收标准：全新数据库可一键迁移；测试可创建/清理隔离数据；schema 字段覆盖 P0 需求。
- 边界：不引入多租户共享项目模型，第一版 owner-only/member 基础角色即可。

### MU-03 身份、会话与权限守卫

- 对应待办：P0-1 身份与会话安全基线。
- 目标：实现登录态、会话失效和 API 权限入口。
- 涉及模块：未来 `src/server/auth/*`、`src/server/session/*`、`src/server/policies/*`。
- 开发产物：
  1. `User` / `Session` repository 和服务。
  2. httpOnly session cookie 或等价安全会话机制。
  3. `requireUser`、`requireProjectRole` 中间件。
  4. logout / revoke session。
- 验收标准：未登录不能访问项目 API；过期会话拒绝写操作；权限不足返回一致错误码。
- 边界：不做企业 SSO、OAuth provider、市面账号体系联登。

### MU-04 项目归属、ACL 与路径安全

- 对应待办：P0-2 项目隔离与路径安全、P2-2 多用户账号与项目隔离。
- 目标：所有项目访问都绑定 `userId + projectId`，禁止客户端路径直通文件系统。
- 涉及模块：未来 `src/server/projects/*`、`src/server/storage/*`、`src/application/*` 接入适配。
- 开发产物：
  1. `Project`、`ProjectMember` 创建与查询。
  2. `ProjectStorage`：规范化路径、限制 data root、拒绝 `..` 和符号链接逃逸。
  3. 项目 API 权限测试和路径穿越测试。
- 验收标准：用户只能访问自己项目；跨项目/越界路径访问失败；合法 StorySpec 文件读写正常。
- 边界：不做共享链接、团队空间和实时协作。

### MU-05 AgentJob 队列与状态机

- 对应待办：P0-3 AgentJob 作业控制面、P2-3 App 部署与 AI 成本边界。
- 目标：把长任务从同步请求转成可追踪作业。
- 涉及模块：未来 `src/server/jobs/*`、`src/server/queue/*`、`src/server/workers/*`。
- 开发产物：
  1. `AgentJob` 状态机：queued/running/succeeded/failed/canceled/timeout。
  2. BullMQ adapter、worker runner、幂等键、重试、超时、取消。
  3. 作业 API：创建、查询、取消、重试。
- 验收标准：长任务不会阻塞 HTTP 请求；失败可重试且不会重复 apply；取消后状态一致。
- 边界：不实现复杂 DAG、定时任务平台或跨区域调度。

### MU-06 审计、配额与限流

- 对应待办：P0-4 审计追溯与 Apply 证据链、P0-5 配额/限流/成本熔断。
- 目标：让每次写入可追溯，并限制多用户资源消耗。
- 涉及模块：未来 `src/server/audit/*`、`src/server/quota/*`、`src/server/jobs/*`。
- 开发产物：
  1. `AuditLog` 写入服务，记录 actor、project、source、diff summary、jobId、timestamp。
  2. 用户/项目级请求数、并发作业数、token 预算字段和检查器。
  3. 限流响应与 UI/API 可读的超限原因。
- 验收标准：任一 apply 可追溯；超限行为可预测；单用户不能压垮全局队列。
- 边界：不做商业计费系统。

## P1 平台化增强

### MU-07 AgentRuntimeAdapter 接口与 LocalStorySpecRunner

- 对应待办：P1-1 Runtime Adapter 与 OpenHands 接入、P2-0 执行引擎抽象。
- 目标：把“如何执行 agent 作业”从业务流程中剥离。
- 涉及模块：未来 `src/server/agent-runtime/*`、`src/server/jobs/*`。
- 开发产物：
  1. `AgentRuntimeAdapter` 接口：validate、start、cancel、stream/logs、result。
  2. `LocalStorySpecRunner`：先包装现有 CLI/application 能力。
  3. job 与 runtime 的状态映射。
- 验收标准：同一个 `AgentJob` 可通过 runtime adapter 执行；业务 API 不依赖具体 runner。
- 边界：不接 OpenHands，不执行自动 apply。

### MU-08 OpenHandsRunner PoC

- 对应待办：P1-1 Runtime Adapter 与 OpenHands 接入。
- 目标：验证 OpenHands headless/SDK 作为外部执行引擎的边界。
- 涉及模块：未来 `src/server/agent-runtime/openhands/*`、`docs/tech/*`。
- 开发产物：
  1. OpenHands 命令/SDK 调用 adapter。
  2. 工作区隔离与输入/输出映射。
  3. 自动批准风险说明与平台侧 confirm/apply 兜底。
- 验收标准：低风险任务可通过 OpenHands runtime 跑通；输出只进入候选/预览，不直接写正典。
- 边界：不照搬 OpenHands 企业目录能力，不把 headless 自动批准等同于 StorySpec apply。

### MU-09 多用户 App API 与 UI 回流

- 对应待办：P1-2 多用户协作体验基础层、P2-1 App 工作台延续。
- 目标：让用户在 App 内完成项目选择、状态回流、作业查看和基础成员动作。
- 涉及模块：未来 `src/server/http/*`、`apps/web/*` 或现有 `src/app-server/*` 过渡层。
- 开发产物：
  1. 项目列表、当前项目、成员列表、作业列表 API。
  2. App 中展示作业状态、权限提示、可执行下一步。
  3. 成员邀请/移除的基础 UI（非实时协作）。
- 验收标准：用户不用 CLI 即可进入项目、查看权限和追踪作业。
- 边界：不做多人实时编辑和共享链接。

### MU-10 可观测性与故障定位

- 对应待办：P1-3 可观测性与故障定位。
- 目标：能定位“请求 -> 作业 -> runtime -> 写入结果”链路。
- 涉及模块：未来 `src/server/observability/*`、`src/server/jobs/*`。
- 开发产物：
  1. 结构化日志、request id、job trace id。
  2. health/readiness endpoint。
  3. 失败作业的错误分类与排障字段。
- 验收标准：一次失败能定位到用户、项目、作业、runtime 和错误原因。
- 边界：不引入复杂 APM 平台绑定。

### MU-11 备份、恢复、导出与删除

- 对应待办：P1-4 备份恢复与数据生命周期、P2-2 删除/导出策略。
- 目标：保证用户可退出、可恢复、可删除。
- 涉及模块：未来 `src/server/storage/*`、`src/server/projects/*`、`src/server/audit/*`。
- 开发产物：
  1. 项目快照与恢复点。
  2. 导出为本地 StorySpec 项目包。
  3. 删除项目/账号数据流程和审计记录。
- 验收标准：项目可导出；误操作有恢复路径；删除有明确结果和审计。
- 边界：不做跨区域灾备。

## P2 部署与文档收口

### MU-12 自托管部署配置

- 对应待办：P2-3 App 部署与 AI 成本边界。
- 目标：提供本地/自托管运行所需的最小部署件。
- 涉及模块：未来 `docker-compose.yml`、`docs/deploy/*`、`src/server/config/*`。
- 开发产物：
  1. app server、PostgreSQL、Redis、worker 的本地 compose。
  2. env 示例与 secret 配置说明。
  3. 数据目录和备份位置说明。
- 验收标准：新机器可按文档启动最小自托管环境。
- 边界：不承诺 Kubernetes/企业高可用。

### MU-13 安全与越权回归测试

- 对应待办：P0-1 至 P0-5 的验收收口。
- 目标：把多用户核心风险固定成自动化测试。
- 涉及模块：`tests/security/*`、`tests/smoke/*multiuser*`、`tests/unit/*policy*`。
- 开发产物：
  1. 未登录/过期/权限不足测试。
  2. 跨用户项目访问测试。
  3. 路径穿越和重复 apply 测试。
- 验收标准：安全回归测试稳定通过，并纳入 `npm run verify` 或专门 CI 清单。
- 边界：不替代第三方安全审计。

### MU-14 README、changeset 与归档

- 对应待办：所有已完成多用户批次。
- 目标：文档只描述真实可用能力，未实现能力留在路线图。
- 涉及模块：`README.md`、`docs/*`、`changes/*.md`、`docs/tech/todo-archive.md`。
- 开发产物：
  1. 用户可见能力更新。
  2. changeset 记录 CLI/API/部署/安全行为变化。
  3. 完成项归档并从 `todo-index.md` 移除或降级。
- 验收标准：README 不提前承诺未实现能力；待办入口只保留未完成项。
- 边界：不把 roadmap 内容复制成用户承诺。
