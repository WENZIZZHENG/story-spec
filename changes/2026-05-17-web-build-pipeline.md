---
change_type: minor
scope: web,build
---

# Web 前端构建链首片

## 背景

`apps/web/` 已有独立前端 shell 与登录/权限只读 UI contract，但此前只做 TypeScript no-emit 检查，没有可交付的静态构建产物，也没有被根构建脚本覆盖。

## 变化

- 新增 `apps/web/tsconfig.json`，把独立 Web shell 编译到 `apps/web/dist/src/`。
- 新增 `scripts/build-web-app.cjs`，清理 `apps/web/dist/`、编译 TypeScript、复制并改写 `index.html` 入口为 `./src/main.js`。
- `apps/web/package.json` 的 `build` 改为真实产物构建，并保留 `typecheck`。
- 根 `package.json` 新增 `build:web`，并把 web build 纳入根 `npm run build`。
- 增加测试验证构建脚本、框架非目标和静态产物。

## CLI 行为

无 CLI 行为变化。

## 模板契约

无模板契约变化。

## 生成产物

`apps/web/dist/**` 是生成物，不手工编辑，不提交。

## 验证

- `npx openspec validate add-web-build-pipeline --strict --json --no-interactive`
- `npx vitest run tests/unit/independent-web-app-shell.test.ts`
- `npm run build:web`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
