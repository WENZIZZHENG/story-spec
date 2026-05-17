## Why

OpenHands headless executor 已能显式运行并返回 preview-only candidate，但 stdout/stderr 仍只存在于 runner summary 中，没有稳定的输出记录模型。后续 job 日志、dashboard、产物回传和前端审阅都需要一个不会自动 apply 的 runtime output record 底座。

## What Changes

- 扩展 `AgentRuntimeOutput`，允许携带 preview-only artifacts 和 log entries。
- 新增 runtime output record repository，记录 jobId、candidateRef、summary、artifacts、logs、traceId 和 createdAt。
- `runAgentJobWithRuntime()` 在成功执行后可注入保存 output record。
- OpenHands headless 成功时把 bounded stdout/stderr 作为 preview artifact/log metadata 回传。

## Non-goals

- 不修改 PostgreSQL schema。
- 不新增 HTTP API 或独立前端 UI。
- 不把 OpenHands 输出写入正式故事、正文、正典或 tracking。
- 不持久化无限长 stdout/stderr；本切片只保留 bounded preview 文本。

## SDD 分级

standard。该切片新增跨 runtime 的输出记录契约和 repository 行为，会影响 worker 后续可观测性，但不改变正式写入或部署架构。

## Impact

影响 `src/server/agent-runtime/*`、相关 unit tests、OpenSpec、changeset 和 roadmap 文档。

## Capabilities

- `agent-runtime-output-records`
