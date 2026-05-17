---
change_type: minor
scope: collaboration,multiuser
---

# 增加项目活动流接口

## 背景

多人在线写作平台已经将 job、协作正典候选、评论、审批、patch 和 apply request 写入 audit log，但完整 App 仍缺少项目级活动流读接口，用户无法在一个地方看到团队近期动态。

## 变化

- 新增项目 activity feed 读模型，基于 audit log 生成活动项。
- 新增 activity kind 分类：`agent-job`、`collaboration`、`project`、`member`、`story`、`other`。
- 新增 `GET /api/projects/:projectId/activity`，返回项目活动流，最多读取 100 条。
- 更新协作正典路线图和待办入口，标记项目活动流 API 已完成。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化；未修改 `dist/**`。

## 验证

- `npx.cmd openspec validate add-project-activity-feed-api --strict --json --no-interactive`
- `npx.cmd vitest run tests/unit/multiuser-audit-quota.test.ts tests/unit/multiuser-server.test.ts`
- `npm.cmd run build`
- `npm.cmd run check:changes`
- `npm.cmd test`
- `git diff --check`
