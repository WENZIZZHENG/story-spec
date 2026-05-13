# StorySpec 自托管说明

本文记录当前多用户控制平面的最小自托管配置。

## 当前可用

- `storyspec server` 可以启动多用户 HTTP server。
- `/health` 和 `/ready` 可用于基础探活。
- 当前控制面已具备 session/project guard、项目元信息、路径解析探针、job 控制面、审计/配额守卫、runtime adapter foundation、只读 App 回流 API 和 PostgreSQL-backed repository 配置。

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

## 重要边界

- 当前已提供 Redis/BullMQ 的部署占位，但还没有真实 worker queue。
- `OpenHandsRunner` 目前是 PoC adapter，不安装或调用真实 OpenHands。
- 项目删除当前只生成需要二次确认的删除计划和审计事件，不直接删除磁盘文件。
- 该配置面向本地/自托管验证，不承诺 Kubernetes、企业高可用或商业计费。
