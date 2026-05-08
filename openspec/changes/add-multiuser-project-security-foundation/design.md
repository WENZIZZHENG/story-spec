## 设计

本 change 实现多用户路线的第一个可运行安全切片：不做 HTTP、数据库或队列，只提供纯 TypeScript 的授权和路径规范化模块。这样后续 server 和 repository 可以先依赖稳定接口，再替换内存或数据库实现。

## 源文件边界

- 新增 `src/server/projects/project-security.ts`：类型、授权守卫、路径解析和内存仓库测试辅助。
- 新增 `tests/unit/multiuser-project-security.test.ts`：覆盖授权和路径安全。
- 新增 changeset，说明这是多用户安全 foundation，不是可用账号系统。
- 不修改 `src/app-server/**`、`src/cli/**`、`dist/**`。

## 授权模型

最小模型：

- `MultiuserProject`：`id`、`ownerUserId`、`dataRoot`。
- `ProjectMembership`：`projectId`、`userId`、`role`，第一版支持 `owner` / `member`。
- `ProjectAccessContext`：`userId`、`projectId`、`role`。
- `ProjectAccessResult`：成功时返回 context 和 project；失败时返回 `blockedReasons`。

`requireProjectAccess()` 必须：

- 拒绝缺少 `userId` 或 `projectId` 的请求。
- 查询项目是否存在。
- 查询成员关系。
- role 权限不足时拒绝。
- 成功时返回已授权项目与上下文。

## ProjectStorage

`createProjectStorage(project)` 提供：

- `resolve(relativePath)`：返回项目 data root 内的绝对路径。
- 拒绝空路径、绝对路径、`..` 段、Windows / POSIX 混合路径越界。
- 输出用当前平台绝对路径，供后续文件系统 adapter 使用。

本层只做路径和授权，不直接读写文件。
