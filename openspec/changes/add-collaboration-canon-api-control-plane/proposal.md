## Why

协作正典合并协议已经能表达 proposal、review decision、canon patch 和 apply request，但多人在线 App 还缺少 HTTP 控制面。前端和外部客户端目前不能通过多用户 server 创建候选、提交审阅、生成 patch 或发起 apply gate 检查，也无法把这些动作写入审计链。

## What Changes

- 在 multiuser server 中新增协作正典 API：创建 proposal、提交 review decision、创建 canon patch、创建 apply request。
- 复用现有 session/project 权限守卫，并按动作使用 `create-candidate`、`review-canon`、`apply-canon-change`。
- 将协作变更写入 audit log，保持 author/reviewer/source 的可追踪性。
- 在 readiness 中暴露 collaboration repository 配置状态。

## Non-goals

- 不实现真实文件 apply、正典写入器或 PostgreSQL migration。
- 不实现 Yjs/CRDT、实时编辑同步、评论 UI 或通知中心。
- 不改变现有 job API 行为。

## Impact

影响 `src/server/http/multiuser-server.ts`、协作 API 单元测试、路线图/待办和 changeset。该变更是完整 App 的协作控制面第一片，为后续前端审批面板和持久化 repository 铺路。

## Capabilities

- `collaboration-canon-api`
