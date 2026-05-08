## 设计

第一版只定义 PostgreSQL 元数据基座和 repository 边界，不实现真实连接池或 ORM 全量接入。设计目标是让后续 `MU-03` 到 `MU-06` 可以把内存 repository 无痛替换为数据库 repository，同时不破坏已完成的 session、project-security、agent-job、audit 和 quota foundation。

## 源文件边界

- 新增 `src/server/db/schema.ts`：集中定义表与类型。
- 新增 `src/server/db/migrations.ts`：迁移版本与初始化入口。
- 新增 `src/server/db/repositories/*`：用户、会话、项目、成员、作业、审计、配额 repository 适配层。
- 新增 unit / smoke tests。
- 不修改本机 `storyspec app`。

## 行为

- schema 必须覆盖 user、session、project、membership、agent job、audit log、quota bucket。
- quota bucket 沿用现有 `scope/metric/limit/used` 语义，每行代表一个用户或项目在一个 metric 上的限制，不做宽表。
- repository 层必须沿用现有 foundation 的领域字段，不改动高层业务语义。
- migration 初始化必须可重复执行，不依赖人工修改。

## 验证

- 先用 unit test 锁定 schema 字段和 repository 接口。
- 再实现最小 schema / migration / repository 骨架。
- 最后跑 build、unit、smoke 和 changes 检查。
