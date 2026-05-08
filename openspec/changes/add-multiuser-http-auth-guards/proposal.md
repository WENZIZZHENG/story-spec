## Why

多用户 server 已经能启动，session 与项目权限也已有纯 TypeScript foundation，但 HTTP 入口还没有把它们串起来。没有统一 guard，后续项目 API、作业 API、审计与配额都容易各自解析 token 和 projectId，造成越权风险。

## What Changes

- 在多用户 server 入口增加可选的 auth/project repositories。
- 新增最小受保护上下文端点，验证 bearer token 和项目 membership。
- 未登录、过期/无效 token、项目越权统一返回标准错误响应。

## Non-goals

- 不做注册、密码登录、OAuth 或 UI。
- 不做完整项目 CRUD。
- 不改变本机 `storyspec app`。

## Impact

影响 `src/server/http/*`、`tests/unit/multiuser-server.test.ts`、changeset 和多用户路线图。

## Capabilities

- `multiuser-http-auth-guards`
