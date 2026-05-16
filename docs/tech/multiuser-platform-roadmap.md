# 多人平台与 API 契约路线图

## 状态

Active。本文承接多人在线平台的产品对象、权限模型、API contract、真实持久化、worker 队列和完整前端承载层。它依赖 [app-ux-roadmap.md](app-ux-roadmap.md) 的产品体验设计产物。

## 覆盖功能缺口

- 账号、团队和权限体系：注册登录、session、workspace/team/project、邀请、角色矩阵、故事级和章节级权限、高风险操作权限和权限 UI。
- 真实持久化和数据层：PostgreSQL driver、连接池、migration runner、事务边界、真实 repository、integration tests、ready 状态和多租户隔离。
- Worker 队列和 agent 真实执行：Redis/BullMQ 或等价队列、独立 worker、完整 job lifecycle、幂等、取消、重试、日志、runner 输出落库。
- 完整前端 App 架构：独立前端项目、路由、API client、鉴权状态、错误状态、App shell、E2E 和本机 fallback。

## P1-1 多人平台产品边界与角色模型

- 类型：产品范围、权限、数据模型
- 状态：已完成首批底座（2026-05-13）。`add-multiuser-role-permission-model` 已冻结 `owner/editor/reviewer/viewer/agent` 项目角色、项目/故事/章节/候选/评论/正典/agent job/成员/导出/删除权限动作矩阵，并把 action-level 权限检查接入 project guard；故事/章节级独立 ACL、邀请流程和复杂 workspace/team 表仍留给后续 OpenSpec。
- 背景/问题：当前 server 已有控制面基础，但“多人在线写作平台”需要先定义用户、团队、项目、故事、章节、角色权限、协作边界和作者控制权，不然容易把多人协作做成共享文件夹。
- 已有基础：session/project guard、membership、project metadata、audit/quota、job list、项目删除计划。
- 缺口：故事级和章节级独立权限、邀请流程、复杂 workspace/team 表、权限 UI、离线导出与删除的真实执行仍未实现。
- 建议方案：
  1. 新建 OpenSpec 定义平台对象模型和权限矩阵。
  2. 明确“谁能创建候选、谁能评论、谁能 apply 正典、谁能发布章节、谁能运行 agent job”。
  3. 把权限检查接到现有 project guard、audit 和 quota。
- 涉及文件/模块：`src/server/auth/*`、`src/server/projects/*`、`src/server/audit/*`、`src/server/quota/*`、`docs/deploy/self-hosted.md`。
- 验收标准：权限矩阵覆盖项目、故事、章节、候选、评论、agent job、导出/删除；跨用户访问失败；敏感动作进入 audit；README 只写基础或实验性状态。
- 参考项目/资料：Liveblocks docs 的协作 App 能力清单；当前多用户 OpenSpec changes。
- 不做/边界：不做商业计费或公开社区。

## P1-2 API contract 与前端状态模型前置设计

- 类型：API、产品体验、测试契约
- 状态：已完成首批底座（2026-05-13）。`add-multiuser-api-contract-state-model` 已冻结统一 envelope、错误码、权限状态、首批页面 endpoint map 和 fixtures；P1-1 已进一步把 page permission actions 对齐到角色权限模型。
- 背景/问题：完整 App 不能等前端开工后再临时拼字段；项目列表、故事工作台、章节入口、候选审阅、任务中心、成员权限都需要稳定的响应结构、错误格式、权限状态和 loading / empty / offline 状态。否则前端设计、server API、权限模型和 E2E 会互相返工。
- 已有基础：本机 App API、server 控制面 API、`src/server/http/multiuser-server.ts`、session/project guard、audit/quota/job 控制面、P1-0 将产出的页面地图和状态语言词典。
- 缺口：缺少统一 API envelope、错误码、request id、权限决策对象、分页/排序规则、资源版本字段、前端 mock fixtures、API contract tests 和 OpenAPI/等价契约文档。
- 建议方案：
  1. 从 P1-0 首批页面反推 endpoint map：项目列表、故事工作台、章节写作入口、候选审阅、任务中心、成员权限。
  2. 定义统一响应 envelope：`data`、`error`、`requestId`、`permissions`、`resourceVersion`、`warnings`。
  3. 定义统一错误格式：认证失败、权限不足、资源不存在、冲突、流程阻塞、配额不足、服务离线。
  4. 定义权限状态模型：允许、拒绝、禁用原因、申请权限入口、是否需要二次确认。
  5. 为前端提供 mock fixtures，让 UX/前端能在真实后端完成前走通页面状态。
  6. 增加 API contract tests，保护 server 和未来 web client 的字段契约。
  7. 先落地 `multiuser-api-contract-state-model` 变更，冻结首批页面 endpoint map、权限状态和 fixtures，再继续数据库、worker 和完整前端。
- 涉及文件/模块：`src/server/http/*`、`src/app-server/*`、未来 `web/` 或 `app/`、未来 `tests/contract/`、`docs/deploy/self-hosted.md`、后续 OpenSpec artifacts。
- 验收标准：首批页面都有 endpoint map、响应字段、错误状态和权限状态；contract fixtures 能覆盖 success / empty / unauthorized / forbidden / conflict / blocked / offline；server 变更能通过 contract tests 暴露破坏性字段变化；P1-5 完整前端架构必须引用本任务产物。
- 参考项目/资料：当前 server 控制面 API；Liveblocks docs 的协作状态边界；OpenAPI/JSON Schema 只作为契约表达候选，不默认引入生成链。
- 不做/边界：本任务不实现完整前端、不接真实数据库、不引入大型 API framework；它只定义可测试的 API 和状态契约。

## P1-3 真实 PostgreSQL driver、迁移执行与数据访问层

- 类型：存储、部署、可靠性
- 状态：已完成首批底座（2026-05-13）。`add-multiuser-postgres-driver` 已接入 `pg` connection pool、PostgreSQL executor、可重复 migration runner、`STORYSPEC_DATABASE_URL` / `STORYSPEC_DATABASE_MIGRATE` server wiring，以及 `/ready.database` configured/connected/migrated 状态；真实测试数据库容器 fixture、事务 helper 和生产 rollback 策略仍留给后续质量批次。
- 背景/问题：当前已定义 PostgreSQL schema、migration plan 和 repository adapter；多用户平台不能长期依赖内存 repository。
- 已有基础：`src/server/db/schema.ts`、`src/server/db/repositories.ts`、`src/server/db/postgres.ts`、`docker-compose.yml`、`docs/deploy/self-hosted.md`。
- 缺口：缺少真实测试数据库 fixture、事务边界 helper、生产 migration rollback 和大规模数据访问压测。
- 建议方案：
  1. 接入 PostgreSQL driver 和连接池。
  2. 增加 migration runner，并在 server startup 或独立命令中可控执行。
  3. 为 sessions/projects/memberships/jobs/audit/quota 增加真实 repository integration tests。
  4. 更新 docker compose 和自托管说明。
- 涉及文件/模块：`src/server/db/*`、`src/server/http/multiuser-server.ts`、`docker-compose.yml`、`.env.example`、`docs/deploy/self-hosted.md`、tests。
- 验收标准：本地 compose 可启动 PostgreSQL-backed server；`/health`、`/ready` 能区分应用和数据库状态；迁移可重复运行；数据库测试不依赖内存替身。
- 参考项目/资料：PostgreSQL 官方文档；当前 `add-multiuser-database-foundation`。
- 不做/边界：不在本任务引入复杂 ORM，除非 OpenSpec 证明收益高于维护成本。

## P1-4 Redis/BullMQ worker 与 agent job 真实执行队列

- 类型：任务调度、agent runtime、可观测性
- 状态：已完成首批底座（2026-05-16）。`add-multiuser-worker-queue` 已新增 `AgentJobQueue`、内存队列、BullMQ adapter、preview-only worker runner、server job enqueue、`/ready.queue` 和 `storyspec worker` CLI wiring；`add-worker-reliability-policy` 已补 worker failure policy、retryable/dead-letter 决策和失败记录底座；`add-agent-job-dashboard-read-api` 已提供项目级 job dashboard 读模型，展示状态计数、active/retryable 数量和 queue readiness；`add-agent-job-log-read-api` 已提供项目级 job 日志只读接口，从 job 状态生成创建、运行结果、失败原因和 runtime error code 时间线；`add-worker-alert-summary-read-api` 已提供项目级 worker 告警摘要只读接口，聚合 retryable/dead-letter failure、queue readiness 和 failed job 状态；`add-openhands-headless-executor` 已提供显式 opt-in 的 OpenHands headless executor；`add-worker-lease-heartbeat` 已提供 worker lease/heartbeat 领域模型和内存 repository；`add-worker-lease-recovery-plan` 已提供 stale worker 只读恢复计划；`add-worker-stale-job-timeout-recovery` 已提供 stale running job timeout 恢复执行器；`add-worker-job-lock` 已提供 worker job 独占锁领域模型和内存 repository；`add-agent-runtime-output-records` 已提供 preview-only runtime output record 和 OpenHands bounded stdout/stderr artifact 回传；`add-agent-runtime-output-postgres-repository` 已提供 output record PostgreSQL 表和 repository；`add-agent-runtime-output-read-api` 已提供项目级 job output 只读接口；`add-runtime-output-ui-slice` 已提供任务中心 output 预览 UI contract 和本机 shell 面板。高可用调度、BullMQ attempts 策略、外部告警推送、独立前端承载和预览结果落库仍留给后续质量批次。
- 背景/问题：当前有 job 控制面、审计/配额守卫、runtime adapter foundation、显式启用的 OpenHands headless executor、worker lease/heartbeat 底座、stale worker recovery plan、timeout recovery executor、worker job 独占锁底座、preview output record、PostgreSQL repository、项目级 output 只读 API 和本机任务中心 output UI contract，但 worker 还缺持久化分布式锁接入、高可用调度、独立前端承载和完整可观测性。
- 已有基础：`src/server/jobs/agent-job.ts`、`src/server/agent-runtime/*`、`src/server/quota/*`、`src/server/audit/*`、job API。
- 缺口：真实队列、worker 进程、基础重试/取消语义、幂等键、失败分类、job dashboard 读模型、基于 job 状态的日志查询、worker 告警摘要读接口、显式 OpenHands headless executor、worker lease/heartbeat、stale worker recovery plan、timeout recovery executor、worker job lock、preview output record、output record PostgreSQL repository、项目级 output 只读 API 和本机任务中心 output UI contract 已完成首批底座；仍缺独立前端承载、预览结果落库、外部告警推送、持久化锁接入、BullMQ attempts 策略和高可用调度。
- 建议方案：
  1. 先实现本地 runner worker，所有输出默认 preview-only。
  2. 再接 Redis/BullMQ 队列，补取消、重试、超时、并发限制和配额消耗。
  3. 再补 OpenHands 或其他 agent runtime 的产物回传、日志持久化和安全边界。
- 涉及文件/模块：`src/server/jobs/*`、`src/server/agent-runtime/*`、`src/server/audit/*`、`src/server/quota/*`、`docker-compose.yml`、tests。
- 验收标准：创建 job 后由 worker 异步处理；取消和重试有明确状态转移；失败不会 apply 正文或正典；所有写入候选都能追溯到 job/audit。
- 参考项目/资料：BullMQ 官方文档；当前 `add-multiuser-agent-job-foundation` 和 `add-multiuser-runtime-app-observability`。
- 不做/边界：不让 agent job 自动覆盖正式故事文件。

## P1-5 完整 App 前端架构与 API 契约落地

- 类型：前端架构、API、产品体验
- 状态：已完成首批底座（2026-05-16）。`add-complete-app-frontend-architecture-slice` 已新增完整 App 前端架构契约，冻结项目与工作区、故事驾驶舱、章节与写作、候选与正典审阅、任务中心的 route/API/status contract，并让本机 App shell 从该契约渲染导航和 API 地图；`add-independent-web-app-shell` 已新增 `apps/web/` 独立前端首片 shell、route/API 边界和 fallback 约束；登录态 UI、成员权限 UI、E2E、富文本编辑器和实时协作仍留给后续 OpenSpec。
- 背景/问题：当前 `storyspec app` 是零依赖本机页面，能证明工作台流程，但不适合作为长期多人在线 App 的前端承载层。
- 已有基础：`src/app-server/local-app-html.ts`、`src/app-server/local-app-server.ts`、本机 App API、server 控制面 API、P1-0 产品体验设计、P1-2 API contract。
- 缺口：独立前端项目首片 shell 已建立；仍缺状态管理、登录态 UI、成员权限 UI、错误边界组件、端到端测试、真实构建/dev server 和可维护组件边界。
- 建议方案：
  1. 引用 P1-0 的 App IA 和 P1-2 的 API contract，先建立项目列表、故事工作台、章节写作、候选/评论、任务/审稿、设置的前端骨架。
  2. 再选择前端栈，优先小步迁移，不一次性重写本机工作台。
  3. 把现有 `local-app-html.ts` 拆为可替换 shell 或静态 fallback。
- 涉及文件/模块：`src/app-server/*`、`src/server/http/*`、`apps/web/*`、tests/e2e。
- 验收标准：前端入口能登录或绑定 session，按权限展示项目/故事/章节；API 错误有统一呈现；本机 App fallback 不被破坏；Playwright 或等价 e2e 覆盖首屏和核心路径。首批底座已完成 route/API/status contract；后续验收应基于该契约扩展独立前端。
- 参考项目/资料：Liveblocks docs 的 comments/presence/notifications 作为协作体验清单；StorySpec 当前 App OpenSpec。
- 不做/边界：不在第一步做富文本编辑器或实时协同。
