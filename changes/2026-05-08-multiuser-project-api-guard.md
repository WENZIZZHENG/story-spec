---
change_type: minor
scope: server,security,docs
---

# 多用户项目 API 守卫

## CLI 行为

- 无新增用户命令；`storyspec server` 内部 HTTP 入口新增项目元信息与路径解析探针端点。

## 模板契约

- 无用户可见模板契约变化。

## 生成产物

- 新增受保护 `GET /api/projects/:projectId`，只向已授权成员返回项目元信息。
- 新增受保护 `GET /api/projects/:projectId/resolve?path=<relative>`，通过 `ProjectStorage` 解析项目内相对路径。
- 路径为空、绝对路径或包含 `..` 时返回 `PROJECT_PATH_INVALID`。

## 验证

- `npx vitest run tests/unit/multiuser-server.test.ts`
- `npm run build`
