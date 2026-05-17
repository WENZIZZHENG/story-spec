---
change_type: minor
scope: multiuser,collaboration
---

# 增加协作正典只读审阅面板 API

## 背景

协作正典已经具备 proposal、review、patch 和 apply request 的写入控制面与 PostgreSQL repository，但完整 App 的“候选与正典”页面还缺少稳定读模型。

## 变化

- 新增协作正典审阅读模型，聚合 proposal、review decisions、canon patches 和 apply requests。
- 新增 `GET /api/projects/:projectId/stories/:storyId/canon-review`，按故事读取只读审阅面板。
- 新增 `GET /api/projects/:projectId/collaboration/proposals?storyId=...`，复用同一只读面板。
- 为数据库 repository 增加 project/story proposal 查询和 apply request 查询能力。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

不手工修改 `dist/**`；构建产物由 `npm run build` 生成。

## 验证

- `npx openspec validate add-collaboration-canon-review-read-api --strict --json --no-interactive`
- `npx vitest run tests/unit/collaboration-canon-merge.test.ts tests/unit/multiuser-database.test.ts tests/unit/multiuser-server.test.ts tests/unit/api-contract.test.ts`
