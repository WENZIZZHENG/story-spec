## Why

多用户 App 的第一条硬边界是项目隔离。即使正式认证、数据库和队列还没落地，后续代码也不能继续依赖“客户端传 projectRoot 路径”这种单机模式。先实现一个小型、可测试的授权守卫和 `ProjectStorage` 路径规范化层，可以让后续 server、job、runtime 和 UI 都复用同一安全底座。

## What Changes

- 新增多用户项目安全 foundation，定义用户、项目成员关系、项目仓库和授权上下文的最小接口。
- 新增 `requireProjectAccess()`：根据 `userId + projectId + role` 判断是否允许访问，拒绝 path-only 访问和跨项目访问。
- 新增 `createProjectStorage()`：只在授权项目 data root 下解析相对路径，拒绝绝对路径、`..`、空路径和越界结果。
- 新增单元测试覆盖 owner/member 访问、非成员拒绝、路径穿越拒绝和合法路径解析。

## Non-goals

- 不引入 Fastify、PostgreSQL、Drizzle、Redis 或 BullMQ。
- 不实现登录、session cookie、密码、OAuth 或真实数据库 repository。
- 不改本机 `storyspec app` 的 session token / allowlist 机制。
- 不接入真实 StorySpec 文件读写。

## Impact

影响范围限于新增 `src/server/projects/*` 安全 foundation、对应 unit test、OpenSpec tasks 和 changeset。后续 `MU-01` server 骨架、`MU-02` schema、`MU-03` auth 和 `MU-05` job 都应复用这里的授权与路径边界。

## Capabilities

- `multiuser-project-security-foundation`
