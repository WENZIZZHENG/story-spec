## Design

### Queue boundary

新增 `src/server/queue/agent-job-queue.ts` 作为源文件，定义：

- `AgentJobQueue`：`enqueue/dequeue/ack/fail/getReadyState/close`。
- `AgentJobQueuePayload`：只传 `jobId/projectId/userId/runtime/kind/attempt/traceId`，正文内容仍由 repository/runtime 获取，避免队列成为正典写入通道。
- `QueueReadyState`：`configured/connected/worker/driver`，供 `/ready` 和 CLI 输出使用。
- `createMemoryAgentJobQueue()`：单元测试和无 Redis 环境的最小实现。

新增 `src/server/queue/bullmq-agent-job-queue.ts` 作为 BullMQ adapter 源文件。它只依赖 `bullmq` 的 `Queue/Worker/QueueEvents` 连接 Redis，并把 BullMQ job 映射为 `AgentJobQueuePayload`。单元测试使用 constructor injection / fake client 验证边界，不要求启动 Redis。

### Worker runner

新增 `src/server/workers/agent-job-worker.ts`：

- `runNextAgentJob()`：拉取一个 payload，查 repository，确认 job 仍为 `queued` 且 runtime 已注册，然后调用 `runAgentJobWithRuntime()`。
- 成功时 ack queue，并返回 preview-only output；失败时 fail queue，job 状态由 runtime runner 标记为 `failed`。
- 如果 job 已取消或不再 queued，worker ack 并跳过，避免取消后仍执行。
- worker 不调用任何 apply、preview apply 或文件写入入口，继续尊重 preview / confirm / apply 边界。

### HTTP and CLI wiring

`startMultiuserServer()` 增加可选 `jobQueue`。当 `POST /api/projects/:projectId/jobs` 创建新 job 成功后，server enqueue payload；如果 idempotency key 命中已有 active job，不重复入列。`/ready` 新增 `queue` 状态。

新增 `src/cli/commands/multiuser-worker.command.ts` 并在 `src/cli/program.ts` 注册 `storyspec worker`。worker command 读取：

- `STORYSPEC_DATABASE_URL` / `STORYSPEC_DATABASE_MIGRATE`
- `STORYSPEC_REDIS_URL`
- `STORYSPEC_WORKER_CONCURRENCY`
- `STORYSPEC_WORKER_ONCE`

默认需要 PostgreSQL 和 Redis 才运行真实 worker；测试可通过 dependency injection 注入内存队列和 repository。compose 新增独立 `storyspec-worker` 服务。

### Documentation boundary

README 和部署文档只写“首批 worker 队列底座”和“preview-only runner”，不承诺完整 SaaS、真实 OpenHands 执行、富文本或实时协作。涉及候选/正文/正典的输出继续必须由后续 preview / confirm / apply 流程确认。
