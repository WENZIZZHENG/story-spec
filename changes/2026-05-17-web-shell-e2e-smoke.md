---
change_type: minor
scope: web,test
---

# Web Shell E2E 冒烟首片

## 背景

独立 Web shell 已有静态构建、本地预览服务和关键 UI contract，但还缺少 `tests/e2e` 层面的真实服务冒烟。当前项目没有 Playwright 依赖，因此本切片先采用零依赖 HTTP 级 E2E。

## 变化

- 新增 `tests/e2e/web-shell.e2e.test.ts`。
- E2E 测试会运行 `build:web`、启动真实 `scripts/dev-web-app.cjs`、读取首页、`main.js` 和 `app-shell.js`。
- 覆盖首屏标题、登录/权限、错误边界、候选与正典审阅、任务中心、写入边界和 fallback 文案。
- 根 `package.json` 新增 `test:e2e`。

## CLI 行为

无 StorySpec CLI 行为变化。开发验证可运行 `npm run test:e2e`。

## 模板契约

无模板契约变化。

## 生成产物

`apps/web/dist/**` 仍是生成物，不手工编辑，不提交。

## 验证

- `npx openspec validate add-web-shell-e2e-smoke --strict --json --no-interactive`
- `npm run test:e2e`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
