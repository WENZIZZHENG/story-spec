# StorySpec 自托管说明

本文记录当前多用户控制平面的最小自托管配置。

## 当前可用

- `storyspec server` 可以启动多用户 HTTP server。
- `storyspec worker` 可以作为独立进程消费 agent job 队列。
- `/health` 和 `/ready` 可用于基础探活。
- 当前控制面已具备 session/project guard、项目元信息、路径解析探针、job 控制面、审计/配额守卫、runtime adapter foundation、只读 App 回流 API、完整 App 首批前端架构契约、PostgreSQL-backed repository 配置和 Redis/BullMQ worker 队列底座。

## 启动方式

1. 复制 `.env.example` 为 `.env` 并修改 `STORYSPEC_SESSION_SECRET`。
2. 先构建项目：`npm run build`。
3. 启动：`docker compose up`。
4. 检查：`GET http://127.0.0.1:4321/health` 和 `GET http://127.0.0.1:4321/ready`。

补充说明：compose 会把仓库源码以只读方式挂载进容器，并把 `node_modules` 放到独立 volume；首次启动会在容器里安装运行时依赖，前提是本地已经生成过 `dist/`。

## 数据库

- `STORYSPEC_DATABASE_URL` 配置后，`storyspec server` 会使用 PostgreSQL connection pool，并将 session/project/job/audit/quota repository 接到真实数据库 executor。
- `STORYSPEC_DATABASE_MIGRATE` 默认是 `true`，启动时会执行可重复 migration；设为 `false` 时只连接数据库，不自动建表。
- `/ready` 的 `database.configured`、`database.connected` 和 `database.migrated` 会分别显示数据库是否配置、是否连接成功、当前 migration version 是否已记录。

## Worker 队列

- `storyspec server` 在配置 `STORYSPEC_REDIS_URL` 并传入 queue adapter 后，会在创建新 agent job 后 enqueue；幂等命中的 active job 不会重复入列。
- `storyspec worker` 读取 `STORYSPEC_DATABASE_URL` 和 `STORYSPEC_REDIS_URL`，连接 PostgreSQL repository 与 Redis/BullMQ 队列，并通过现有 runtime adapter 处理 queued job。
- `STORYSPEC_WORKER_CONCURRENCY` 默认是 `1`；`STORYSPEC_WORKER_ONCE=true` 或 `storyspec worker --once` 可用于本地单次验证。
- `STORYSPEC_OPENHANDS_HEADLESS` 默认是 `false`；只有设为 `true` 时，OpenHands runtime 才会调用 `STORYSPEC_OPENHANDS_COMMAND` 指定的 headless 命令，并使用 `STORYSPEC_OPENHANDS_PROMPT_PREFIX` 作为任务提示前缀。
- worker 输出仍是 preview-only candidate，不会自动 apply 正文、正典、tracking 或正式故事文件。

## 重要边界

- 当前 Redis/BullMQ queue 和独立 worker 是首批底座，不包含生产级死信队列、分布式锁或高可用调度。
- 当前完整 App 前端架构只是本机 shell 可复用的首批 route/API/status contract，不包含独立前端项目、账号产品流、富文本编辑器或实时协作。
- `OpenHandsRunner` 默认仍是 PoC adapter；显式启用 headless executor 后可调用本机已安装的 OpenHands，但 StorySpec 不安装 OpenHands、不持久化 stdout/stderr，也不把输出自动应用为正式内容。
- 项目删除当前只生成需要二次确认的删除计划和审计事件，不直接删除磁盘文件。
- 该配置面向本地/自托管验证，不承诺 Kubernetes、企业高可用或商业计费。
