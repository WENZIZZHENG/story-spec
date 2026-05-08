## 设计

在多用户 server 入口继续扩展受保护端点：

- `POST /api/projects/:projectId/jobs`：创建 queued job。
- `GET /api/projects/:projectId/jobs/:jobId`：查询 job。
- `POST /api/projects/:projectId/jobs/:jobId/cancel`：取消 job。
- `POST /api/projects/:projectId/jobs/:jobId/retry`：重试 failed/timeout job。

所有端点都先通过 session，再通过 `projectId` membership。查询、取消和重试必须额外确认 job 属于该 project，防止跨项目 job id 探测。

## 边界

- 不接队列 runner。
- 不接 OpenHands。
- 不自动写入 StorySpec 正典或正文。
