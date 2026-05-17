# Web Dev Server 首片设计

## 服务器

新增 `scripts/dev-web-app.cjs`，使用 Node 内置 `http`、`fs`、`path` 和 `url` 服务 `apps/web/dist/`。默认 host 为 `127.0.0.1`，默认 port 为 `43217`，也允许通过 `--host`、`--port` 或环境变量覆盖。

## 构建关系

dev server 启动前检查 `apps/web/dist/index.html` 和 `apps/web/dist/src/main.js`。缺失时调用现有 `scripts/build-web-app.cjs`，避免打开空页面。

## 测试

unit test 通过 `node scripts/dev-web-app.cjs --port 0` 启动随机端口，读取 stdout 中的 URL，fetch 首页，确认页面包含 `StorySpec Web` 且引用 `./src/main.js`，最后关闭进程。

## 边界

本切片只提供静态预览。不做热更新、API 代理、E2E browser automation 或生产部署 server。
