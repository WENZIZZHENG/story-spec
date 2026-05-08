---
change_type: minor
scope: server,docs
---

# 多用户 server core 基线

## CLI 行为

无变化。未新增或修改 CLI 命令。

## 模板契约

无变化。未修改 agent prompt、slash command 模板或用户项目初始化模板。

## 生成产物

无变化。未手工修改 `dist/` 或命令生成产物。

## Server

- 新增多用户 server core 的 health、request id 和标准错误响应模型。
- 第一版不引入 Fastify 或其他 HTTP 框架依赖，避免在锁文件不可更新时留下半成品依赖。
- 后续真实 HTTP adapter、认证、数据库、队列和 runtime 需要继续走独立 OpenSpec change。

## 验证

- `npx openspec validate add-multiuser-server-foundation --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-server-core.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
