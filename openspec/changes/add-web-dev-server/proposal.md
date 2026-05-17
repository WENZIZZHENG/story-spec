# Web Dev Server 首片

## 背景

`apps/web` 已能生成静态 `dist/` 产物，但开发者还没有一个直接预览独立 Web shell 的本地服务入口。待办中的 dev server 需要先落成最小、零依赖、可测试的静态预览服务器。

## 目标

- 为 `apps/web` 增加 `dev` 脚本。
- 新增零依赖 Node 静态服务器，默认服务 `apps/web/dist/`。
- 启动前确保静态产物存在；缺失时自动执行 web build。
- 增加测试实际启动服务并读取首页。

## 非目标

- 不实现热更新、文件监听、代理 API、登录流或 E2E。
- 不引入 Vite、Express、React、Next、Tailwind 或 bundler。
- 不替换 `storyspec app` 本机 fallback。
