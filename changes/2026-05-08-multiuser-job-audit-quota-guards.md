---
change_type: minor
scope: server,jobs,security,docs
---

# 多用户 Job 审计与配额守卫

## CLI 行为

- 无新增用户命令；`storyspec server` 内部 HTTP job API 增加审计与配额守卫。

## 模板契约

- 无用户可见模板契约变化。

## 生成产物

- 受保护 `POST /api/projects/:projectId/jobs` 在创建 job 前检查 user/project 级 `job` 配额。
- 配额不足时返回 `429 QUOTA_EXCEEDED`，不会创建 job。
- job 创建成功后消耗 user/project job 配额。
- job 创建、取消和重试成功后写入审计事件。

## 验证

- `npx vitest run tests/unit/multiuser-server.test.ts`
