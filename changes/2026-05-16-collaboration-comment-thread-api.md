---
change_type: minor
scope: collaboration,multiuser
---

# 增加协作评论线程接口

## 背景

多人在线写作平台需要让作者、编辑和审稿者围绕候选正典变更讨论，但评论不能绕过候选审阅、审批和 apply gate 直接修改正式故事文件。

## 变化

- 新增 proposal 锚定的评论线程领域能力，评论记录 actor、body 和创建时间。
- 新增 `collaboration_comment_threads` PostgreSQL 表，multiuser migration 升级到 v3。
- 新增 `POST /api/projects/:projectId/collaboration/proposals/:proposalId/comments` 创建评论，并写入 audit log。
- 新增 `GET /api/projects/:projectId/collaboration/proposals/:proposalId/comments` 读取 proposal 评论线程。
- 更新协作正典路线图和待办入口，标记 proposal 评论线程 API 已完成，后续进入评论审批 UI。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化；未修改 `dist/**`。

## 验证

- `npx.cmd openspec validate add-collaboration-comment-thread-api --strict --json --no-interactive`
- `npx.cmd vitest run tests/unit/collaboration-canon-merge.test.ts tests/unit/multiuser-database.test.ts tests/unit/multiuser-server.test.ts`
- `npm run build`
- `npm run check:changes`
- `npm test`
- `git diff --check`
