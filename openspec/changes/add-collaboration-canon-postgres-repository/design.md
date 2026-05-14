## Data Model

新增四张表，保持一类对象一张表：

- `collaboration_proposals`
- `collaboration_review_decisions`
- `collaboration_canon_patches`
- `collaboration_apply_requests`

对象中的嵌套字段先以 `jsonb` 保存：`target`、`source_refs`、`risks`、`current_version`、`patch_ids`、`reviewer_ids`、`blocked_reasons`。这样可以复用当前领域模型，避免为了首批持久化过早拆成复杂 join 表。后续若需要按 story、source 或 risk 过滤，再单独 OpenSpec 增加索引或规范化表。

## Migration Strategy

`MULTIUSER_MIGRATION_VERSION` 从 1 升到 2。migration plan 继续包含所有 `create table if not exists` 语句，因此新库可一次建全表，旧库运行 v2 时只会补协作表并记录 version 2。当前 runner 已按目标 version 判断是否应用；本切片不改 rollback。

## Repository Boundary

`MultiuserDatabaseRepositories` 新增 `collaboration` 字段。实现必须满足 `CollaborationCanonRepository`：

- `findProposalById`
- `saveProposal`
- `listReviewDecisions`
- `saveReviewDecision`
- `listPatches`
- `savePatch`
- `saveApplyRequest`
- `snapshot`

`snapshot` 用于测试和本机调试，按现有内存 repository 返回所有协作对象。评论线程持久化暂不实现，接口保持可选。

## Server Wiring

`createPostgresDatabaseConnection` 返回的 repositories 将包含 collaboration。`storyspec server` 启用 `STORYSPEC_DATABASE_URL` 时传入 `collaborationRepository`，因此 HTTP 协作 API 可直接使用 PostgreSQL-backed repository。

## Error Handling

数据库 executor 错误继续向上抛，由现有 HTTP error envelope 和 CLI command 流程处理。本切片不新增重试、事务 helper 或连接池策略。
