---
change_type: minor
scope: web,dev
---

# Web Dev Server 首片

## 背景

`apps/web` 已经有静态构建链，但开发者还缺一个可以直接预览独立 Web shell 的本地服务入口。为了保持当前零依赖前端边界，本次先提供内置 Node 静态服务器。

## 变化

- 新增 `scripts/dev-web-app.cjs`，使用 Node 内置 `http` 服务 `apps/web/dist/`。
- `apps/web/package.json` 新增 `dev` 脚本。
- dev server 启动前会检查 `dist/index.html` 和 `dist/src/main.js`，缺失时自动执行 web build。
- 增加测试实际启动 dev server、读取首页并确认 HTML 引用编译后的 `main.js`。

## CLI 行为

无 StorySpec CLI 行为变化。开发者可通过 `npm --prefix apps/web run dev` 预览独立 Web shell。

## 模板契约

无模板契约变化。

## 生成产物

`apps/web/dist/**` 仍是生成物，不手工编辑，不提交。

## 验证

- `npx openspec validate add-web-dev-server --strict --json --no-interactive`
- `npx vitest run tests/unit/independent-web-app-shell.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
