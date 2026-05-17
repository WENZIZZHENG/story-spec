# Web 前端构建链首片设计

## 构建方式

本切片延续 `apps/web` 的零依赖 TypeScript 方向，新增 `apps/web/tsconfig.json` 将 `src/*.ts` 编译到 `apps/web/dist/src/*.js`。构建脚本负责复制 `index.html` 到 `dist/index.html`，并把浏览器入口从 `./src/main.ts` 改写为 `./src/main.js`。

## 根脚本

根 `package.json` 增加 `build:web`，执行 `npm --prefix apps/web run build`。根 `build` 改为先跑主项目 `tsc`，再跑 `build:web`，最后保留现有 `postbuild`。

## 测试

新增 unit test 读取 `apps/web/package.json` 和根 `package.json`，确认脚本存在且不引入框架依赖。测试还会清理并运行 web build，验证 `dist/index.html` 和 `dist/src/main.js` 生成，且 HTML 不再引用 TypeScript 入口。

## 边界

构建产物 `apps/web/dist/**` 是生成物，不手工编辑、不提交。dev server、bundler 和框架迁移留给后续 OpenSpec。
