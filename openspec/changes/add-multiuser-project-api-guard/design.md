## 设计

在已有 `GET /api/context` guard 基础上继续复用同一鉴权路径，新增两个项目相关端点：

- `GET /api/projects/:projectId`：返回当前用户可访问的项目元信息。
- `GET /api/projects/:projectId/resolve?path=<relative>`：返回规范化后的服务端项目内路径，供后续读写 API 复用。

所有端点都先 requireUser，再 requireProjectAccess。路径解析只接受相对路径，并通过 `createProjectStorage()` 拒绝空路径、绝对路径和 `..` 越界。

## 边界

- 不做真实文件读取或写入。
- 不暴露未授权项目。
- 不绕过 `ProjectStorage`。
