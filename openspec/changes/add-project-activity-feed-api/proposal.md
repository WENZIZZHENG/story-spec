# add-project-activity-feed-api

## 背景

多人在线写作平台已经把 job、协作正典 proposal/review/patch/apply-request/comment 等关键 mutation 写入 audit log，但完整 App 仍缺少项目级活动流读接口。没有活动流，评论审批 UI、任务中心和成员协作页只能各自拼状态，用户很难理解“谁刚刚做了什么、是否需要我处理”。

## 目标

- 增加项目级 activity feed 读模型，基于现有 audit log 暴露活动列表。
- 提供 `GET /api/projects/:projectId/activity`，供完整 App 团队动态、候选审阅页和任务中心读取。
- Activity item 包含 actor、action、source、summary、jobId、createdAt，以及供 UI 分类的 kind。
- 保持只读边界，不新增通知投递、不修改 audit 写入语义。

## 非目标

- 不实现 WebSocket、实时 presence、推送通知或邮件通知。
- 不新增独立 activity 表；首批直接复用 audit log。
- 不实现分页游标之外的复杂筛选。

## 影响范围

- `src/server/audit/audit-log.ts`
- `src/server/http/multiuser-server.ts`
- `tests/unit/multiuser-audit-quota.test.ts`
- `tests/unit/multiuser-server.test.ts`
- `docs/tech/*`
