---
change_type: minor
scope: server,docs
---

# 多人平台角色与权限模型

## CLI 行为

- 无新的 CLI 命令或参数。
- 多用户 server 的项目成员角色底座从历史 `owner/member` 扩展为 `owner/editor/reviewer/viewer/agent`。
- 项目访问守卫现在支持可选 action-level 权限判断，用于后续写入、job、成员、导出和删除 API 接入。

## 模板契约

- 无 agent prompt、slash command 模板或用户项目初始化模板变化。

## 生成产物

- 新增 `multiuser-role-permission-model` OpenSpec change，冻结首版角色模型、权限动作矩阵和高影响二次确认边界。
- 新增角色/权限单测，覆盖项目、故事、章节、候选、评论、正典、agent job、成员、导出和删除动作。
- 更新数据库 schema 约束、repository typing 和 API contract page permission actions。
- 该变更不表示完整多人在线平台已经完成；真实 PostgreSQL driver、Redis/BullMQ worker、邀请流程、故事/章节级独立 ACL 和完整前端仍是后续待办。

## 验证

- `npx openspec validate add-multiuser-role-permission-model --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-role-permissions.test.ts tests/unit/multiuser-project-security.test.ts tests/unit/multiuser-database.test.ts tests/unit/api-contract.test.ts tests/unit/api-contract-fixtures.test.ts tests/unit/multiuser-server.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
