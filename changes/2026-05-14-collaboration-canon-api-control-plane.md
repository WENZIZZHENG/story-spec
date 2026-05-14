---
change_type: minor
scope: server,docs
---

# 协作正典 HTTP 控制面

## CLI 行为

- 无新增 CLI 命令。

## 多用户控制面

- Multiuser server 新增项目级协作正典 mutation：创建 proposal、提交 review decision、创建 canon patch、发起 apply request。
- 协作 mutation 复用现有 session/project 权限守卫，并分别使用 `create-candidate`、`review-canon`、`apply-canon-change` 权限动作。
- `/ready` 的 repositories 状态新增 `collaboration` 标记。
- 成功 mutation 会写入 audit log，来源为 `multiuser-server`。

## 模板契约

- 无模板生成产物变化。

## 生成产物

- 不手工修改 `dist/**`。

## 协作正典边界

- 本切片只开放 HTTP 控制面对象和 apply gate 结果。
- 不实现真实文件 apply、PostgreSQL repository、评论/审批 UI、通知或实时协同。
- 不自动写正式 story、chapter、canon 或 tracking 文件。

## 验证

- `npx openspec validate add-collaboration-canon-api-control-plane --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-server.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
