## 设计

在现有多用户 server job API 中新增两个可选依赖：

- `auditRepository`：成功创建、取消、重试 job 后调用 `recordAuditEvent()`。
- `quotaRepository`：创建 job 前依次消耗 project/job 与 user/job 配额。

配额策略保持最小：

1. 如果没有对应 quota bucket，视为未配置限制，允许执行。
2. 如果 project 或 user bucket 超限，返回 `429 QUOTA_EXCEEDED`。
3. 配额只在 job 创建成功路径消耗；取消和重试只记录审计，不额外消耗。重试本身会创建新的 queued job，但本 change 先保持“重试不重复计入配额”，避免用户因失败恢复被重复惩罚。

审计 action 命名：

- `agent_job.create`
- `agent_job.cancel`
- `agent_job.retry`

`source` 统一为 `multiuser-server`，`diffSummary` 使用短文本描述控制面动作，不代表正文 diff。

## 边界

- 该层不执行 runtime，因此不记录 apply 事件。
- 该层不暴露 audit list API；后续 MU-09 或 MU-11 可添加读取/导出。
- 配额消耗不是数据库事务级原子操作；真实 PostgreSQL/Redis 接入时需要把 quota consume 与 job create 放进事务或队列调度临界区。
