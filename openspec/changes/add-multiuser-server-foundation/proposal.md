## Why

多用户路线已经有控制平面基线和项目安全底座，但还缺少独立于本机 `storyspec app` 的 server 骨架。后续认证、项目 API、AgentJob、审计和配额都需要统一的 health、request id 和错误响应格式。当前仓库没有 Fastify 依赖，且本机环境没有 `bun`，所以第一步先实现框架无关的 server core，后续再用独立 change 接 Fastify adapter，避免在锁文件不可更新时引入半成品依赖。

## What Changes

- 新增 `src/server/http/server-core.ts`，提供多用户 server 的基础响应模型。
- 新增 `createServerHealth()`，输出服务名、状态、时间戳和版本。
- 新增 `createRequestContext()`，统一生成/接收 request id。
- 新增 `createErrorResponse()`，统一错误响应字段：`error.code`、`error.message`、`requestId`、`statusCode`。
- 新增 unit tests 锁定 health、request id 和错误响应。

## Non-goals

- 不新增 Fastify、Express 或其他 HTTP 框架依赖。
- 不新增 CLI server 启动命令。
- 不接登录、session、数据库、队列、项目 API 或 runtime。
- 不改变 `storyspec app` 本机工作台。

## Impact

影响 `src/server/http/*`、`tests/unit/*server*`、changeset 和多用户 OpenSpec。后续 `MU-03` auth、`MU-04` project API、`MU-05` jobs 可复用该 core。

## Capabilities

- `multiuser-server-foundation`
