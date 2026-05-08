---
change_type: minor
scope: cli,server,docs
---

# 多用户 server 入口

## CLI 行为

- 新增 `storyspec server` 多用户 server 启动命令。
- 默认监听 `127.0.0.1`，可通过 `--host`、`--port`、`--version` 覆盖。
- CLI help 增加多用户 server 入口示例。

## 模板契约

- 无用户可见模板契约变化。

## 生成产物

- 新增多用户 server 启动入口，提供 `/health` 和标准错误响应。
- 新增 unit 和 smoke 测试锁定启动行为、health、request id 和错误响应。

## 验证

- `npx vitest run tests/unit/multiuser-server.test.ts tests/smoke/multiuser-server.test.ts`
- `npm run build`
