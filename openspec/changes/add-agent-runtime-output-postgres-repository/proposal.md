## Why

`agent-runtime-output-records` 已提供 preview-only runtime output record 和内存 repository，但自托管 worker 仍无法把输出记录落到 PostgreSQL。后续 job output API、前端审阅和长期日志追踪需要真实 database repository 作为数据源。

## What Changes

- 新增 `agent_runtime_outputs` migration table，保存 jobId、candidateRef、previewOnly、summary、artifacts、logs、traceId 和 createdAt。
- 将 migration version 从 5 提升到 6。
- 在 `createMultiuserDatabaseRepositories()` 中暴露 `runtimeOutputs` repository，实现保存和按 job 查询。

## Non-goals

- 不新增 HTTP API。
- 不新增独立前端 UI。
- 不改变 worker 默认输出 preview-only 边界。
- 不自动 apply runtime output 到故事、正文、正典或 tracking。

## SDD 分级

full。该切片修改数据库 schema/migration 和 repository 契约，虽然范围小，但属于持久化结构变更。

## Impact

影响 `src/server/db/schema.ts`、`src/server/db/repositories.ts`、数据库相关 unit tests、OpenSpec、changeset 和 roadmap 文档。

## Capabilities

- `agent-runtime-output-postgres-repository`
