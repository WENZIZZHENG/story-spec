## 设计

第一版只做框架无关 server core，不绑定 Fastify。原因是仓库当前没有 Fastify 依赖，且本机 `bun` 不可用，直接引入依赖会留下锁文件和安装状态不一致的问题。后续接入 Fastify 时，应新建 adapter change，把这里的 core 挂到真实 HTTP server。

## 源文件边界

- 新增 `src/server/http/server-core.ts`：多用户 server 基础模型。
- 新增 `tests/unit/multiuser-server-core.test.ts`：基础行为单测。
- 新增 changeset。
- 不修改 `package.json`、`bun.lock`、`src/app-server/**`、`dist/**`。

## 行为

`createServerHealth(input)`：

- 默认 `service: "storyspec-multiuser"`。
- `status: "ok"`。
- 包含 `version` 和 `checkedAt`。

`createRequestContext(input)`：

- 若传入 `requestId`，使用传入值。
- 否则生成 `req-<timestamp>-<random>` 形式 id。

`createErrorResponse(input)`：

- 返回稳定结构，便于后续 HTTP adapter 直接映射。
- `statusCode` 使用输入值。
- `error.code` 和 `error.message` 为机器/人读字段。
- `requestId` 必须保留，便于日志追踪。

## 后续

Fastify adapter 应复用这些函数，不重新定义错误体和 health schema。
