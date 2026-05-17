# Web Shell E2E 冒烟首片设计

## 测试方式

新增 `tests/e2e/web-shell.e2e.test.ts`，使用 Vitest 和 Node 内置子进程能力：

1. 运行 `npm run build:web` 生成静态产物。
2. 启动 `node scripts/dev-web-app.cjs --port 0`。
3. 从 stdout 解析本地 URL。
4. `fetch('/')` 验证 HTML。
5. `fetch('/src/main.js')` 验证 JS 入口可访问。
6. 测试结束关闭 server。

## 覆盖范围

首片只验证真实服务路径和首屏关键文本：`StorySpec Web`、登录与权限、错误边界、候选与正典审阅、任务中心、preview/apply-confirmed/fallback 等。

## 边界

本切片是 HTTP 级 e2e，不执行 DOM hydration，不下载浏览器，不接真实多人 server。后续 Playwright 可基于同一 dev server 扩展。
