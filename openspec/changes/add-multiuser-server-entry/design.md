## 设计

第一版只做框架无关的多用户 server 入口，不绑定 Fastify。入口的职责很窄：启动监听、暴露 health、统一 request id、输出标准错误响应。这样后续 `MU-02` 到 `MU-06` 的认证、隔离、作业、审计和配额都能接到同一个入口上。

## 源文件边界

- 新增 `src/server/http/multiuser-server.ts`：启动入口和请求处理。
- 复用 `src/server/http/server-core.ts`：health、request id、错误响应。
- 新增 `src/cli/commands/multiuser-server.command.ts`：CLI 启动命令。
- 新增 unit / smoke tests。
- 不修改 `storyspec app` 的本机工作台逻辑。

## 行为

- `storyspec server` 默认监听 `127.0.0.1`。
- `GET /health` 返回健康信息。
- 任一未知路径返回标准错误响应，包含 `statusCode`、`requestId`、`error.code`、`error.message`。
- 所有响应都能带上请求上下文中的 request id。

## 验证

- 先用 unit test 锁定健康、request id、错误响应和启动行为。
- 再实现最小入口。
- 最后跑 build 和 smoke。
