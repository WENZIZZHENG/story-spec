## Why

项目隔离底座已经能检查 `userId + projectId` 和规范化项目内路径，但多用户 HTTP 入口还没有项目 API。后续所有故事文件、章节、作业和审计都不能让客户端直传文件系统路径，必须先通过项目授权，再由 `ProjectStorage` 解析相对路径。

## What Changes

- 新增受保护项目元信息端点。
- 新增受保护路径解析端点，只接受项目内相对路径。
- 统一复用 session guard、project membership 和 `ProjectStorage`。

## Non-goals

- 不实现项目创建、成员邀请或项目列表。
- 不读取或写入故事正文文件。
- 不支持共享链接或团队空间。

## Impact

影响 `src/server/http/multiuser-server.ts`、`tests/unit/multiuser-server.test.ts`、changeset 和多用户路线图。

## Capabilities

- `multiuser-project-api-guard`
