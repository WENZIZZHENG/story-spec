## 设计

### Runtime

新增 `src/server/agent-runtime/agent-runtime.ts`：

- `AgentRuntimeAdapter`：`validate(job)`, `start(job)`, `cancel(job)`, `logs(job)`, `result(job)`。
- `runAgentJobWithRuntime()`：负责状态转移，成功时 job 从 `queued -> running -> succeeded`，失败时 `queued/running -> failed`，并保存错误摘要。
- runtime 输出只返回 `candidateRef` / `previewOnly`，不写正典。

新增 `local-storyspec-runner.ts`：

- 不直接 shell 调 CLI；第一版通过注入 executor 函数模拟本地执行。
- 默认 executor 返回 preview-only candidate，方便后续替换为 application service。

新增 `openhands-runner.ts`：

- 只构造 headless 任务计划：命令、workspace、prompt、autoApply=false。
- `start()` 默认返回 preview-only candidate。
- 不新增 npm dependency，不调用网络或真实二进制。

### App API 回流

扩展 `ProjectAccessRepository`：

- `listProjectsForUser(userId)`
- `listMembers(projectId)`

扩展 `AgentJobRepository`：

- `listByProject(projectId)`

HTTP API：

- `GET /api/projects`：登录后返回用户项目列表。
- `GET /api/projects/:projectId/members`：返回当前项目成员。
- `GET /api/projects/:projectId/jobs`：返回当前项目 job 列表；`POST` 继续创建 job。

### Observability

- `GET /ready` 返回 service/version/repositories/runtime readiness。
- `AgentJob` 增加 `traceId` 和 `runtimeErrorCode?`。
- `createErrorResponse()` 支持可选 `traceId`，但保持原字段兼容。

## 边界

- 这些 API 仍是控制平面基础，不是完整产品前端。
- 成员 API 只读；邀请/移除另行实现。
- job list 只按项目列出，不做分页和高级筛选。
