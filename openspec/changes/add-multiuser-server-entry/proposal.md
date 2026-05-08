## Why

多用户路线已经有 server core、session、安全、job、审计和配额底座，但还缺少一个真正可启动的 server 入口。没有入口，后续的认证、项目 API、作业控制面和可观测性都只能停留在纯函数层，无法验证 health、request id、错误响应和启动冒烟。

## What Changes

- 新增多用户 server 启动入口。
- 默认提供 health、request id 和标准错误响应。
- 提供最小启动 smoke，确认 server 能在本机监听。
- 保留当前本机 `storyspec app` 不变。

## Non-goals

- 不引入 Fastify 或其他 HTTP 框架依赖。
- 不接登录、项目 API、数据库、队列或 runtime。
- 不修改本机单人工作台。

## Impact

影响 `src/server/http/*`、`src/cli/*`、`tests/unit/*server*`、`tests/smoke/*`、changeset 和多用户路线图。

## Capabilities

- `multiuser-server-entry`
