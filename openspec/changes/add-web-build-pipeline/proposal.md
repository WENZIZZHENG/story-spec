# Web 前端构建链首片

## 背景

`apps/web/` 已有独立前端 shell、登录/权限只读 UI contract 和 TypeScript no-emit 检查，但还没有真正的静态构建产物，也没有根脚本把 web build 纳入日常验证。待办中的“前端构建链”需要先落一个零依赖、可验证、可替换的最小版本。

## 目标

- 为 `apps/web` 增加可产出 `dist/` 的 TypeScript 构建链。
- 构建后复制 `index.html` 并让入口脚本指向编译后的 `main.js`。
- 在根 `package.json` 增加 `build:web`，并让根 `build` 串上 web build。
- 增加测试验证 web build contract，不引入大型前端框架。

## 非目标

- 不引入 Vite、React、Next、Tailwind 或 bundler。
- 不实现 dev server、热更新、E2E 或部署流水线。
- 不替换本机 `storyspec app` fallback。
