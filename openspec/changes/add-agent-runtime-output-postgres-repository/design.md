# Runtime Output PostgreSQL Repository 设计

## 方案

新增 `agent_runtime_outputs` 表，使用 `job_id` 外键关联 `agent_jobs`。`artifacts` 和 `logs` 先以 `jsonb` 保存，避免在首批切片中过早拆分子表；后续如果需要按 artifact kind、log level 或全文检索筛选，再单独增加索引或规范化表。

## 兼容性

migration 使用 `create table if not exists` 和新版本号 6。已有部署如果已经在 version 5，下一次 migration 会补建新表并记录 version 6。既有 job、audit、collaboration 表不改字段。

## 回滚

本切片不自动删除表。需要人工回滚时，可以停止 worker/server 后删除 `agent_runtime_outputs` 表，并移除 schema_migrations version 6 记录；正式故事文件不受影响。

## 验证

- schema unit test 覆盖新表、列、migration version 和 SQL。
- repository unit test 覆盖 save/listByJob 的 JSON 序列化和反序列化。
- `npm run build` 确认类型边界。
