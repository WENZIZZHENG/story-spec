## 方案

创建 `apps/web/`，先采用零依赖 TypeScript + 静态 HTML 的骨架：

- `apps/web/package.json`：独立前端项目元数据和脚本占位。
- `apps/web/src/app-shell.ts`：导出 shell contract、API client config 和 HTML renderer。
- `apps/web/src/main.ts`：浏览器入口，未来可替换为框架 mount。
- `apps/web/index.html`：独立前端入口。
- `tests/unit/independent-web-app-shell.test.ts`：验证路由、端点、token header 和边界文案。

## 取舍

选项 A：直接引入 Vite + React。优点是接近最终前端，缺点是依赖、构建和测试面会显著变大，且当前仍缺登录/权限 UI 的后端产品闭环。

选项 B：先建零依赖独立 shell。优点是低风险、可测试、能明确目录和 contract 边界；后续可在同目录逐步引入框架。本切片采用选项 B。

## 兼容性

- 不修改根 `tsconfig.json` 的 `rootDir`，避免影响 CLI/server 构建。
- 不改 `storyspec app` 启动路径，本机 shell 仍是 fallback。
- `apps/web` 暂不作为 npm package 发布产物。

## 后续

- 为 `apps/web` 增加真实 build/dev server。
- 接入 server session/auth 状态和 API client。
- 用 Playwright 或等价工具补首屏和核心路径 E2E。
