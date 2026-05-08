## 设计

本 change 提供框架无关的 `AgentJob` 状态机。它只管理元数据和状态，不运行任务。队列、worker、runtime 和结果写入后续通过独立 change 接入。

## 状态机

状态：

- `queued`
- `running`
- `succeeded`
- `failed`
- `canceled`
- `timeout`

合法转移：

- `queued -> running`
- `queued -> canceled`
- `running -> succeeded`
- `running -> failed`
- `running -> timeout`
- `running -> canceled`
- `failed -> queued` 通过 retry 创建新尝试
- `timeout -> queued` 通过 retry 创建新尝试

终态 `succeeded`、`canceled` 不可重试。

## 数据模型

`AgentJob` 包含：

- `id`
- `userId`
- `projectId`
- `kind`
- `runtime`
- `status`
- `attempt`
- `idempotencyKey`
- `createdAt`
- `updatedAt`
- `errorMessage`

## 幂等

`createAgentJob()` 如果收到相同 `projectId + userId + idempotencyKey` 的非终态 job，应返回已有 job，避免重复排队。

## 源文件边界

- 新增 `src/server/jobs/agent-job.ts`。
- 新增 `tests/unit/multiuser-agent-job.test.ts`。
- 新增 changeset。
- 不修改 `src/app-server/**`、`dist/**` 或 package 依赖。
