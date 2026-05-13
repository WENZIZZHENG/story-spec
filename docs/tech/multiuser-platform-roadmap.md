# 多人平台与 API 契约路线图

## 状态

Planned。本文承接多人在线平台的产品对象、权限模型、API contract、真实持久化、worker 队列和完整前端承载层。它依赖 [app-ux-roadmap.md](app-ux-roadmap.md) 的产品体验设计产物。

## 覆盖功能缺口

- 账号、团队和权限体系：注册登录、session、workspace/team/project、邀请、角色矩阵、故事级和章节级权限、高风险操作权限和权限 UI。
- 真实持久化和数据层：PostgreSQL driver、连接池、migration runner、事务边界、真实 repository、integration tests、ready 状态和多租户隔离。
- Worker 队列和 agent 真实执行：Redis/BullMQ 或等价队列、独立 worker、完整 job lifecycle、幂等、取消、重试、日志、runner 输出落库。
- 完整前端 App 架构：独立前端项目、路由、API client、鉴权状态、错误状态、App shell、E2E 和本机 fallback。

## P1-1 多人平台产品边界与角色模型

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

## P1-2 API contract 与前端状态模型前置设计

- 类型：API、产品体验、测试契约
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

## P1-4 Redis/BullMQ worker 与 agent job 真实执行队列

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

## P1-5 完整 App 前端架构与 API 契约落地

- 类型：前端架构、API、产品体验
- 背景/问题：当前 `storyspec app` 是零依赖本机页面，能证明工作台流程，但不适合作为长期多人在线 App 的前端承载层。
- 已有基础：`src/app-server/local-app-html.ts`、`src/app-server/local-app-server.ts`、本机 App API、server 控制面 API、P1-0 产品体验设计、P1-2 API contract。
- 缺口：缺少前端框架、路由、状态管理、API client、错误边界、登录态、权限态、加载态、端到端测试和可维护组件边界。
- 建议方案：
  1. 引用 P1-0 的 App IA 和 P1-2 的 API contract，先建立项目列表、故事工作台、章节写作、候选/评论、任务/审稿、设置的前端骨架。
  2. 再选择前端栈，优先小步迁移，不一次性重写本机工作台。
  3. 把现有 `local-app-html.ts` 拆为可替换 shell 或静态 fallback。
- 涉及文件/模块：`src/app-server/*`、`src/server/http/*`、未来 `app/` 或 `web/`、tests/e2e。
- 验收标准：前端入口能登录或绑定 session，按权限展示项目/故事/章节；API 错误有统一呈现；本机 App fallback 不被破坏；Playwright 或等价 e2e 覆盖首屏和核心路径。
- 参考项目/资料：Liveblocks docs 的 comments/presence/notifications 作为协作体验清单；StorySpec 当前 App OpenSpec。
- 不做/边界：不在第一步做富文本编辑器或实时协同。
