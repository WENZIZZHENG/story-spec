## Why

P1-2 已经冻结多人平台 API envelope 和首批页面 endpoint map，但 P1-1 的产品角色与权限边界仍停留在 `owner/member` 基础模型。完整 App 需要让前端、server、审计和未来协作对象都能回答“谁能看、谁能评论、谁能创建候选、谁能运行 agent job、谁能 apply 正典或删除项目”。如果不先把角色矩阵落成可测试契约，后续真实数据库、worker 和前端会继续各自拼权限字段。

## What Changes

- 新增多人平台角色/权限模型，定义 `owner`、`editor`、`reviewer`、`viewer`、`agent` 五类项目角色。
- 定义覆盖项目、故事、章节、候选、评论、正典、agent job、导出、删除和成员管理的权限动作矩阵。
- 将权限决策接入现有项目访问守卫，保留 `userId + projectId` 授权边界，并让高影响动作明确返回“需要作者确认”。
- 更新 membership schema 和 repository typing，使真实数据库后续能保存扩展角色。
- 同步 API contract、changeset 和路线图状态，继续说明完整多人在线平台仍未完成。

## Non-goals

- 不实现邀请邮件、商业组织、公开社区、计费或企业 IAM。
- 不实现故事/章节级独立 ACL 表；第一版先用项目成员角色推导故事和章节权限。
- 不让 editor/reviewer/agent 绕过 Preview / Confirm / Apply。
- 不接真实 PostgreSQL driver、Redis/BullMQ worker 或完整前端。

## Impact

影响 `src/server/projects/*`、`src/server/db/*`、`src/server/http/api-contract.ts`、unit tests、changeset 和多人平台路线图。该变更是 P1-3 数据库、P1-4 worker、P1-5 前端权限态的输入。

## Capabilities

- `multiuser-role-permission-model`
